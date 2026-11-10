<?php

namespace Database\Seeders;

use App\Models\Rateio;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Cria os 3 sócios (troque nome/e-mail/senha depois pela tela "Sócios & Rateio")
     * e uma regra de rateio padrão: 20% p/ cada sócio, 25% caixa, 15% custos.
     */
    public function run(): void
    {
        $socios = collect([
            ['name' => 'Sócio 1', 'email' => 'socio1@financeiro.local'],
            ['name' => 'Sócio 2', 'email' => 'socio2@financeiro.local'],
            ['name' => 'Sócio 3', 'email' => 'socio3@financeiro.local'],
        ])->map(fn ($s) => User::firstOrCreate(['email' => $s['email']], [...$s, 'password' => 'financeiro123', 'socio' => true]));

        if (Rateio::whereNull('projeto_id')->doesntExist()) {
            foreach ($socios as $s) {
                Rateio::create(['destino' => 'socio', 'user_id' => $s->id, 'percentual' => 20]);
            }
            Rateio::create(['destino' => 'caixa', 'percentual' => 25]);
            Rateio::create(['destino' => 'custos', 'percentual' => 15]);
        }
    }
}
