<?php

namespace App\Services;

use App\Models\Movimentacao;
use App\Models\Parcela;
use App\Models\Rateio;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class FinanceiroService
{
    /**
     * Regra de rateio que vale para um projeto: a própria (se tiver) ou a padrão da empresa.
     *
     * @return array{personalizado: bool, itens: Collection<int, Rateio>}
     */
    public function rateioEfetivo(?int $projetoId): array
    {
        if ($projetoId) {
            $itens = Rateio::with('user:id,name')->where('projeto_id', $projetoId)->get();
            if ($itens->isNotEmpty()) {
                return ['personalizado' => true, 'itens' => $itens];
            }
        }

        return [
            'personalizado' => false,
            'itens' => Rateio::with('user:id,name')->whereNull('projeto_id')->get(),
        ];
    }

    /**
     * Divide um valor (em centavos) entre os itens do rateio.
     * A sobra de arredondamento vai para o caixa (ou para o último item).
     *
     * @return array<int, array{item: Rateio, centavos: int}>
     */
    public function dividir(int $totalCentavos, Collection $itens): array
    {
        $partes = [];
        $soma = 0;
        foreach ($itens as $item) {
            $c = intdiv($totalCentavos * (int) round($item->percentual * 100), 10000);
            $partes[] = ['item' => $item, 'centavos' => $c];
            $soma += $c;
        }

        $sobra = $totalCentavos - $soma;
        if ($sobra !== 0 && $partes) {
            $idx = collect($partes)->search(fn ($p) => $p['item']->destino === 'caixa');
            $idx = $idx === false ? count($partes) - 1 : $idx;
            $partes[$idx]['centavos'] += $sobra;
        }

        return $partes;
    }

    /**
     * Dá baixa numa parcela e distribui o valor recebido entre sócios / caixa / custos.
     */
    public function receber(Parcela $parcela, string $data, float $valor, ?string $forma, ?int $userId): Parcela
    {
        if ($parcela->status !== 'pendente') {
            throw ValidationException::withMessages(['parcela' => 'Esta parcela não está pendente.']);
        }

        $contrato = $parcela->contrato()->with('projeto')->first();
        $projetoId = $contrato->projeto_id;
        $clienteId = $contrato->cliente_id ?? $contrato->projeto?->cliente_id;

        $regra = $this->rateioEfetivo($projetoId);
        $this->validarItens($regra['itens']);

        return DB::transaction(function () use ($parcela, $data, $valor, $forma, $userId, $regra, $projetoId, $clienteId, $contrato) {
            $parcela->update([
                'status' => 'pago',
                'data_pagamento' => $data,
                'valor_pago' => $valor,
                'forma_pagamento' => $forma,
            ]);

            $descricao = "{$parcela->descricao} — {$contrato->titulo}";

            foreach ($this->dividir((int) round($valor * 100), $regra['itens']) as $parte) {
                if ($parte['centavos'] <= 0) {
                    continue;
                }
                Movimentacao::create([
                    'data' => $data,
                    'conta' => $parte['item']->destino,
                    'user_id' => $parte['item']->destino === 'socio' ? $parte['item']->user_id : null,
                    'tipo' => 'credito',
                    'valor' => $parte['centavos'] / 100,
                    'origem' => 'recebimento',
                    'descricao' => $descricao,
                    'percentual' => $parte['item']->percentual,
                    'parcela_id' => $parcela->id,
                    'projeto_id' => $projetoId,
                    'cliente_id' => $clienteId,
                    'created_by' => $userId,
                ]);
            }

            return $parcela->fresh(['movimentacoes.user:id,name']);
        });
    }

    /** Desfaz o recebimento: apaga a distribuição e volta a parcela para pendente. */
    public function estornar(Parcela $parcela): Parcela
    {
        if ($parcela->status !== 'pago') {
            throw ValidationException::withMessages(['parcela' => 'Só é possível estornar parcelas pagas.']);
        }

        DB::transaction(function () use ($parcela) {
            $parcela->movimentacoes()->delete();
            $parcela->update([
                'status' => 'pendente',
                'data_pagamento' => null,
                'valor_pago' => null,
                'forma_pagamento' => null,
            ]);
        });

        return $parcela->fresh();
    }

    /** Move dinheiro entre contas (ex.: sobra de custos -> caixa). */
    public function transferir(array $origem, array $destino, float $valor, string $data, ?string $descricao, ?int $userId): string
    {
        $grupo = (string) Str::uuid();
        DB::transaction(function () use ($origem, $destino, $valor, $data, $descricao, $userId, $grupo) {
            foreach ([[$origem, 'debito'], [$destino, 'credito']] as [$conta, $tipo]) {
                Movimentacao::create([
                    'data' => $data,
                    'conta' => $conta['conta'],
                    'user_id' => $conta['conta'] === 'socio' ? $conta['user_id'] : null,
                    'tipo' => $tipo,
                    'valor' => $valor,
                    'origem' => 'transferencia',
                    'descricao' => $descricao ?: 'Transferência entre contas',
                    'grupo' => $grupo,
                    'created_by' => $userId,
                ]);
            }
        });

        return $grupo;
    }

    /**
     * Saldo de cada conta: caixa, custos e o saldo "a repassar" de cada sócio.
     *
     * @return array{caixa: float, custos: float, socios: array<int, array{user_id:int, name:string, saldo:float}>, total: float}
     */
    public function saldos(?string $ate = null): array
    {
        $rows = Movimentacao::query()
            ->when($ate, fn ($q) => $q->where('data', '<=', $ate))
            ->select('conta', 'user_id', DB::raw("SUM(CASE WHEN tipo = 'credito' THEN valor ELSE -valor END) as saldo"))
            ->groupBy('conta', 'user_id')
            ->get();

        $socios = \App\Models\User::where('socio', true)->orderBy('name')->get(['id', 'name'])
            ->map(fn ($u) => [
                'user_id' => $u->id,
                'name' => $u->name,
                'saldo' => round((float) $rows->where('conta', 'socio')->where('user_id', $u->id)->sum('saldo'), 2),
            ])->values()->all();

        $caixa = round((float) $rows->where('conta', 'caixa')->sum('saldo'), 2);
        $custos = round((float) $rows->where('conta', 'custos')->sum('saldo'), 2);

        return [
            'caixa' => $caixa,
            'custos' => $custos,
            'socios' => $socios,
            'total' => round($caixa + $custos + collect($socios)->sum('saldo'), 2),
        ];
    }

    /** Garante que a regra soma 100% e está bem formada. */
    public function validarItens(Collection|array $itens): void
    {
        $itens = collect($itens);
        if ($itens->isEmpty()) {
            throw ValidationException::withMessages(['rateio' => 'Nenhuma regra de rateio configurada. Configure o rateio padrão em Sócios & Rateio.']);
        }
        $soma = round($itens->sum(fn ($i) => (float) (is_array($i) ? $i['percentual'] : $i->percentual)), 2);
        if (abs($soma - 100) > 0.001) {
            throw ValidationException::withMessages(['rateio' => "O rateio precisa somar 100% (atual: {$soma}%)."]);
        }
    }
}
