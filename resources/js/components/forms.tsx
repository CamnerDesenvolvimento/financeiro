import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGet, useSend } from '@/lib/hooks';
import { LABELS, money, today } from '@/lib/format';
import type { Cliente, Contrato, ContratoTipo, Projeto } from '@/lib/types';
import { Button, Field, Modal } from './ui';

type Str<T> = { [K in keyof T]: string };

function Actions({ onClose, loading }: { onClose: () => void; loading: boolean }) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <Button type="button" variant="secondary" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="submit" loading={loading}>
        Salvar
      </Button>
    </div>
  );
}

// ─── Cliente ─────────────────────────────────────────────────────────────────

export function ClienteForm({ cliente, onClose }: { cliente?: Cliente; onClose: () => void }) {
  const nav = useNavigate();
  const [f, setF] = useState({
    nome: cliente?.nome ?? '',
    tipo: cliente?.tipo ?? 'pj',
    documento: cliente?.documento ?? '',
    email: cliente?.email ?? '',
    telefone: cliente?.telefone ?? '',
    contato: cliente?.contato ?? '',
    endereco: cliente?.endereco ?? '',
    observacoes: cliente?.observacoes ?? '',
  });
  const salvar = useSend<typeof f, Cliente>(cliente ? 'put' : 'post', cliente ? `/clientes/${cliente.id}` : '/clientes', 'Cliente salvo');
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Modal open onClose={onClose} title={cliente ? 'Editar cliente' : 'Novo cliente'} wide>
      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          salvar.mutate(f, {
            onSuccess: (c) => {
              onClose();
              if (!cliente) nav(`/clientes/${c.id}`);
            },
          });
        }}
      >
        <Field label="Nome / Razão social" className="sm:col-span-2">
          <input className="input" required value={f.nome} onChange={up('nome')} />
        </Field>
        <Field label="Tipo">
          <select className="input" value={f.tipo} onChange={up('tipo')}>
            <option value="pj">Pessoa jurídica</option>
            <option value="pf">Pessoa física</option>
          </select>
        </Field>
        <Field label={f.tipo === 'pj' ? 'CNPJ' : 'CPF'}>
          <input className="input" value={f.documento} onChange={up('documento')} />
        </Field>
        <Field label="E-mail">
          <input type="email" className="input" value={f.email} onChange={up('email')} />
        </Field>
        <Field label="Telefone">
          <input className="input" value={f.telefone} onChange={up('telefone')} />
        </Field>
        <Field label="Pessoa de contato">
          <input className="input" value={f.contato} onChange={up('contato')} />
        </Field>
        <Field label="Endereço">
          <input className="input" value={f.endereco} onChange={up('endereco')} />
        </Field>
        <Field label="Observações" className="sm:col-span-2">
          <textarea className="input" rows={3} value={f.observacoes} onChange={up('observacoes')} />
        </Field>
        <div className="sm:col-span-2">
          <Actions onClose={onClose} loading={salvar.isPending} />
        </div>
      </form>
    </Modal>
  );
}

// ─── Projeto ─────────────────────────────────────────────────────────────────

export function ProjetoForm({ projeto, clienteId, onClose }: { projeto?: Projeto; clienteId?: number; onClose: () => void }) {
  const nav = useNavigate();
  const clientes = useGet<Cliente[]>('/clientes');
  const [f, setF] = useState({
    cliente_id: String(projeto?.cliente_id ?? clienteId ?? ''),
    nome: projeto?.nome ?? '',
    descricao: projeto?.descricao ?? '',
    status: projeto?.status ?? 'em_andamento',
    data_inicio: projeto?.data_inicio ?? today(),
    data_fim: projeto?.data_fim ?? '',
  });
  const salvar = useSend<typeof f, Projeto>(projeto ? 'put' : 'post', projeto ? `/projetos/${projeto.id}` : '/projetos', 'Projeto salvo');
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Modal open onClose={onClose} title={projeto ? 'Editar projeto' : 'Novo projeto'}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          salvar.mutate(f, {
            onSuccess: (p) => {
              onClose();
              if (!projeto) nav(`/projetos/${p.id}`);
            },
          });
        }}
      >
        <Field label="Cliente">
          <select className="input" required value={f.cliente_id} onChange={up('cliente_id')}>
            <option value="">Selecione…</option>
            {clientes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nome do projeto">
          <input className="input" required value={f.nome} onChange={up('nome')} placeholder="Ex.: Site institucional, App delivery…" />
        </Field>
        <Field label="Descrição">
          <textarea className="input" rows={3} value={f.descricao} onChange={up('descricao')} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Status">
            <select className="input" value={f.status} onChange={up('status')}>
              {Object.entries(LABELS.projetoStatus).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Início">
            <input type="date" className="input" value={f.data_inicio} onChange={up('data_inicio')} />
          </Field>
          <Field label="Fim previsto">
            <input type="date" className="input" value={f.data_fim} onChange={up('data_fim')} />
          </Field>
        </div>
        <Actions onClose={onClose} loading={salvar.isPending} />
      </form>
    </Modal>
  );
}

// ─── Contrato (com gerador de parcelas) ──────────────────────────────────────

interface ContratoFormProps {
  contrato?: Contrato;
  defaults?: { tipo?: ContratoTipo; cliente_id?: number; projeto_id?: number };
  onClose: () => void;
}

export function ContratoForm({ contrato, defaults, onClose }: ContratoFormProps) {
  const nav = useNavigate();
  const clientes = useGet<Cliente[]>('/clientes');
  const projetos = useGet<Projeto[]>('/projetos');
  const [f, setF] = useState<Str<Omit<Contrato, 'id' | 'cliente' | 'projeto' | 'parcelas' | 'documentos' | 'documentos_count' | 'recebido' | 'a_receber'>>>({
    tipo: contrato?.tipo ?? defaults?.tipo ?? 'cliente',
    cliente_id: String(contrato?.cliente_id ?? defaults?.cliente_id ?? ''),
    projeto_id: String(contrato?.projeto_id ?? defaults?.projeto_id ?? ''),
    titulo: contrato?.titulo ?? '',
    numero: contrato?.numero ?? '',
    valor_total: contrato ? String(Number(contrato.valor_total)) : '',
    data_assinatura: contrato?.data_assinatura ?? today(),
    data_inicio: contrato?.data_inicio ?? '',
    data_fim: contrato?.data_fim ?? '',
    status: contrato?.status ?? 'ativo',
    observacoes: contrato?.observacoes ?? '',
  });
  const [plano, setPlano] = useState({ entrada_valor: '', entrada_vencimento: today(), parcelas_qtd: '', parcelas_valor: '', primeiro_vencimento: '' });
  const salvar = useSend<Record<string, unknown>, Contrato>(contrato ? 'put' : 'post', contrato ? `/contratos/${contrato.id}` : '/contratos', 'Contrato salvo');
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const upP = (k: keyof typeof plano) => (e: React.ChangeEvent<HTMLInputElement>) => setPlano({ ...plano, [k]: e.target.value });

  const projetosFiltrados = (projetos.data ?? []).filter((p) => !f.cliente_id || String(p.cliente_id) === f.cliente_id);
  const totalPlano = Number(plano.entrada_valor || 0) + Number(plano.parcelas_qtd || 0) * Number(plano.parcelas_valor || 0);
  const ehSocietario = f.tipo === 'societario';

  const submit = () => {
    const body: Record<string, unknown> = { ...f, cliente_id: f.cliente_id || null, projeto_id: f.projeto_id || null, valor_total: f.valor_total || null };
    if (!contrato) {
      if (Number(plano.entrada_valor) > 0) Object.assign(body, { entrada_valor: plano.entrada_valor, entrada_vencimento: plano.entrada_vencimento });
      if (Number(plano.parcelas_qtd) > 0)
        Object.assign(body, { parcelas_qtd: plano.parcelas_qtd, parcelas_valor: plano.parcelas_valor, primeiro_vencimento: plano.primeiro_vencimento });
    }
    salvar.mutate(body, {
      onSuccess: (c) => {
        onClose();
        if (!contrato) nav(`/contratos/${c.id}`);
      },
    });
  };

  return (
    <Modal open onClose={onClose} title={contrato ? 'Editar contrato' : 'Novo contrato'} wide>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tipo">
            <select className="input" value={f.tipo} onChange={up('tipo')}>
              {Object.entries(LABELS.contratoTipo).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={f.status} onChange={up('status')}>
              {Object.entries(LABELS.contratoStatus).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Título" className="sm:col-span-2">
            <input className="input" required value={f.titulo} onChange={up('titulo')} placeholder={ehSocietario ? 'Contrato social / Acordo de sócios' : 'Ex.: Desenvolvimento do site'} />
          </Field>
          {!ehSocietario && (
            <>
              <Field label="Cliente">
                <select className="input" value={f.cliente_id} onChange={(e) => setF({ ...f, cliente_id: e.target.value, projeto_id: '' })}>
                  <option value="">—</option>
                  {clientes.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Projeto">
                <select className="input" value={f.projeto_id} onChange={up('projeto_id')}>
                  <option value="">—</option>
                  {projetosFiltrados.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
          <Field label="Número / referência">
            <input className="input" value={f.numero} onChange={up('numero')} />
          </Field>
          <Field label="Valor total (R$)">
            <input type="number" step="0.01" min="0" className="input" value={f.valor_total} onChange={up('valor_total')} placeholder={!contrato && totalPlano ? `${totalPlano} (soma das parcelas)` : ''} />
          </Field>
          <Field label="Assinatura">
            <input type="date" className="input" value={f.data_assinatura} onChange={up('data_assinatura')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vigência início">
              <input type="date" className="input" value={f.data_inicio} onChange={up('data_inicio')} />
            </Field>
            <Field label="Vigência fim">
              <input type="date" className="input" value={f.data_fim} onChange={up('data_fim')} />
            </Field>
          </div>
          <Field label="Observações / cláusulas importantes" className="sm:col-span-2">
            <textarea className="input" rows={3} value={f.observacoes} onChange={up('observacoes')} />
          </Field>
        </div>

        {!contrato && !ehSocietario && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="mb-3 text-sm font-semibold text-emerald-900">Plano de pagamento (gera as parcelas automaticamente)</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Field label="Entrada (R$)">
                <input type="number" step="0.01" min="0" className="input" value={plano.entrada_valor} onChange={upP('entrada_valor')} placeholder="1000" />
              </Field>
              <Field label="Venc. entrada">
                <input type="date" className="input" value={plano.entrada_vencimento} onChange={upP('entrada_vencimento')} />
              </Field>
              <Field label="Nº parcelas">
                <input type="number" min="0" className="input" value={plano.parcelas_qtd} onChange={upP('parcelas_qtd')} placeholder="12" />
              </Field>
              <Field label="Valor parcela">
                <input type="number" step="0.01" min="0" className="input" value={plano.parcelas_valor} onChange={upP('parcelas_valor')} placeholder="500" required={Number(plano.parcelas_qtd) > 0} />
              </Field>
              <Field label="1º vencimento">
                <input type="date" className="input" value={plano.primeiro_vencimento} onChange={upP('primeiro_vencimento')} required={Number(plano.parcelas_qtd) > 0} />
              </Field>
            </div>
            {totalPlano > 0 && (
              <p className="mt-3 text-sm text-emerald-900">
                {Number(plano.entrada_valor) > 0 && <>Entrada de {money(plano.entrada_valor)} + </>}
                {Number(plano.parcelas_qtd) > 0 && (
                  <>
                    {plano.parcelas_qtd}x de {money(plano.parcelas_valor)}{' '}
                  </>
                )}
                = <strong>{money(totalPlano)}</strong>
              </p>
            )}
          </div>
        )}

        <Actions onClose={onClose} loading={salvar.isPending} />
      </form>
    </Modal>
  );
}
