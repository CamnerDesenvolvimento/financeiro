import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGet, useSend } from '@/lib/hooks';
import { date, LABELS, money } from '@/lib/format';
import type { Movimentacao, Projeto } from '@/lib/types';
import Documentos from '@/components/Documentos';
import ParcelasTable from '@/components/ParcelasTable';
import RateioEditor from '@/components/RateioEditor';
import { ContratoForm, ProjetoForm } from '@/components/forms';
import { Badge, Button, Card, Empty, Loading, PageHeader, PROJETO_TONE, Stat } from '@/components/ui';

export default function ProjetoDetalhe() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: p, isLoading } = useGet<Projeto>(`/projetos/${id}`);
  const despesas = useGet<Movimentacao[]>('/movimentacoes', { projeto_id: id, origem: 'despesa' });
  const [modal, setModal] = useState<'editar' | 'contrato' | null>(null);
  const excluir = useSend('delete', `/projetos/${id}`, 'Projeto excluído');

  if (isLoading || !p) return <Loading />;
  const r = p.resumo!;
  const parcelas = (p.contratos ?? []).flatMap((c) => (c.parcelas ?? []).map((x) => ({ ...x, contrato: { id: c.id, titulo: c.titulo, cliente: null, projeto: null } })));

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {p.nome} <Badge tone={PROJETO_TONE[p.status]}>{LABELS.projetoStatus[p.status]}</Badge>
          </span>
        }
        subtitle={
          <>
            <Link to={`/clientes/${p.cliente_id}`} className="text-emerald-700 hover:underline">
              {p.cliente?.nome}
            </Link>
            {p.data_inicio && ` · início ${date(p.data_inicio)}`}
            {p.data_fim && ` · fim ${date(p.data_fim)}`}
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setModal('editar')}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button variant="ghost" onClick={() => confirm('Excluir o projeto?') && excluir.mutate(undefined, { onSuccess: () => nav('/projetos') })}>
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Contratado" value={money(r.valor_contratado)} />
        <Stat label="Recebido" value={money(r.recebido)} tone="green" />
        <Stat label="A receber" value={money(r.a_receber)} />
        <Stat label="Atrasado" value={money(r.atrasado)} tone={r.atrasado ? 'red' : 'default'} />
        <Stat label="Despesas do projeto" value={money(r.despesas)} tone="amber" />
      </div>

      {p.descricao && <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{p.descricao}</p>}

      <Card
        title="Parcelas de todos os contratos"
        className="mt-6"
        actions={
          <Button size="sm" onClick={() => setModal('contrato')}>
            <Plus className="h-3.5 w-3.5" /> Novo contrato
          </Button>
        }
      >
        <ParcelasTable parcelas={parcelas} showContrato />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RateioEditor projetoId={p.id} />
        <Card title="Quanto já foi distribuído deste projeto">
          {!p.distribuicao?.length ? (
            <Empty>Nenhum recebimento ainda.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {p.distribuicao.map((d, i) => (
                <li key={i} className="flex justify-between px-5 py-3 text-sm">
                  <span>{d.conta === 'socio' ? d.user?.name : LABELS.conta[d.conta]}</span>
                  <span className="font-medium tabular-nums">{money(d.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Contratos">
          {!p.contratos?.length ? (
            <Empty>Nenhum contrato neste projeto.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {p.contratos.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Link to={`/contratos/${c.id}`} className="text-sm font-medium hover:text-emerald-700">
                      {c.titulo}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {LABELS.contratoStatus[c.status]} · {c.parcelas?.length ?? 0} parcela(s)
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{money(c.valor_total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Despesas lançadas no projeto">
          {!despesas.data?.length ? (
            <Empty>Lance despesas em “Caixa & Extrato” vinculando a este projeto.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {despesas.data.map((m) => (
                <li key={m.id} className="flex justify-between px-5 py-3 text-sm">
                  <span>
                    {date(m.data)} · {m.descricao}
                  </span>
                  <span className="font-medium tabular-nums text-rose-600">-{money(m.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Documentos tipo="projeto" id={p.id} documentos={p.documentos ?? []} />
      </div>

      {modal === 'editar' && <ProjetoForm projeto={p} onClose={() => setModal(null)} />}
      {modal === 'contrato' && <ContratoForm defaults={{ cliente_id: p.cliente_id, projeto_id: p.id }} onClose={() => setModal(null)} />}
    </>
  );
}
