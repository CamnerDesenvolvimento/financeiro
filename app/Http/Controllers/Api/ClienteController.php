<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Parcela;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        return Cliente::query()
            ->withCount('projetos')
            ->when($request->q, fn ($q, $s) => $q->where(fn ($w) => $w->where('nome', 'like', "%$s%")->orWhere('documento', 'like', "%$s%")))
            ->orderBy('nome')
            ->get()
            ->map(function ($c) {
                $c->resumo = $this->resumo($c->id);

                return $c;
            });
    }

    public function store(Request $request)
    {
        return response()->json(Cliente::create($this->validar($request)), 201);
    }

    public function show(Cliente $cliente)
    {
        $cliente->load([
            'projetos' => fn ($q) => $q->withCount('contratos')->orderByDesc('created_at'),
            'contratos.projeto:id,nome',
            'documentos',
        ]);
        $cliente->resumo = $this->resumo($cliente->id);

        return $cliente;
    }

    public function update(Request $request, Cliente $cliente)
    {
        $cliente->update($this->validar($request));

        return $cliente;
    }

    public function destroy(Cliente $cliente)
    {
        $cliente->delete();

        return response()->noContent();
    }

    private function validar(Request $request): array
    {
        return $request->validate([
            'nome' => 'required|string|max:255',
            'tipo' => 'required|in:pf,pj',
            'documento' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'telefone' => 'nullable|string|max:30',
            'contato' => 'nullable|string|max:255',
            'endereco' => 'nullable|string|max:255',
            'observacoes' => 'nullable|string',
            'ativo' => 'boolean',
        ]);
    }

    private function resumo(int $clienteId): array
    {
        // contratos com projeto sempre recebem o cliente_id do projeto (ver ContratoController)
        $parcelas = Parcela::whereHas('contrato', fn ($q) => $q->where('cliente_id', $clienteId))->get();

        return [
            'recebido' => round((float) $parcelas->where('status', 'pago')->sum('valor_pago'), 2),
            'a_receber' => round((float) $parcelas->where('status', 'pendente')->sum('valor'), 2),
            'atrasado' => round((float) $parcelas->where('situacao', 'atrasado')->sum('valor'), 2),
        ];
    }
}
