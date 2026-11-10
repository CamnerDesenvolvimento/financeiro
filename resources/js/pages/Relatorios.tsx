import { useState } from 'react';
import { useGet } from '@/lib/hooks';
import { MESES_NOME, money } from '@/lib/format';
import { Card, Loading, PageHeader, Table } from '@/components/ui';

interface Linha {
  chave: string;
  nome: string;
  meses: Record<string, number>;
  total: number;
  por_projeto: { projeto: string; total: number }[];
}
interface Rel {
  ano: number;
  linhas: Linha[];
  recebido_mes: Record<string, number>;
  despesas_mes: Record<string, number>;
  repasses_mes: Record<string, number>;
}

const M = Array.from({ length: 12 }, (_, i) => i + 1);

export default function Relatorios() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const { data, isLoading } = useGet<Rel>('/relatorios/mensal', { ano });

  const cell = (v: number) => <td className={`td whitespace-nowrap text-right tabular-nums ${v ? '' : 'text-slate-300'}`}>{v ? money(v) : '—'}</td>;
  const soma = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Quanto cada sócio, o caixa e a reserva de custos receberam por mês."
        actions={
          <select className="input w-28" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        }
      />
      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <Card title={`Distribuição mensal — ${data.ano}`}>
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <th className="th sticky left-0 bg-slate-50">Destino</th>
                  {M.map((m) => (
                    <th key={m} className="th text-right">
                      {MESES_NOME[m - 1]}
                    </th>
                  ))}
                  <th className="th text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.linhas.map((l) => (
                  <tr key={l.chave}>
                    <td className="td sticky left-0 whitespace-nowrap bg-white font-medium">{l.nome}</td>
                    {M.map((m) => cell(l.meses[m]))}
                    <td className="td whitespace-nowrap text-right font-semibold tabular-nums">{money(l.total)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="td sticky left-0 bg-slate-50">Total recebido</td>
                  {M.map((m) => cell(data.recebido_mes[m]))}
                  <td className="td text-right tabular-nums">{money(soma(data.recebido_mes))}</td>
                </tr>
                <tr className="text-rose-700">
                  <td className="td sticky left-0 bg-white">Despesas</td>
                  {M.map((m) => cell(data.despesas_mes[m]))}
                  <td className="td text-right tabular-nums">{money(soma(data.despesas_mes))}</td>
                </tr>
                <tr className="text-amber-700">
                  <td className="td sticky left-0 bg-white">Repasses a sócios</td>
                  {M.map((m) => cell(data.repasses_mes[m]))}
                  <td className="td text-right tabular-nums">{money(soma(data.repasses_mes))}</td>
                </tr>
              </tbody>
            </Table>
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.linhas.map((l) => (
              <Card key={l.chave} title={`${l.nome} — por projeto`}>
                {l.por_projeto.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-400">Nada em {data.ano}.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {l.por_projeto.map((p) => (
                      <li key={p.projeto} className="flex justify-between px-5 py-2.5 text-sm">
                        <span>{p.projeto}</span>
                        <span className="font-medium tabular-nums">{money(p.total)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
