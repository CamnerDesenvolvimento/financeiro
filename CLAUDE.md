# Financeiro

Laravel 13 API (Sanctum bearer tokens) + React 18/TS SPA in the same repo, served by `resources/views/app.blade.php` via Vite (`laravel-vite-plugin` 1.x, Vite 5, Tailwind 3 — pinned for Node 18; do not bump to Vite 7/8 or Tailwind 4 without upgrading Node).

- Business logic lives in `app/Services/FinanceiroService.php`. Money split is done in integer cents; rounding remainder goes to the `caixa` item.
- `movimentacoes` is the single ledger. Balance = sum(credito) − sum(debito) per (`conta`, `user_id`). Never update balances elsewhere.
- Receiving a `parcela` creates `recebimento` movements; they are only removed by estornar (cascade on parcela_id).
- `rateios` with `projeto_id = NULL` is the company default; a project with its own rows overrides it entirely.
- Contracts with a `projeto_id` always get `cliente_id` filled from the project (client summaries rely on it).
- Domain names are in Portuguese (tables, columns, routes, UI). Keep it that way.
- Frontend: `resources/js/lib/hooks.ts` (`useGet`/`useSend`, which invalidates all queries on success). Alias `@` → `resources/js`.
- Checks: `npx tsc --noEmit`, `npm run build`, `php artisan test` (needs MySQL db `financeiro_test`).
