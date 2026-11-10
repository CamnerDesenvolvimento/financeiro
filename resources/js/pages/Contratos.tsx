import { Paperclip, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useGet } from '@/lib/hooks';
import { date, LABELS, money } from '@/lib/format';
import type { Contrato, ContratoTipo } from '@/lib/types';
import { ContratoForm } from '@/components/forms';
import { Badge, Button, Card, Empty, Loading, PageHeader, Table } from '@/components/ui';

const ABAS: { v: '' | ContratoTipo; l: string }[] = [
  { v: '', l: 'Todos' },
  { v: 'cliente', l: 'Clientes' },
  { v: 'societario', l: 'Societários' },
  { v: 'fornecedor', l: 'Fornecedores' },
  { v: 'outro', l: 'Outros' },
];

export default function Contratos() {
  const [params, setParams] = useSearchParams();
  const tipo = (params.get('tipo') ?? '') as '' | ContratoTipo;
  const [novo, setNovo] = useState(false);
  const { data, isLoading } = useGet<Contrato[]>('/contratos', { tipo: tipo || undefined });

  return (
    <>
      <PageHeader
        title="Contratos"
        subtitle="Contratos com clientes, o contrato da sociedade e outros documentos contratuais."
        actions={
          <Button onClick={() => setNovo(true)}>
            <Plus className="h-4 w-4" /> Novo contrato
          </Button>
        }
      />
      <Card>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-2">
          {ABAS.map((a) => (
            <button
              key={a.v}
              onClick={() => setParams(a.v ? { tipo: a.v } : {})}
              className={clsx('whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', tipo === a.v ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700')}
            >
              {a.l}
            </button>
          ))}
        </div>
        {isLoading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>Nenhum contrato.</Empty>
        ) : (
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Contrato</th>
                <th className="th">Tipo</th>
                <th className="th">Assinatura</th>
                <th className="th text-right">Valor</th>
                <th className="th text-right">Recebido</th>
                <th className="th text-right">A receber</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="td">
                    <Link to={`/contratos/${c.id}`} className="flex items-center gap-1.5 font-medium hover:text-emerald-700">
                      {c.titulo}
                      {!!c.documentos_count && <Paperclip className="h-3.5 w-3.5 text-slate-400" />}
                    </Link>
                    <p className="text-xs text-slate-500">{[c.cliente?.nome, c.projeto?.nome].filter(Boolean).join(' · ') || '—'}</p>
                  </td>
                  <td className="td">
                    <Badge tone={c.tipo === 'societario' ? 'violet' : 'gray'}>{LABELS.contratoTipo[c.tipo]}</Badge>
                  </td>
                  <td className="td">{date(c.data_assinatura)}</td>
                  <td className="td text-right tabular-nums">{money(c.valor_total)}</td>
                  <td className="td text-right tabular-nums text-emerald-700">{money(c.recebido)}</td>
                  <td className="td text-right tabular-nums">{money(c.a_receber)}</td>
                  <td className="td">{LABELS.contratoStatus[c.status]}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {novo && <ContratoForm defaults={{ tipo: tipo || 'cliente' }} onClose={() => setNovo(false)} />}
    </>
  );
}
