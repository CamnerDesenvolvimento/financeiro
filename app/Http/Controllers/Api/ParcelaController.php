<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contrato;
use App\Models\Parcela;
use App\Services\FinanceiroService;
use Illuminate\Http\Request;

class ParcelaController extends Controller
{
    public function __construct(private FinanceiroService $fin) {}

    /** Contas a receber, com filtros: situacao (pendente|atrasado|pago|cancelado), de, ate, cliente_id, projeto_id */
    public function index(Request $request)
    {
        $q = Parcela::query()
            ->with(['contrato:id,titulo,cliente_id,projeto_id', 'contrato.cliente:id,nome', 'contrato.projeto:id,nome'])
            ->when($request->de, fn ($q, $d) => $q->where('vencimento', '>=', $d))
            ->when($request->ate, fn ($q, $d) => $q->where('vencimento', '<=', $d))
            ->when($request->cliente_id, fn ($q, $id) => $q->whereHas('contrato', fn ($c) => $c->where('cliente_id', $id)))
            ->when($request->projeto_id, fn ($q, $id) => $q->whereHas('contrato', fn ($c) => $c->where('projeto_id', $id)));

        match ($request->situacao) {
            'atrasado' => $q->where('status', 'pendente')->where('vencimento', '<', today()),
            'pendente' => $q->where('status', 'pendente'),
            'pago' => $q->where('status', 'pago'),
            'cancelado' => $q->where('status', 'cancelado'),
            default => null,
        };

        return $q->orderBy('vencimento')->limit(500)->get();
    }

    public function store(Request $request, Contrato $contrato)
    {
        $data = $request->validate([
            'descricao' => 'required|string|max:255',
            'valor' => 'required|numeric|min:0.01',
            'vencimento' => 'required|date',
            'numero' => 'nullable|integer|min:0',
        ]);
        $data['numero'] = $data['numero'] ?? ((int) $contrato->parcelas()->max('numero') + 1);

        return response()->json($contrato->parcelas()->create($data), 201);
    }

    public function update(Request $request, Parcela $parcela)
    {
        $data = $request->validate([
            'descricao' => 'required|string|max:255',
            'valor' => 'required|numeric|min:0.01',
            'vencimento' => 'required|date',
            'status' => 'nullable|in:pendente,cancelado',
            'observacoes' => 'nullable|string',
        ]);
        if ($parcela->status === 'pago') {
            abort(422, 'Parcela já recebida. Estorne antes de editar.');
        }
        $parcela->update($data);

        return $parcela;
    }

    public function destroy(Parcela $parcela)
    {
        if ($parcela->status === 'pago') {
            abort(422, 'Parcela já recebida. Estorne antes de excluir.');
        }
        $parcela->delete();

        return response()->noContent();
    }

    /** Pré-visualiza como o valor será dividido, sem gravar nada. */
    public function simular(Request $request, Parcela $parcela)
    {
        $valor = (float) ($request->valor ?? $parcela->valor);
        $regra = $this->fin->rateioEfetivo($parcela->contrato->projeto_id);

        return [
            'personalizado' => $regra['personalizado'],
            'itens' => collect($this->fin->dividir((int) round($valor * 100), $regra['itens']))->map(fn ($p) => [
                'destino' => $p['item']->destino,
                'user' => $p['item']->user,
                'percentual' => $p['item']->percentual,
                'valor' => $p['centavos'] / 100,
            ]),
        ];
    }

    public function receber(Request $request, Parcela $parcela)
    {
        $data = $request->validate([
            'data_pagamento' => 'required|date',
            'valor_pago' => 'required|numeric|min:0.01',
            'forma_pagamento' => 'nullable|string|max:30',
        ]);

        return $this->fin->receber($parcela, $data['data_pagamento'], (float) $data['valor_pago'], $data['forma_pagamento'] ?? null, $request->user()->id);
    }

    public function estornar(Parcela $parcela)
    {
        return $this->fin->estornar($parcela);
    }
}
