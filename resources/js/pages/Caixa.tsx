import { ArrowLeftRight, HandCoins, Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useGet, useSend } from '@/lib/hooks';
import { date, LABELS, money, today } from '@/lib/format';
import type { Conta, Movimentacao, Projeto, Saldos, User } from '@/lib/types';
import { Badge, Button, Card, Empty, Field, Loading, Modal, PageHeader, Stat, Table } from '@/components/ui';

const CATEGORIAS = ['Servidor / hospedagem', 'Domínio', 'Ferramentas / SaaS', 'Impostos', 'Contador', 'Marketing', 'Freelancer', 'Equipamento', 'Taxas bancárias', 'Outros'];

type ModalTipo = 'despesa' | 'aporte' | 'transferencia' | { repasse: { user_id: number; name: string; saldo: number } } | null;

export default function Caixa() {
  const [filtro, setFiltro] = useState({ conta: '', user_id: '', origem: '', de: '', ate: '' });
  const [modal, setModal] = useState<ModalTipo>(null);
  const saldos = useGet<Saldos>('/saldos');
  const movs = useGet<Movimentacao[]>('/movimentacoes', Object.fromEntries(Object.entries(filtro).filter(([, v]) => v)));
  const excluir = useSend<number>('delete', (id) => `/movimentacoes/${id}`, 'Lançamento excluído');

  const s = saldos.data;

  return (
    <>
      <PageHeader
        title="Caixa & Extrato"
        subtitle="Cada recebimento entra dividido nas contas abaixo. Despesas saem de Custos (ou do Caixa); repasses baixam o saldo do sócio."
        actions={
          <>
            <Button variant="secondary" onClick={() => setModal('despesa')}>
              <Minus className="h-4 w-4" /> Despesa
            </Button>
            <Button variant="secondary" onClick={() => setModal('aporte')}>
              <Plus className="h-4 w-4" /> Aporte
            </Button>
            <Button variant="secondary" onClick={() => setModal('transferencia')}>
              <ArrowLeftRight className="h-4 w-4" /> Transferir
            </Button>
          </>
        }
      />

      {!s ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Caixa da empresa" value={money(s.caixa)} tone="green" />
          <Stat label="Reserva de custos" value={money(s.custos)} tone="blue" />
          {s.socios.map((so) => (
            <div key={so.user_id} className="card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">A repassar · {so.name}</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums">{money(so.saldo)}</p>
              <Button size="sm" variant="secondary" className="mt-2" disabled={so.saldo <= 0} onClick={() => setModal({ repasse: so })}>
                <HandCoins className="h-3.5 w-3.5" /> Registrar repasse
              </Button>
            </div>
          ))}
        </div>
      )}

      <Card title="Extrato" className="mt-6">
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-3">
          <Field label="Conta">
            <select className="input w-44" value={filtro.conta} onChange={(e) => setFiltro({ ...filtro, conta: e.target.value, user_id: '' })}>
              <option value="">Todas</option>
              <option value="caixa">Caixa</option>
              <option value="custos">Custos</option>
              <option value="socio">Sócios</option>
            </select>
          </Field>
          {filtro.conta === 'socio' && (
            <Field label="Sócio">
              <select className="input w-44" value={filtro.user_id} onChange={(e) => setFiltro({ ...filtro, user_id: e.target.value })}>
                <option value="">Todos</option>
                {s?.socios.map((so) => (
                  <option key={so.user_id} value={so.user_id}>
                    {so.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Origem">
            <select className="input w-40" value={filtro.origem} onChange={(e) => setFiltro({ ...filtro, origem: e.target.value })}>
              <option value="">Todas</option>
              {Object.entries(LABELS.origem).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="De">
            <input type="date" className="input" value={filtro.de} onChange={(e) => setFiltro({ ...filtro, de: e.target.value })} />
          </Field>
          <Field label="Até">
            <input type="date" className="input" value={filtro.ate} onChange={(e) => setFiltro({ ...filtro, ate: e.target.value })} />
          </Field>
        </div>
        {movs.isLoading ? (
          <Loading />
        ) : !movs.data?.length ? (
          <Empty>Nenhuma movimentação.</Empty>
        ) : (
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Data</th>
                <th className="th">Conta</th>
                <th className="th">Origem</th>
                <th className="th">Descrição</th>
                <th className="th text-right">Valor</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movs.data.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="td whitespace-nowrap tabular-nums">{date(m.data)}</td>
                  <td className="td whitespace-nowrap">{m.conta === 'socio' ? m.user?.name : LABELS.conta[m.conta]}</td>
                  <td className="td">
                    <Badge tone={{ recebimento: 'green', despesa: 'red', repasse: 'amber', aporte: 'blue', transferencia: 'gray', ajuste: 'violet' }[m.origem]}>
                      {LABELS.origem[m.origem]}
                    </Badge>
                  </td>
                  <td className="td">
                    <p>{m.descricao}</p>
                    <p className="text-xs text-slate-500">
                      {[m.categoria, m.projeto?.nome, m.percentual && `${Number(m.percentual)}%`, m.autor && `por ${m.autor.name}`].filter(Boolean).join(' · ')}
                    </p>
                  </td>
                  <td className={`td whitespace-nowrap text-right font-medium tabular-nums ${m.tipo === 'credito' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {m.tipo === 'credito' ? '+' : '−'}
                    {money(m.valor)}
                  </td>
                  <td className="td text-right">
                    {m.origem !== 'recebimento' && (
                      <Button size="sm" variant="ghost" onClick={() => confirm('Excluir este lançamento?') && excluir.mutate(m.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {(modal === 'despesa' || modal === 'aporte') && <LancamentoModal origem={modal} onClose={() => setModal(null)} />}
      {modal === 'transferencia' && <TransferenciaModal onClose={() => setModal(null)} />}
      {modal && typeof modal === 'object' && <RepasseModal socio={modal.repasse} onClose={() => setModal(null)} />}
    </>
  );
}

function LancamentoModal({ origem, onClose }: { origem: 'despesa' | 'aporte'; onClose: () => void }) {
  const projetos = useGet<Projeto[]>('/projetos');
  const socios = useGet<User[]>('/socios');
  const [f, setF] = useState({ data: today(), conta: (origem === 'despesa' ? 'custos' : 'caixa') as Conta, user_id: '', valor: '', categoria: '', descricao: '', projeto_id: '' });
  const salvar = useSend('post', '/movimentacoes', origem === 'despesa' ? 'Despesa lançada' : 'Aporte lançado');

  return (
    <Modal open onClose={onClose} title={origem === 'despesa' ? 'Nova despesa' : 'Novo aporte'}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          salvar.mutate({ ...f, origem, user_id: f.user_id || null, projeto_id: f.projeto_id || null }, { onSuccess: onClose });
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <input type="date" className="input" required value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} />
          </Field>
          <Field label="Valor (R$)">
            <input type="number" step="0.01" min="0.01" className="input" required value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
          </Field>
          <Field label={origem === 'despesa' ? 'Sai de' : 'Entra em'}>
            <select className="input" value={f.conta} onChange={(e) => setF({ ...f, conta: e.target.value as Conta })}>
              <option value="custos">Reserva de custos</option>
              <option value="caixa">Caixa da empresa</option>
              <option value="socio">Saldo de um sócio</option>
            </select>
          </Field>
          {f.conta === 'socio' ? (
            <Field label="Sócio">
              <select className="input" required value={f.user_id} onChange={(e) => setF({ ...f, user_id: e.target.value })}>
                <option value="">Selecione…</option>
                {socios.data?.filter((s) => s.socio).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Categoria">
              <select className="input" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
                <option value="">—</option>
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
        <Field label="Descrição">
          <input className="input" required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder={origem === 'despesa' ? 'Ex.: VPS Hostinger novembro' : 'Ex.: Aporte inicial'} />
        </Field>
        <Field label="Projeto (opcional)">
          <select className="input" value={f.projeto_id} onChange={(e) => setF({ ...f, projeto_id: e.target.value })}>
            <option value="">—</option>
            {projetos.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.cliente?.nome})
              </option>
            ))}
          </select>
        </Field>
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

function TransferenciaModal({ onClose }: { onClose: () => void }) {
  const socios = useGet<User[]>('/socios');
  const [f, setF] = useState({ de_conta: 'custos', de_user_id: '', para_conta: 'caixa', para_user_id: '', valor: '', data: today(), descricao: '' });
  const salvar = useSend('post', '/transferencias', 'Transferência registrada');
  const lista = socios.data?.filter((s) => s.socio) ?? [];

  const contaSelect = (k: 'de' | 'para') => (
    <div className="space-y-2">
      <select className="input" value={f[`${k}_conta`]} onChange={(e) => setF({ ...f, [`${k}_conta`]: e.target.value })}>
        <option value="caixa">Caixa da empresa</option>
        <option value="custos">Reserva de custos</option>
        <option value="socio">Saldo de sócio</option>
      </select>
      {f[`${k}_conta`] === 'socio' && (
        <select className="input" required value={f[`${k}_user_id`]} onChange={(e) => setF({ ...f, [`${k}_user_id`]: e.target.value })}>
          <option value="">Sócio…</option>
          {lista.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <Modal open onClose={onClose} title="Transferir entre contas">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          salvar.mutate({ ...f, de_user_id: f.de_user_id || null, para_user_id: f.para_user_id || null }, { onSuccess: onClose });
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="De">{contaSelect('de')}</Field>
          <Field label="Para">{contaSelect('para')}</Field>
          <Field label="Valor (R$)">
            <input type="number" step="0.01" min="0.01" className="input" required value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
          </Field>
          <Field label="Data">
            <input type="date" className="input" required value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} />
          </Field>
        </div>
        <Field label="Descrição">
          <input className="input" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder="Ex.: Sobra de custos do trimestre para o caixa" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvar.isPending}>
            Transferir
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RepasseModal({ socio, onClose }: { socio: { user_id: number; name: string; saldo: number }; onClose: () => void }) {
  const [f, setF] = useState({ valor: String(socio.saldo), data: today(), descricao: '' });
  const salvar = useSend('post', '/repasses', 'Repasse registrado');

  return (
    <Modal open onClose={onClose} title={`Repasse para ${socio.name}`}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          salvar.mutate({ ...f, user_id: socio.user_id }, { onSuccess: onClose });
        }}
      >
        <p className="text-sm text-slate-500">
          Saldo a repassar: <strong className="text-slate-800">{money(socio.saldo)}</strong>. Registre quando o dinheiro sair da conta da empresa para o sócio.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <input type="number" step="0.01" min="0.01" className="input" required value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
          </Field>
          <Field label="Data">
            <input type="date" className="input" required value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} />
          </Field>
        </div>
        <Field label="Descrição">
          <input className="input" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder="Ex.: Pró-labore novembro (PIX)" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvar.isPending}>
            Registrar repasse
          </Button>
        </div>
      </form>
    </Modal>
  );
}
