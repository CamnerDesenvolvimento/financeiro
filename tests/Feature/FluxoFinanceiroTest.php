<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Exemplo real: contrato de 1000 de entrada + 12x de 500.
 * Rateio padrão do seeder: 20% para cada sócio, 25% caixa, 15% custos.
 */
class FluxoFinanceiroTest extends TestCase
{
    use RefreshDatabase;

    public function test_fluxo_completo_contrato_recebimento_rateio_repasse_estorno(): void
    {
        $this->seed(DatabaseSeeder::class);
        [$s1, $s2] = User::orderBy('id')->take(2)->get();
        $this->actingAs($s1, 'sanctum');

        $cliente = $this->postJson('/api/clientes', ['nome' => 'Padaria Pão Quente', 'tipo' => 'pj'])->assertCreated()->json();
        $projeto = $this->postJson('/api/projetos', ['cliente_id' => $cliente['id'], 'nome' => 'App delivery', 'status' => 'em_andamento'])->assertCreated()->json();

        $contrato = $this->postJson('/api/contratos', [
            'tipo' => 'cliente', 'projeto_id' => $projeto['id'], 'titulo' => 'Desenvolvimento App', 'status' => 'ativo',
            'entrada_valor' => 1000, 'entrada_vencimento' => '2026-11-10',
            'parcelas_qtd' => 12, 'parcelas_valor' => 500, 'primeiro_vencimento' => '2026-12-10',
        ])->assertCreated()->json();

        $this->assertCount(13, $contrato['parcelas']);
        $this->assertEquals(7000, $contrato['valor_total'] ?? $this->getJson("/api/contratos/{$contrato['id']}")->json('valor_total'));
        $this->assertSame($cliente['id'], $contrato['cliente_id']); // herdado do projeto

        $entrada = collect($contrato['parcelas'])->firstWhere('numero', 0);
        $p1 = collect($contrato['parcelas'])->firstWhere('numero', 1);
        $this->assertSame('2027-11-10', collect($contrato['parcelas'])->firstWhere('numero', 12)['vencimento']);

        // Recebe a entrada (1000)
        $this->postJson("/api/parcelas/{$entrada['id']}/receber", ['data_pagamento' => '2026-11-10', 'valor_pago' => 1000, 'forma_pagamento' => 'pix'])->assertOk();
        $saldos = $this->getJson('/api/saldos')->assertOk()->json();
        $this->assertEquals(250, $saldos['caixa']);
        $this->assertEquals(150, $saldos['custos']);
        $this->assertEquals([200, 200, 200], array_column($saldos['socios'], 'saldo'));
        $this->assertEquals(1000, $saldos['total']);

        // Projeto com rateio próprio: 30/30/30 sócios e 10 custos (ex.: sem caixa)
        $this->putJson('/api/rateios', ['projeto_id' => $projeto['id'], 'itens' => [
            ['destino' => 'socio', 'user_id' => $s1->id, 'percentual' => 30],
            ['destino' => 'socio', 'user_id' => $s2->id, 'percentual' => 30],
            ['destino' => 'socio', 'user_id' => User::orderBy('id')->skip(2)->first()->id, 'percentual' => 30],
            ['destino' => 'custos', 'percentual' => 10],
        ]])->assertOk()->assertJsonPath('personalizado', true);

        // Rateio que não soma 100 é recusado
        $this->putJson('/api/rateios', ['itens' => [['destino' => 'caixa', 'percentual' => 90]]])->assertUnprocessable();

        $this->postJson("/api/parcelas/{$p1['id']}/receber", ['data_pagamento' => '2026-12-10', 'valor_pago' => 500])->assertOk();
        $saldos = $this->getJson('/api/saldos')->json();
        $this->assertEquals(250, $saldos['caixa']);
        $this->assertEquals(200, $saldos['custos']);
        $this->assertEquals(350, $saldos['socios'][0]['saldo']);

        // Não recebe duas vezes
        $this->postJson("/api/parcelas/{$p1['id']}/receber", ['data_pagamento' => '2026-12-10', 'valor_pago' => 500])->assertUnprocessable();

        // Despesa sai de custos, repasse baixa o saldo do sócio
        $this->postJson('/api/movimentacoes', ['data' => '2026-12-11', 'conta' => 'custos', 'origem' => 'despesa', 'valor' => 80, 'descricao' => 'VPS', 'projeto_id' => $projeto['id']])->assertCreated();
        $this->postJson('/api/repasses', ['user_id' => $s1->id, 'valor' => 350, 'data' => '2026-12-15'])->assertCreated();
        $this->postJson('/api/transferencias', ['de_conta' => 'custos', 'para_conta' => 'caixa', 'valor' => 20, 'data' => '2026-12-20'])->assertCreated();

        $saldos = $this->getJson('/api/saldos')->json();
        $this->assertEquals(270, $saldos['caixa']);
        $this->assertEquals(100, $saldos['custos']);
        $this->assertEquals(0, $saldos['socios'][0]['saldo']);

        // Estorno desfaz a distribuição
        $this->postJson("/api/parcelas/{$p1['id']}/estornar")->assertOk()->assertJsonPath('status', 'pendente');
        $this->assertEquals(-150, $this->getJson('/api/saldos')->json('socios.0.saldo'));

        // Endpoints de leitura respondem
        $this->getJson('/api/dashboard')->assertOk()->assertJsonStructure(['saldos', 'mes', 'serie', 'atrasadas', 'proximas']);
        $this->assertEquals(1000, $this->getJson('/api/relatorios/mensal?ano=2026')->assertOk()->json('recebido_mes.11'));
        $this->assertEquals(1000, $this->getJson("/api/projetos/{$projeto['id']}")->assertOk()->json('resumo.recebido'));
        $this->assertEquals(1000, $this->getJson("/api/clientes/{$cliente['id']}")->assertOk()->json('resumo.recebido'));
        $this->getJson('/api/parcelas?situacao=pendente')->assertOk()->assertJsonCount(12);

        // Contrato societário (sem cliente / parcelas)
        $this->postJson('/api/contratos', ['tipo' => 'societario', 'titulo' => 'Contrato social', 'status' => 'ativo'])->assertCreated();
    }

    public function test_api_exige_login(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();
    }
}
