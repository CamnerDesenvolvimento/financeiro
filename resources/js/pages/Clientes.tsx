import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGet } from '@/lib/hooks';
import { money } from '@/lib/format';
import type { Cliente } from '@/lib/types';
import { ClienteForm } from '@/components/forms';
import { Button, Card, Empty, Loading, PageHeader, Table } from '@/components/ui';

export default function Clientes() {
  const [q, setQ] = useState('');
  const [novo, setNovo] = useState(false);
  const { data, isLoading } = useGet<Cliente[]>('/clientes', { q: q || undefined });

  return (
    <>
      <PageHeader
        title="Clientes"
        actions={
          <Button onClick={() => setNovo(true)}>
            <Plus className="h-4 w-4" /> Novo cliente
          </Button>
        }
      />
      <Card>
        <div className="border-b border-slate-100 p-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Buscar por nome ou documento…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {isLoading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>Nenhum cliente cadastrado.</Empty>
        ) : (
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Cliente</th>
                <th className="th">Contato</th>
                <th className="th text-center">Projetos</th>
                <th className="th text-right">Recebido</th>
                <th className="th text-right">A receber</th>
                <th className="th text-right">Atrasado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="td">
                    <Link to={`/clientes/${c.id}`} className="font-medium text-slate-900 hover:text-emerald-700">
                      {c.nome}
                    </Link>
                    <p className="text-xs text-slate-500">{c.documento}</p>
                  </td>
                  <td className="td text-slate-600">
                    {c.contato && <p>{c.contato}</p>}
                    <p className="text-xs text-slate-500">{[c.email, c.telefone].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="td text-center">{c.projetos_count}</td>
                  <td className="td text-right tabular-nums text-emerald-700">{money(c.resumo?.recebido)}</td>
                  <td className="td text-right tabular-nums">{money(c.resumo?.a_receber)}</td>
                  <td className={`td text-right tabular-nums ${c.resumo?.atrasado ? 'font-medium text-rose-600' : 'text-slate-400'}`}>{money(c.resumo?.atrasado)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {novo && <ClienteForm onClose={() => setNovo(false)} />}
    </>
  );
}
