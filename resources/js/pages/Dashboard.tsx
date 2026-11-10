import { AlertTriangle, CalendarClock, PiggyBank, Wallet, Wrench } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useGet } from '@/lib/hooks';
import { mesCurto, money } from '@/lib/format';
import type { Parcela, Saldos } from '@/lib/types';
import ParcelasTable from '@/components/ParcelasTable';
import { Card, Loading, PageHeader, Stat } from '@/components/ui';

interface Dash {
  saldos: Saldos;
  mes: { recebido: number; a_receber: number; despesas: number; socios: { user_id: number; total: string; user: { name: string } }[] };
  atrasadas: Parcela[];
  proximas: Parcela[];
  a_receber_total: number;
  projetos_ativos: number;
  serie: { mes: string; recebido: number; previsto: number }[];
}

// Paleta categórica validada (slots 1 e 2)
const COR_RECEBIDO = '#2a78d6';
const COR_PREVISTO = '#eb6834';

export default function Dashboard() {
  const { data, isLoading } = useGet<Dash>('/dashboard');
  if (isLoading || !data) return <Loading />;

  const { saldos, mes } = data;

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`${data.projetos_ativos} projeto(s) em andamento · ${money(data.a_receber_total)} a receber no total`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Saldo total da empresa" value={money(saldos.total)} hint="caixa + custos + a repassar" icon={<Wallet className="h-4 w-4" />} />
        <Stat label="Caixa da empresa" value={money(saldos.caixa)} tone="green" icon={<PiggyBank className="h-4 w-4" />} />
        <Stat label="Reserva de custos" value={money(saldos.custos)} tone="blue" icon={<Wrench className="h-4 w-4" />} />
        <Stat
          label="Atrasado"
          value={money(data.atrasadas.reduce((s, p) => s + Number(p.valor), 0))}
          tone={data.atrasadas.length ? 'red' : 'default'}
          hint={`${data.atrasadas.length} parcela(s)`}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Este mês" className="lg:col-span-1">
          <dl className="divide-y divide-slate-100 text-sm">
            <Row label="Recebido" value={money(mes.recebido)} strong />
            <Row label="Ainda a receber no mês" value={money(mes.a_receber)} />
            <Row label="Despesas lançadas" value={money(mes.despesas)} />
          </dl>
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Cada sócio recebeu no mês</p>
            {mes.socios.length === 0 && <p className="text-sm text-slate-400">Nada ainda.</p>}
            {mes.socios.map((s) => (
              <div key={s.user_id} className="flex justify-between py-1 text-sm">
                <span>{s.user?.name}</span>
                <span className="font-medium tabular-nums">{money(s.total)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Saldo a repassar (acumulado)</p>
            {saldos.socios.map((s) => (
              <div key={s.user_id} className="flex justify-between py-1 text-sm">
                <span>{s.name}</span>
                <span className="font-medium tabular-nums">{money(s.saldo)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recebido × previsto por mês" className="lg:col-span-2">
          <div className="h-80 p-4">
            <ResponsiveContainer>
              <BarChart data={data.serie} barGap={2} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} stroke="#eef2f6" />
                <XAxis dataKey="mes" tickFormatter={mesCurto} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  labelFormatter={(l) => mesCurto(String(l))}
                  formatter={(v: number, n: string) => [money(v), n === 'recebido' ? 'Recebido' : 'Previsto (pendente)']}
                />
                <Legend formatter={(v) => <span className="text-xs text-slate-600">{v === 'recebido' ? 'Recebido' : 'Previsto (pendente)'}</span>} />
                <Bar dataKey="recebido" fill={COR_RECEBIDO} radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="previsto" fill={COR_PREVISTO} radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {data.atrasadas.length > 0 && (
        <Card title={<span className="flex items-center gap-2 text-rose-700"><AlertTriangle className="h-4 w-4" /> Parcelas atrasadas</span>} className="mt-6">
          <ParcelasTable parcelas={data.atrasadas} showContrato />
        </Card>
      )}

      <Card title={<span className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Vencendo nos próximos 30 dias</span>} className="mt-6">
        <ParcelasTable parcelas={data.proximas} showContrato />
      </Card>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between px-5 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={strong ? 'font-semibold text-emerald-600 tabular-nums' : 'font-medium tabular-nums'}>{value}</dd>
    </div>
  );
}
