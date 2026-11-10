<?php

namespace Tests\Unit;

use App\Models\Rateio;
use App\Services\FinanceiroService;
use PHPUnit\Framework\TestCase;

class RateioDivisaoTest extends TestCase
{
    private function itens(array $linhas)
    {
        return collect($linhas)->map(fn ($l) => (new Rateio)->forceFill(['destino' => $l[0], 'user_id' => $l[1], 'percentual' => $l[2]]));
    }

    public function test_divide_500_pela_regra_padrao(): void
    {
        $partes = (new FinanceiroService)->dividir(50000, $this->itens([
            ['socio', 1, 20], ['socio', 2, 20], ['socio', 3, 20], ['caixa', null, 25], ['custos', null, 15],
        ]));

        $this->assertSame([10000, 10000, 10000, 12500, 7500], array_column($partes, 'centavos'));
    }

    public function test_sobra_de_arredondamento_vai_para_o_caixa_e_nada_se_perde(): void
    {
        // 100,00 dividido em 3 x 33,33% + caixa 0,01%
        $partes = (new FinanceiroService)->dividir(10000, $this->itens([
            ['socio', 1, 33.33], ['socio', 2, 33.33], ['socio', 3, 33.33], ['caixa', null, 0.01],
        ]));

        $this->assertSame(10000, array_sum(array_column($partes, 'centavos')));
        $this->assertSame([3333, 3333, 3333, 1], array_column($partes, 'centavos'));
    }

    public function test_valor_quebrado_sem_caixa_sobra_vai_para_o_ultimo(): void
    {
        $partes = (new FinanceiroService)->dividir(1001, $this->itens([['socio', 1, 50], ['socio', 2, 50]]));
        $this->assertSame([500, 501], array_column($partes, 'centavos'));
    }
}
