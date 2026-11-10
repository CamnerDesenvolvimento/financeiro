import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGet, useSend } from '@/lib/hooks';
import { date, LABELS, money } from '@/lib/format';
import type { Contrato } from '@/lib/types';
import Documentos from '@/components/Documentos';
import ParcelasTable from '@/components/ParcelasTable';
import { ContratoForm } from '@/components/forms';
import { Badge, Button, Card, Loading, PageHeader, Stat } from '@/components/ui';

export default function ContratoDetalhe() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: c, isLoading } = useGet<Contrato>(`/contratos/${id}`);
  const [editar, setEditar] = useState(false);
  const excluir = useSend('delete', `/contratos/${id}`, 'Contrato excluído');

  if (isLoading || !c) return <Loading />;
  const parcelas = c.parcelas ?? [];
  const recebido = parcelas.filter((p) => p.status === 'pago').reduce((s, p) => s + Number(p.valor_pago), 0);
  const aReceber = parcelas.filter((p) => p.status === 'pendente').reduce((s, p) => s + Number(p.valor), 0);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {c.titulo} <Badge tone={c.tipo === 'societario' ? 'violet' : 'gray'}>{LABELS.contratoTipo[c.tipo]}</Badge>
          </span>
        }
        subtitle={
          <>
            {c.cliente && (
              <Link to={`/clientes/${c.cliente.id}`} className="text-emerald-700 hover:underline">
                {c.cliente.nome}
              </Link>
            )}
            {c.projeto && (
              <>
                {' · '}
                <Link to={`/projetos/${c.projeto.id}`} className="text-emerald-700 hover:underline">
                  {c.projeto.nome}
                </Link>
              </>
            )}
            {c.numero && ` · nº ${c.numero}`} · {LABELS.contratoStatus[c.status]}
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditar(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button variant="ghost" onClick={() => confirm('Excluir este contrato e suas parcelas?') && excluir.mutate(undefined, { onSuccess: () => nav('/contratos') })}>
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Valor do contrato" value={money(c.valor_total)} />
        <Stat label="Recebido" value={money(recebido)} tone="green" />
        <Stat label="A receber" value={money(aReceber)} />
        <Stat label="Vigência" value={<span className="text-base">{date(c.data_inicio)} → {date(c.data_fim)}</span>} hint={`Assinado em ${date(c.data_assinatura)}`} />
      </div>

      {c.tipo !== 'societario' && (
        <Card title="Parcelas" className="mt-6">
          <ParcelasTable parcelas={parcelas} contratoId={c.id} />
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Documentos tipo="contrato" id={c.id} documentos={c.documentos ?? []} title="Arquivos do contrato" />
        <Card title="Observações / cláusulas">
          <p className="whitespace-pre-wrap p-5 text-sm text-slate-600">{c.observacoes || '—'}</p>
        </Card>
      </div>

      {editar && <ContratoForm contrato={c} onClose={() => setEditar(false)} />}
    </>
  );
}
