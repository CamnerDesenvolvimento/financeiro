<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Clientes (PF ou PJ)
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->enum('tipo', ['pf', 'pj'])->default('pj');
            $table->string('documento', 20)->nullable(); // CPF / CNPJ
            $table->string('email')->nullable();
            $table->string('telefone', 30)->nullable();
            $table->string('contato')->nullable(); // pessoa de contato
            $table->string('endereco')->nullable();
            $table->text('observacoes')->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });

        // Projetos (um cliente tem vários projetos)
        Schema::create('projetos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cliente_id')->constrained('clientes')->cascadeOnDelete();
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->enum('status', ['proposta', 'em_andamento', 'pausado', 'concluido', 'cancelado'])->default('em_andamento');
            $table->date('data_inicio')->nullable();
            $table->date('data_fim')->nullable();
            $table->timestamps();
        });

        // Contratos: de cliente/projeto, contrato societário, fornecedores etc.
        Schema::create('contratos', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo', ['cliente', 'societario', 'fornecedor', 'outro'])->default('cliente');
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->foreignId('projeto_id')->nullable()->constrained('projetos')->nullOnDelete();
            $table->string('titulo');
            $table->string('numero')->nullable();
            $table->decimal('valor_total', 12, 2)->default(0);
            $table->date('data_assinatura')->nullable();
            $table->date('data_inicio')->nullable();
            $table->date('data_fim')->nullable();
            $table->enum('status', ['rascunho', 'ativo', 'concluido', 'cancelado'])->default('ativo');
            $table->text('observacoes')->nullable();
            $table->timestamps();
        });

        // Parcelas a receber de um contrato (entrada + N parcelas)
        Schema::create('parcelas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contrato_id')->constrained('contratos')->cascadeOnDelete();
            $table->unsignedSmallInteger('numero')->default(0); // 0 = entrada
            $table->string('descricao');
            $table->decimal('valor', 12, 2);
            $table->date('vencimento');
            $table->enum('status', ['pendente', 'pago', 'cancelado'])->default('pendente');
            $table->date('data_pagamento')->nullable();
            $table->decimal('valor_pago', 12, 2)->nullable();
            $table->string('forma_pagamento', 30)->nullable(); // pix, boleto, transferencia...
            $table->text('observacoes')->nullable();
            $table->timestamps();
            $table->index(['status', 'vencimento']);
        });

        // Regras de rateio: projeto_id NULL = regra padrão da empresa
        Schema::create('rateios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('projeto_id')->nullable()->constrained('projetos')->cascadeOnDelete();
            $table->enum('destino', ['socio', 'caixa', 'custos']);
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->decimal('percentual', 5, 2);
            $table->timestamps();
        });

        // Livro-razão: toda entrada/saída de dinheiro em cada "conta"
        //   caixa  -> caixa da empresa (reserva / reinvestimento)
        //   custos -> reserva para custos (servidores, impostos, ferramentas...)
        //   socio  -> saldo a repassar para cada sócio (user_id)
        Schema::create('movimentacoes', function (Blueprint $table) {
            $table->id();
            $table->date('data');
            $table->enum('conta', ['caixa', 'custos', 'socio']);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('tipo', ['credito', 'debito']);
            $table->decimal('valor', 12, 2);
            $table->enum('origem', ['recebimento', 'despesa', 'repasse', 'aporte', 'transferencia', 'ajuste']);
            $table->string('categoria', 60)->nullable();
            $table->string('descricao')->nullable();
            $table->decimal('percentual', 5, 2)->nullable();
            $table->foreignId('parcela_id')->nullable()->constrained('parcelas')->cascadeOnDelete();
            $table->foreignId('projeto_id')->nullable()->constrained('projetos')->nullOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->uuid('grupo')->nullable(); // liga os dois lados de uma transferência
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['conta', 'user_id']);
            $table->index('data');
        });

        // Arquivos (PDF de contrato, comprovantes...) anexados a qualquer registro
        Schema::create('documentos', function (Blueprint $table) {
            $table->id();
            $table->morphs('documentable');
            $table->string('nome');
            $table->string('caminho');
            $table->string('mime', 120)->nullable();
            $table->unsignedBigInteger('tamanho')->default(0);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documentos');
        Schema::dropIfExists('movimentacoes');
        Schema::dropIfExists('rateios');
        Schema::dropIfExists('parcelas');
        Schema::dropIfExists('contratos');
        Schema::dropIfExists('projetos');
        Schema::dropIfExists('clientes');
    }
};
