<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movimentacao;
use App\Models\Projeto;
use App\Services\FinanceiroService;
use Illuminate\Http\Request;

class ProjetoController extends Controller
{
    public function __construct(private FinanceiroService $fin) {}

    public function index(Request $request)
    {
        return Projeto::query()
            ->with('cliente:id,nome')
            ->withCount('contratos')
            ->when($request->cliente_id, fn ($q, $id) => $q->where('cliente_id', $id))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->q, fn ($q, $s) => $q->where('nome', 'like', "%$s%"))
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($p) {
                $p->resumo = $this->resumo($p);

                return $p;
            });
    }

    public function store(Request $request)
    {
        return response()->json(Projeto::create($this->validar($request)), 201);
    }

    public function show(Projeto $projeto)
    {
        $projeto->load(['cliente', 'contratos.parcelas', 'documentos']);
        $projeto->resumo = $this->resumo($projeto);
        $projeto->rateio = $this->fin->rateioEfetivo($projeto->id);

        // Quanto cada destino já recebeu deste projeto
        $projeto->distribuicao = Movimentacao::query()
            ->where('projeto_id', $projeto->id)
            ->where('origem', 'recebimento')
            ->with('user:id,name')
            ->get()
            ->groupBy(fn ($m) => $m->conta.'-'.($m->user_id ?? 0))
            ->map(fn ($g) => [
                'conta' => $g->first()->conta,
                'user' => $g->first()->user,
                'valor' => round((float) $g->sum('valor'), 2),
            ])->values();

        return $projeto;
    }

    public function update(Request $request, Projeto $projeto)
    {
        $projeto->update($this->validar($request));

        return $projeto;
    }

    public function destroy(Projeto $projeto)
    {
        $projeto->delete();

        return response()->noContent();
    }

    private function validar(Request $request): array
    {
        return $request->validate([
            'cliente_id' => 'required|exists:clientes,id',
            'nome' => 'required|string|max:255',
            'descricao' => 'nullable|string',
            'status' => 'required|in:proposta,em_andamento,pausado,concluido,cancelado',
            'data_inicio' => 'nullable|date',
            'data_fim' => 'nullable|date',
        ]);
    }

    private function resumo(Projeto $projeto): array
    {
        $parcelas = $projeto->parcelas()->get();
        $custos = Movimentacao::where('projeto_id', $projeto->id)->where('origem', 'despesa')->sum('valor');

        return [
            'valor_contratado' => round((float) $projeto->contratos()->where('status', '!=', 'cancelado')->sum('valor_total'), 2),
            'recebido' => round((float) $parcelas->where('status', 'pago')->sum('valor_pago'), 2),
            'a_receber' => round((float) $parcelas->where('status', 'pendente')->sum('valor'), 2),
            'atrasado' => round((float) $parcelas->where('situacao', 'atrasado')->sum('valor'), 2),
            'despesas' => round((float) $custos, 2),
        ];
    }
}
