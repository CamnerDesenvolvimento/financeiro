import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGet, useSend } from '@/lib/hooks';
import { date, LABELS, money } from '@/lib/format';
import type { Cliente } from '@/lib/types';
import Documentos from '@/components/Documentos';
import { ClienteForm, ContratoForm, ProjetoForm } from '@/components/forms';
import { Badge, Button, Card, Empty, Loading, PageHeader, PROJETO_TONE, Stat, Table } from '@/components/ui';

export default function ClienteDetalhe() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: c, isLoading } = useGet<Cliente>(`/clientes/${id}`);
  const [modal, setModal] = useState<'editar' | 'projeto' | 'contrato' | null>(null);
  const excluir = useSend('delete', `/clientes/${id}`, 'Cliente excluído');

  if (isLoading || !c) return <Loading />;

  return (
    <>
      <PageHeader
        title={c.nome}
        subtitle={[c.tipo === 'pj' ? 'PJ' : 'PF', c.documento, c.email, c.telefone].filter(Boolean).join(' · ')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setModal('editar')}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button
              variant="ghost"
              onClick={() => confirm('Excluir o cliente e TODOS os seus projetos?') && excluir.mutate(undefined, { onSuccess: () => nav('/clientes') })}
            >
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Recebido" value={money(c.resumo?.recebido)} tone="green" />
        <Stat label="A receber" value={money(c.resumo?.a_receber)} />
        <Stat label="Atrasado" value={money(c.resumo?.atrasado)} tone={c.resumo?.atrasado ? 'red' : 'default'} />
      </div>

      <Card
        title="Projetos"
        className="mt-6"
        actions={
          <Button size="sm" onClick={() => setModal('projeto')}>
            <Plus className="h-3.5 w-3.5" /> Novo projeto
          </Button>
        }
      >
        {!c.projetos?.length ? (
          <Empty>Nenhum projeto para este cliente.</Empty>
        ) : (
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Projeto</th>
                <th className="th">Status</th>
                <th className="th">Início</th>
                <th className="th text-center">Contratos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {c.projetos.map((p) => (
                <tr key={p.id}>
                  <td className="td">
                    <Link to={`/projetos/${p.id}`} className="font-medium hover:text-emerald-700">
                      {p.nome}
                    </Link>
                  </td>
                  <td className="td">
                    <Badge tone={PROJETO_TONE[p.status]}>{LABELS.projetoStatus[p.status]}</Badge>
                  </td>
                  <td className="td">{date(p.data_inicio)}</td>
                  <td className="td text-center">{p.contratos_count}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Contratos"
          actions={
            <Button size="sm" variant="secondary" onClick={() => setModal('contrato')}>
              <Plus className="h-3.5 w-3.5" /> Contrato
            </Button>
          }
        >
          {!c.contratos?.length ? (
            <Empty>Nenhum contrato.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {c.contratos.map((ct) => (
                <li key={ct.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Link to={`/contratos/${ct.id}`} className="text-sm font-medium hover:text-emerald-700">
                      {ct.titulo}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {ct.projeto?.nome ?? 'Sem projeto'} · {LABELS.contratoStatus[ct.status]}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{money(ct.valor_total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Documentos tipo="cliente" id={c.id} documentos={c.documentos ?? []} />
      </div>

      {c.observacoes && (
        <Card title="Observações" className="mt-6">
          <p className="whitespace-pre-wrap p-5 text-sm text-slate-600">{c.observacoes}</p>
        </Card>
      )}

      {modal === 'editar' && <ClienteForm cliente={c} onClose={() => setModal(null)} />}
      {modal === 'projeto' && <ProjetoForm clienteId={c.id} onClose={() => setModal(null)} />}
      {modal === 'contrato' && <ContratoForm defaults={{ cliente_id: c.id }} onClose={() => setModal(null)} />}
    </>
  );
}
