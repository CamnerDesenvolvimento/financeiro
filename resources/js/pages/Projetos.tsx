import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGet } from '@/lib/hooks';
import { LABELS, money } from '@/lib/format';
import type { Projeto } from '@/lib/types';
import { ProjetoForm } from '@/components/forms';
import { Badge, Button, Card, Empty, Loading, PageHeader, PROJETO_TONE, Table } from '@/components/ui';

export default function Projetos() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [novo, setNovo] = useState(false);
  const { data, isLoading } = useGet<Projeto[]>('/projetos', { status: status || undefined, q: q || undefined });

  return (
    <>
      <PageHeader
        title="Projetos"
        actions={
          <Button onClick={() => setNovo(true)}>
            <Plus className="h-4 w-4" /> Novo projeto
          </Button>
        }
      />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          <input className="input max-w-xs" placeholder="Buscar projeto…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {Object.entries(LABELS.projetoStatus).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        {isLoading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>Nenhum projeto.</Empty>
        ) : (
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Projeto</th>
                <th className="th">Status</th>
                <th className="th text-right">Contratado</th>
                <th className="th text-right">Recebido</th>
                <th className="th text-right">A receber</th>
                <th className="th w-40">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((p) => {
                const r = p.resumo!;
                const total = r.recebido + r.a_receber;
                const pct = total ? Math.round((r.recebido / total) * 100) : 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="td">
                      <Link to={`/projetos/${p.id}`} className="font-medium hover:text-emerald-700">
                        {p.nome}
                      </Link>
                      <p className="text-xs text-slate-500">{p.cliente?.nome}</p>
                    </td>
                    <td className="td">
                      <Badge tone={PROJETO_TONE[p.status]}>{LABELS.projetoStatus[p.status]}</Badge>
                    </td>
                    <td className="td text-right tabular-nums">{money(r.valor_contratado)}</td>
                    <td className="td text-right tabular-nums text-emerald-700">{money(r.recebido)}</td>
                    <td className={`td text-right tabular-nums ${r.atrasado ? 'text-rose-600' : ''}`}>{money(r.a_receber)}</td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-9 text-right text-xs text-slate-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
      {novo && <ProjetoForm onClose={() => setNovo(false)} />}
    </>
  );
}
