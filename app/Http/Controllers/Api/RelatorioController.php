<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movimentacao;
use App\Models\User;
use Illuminate\Http\Request;

class RelatorioController extends Controller
{
    /**
     * Quanto cada destino (cada sócio, caixa, custos) recebeu por mês no ano,
     * com quebra por projeto. Também mostra repasses e despesas.
     */
    public function mensal(Request $request)
    {
        $ano = $request->integer('ano') ?: (int) date('Y');

        $movs = Movimentacao::with(['projeto:id,nome'])
            ->whereYear('data', $ano)
            ->get();

        $destinos = collect([['chave' => 'caixa', 'nome' => 'Caixa da empresa'], ['chave' => 'custos', 'nome' => 'Reserva de custos']])
            ->concat(User::where('socio', true)->orderBy('name')->get()->map(fn ($u) => ['chave' => 'socio-'.$u->id, 'nome' => $u->name]));

        $chave = fn ($m) => $m->conta === 'socio' ? 'socio-'.$m->user_id : $m->conta;
        $recebimentos = $movs->where('origem', 'recebimento');

        $linhas = $destinos->map(function ($d) use ($recebimentos, $chave) {
            $doDestino = $recebimentos->filter(fn ($m) => $chave($m) === $d['chave']);
            $meses = [];
            for ($m = 1; $m <= 12; $m++) {
                $meses[$m] = round((float) $doDestino->filter(fn ($x) => (int) $x->data->format('n') === $m)->sum('valor'), 2);
            }

            return [
                ...$d,
                'meses' => $meses,
                'total' => round(array_sum($meses), 2),
                'por_projeto' => $doDestino->groupBy('projeto_id')->map(fn ($g) => [
                    'projeto' => $g->first()->projeto?->nome ?? 'Sem projeto',
                    'total' => round((float) $g->sum('valor'), 2),
                ])->values(),
            ];
        })->values();

        $porMes = fn ($origem) => collect(range(1, 12))->mapWithKeys(fn ($m) => [
            $m => round((float) $movs->where('origem', $origem)->filter(fn ($x) => (int) $x->data->format('n') === $m)->sum('valor'), 2),
        ]);

        return [
            'ano' => $ano,
            'linhas' => $linhas,
            'recebido_mes' => $porMes('recebimento'),
            'despesas_mes' => $porMes('despesa'),
            'repasses_mes' => $porMes('repasse'),
        ];
    }
}
