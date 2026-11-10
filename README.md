# Financeiro

Sistema interno dos sócios para controlar **clientes, projetos, contratos, parcelas a receber, caixa da empresa, reserva de custos e quanto cada sócio recebe**.

Stack: **Laravel 13 (API + Sanctum) + MySQL + React 18 / TypeScript / Tailwind** — tudo num projeto só (o React é servido pelo Laravel via Vite).

## Como o dinheiro flui

```
Cliente ─┬─ Projeto A ─┬─ Contrato (entrada 1000 + 12x 500)
         │             │     └─ Parcelas ──[Receber]──► rateio ──┬─► Sócio 1 (20%)
         │             │                                         ├─► Sócio 2 (20%)
         │             └─ Arquivos (PDF do contrato…)            ├─► Sócio 3 (20%)
         └─ Projeto B …                                          ├─► Caixa da empresa (25%)
                                                                 └─► Reserva de custos (15%)
```

- **Rateio padrão** (tela *Sócios & Rateio*) vale para todo recebimento. Cada **projeto pode ter uma regra própria**.
- Ao dar **baixa numa parcela**, o valor é dividido e lançado no **livro-razão** (`movimentacoes`), em 3 tipos de conta:
  - `caixa` — dinheiro da empresa (reserva/reinvestimento)
  - `custos` — reserva para servidor, impostos, ferramentas…
  - `socio` — saldo **a repassar** para cada sócio
- **Despesa** = débito em custos (ou caixa), opcionalmente vinculada a um projeto.
- **Repasse** = o dinheiro saiu da conta da empresa para o sócio (zera o saldo a repassar).
- **Transferência** = mover entre contas (ex.: sobra de custos → caixa).
- **Aporte** = sócio colocou dinheiro na empresa.
- **Estorno** de parcela desfaz toda a distribuição.
- Centavos de arredondamento vão para o caixa — nada se perde.

## Telas

| Tela | O que tem |
|---|---|
| Dashboard | saldos, recebido no mês, quanto cada sócio recebeu no mês, gráfico recebido × previsto, atrasadas, próximos 30 dias |
| Clientes | lista com recebido / a receber / atrasado; detalhe com projetos, contratos e arquivos |
| Projetos | progresso de recebimento; detalhe com parcelas, rateio próprio, distribuição, despesas e arquivos |
| Contratos | abas Clientes / **Societários** / Fornecedores / Outros; gerador de parcelas (entrada + N parcelas mensais); anexos |
| Contas a receber | todas as parcelas com filtros; botão **Receber** mostra a prévia da divisão antes de confirmar |
| Caixa & Extrato | saldo de cada conta, despesas, aportes, transferências, repasses e extrato filtrável |
| Relatórios | matriz mês a mês de quanto cada sócio/caixa/custos recebeu no ano, quebra por projeto, despesas e repasses |
| Sócios & Rateio | usuários (login), regra de rateio padrão, troca de senha |

## Rodando localmente

Requisitos: PHP 8.3+, Composer, MySQL 8, Node 18+.

```bash
cp .env.example .env            # ajuste DB_USERNAME / DB_PASSWORD
# edite a senha em database/setup-mysql.sql e rode (cria bancos + usuário "financeiro"):
mysql -u root -p < database/setup-mysql.sql
composer install
php artisan key:generate
php artisan migrate --seed      # cria tabelas + 3 sócios + rateio padrão
npm install
composer dev                    # sobe php artisan serve + vite
```

Acesse http://localhost:8000 — login inicial: `socio1@financeiro.local` / `financeiro123` (idem socio2, socio3).
**Troque nomes, e-mails e senhas** em *Sócios & Rateio* logo no primeiro acesso.

Produção: `npm run build` gera `public/build`; aponte o servidor web para `public/`.

### Testes

```bash
php artisan test                # usa o banco financeiro_test (criado pelo setup-mysql.sql)
```

O teste `tests/Feature/FluxoFinanceiroTest.php` cobre o exemplo real (1000 de entrada + 12x 500, rateio, rateio por projeto, despesa, repasse, transferência e estorno).

## Estrutura

```
app/Services/FinanceiroService.php   ← regra de negócio (rateio, receber, estornar, saldos)
app/Http/Controllers/Api/*           ← endpoints REST (routes/api.php)
app/Models/*                         ← Cliente, Projeto, Contrato, Parcela, Rateio, Movimentacao, Documento
database/migrations/                 ← schema
resources/js/                        ← React (pages/, components/, lib/)
storage/app/private/documentos/      ← arquivos anexados (fora do public; download só autenticado)
```
