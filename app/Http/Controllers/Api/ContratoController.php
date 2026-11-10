<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contrato;
use App\Models\Projeto;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContratoController extends Controller
{
    public function index(Request $request)
    {
        return Contrato::query()
            ->with(['cliente:id,nome', 'projeto:id,nome'])
            ->withCount('documentos')
            ->withSum(['parcelas as recebido' => fn ($q) => $q->where('status', 'pago')], 'valor_pago')
            ->withSum(['parcelas as a_receber' => fn ($q) => $q->where('status', 'pendente')], 'valor')
            ->when($request->tipo, fn ($q, $t) => $q->where('tipo', $t))
            ->when($request->cliente_id, fn ($q, $id) => $q->where('cliente_id', $id))
            ->when($request->projeto_id, fn ($q, $id) => $q->where('projeto_id', $id))
            ->when($request->q, fn ($q, $s) => $q->where('titulo', 'like', "%$s%"))
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Cria o contrato e, opcionalmente, o plano de pagamento:
     *  entrada_valor + entrada_vencimento
     *  parcelas_qtd x parcelas_valor a partir de primeiro_vencimento (mensal)
     */
    public function store(Request $request)
    {
        $data = $this->validar($request);
        $plano = $request->validate([
            'entrada_valor' => 'nullable|numeric|min:0',
            'entrada_vencimento' => 'nullable|required_with:entrada_valor|date',
            'parcelas_qtd' => 'nullable|integer|min:1|max:360',
            'parcelas_valor' => 'nullable|required_with:parcelas_qtd|numeric|min:0.01',
            'primeiro_vencimento' => 'nullable|required_with:parcelas_qtd|date',
        ]);

        $data = $this->preencherCliente($data);

        $contrato = DB::transaction(function () use ($data, $plano) {
            $contrato = Contrato::create($data);

            if (! empty($plano['entrada_valor']) && $plano['entrada_valor'] > 0) {
                $contrato->parcelas()->create([
                    'numero' => 0,
                    'descricao' => 'Entrada',
                    'valor' => $plano['entrada_valor'],
                    'vencimento' => $plano['entrada_vencimento'],
                ]);
            }

            if (! empty($plano['parcelas_qtd'])) {
                $base = Carbon::parse($plano['primeiro_vencimento']);
                $qtd = (int) $plano['parcelas_qtd'];
                for ($i = 1; $i <= $qtd; $i++) {
                    $contrato->parcelas()->create([
                        'numero' => $i,
                        'descricao' => "Parcela {$i}/{$qtd}",
                        'valor' => $plano['parcelas_valor'],
                        'vencimento' => $base->copy()->addMonthsNoOverflow($i - 1)->toDateString(),
                    ]);
                }
            }

            // Se não informou valor total, usa a soma das parcelas
            if ((float) $contrato->valor_total <= 0) {
                $contrato->update(['valor_total' => $contrato->parcelas()->sum('valor')]);
            }

            return $contrato;
        });

        return response()->json($contrato->load('parcelas'), 201);
    }

    public function show(Contrato $contrato)
    {
        return $contrato->load(['cliente:id,nome', 'projeto:id,nome,cliente_id', 'parcelas', 'documentos']);
    }

    public function update(Request $request, Contrato $contrato)
    {
        $contrato->update($this->preencherCliente($this->validar($request)));

        return $contrato;
    }

    public function destroy(Contrato $contrato)
    {
        if ($contrato->parcelas()->where('status', 'pago')->exists()) {
            abort(422, 'Este contrato tem parcelas recebidas. Estorne-as antes de excluir, ou marque o contrato como cancelado.');
        }
        $contrato->delete();

        return response()->noContent();
    }

    private function validar(Request $request): array
    {
        return $request->validate([
            'tipo' => 'required|in:cliente,societario,fornecedor,outro',
            'cliente_id' => 'nullable|exists:clientes,id',
            'projeto_id' => 'nullable|exists:projetos,id',
            'titulo' => 'required|string|max:255',
            'numero' => 'nullable|string|max:255',
            'valor_total' => 'nullable|numeric|min:0',
            'data_assinatura' => 'nullable|date',
            'data_inicio' => 'nullable|date',
            'data_fim' => 'nullable|date',
            'status' => 'required|in:rascunho,ativo,concluido,cancelado',
            'observacoes' => 'nullable|string',
        ]);
    }

    private function preencherCliente(array $data): array
    {
        if (empty($data['cliente_id']) && ! empty($data['projeto_id'])) {
            $data['cliente_id'] = Projeto::find($data['projeto_id'])?->cliente_id;
        }
        $data['valor_total'] = $data['valor_total'] ?? 0;

        return $data;
    }
}
