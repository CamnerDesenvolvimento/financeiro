import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGet, useSend } from '@/lib/hooks';
import { LABELS } from '@/lib/format';
import type { Destino, RateioEfetivo, User } from '@/lib/types';
import { Badge, Button, Card } from './ui';

interface Linha {
  destino: Destino;
  user_id: number | null;
  percentual: string;
}

/** Edita a regra de rateio padrão (projetoId vazio) ou a regra específica de um projeto. */
export default function RateioEditor({ projetoId }: { projetoId?: number }) {
  const regra = useGet<RateioEfetivo>('/rateios', projetoId ? { projeto_id: projetoId } : undefined);
  const socios = useGet<User[]>('/socios');
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [editando, setEditando] = useState(false);

  const salvar = useSend('put', '/rateios', 'Rateio salvo');
  const voltarPadrao = useSend('delete', `/rateios/projeto/${projetoId}`, 'Projeto voltou a usar a regra padrão');

  const resetar = () => {
    if (regra.data) {
      setLinhas(regra.data.itens.map((i) => ({ destino: i.destino, user_id: i.user_id ?? null, percentual: String(Number(i.percentual)) })));
    }
  };
  useEffect(resetar, [regra.data]);

  const soma = linhas.reduce((s, l) => s + Number(l.percentual || 0), 0);
  const herdado = projetoId && regra.data && !regra.data.personalizado;
  const listaSocios = (socios.data ?? []).filter((s) => s.socio);

  const set = (i: number, patch: Partial<Linha>) => setLinhas(linhas.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          {projetoId ? 'Rateio deste projeto' : 'Regra de rateio padrão'}
          {projetoId && <Badge tone={herdado ? 'gray' : 'violet'}>{herdado ? 'usando padrão' : 'personalizado'}</Badge>}
        </span>
      }
      actions={
        !editando ? (
          <Button size="sm" variant="secondary" onClick={() => setEditando(true)}>
            {herdado ? 'Personalizar' : 'Editar'}
          </Button>
        ) : null
      }
    >
      <div className="p-5">
        {!projetoId && (
          <p className="mb-4 text-sm text-slate-500">
            Todo valor recebido é dividido por esta regra (a menos que o projeto tenha uma regra própria). A soma precisa dar 100%.
          </p>
        )}

        <div className="space-y-2">
          {linhas.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <select className="input w-40" disabled={!editando} value={l.destino} onChange={(e) => set(i, { destino: e.target.value as Destino, user_id: null })}>
                <option value="socio">Sócio</option>
                <option value="caixa">{LABELS.conta.caixa}</option>
                <option value="custos">{LABELS.conta.custos}</option>
              </select>
              {l.destino === 'socio' ? (
                <select className="input flex-1" disabled={!editando} value={l.user_id ?? ''} onChange={(e) => set(i, { user_id: Number(e.target.value) || null })}>
                  <option value="">Selecione…</option>
                  {listaSocios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex-1" />
              )}
              <div className="relative w-28">
                <input type="number" step="0.01" min="0" max="100" className="input pr-7 text-right" disabled={!editando} value={l.percentual} onChange={(e) => set(i, { percentual: e.target.value })} />
                <span className="absolute right-3 top-2 text-sm text-slate-400">%</span>
              </div>
              {editando && (
                <Button size="sm" variant="ghost" onClick={() => setLinhas(linhas.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className={`text-sm font-medium ${Math.abs(soma - 100) < 0.001 ? 'text-emerald-600' : 'text-rose-600'}`}>Total: {soma.toFixed(2)}%</p>
          {editando && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setLinhas([...linhas, { destino: 'socio', user_id: null, percentual: '0' }])}>
                <Plus className="h-3.5 w-3.5" /> Linha
              </Button>
              {projetoId && regra.data?.personalizado && (
                <Button size="sm" variant="secondary" onClick={() => voltarPadrao.mutate(undefined, { onSuccess: () => setEditando(false) })}>
                  Voltar ao padrão
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditando(false);
                  resetar();
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                loading={salvar.isPending}
                onClick={() => salvar.mutate({ projeto_id: projetoId ?? null, itens: linhas }, { onSuccess: () => setEditando(false) })}
              >
                Salvar rateio
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
