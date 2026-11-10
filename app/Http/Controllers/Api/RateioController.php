<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rateio;
use App\Services\FinanceiroService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RateioController extends Controller
{
    public function __construct(private FinanceiroService $fin) {}

    /** GET /rateios?projeto_id=  (sem projeto_id = regra padrão) */
    public function show(Request $request)
    {
        return $this->fin->rateioEfetivo($request->integer('projeto_id') ?: null);
    }

    /** PUT /rateios  { projeto_id?: int, itens: [{destino, user_id?, percentual}] } — substitui a regra */
    public function update(Request $request)
    {
        $data = $request->validate([
            'projeto_id' => 'nullable|exists:projetos,id',
            'itens' => 'required|array|min:1',
            'itens.*.destino' => 'required|in:socio,caixa,custos',
            'itens.*.user_id' => 'nullable|required_if:itens.*.destino,socio|exists:users,id',
            'itens.*.percentual' => 'required|numeric|min:0|max:100',
        ]);
        $this->fin->validarItens($data['itens']);
        $projetoId = $data['projeto_id'] ?? null;

        DB::transaction(function () use ($data, $projetoId) {
            Rateio::where('projeto_id', $projetoId)->when(! $projetoId, fn ($q) => $q->whereNull('projeto_id'))->delete();
            foreach ($data['itens'] as $item) {
                Rateio::create([
                    'projeto_id' => $projetoId,
                    'destino' => $item['destino'],
                    'user_id' => $item['destino'] === 'socio' ? $item['user_id'] : null,
                    'percentual' => $item['percentual'],
                ]);
            }
        });

        return $this->fin->rateioEfetivo($projetoId);
    }

    /** DELETE /rateios/projeto/{id} — projeto volta a usar a regra padrão */
    public function destroy(int $projetoId)
    {
        Rateio::where('projeto_id', $projetoId)->delete();

        return $this->fin->rateioEfetivo($projetoId);
    }
}
