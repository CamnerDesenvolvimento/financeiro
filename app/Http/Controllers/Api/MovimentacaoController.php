<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movimentacao;
use App\Services\FinanceiroService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MovimentacaoController extends Controller
{
    public function __construct(private FinanceiroService $fin) {}

    /** Extrato. Filtros: conta, user_id, origem, projeto_id, de, ate */
    public function index(Request $request)
    {
        return Movimentacao::query()
            ->with(['user:id,name', 'projeto:id,nome', 'cliente:id,nome', 'autor:id,name'])
            ->when($request->conta, fn ($q, $c) => $q->where('conta', $c))
            ->when($request->user_id, fn ($q, $id) => $q->where('user_id', $id))
            ->when($request->origem, fn ($q, $o) => $q->where('origem', $o))
            ->when($request->projeto_id, fn ($q, $id) => $q->where('projeto_id', $id))
            ->when($request->de, fn ($q, $d) => $q->where('data', '>=', $d))
            ->when($request->ate, fn ($q, $d) => $q->where('data', '<=', $d))
            ->orderByDesc('data')->orderByDesc('id')
            ->limit(1000)
            ->get();
    }

    public function saldos(Request $request)
    {
        return $this->fin->saldos($request->ate);
    }

    /**
     * Lançamento manual:
     *  - despesa  (débito em custos ou caixa)  ex.: servidor, imposto, ferramenta
     *  - aporte   (crédito)                     ex.: sócio colocou dinheiro
     *  - ajuste   (crédito ou débito)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'data' => 'required|date',
            'conta' => 'required|in:caixa,custos,socio',
            'user_id' => 'nullable|required_if:conta,socio|exists:users,id',
            'origem' => 'required|in:despesa,aporte,ajuste',
            'tipo' => 'required_if:origem,ajuste|in:credito,debito',
            'valor' => 'required|numeric|min:0.01',
            'categoria' => 'nullable|string|max:60',
            'descricao' => 'required|string|max:255',
            'projeto_id' => 'nullable|exists:projetos,id',
            'cliente_id' => 'nullable|exists:clientes,id',
        ]);

        $data['tipo'] = match ($data['origem']) {
            'despesa' => 'debito',
            'aporte' => 'credito',
            default => $data['tipo'],
        };
        if ($data['conta'] !== 'socio') {
            $data['user_id'] = null;
        }
        $data['created_by'] = $request->user()->id;

        return response()->json(Movimentacao::create($data), 201);
    }

    /** Repasse: dinheiro que saiu da empresa para o sócio (baixa o saldo a repassar dele). */
    public function repasse(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'valor' => 'required|numeric|min:0.01',
            'data' => 'required|date',
            'descricao' => 'nullable|string|max:255',
        ]);

        return response()->json(Movimentacao::create([
            'data' => $data['data'],
            'conta' => 'socio',
            'user_id' => $data['user_id'],
            'tipo' => 'debito',
            'valor' => $data['valor'],
            'origem' => 'repasse',
            'descricao' => ($data['descricao'] ?? null) ?: 'Repasse ao sócio',
            'created_by' => $request->user()->id,
        ]), 201);
    }

    public function transferencia(Request $request)
    {
        $data = $request->validate([
            'de_conta' => 'required|in:caixa,custos,socio',
            'de_user_id' => 'nullable|required_if:de_conta,socio|exists:users,id',
            'para_conta' => 'required|in:caixa,custos,socio',
            'para_user_id' => 'nullable|required_if:para_conta,socio|exists:users,id',
            'valor' => 'required|numeric|min:0.01',
            'data' => 'required|date',
            'descricao' => 'nullable|string|max:255',
        ]);

        $grupo = $this->fin->transferir(
            ['conta' => $data['de_conta'], 'user_id' => $data['de_user_id'] ?? null],
            ['conta' => $data['para_conta'], 'user_id' => $data['para_user_id'] ?? null],
            (float) $data['valor'], $data['data'], $data['descricao'] ?? null, $request->user()->id,
        );

        return response()->json(Movimentacao::where('grupo', $grupo)->get(), 201);
    }

    public function destroy(Movimentacao $movimentacao)
    {
        if ($movimentacao->origem === 'recebimento') {
            abort(422, 'Lançamentos de recebimento são removidos estornando a parcela.');
        }
        DB::transaction(function () use ($movimentacao) {
            if ($movimentacao->grupo) {
                Movimentacao::where('grupo', $movimentacao->grupo)->delete();
            } else {
                $movimentacao->delete();
            }
        });

        return response()->noContent();
    }
}
