<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movimentacao;
use App\Models\Parcela;
use App\Models\Projeto;
use App\Services\FinanceiroService;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(private FinanceiroService $fin) {}

    public function __invoke()
    {
        $hoje = today();
        $inicioMes = $hoje->copy()->startOfMonth();
        $fimMes = $hoje->copy()->endOfMonth();

        $parcelaQ = fn () => Parcela::with(['contrato:id,titulo,cliente_id,projeto_id', 'contrato.cliente:id,nome', 'contrato.projeto:id,nome']);

        // Recebimentos dos últimos 12 meses
        $inicio12 = $hoje->copy()->subMonths(11)->startOfMonth();
        $porMes = Parcela::where('status', 'pago')
            ->where('data_pagamento', '>=', $inicio12)
            ->get(['data_pagamento', 'valor_pago'])
            ->groupBy(fn ($p) => $p->data_pagamento->format('Y-m'))
            ->map(fn ($g) => round((float) $g->sum('valor_pago'), 2));
        $previstoMes = Parcela::where('status', 'pendente')
            ->where('vencimento', '>=', $inicio12)
            ->where('vencimento', '<=', $hoje->copy()->addMonths(6)->endOfMonth())
            ->get(['vencimento', 'valor'])
            ->groupBy(fn ($p) => $p->vencimento->format('Y-m'))
            ->map(fn ($g) => round((float) $g->sum('valor'), 2));

        $serie = [];
        for ($d = $inicio12->copy(); $d->lte($hoje->copy()->addMonths(6)); $d->addMonth()) {
            $k = $d->format('Y-m');
            $serie[] = ['mes' => $k, 'recebido' => $porMes[$k] ?? 0, 'previsto' => $previstoMes[$k] ?? 0];
        }

        return [
            'saldos' => $this->fin->saldos(),
            'mes' => [
                'recebido' => round((float) Parcela::where('status', 'pago')->whereBetween('data_pagamento', [$inicioMes, $fimMes])->sum('valor_pago'), 2),
                'a_receber' => round((float) Parcela::where('status', 'pendente')->whereBetween('vencimento', [$inicioMes, $fimMes])->sum('valor'), 2),
                'despesas' => round((float) Movimentacao::where('origem', 'despesa')->whereBetween('data', [$inicioMes, $fimMes])->sum('valor'), 2),
                'socios' => Movimentacao::where('conta', 'socio')->where('origem', 'recebimento')
                    ->whereBetween('data', [$inicioMes, $fimMes])
                    ->select('user_id', DB::raw('SUM(valor) as total'))->groupBy('user_id')
                    ->with('user:id,name')->get(),
            ],
            'atrasadas' => $parcelaQ()->where('status', 'pendente')->where('vencimento', '<', $hoje)->orderBy('vencimento')->get(),
            'proximas' => $parcelaQ()->where('status', 'pendente')->whereBetween('vencimento', [$hoje, $hoje->copy()->addDays(30)])->orderBy('vencimento')->get(),
            'a_receber_total' => round((float) Parcela::where('status', 'pendente')->sum('valor'), 2),
            'projetos_ativos' => Projeto::where('status', 'em_andamento')->count(),
            'serie' => $serie,
        ];
    }
}
