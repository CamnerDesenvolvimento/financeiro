const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const money = (v: number | string | null | undefined) => brl.format(Number(v ?? 0));

/** "2026-11-09" -> "09/11/2026" (sem passar por Date para não sofrer com fuso) */
export const date = (v?: string | null) => {
  if (!v) return '—';
  const [y, m, d] = v.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const mesCurto = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${MESES[Number(m) - 1]}/${y.slice(2)}`;
};
export const MESES_NOME = MESES;

export const bytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`;

export const LABELS = {
  projetoStatus: {
    proposta: 'Proposta',
    em_andamento: 'Em andamento',
    pausado: 'Pausado',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  },
  contratoTipo: { cliente: 'Cliente', societario: 'Societário', fornecedor: 'Fornecedor', outro: 'Outro' },
  contratoStatus: { rascunho: 'Rascunho', ativo: 'Ativo', concluido: 'Concluído', cancelado: 'Cancelado' },
  situacao: { pendente: 'Pendente', atrasado: 'Atrasado', pago: 'Pago', cancelado: 'Cancelado' },
  conta: { caixa: 'Caixa da empresa', custos: 'Reserva de custos', socio: 'Sócio' },
  origem: {
    recebimento: 'Recebimento',
    despesa: 'Despesa',
    repasse: 'Repasse',
    aporte: 'Aporte',
    transferencia: 'Transferência',
    ajuste: 'Ajuste',
  },
} as const;

export const FORMAS_PAGAMENTO = ['pix', 'boleto', 'transferencia', 'cartao', 'dinheiro', 'outro'];
