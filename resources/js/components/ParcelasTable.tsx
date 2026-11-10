import { Check, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGet, useSend } from '@/lib/hooks';
import { date, FORMAS_PAGAMENTO, LABELS, money, today } from '@/lib/format';
import type { Parcela } from '@/lib/types';
import { Badge, Button, Empty, Field, Modal, SITUACAO_TONE, Table } from './ui';

interface Props {
  parcelas: Parcela[];
  contratoId?: number;
  showContrato?: boolean;
}

export default function ParcelasTable({ parcelas, contratoId, showContrato }: Props) {
  const [receber, setReceber] = useState<Parcela | null>(null);
  const [editar, setEditar] = useState<Parcela | 'nova' | null>(null);
  const estornar = useSend<number>('post', (id) => `/parcelas/${id}/estornar`, 'Recebimento estornado');
  const excluir = useSend<number>('delete', (id) => `/parcelas/${id}`, 'Parcela excluída');

  return (
    <>
      {contratoId && (
        <div className="flex justify-end border-b border-slate-100 px-5 py-2">
          <Button size="sm" variant="secondary" onClick={() => setEditar('nova')}>
            <Plus className="h-3.5 w-3.5" /> Adicionar parcela
          </Button>
        </div>
      )}
      {parcelas.length === 0 ? (
        <Empty>Nenhuma parcela.</Empty>
      ) : (
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Vencimento</th>
              <th className="th">Descrição</th>
              {showContrato && <th className="th">Cliente / Contrato</th>}
              <th className="th text-right">Valor</th>
              <th className="th">Situação</th>
              <th className="th">Pagamento</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parcelas.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="td whitespace-nowrap tabular-nums">{date(p.vencimento)}</td>
                <td className="td">{p.descricao}</td>
                {showContrato && (
                  <td className="td">
                    <p className="font-medium">{p.contrato?.cliente?.nome ?? '—'}</p>
                    <Link to={`/contratos/${p.contrato_id}`} className="text-xs text-emerald-700 hover:underline">
                      {p.contrato?.titulo}
                      {p.contrato?.projeto && ` · ${p.contrato.projeto.nome}`}
                    </Link>
                  </td>
                )}
                <td className="td text-right font-medium tabular-nums">{money(p.valor)}</td>
                <td className="td">
                  <Badge tone={SITUACAO_TONE[p.situacao]}>{LABELS.situacao[p.situacao]}</Badge>
                </td>
                <td className="td whitespace-nowrap text-xs text-slate-500">
                  {p.status === 'pago' ? (
                    <>
                      {date(p.data_pagamento)} · {money(p.valor_pago)}
                      {p.forma_pagamento && <span className="uppercase"> · {p.forma_pagamento}</span>}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="td whitespace-nowrap text-right">
                  {p.status === 'pendente' && (
                    <>
                      <Button size="sm" onClick={() => setReceber(p)}>
                        <Check className="h-3.5 w-3.5" /> Receber
                      </Button>
                      <Button size="sm" variant="ghost" title="Editar" onClick={() => setEditar(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Excluir" onClick={() => confirm('Excluir esta parcela?') && excluir.mutate(p.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </Button>
                    </>
                  )}
                  {p.status === 'pago' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Estornar"
                      onClick={() => confirm('Estornar o recebimento? A distribuição para sócios/caixa/custos será desfeita.') && estornar.mutate(p.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Estornar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {receber && <ReceberModal parcela={receber} onClose={() => setReceber(null)} />}
      {editar && <ParcelaForm parcela={editar === 'nova' ? null : editar} contratoId={contratoId} onClose={() => setEditar(null)} />}
    </>
  );
}

interface Simulacao {
  personalizado: boolean;
  itens: { destino: 'socio' | 'caixa' | 'custos'; user: { name: string } | null; percentual: string; valor: number }[];
}

function ReceberModal({ parcela, onClose }: { parcela: Parcela; onClose: () => void }) {
  const [form, setForm] = useState({ data_pagamento: today(), valor_pago: parcela.valor, forma_pagamento: 'pix' });
  const sim = useGet<Simulacao>(`/parcelas/${parcela.id}/simular`, { valor: form.valor_pago || 0 });
  const salvar = useSend('post', `/parcelas/${parcela.id}/receber`, 'Recebimento registrado e distribuído!');

  return (
    <Modal open onClose={onClose} title={`Receber: ${parcela.descricao}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          salvar.mutate(form, { onSuccess: onClose });
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data do pagamento">
            <input type="date" className="input" required value={form.data_pagamento} onChange={(e) => setForm({ ...form, data_pagamento: e.target.value })} />
          </Field>
          <Field label="Valor recebido (R$)">
            <input type="number" step="0.01" min="0.01" className="input" required value={form.valor_pago} onChange={(e) => setForm({ ...form, valor_pago: e.target.value })} />
          </Field>
          <Field label="Forma" className="col-span-2">
            <select className="input" value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}>
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Distribuição {sim.data?.personalizado ? '(regra do projeto)' : '(regra padrão)'}
          </p>
          {sim.isError && <p className="text-sm text-rose-600">Configure o rateio em “Sócios & Rateio” antes de receber.</p>}
          <ul className="space-y-1 text-sm">
            {sim.data?.itens.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span>
                  {i.destino === 'socio' ? i.user?.name : LABELS.conta[i.destino]} <span className="text-slate-400">({Number(i.percentual)}%)</span>
                </span>
                <span className="font-medium tabular-nums">{money(i.valor)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvar.isPending}>
            Confirmar recebimento
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ParcelaForm({ parcela, contratoId, onClose }: { parcela: Parcela | null; contratoId?: number; onClose: () => void }) {
  const [form, setForm] = useState({
    descricao: parcela?.descricao ?? '',
    valor: parcela?.valor ?? '',
    vencimento: parcela?.vencimento ?? today(),
    status: parcela?.status ?? 'pendente',
  });
  const salvar = useSend(parcela ? 'put' : 'post', parcela ? `/parcelas/${parcela.id}` : `/contratos/${contratoId}/parcelas`, 'Parcela salva');

  return (
    <Modal open onClose={onClose} title={parcela ? 'Editar parcela' : 'Nova parcela'}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          salvar.mutate(form, { onSuccess: onClose });
        }}
      >
        <Field label="Descrição">
          <input className="input" required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: Parcela extra, Aditivo…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <input type="number" step="0.01" min="0.01" className="input" required value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
          </Field>
          <Field label="Vencimento">
            <input type="date" className="input" required value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
          </Field>
        </div>
        {parcela && (
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'pendente' })}>
              <option value="pendente">Pendente</option>
              <option value="cancelado">Cancelada</option>
            </select>
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvar.isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
