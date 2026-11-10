import { useState } from 'react';
import { useGet } from '@/lib/hooks';
import { money } from '@/lib/format';
import type { Parcela, Situacao } from '@/lib/types';
import ParcelasTable from '@/components/ParcelasTable';
import { Card, Field, Loading, PageHeader } from '@/components/ui';

export default function Receber() {
  const [f, setF] = useState<{ situacao: '' | Situacao; de: string; ate: string }>({ situacao: 'pendente', de: '', ate: '' });
  const { data, isLoading } = useGet<Parcela[]>('/parcelas', {
    situacao: f.situacao || undefined,
    de: f.de || undefined,
    ate: f.ate || undefined,
  });
  const total = (data ?? []).reduce((s, p) => s + Number(p.status === 'pago' ? p.valor_pago : p.valor), 0);

  return (
    <>
      <PageHeader title="Contas a receber" subtitle="Dê baixa nas parcelas pagas — o valor é distribuído automaticamente entre sócios, caixa e custos." />
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-3">
          <Field label="Situação">
            <select className="input w-44" value={f.situacao} onChange={(e) => setF({ ...f, situacao: e.target.value as Situacao })}>
              <option value="">Todas</option>
              <option value="pendente">Pendentes</option>
              <option value="atrasado">Atrasadas</option>
              <option value="pago">Pagas</option>
              <option value="cancelado">Canceladas</option>
            </select>
          </Field>
          <Field label="Vencimento de">
            <input type="date" className="input" value={f.de} onChange={(e) => setF({ ...f, de: e.target.value })} />
          </Field>
          <Field label="até">
            <input type="date" className="input" value={f.ate} onChange={(e) => setF({ ...f, ate: e.target.value })} />
          </Field>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-500">{data?.length ?? 0} parcela(s)</p>
            <p className="text-lg font-semibold tabular-nums">{money(total)}</p>
          </div>
        </div>
        {isLoading ? <Loading /> : <ParcelasTable parcelas={data ?? []} showContrato />}
      </Card>
    </>
  );
}
