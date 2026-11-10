export interface User {
  id: number;
  name: string;
  email: string;
  telefone?: string | null;
  socio: boolean;
  ativo: boolean;
}

export interface Resumo {
  recebido: number;
  a_receber: number;
  atrasado: number;
  valor_contratado?: number;
  despesas?: number;
}

export interface Cliente {
  id: number;
  nome: string;
  tipo: 'pf' | 'pj';
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  contato?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  projetos_count?: number;
  resumo?: Resumo;
  projetos?: Projeto[];
  contratos?: Contrato[];
  documentos?: Documento[];
}

export type ProjetoStatus = 'proposta' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';

export interface Projeto {
  id: number;
  cliente_id: number;
  nome: string;
  descricao?: string | null;
  status: ProjetoStatus;
  data_inicio?: string | null;
  data_fim?: string | null;
  cliente?: Pick<Cliente, 'id' | 'nome'>;
  contratos_count?: number;
  contratos?: Contrato[];
  documentos?: Documento[];
  resumo?: Resumo;
  rateio?: RateioEfetivo;
  distribuicao?: { conta: Conta; user: Pick<User, 'id' | 'name'> | null; valor: number }[];
}

export type ContratoTipo = 'cliente' | 'societario' | 'fornecedor' | 'outro';

export interface Contrato {
  id: number;
  tipo: ContratoTipo;
  cliente_id?: number | null;
  projeto_id?: number | null;
  titulo: string;
  numero?: string | null;
  valor_total: string;
  data_assinatura?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  status: 'rascunho' | 'ativo' | 'concluido' | 'cancelado';
  observacoes?: string | null;
  cliente?: Pick<Cliente, 'id' | 'nome'> | null;
  projeto?: Pick<Projeto, 'id' | 'nome'> | null;
  parcelas?: Parcela[];
  documentos?: Documento[];
  documentos_count?: number;
  recebido?: string | null;
  a_receber?: string | null;
}

export type Situacao = 'pendente' | 'atrasado' | 'pago' | 'cancelado';

export interface Parcela {
  id: number;
  contrato_id: number;
  numero: number;
  descricao: string;
  valor: string;
  vencimento: string;
  status: 'pendente' | 'pago' | 'cancelado';
  situacao: Situacao;
  data_pagamento?: string | null;
  valor_pago?: string | null;
  forma_pagamento?: string | null;
  observacoes?: string | null;
  contrato?: Pick<Contrato, 'id' | 'titulo' | 'cliente' | 'projeto'>;
}

export type Conta = 'caixa' | 'custos' | 'socio';
export type Destino = Conta;

export interface RateioItem {
  id?: number;
  destino: Destino;
  user_id?: number | null;
  user?: Pick<User, 'id' | 'name'> | null;
  percentual: string | number;
}

export interface RateioEfetivo {
  personalizado: boolean;
  itens: RateioItem[];
}

export type Origem = 'recebimento' | 'despesa' | 'repasse' | 'aporte' | 'transferencia' | 'ajuste';

export interface Movimentacao {
  id: number;
  data: string;
  conta: Conta;
  user_id?: number | null;
  tipo: 'credito' | 'debito';
  valor: string;
  origem: Origem;
  categoria?: string | null;
  descricao?: string | null;
  percentual?: string | null;
  parcela_id?: number | null;
  projeto?: Pick<Projeto, 'id' | 'nome'> | null;
  cliente?: Pick<Cliente, 'id' | 'nome'> | null;
  user?: Pick<User, 'id' | 'name'> | null;
  autor?: Pick<User, 'id' | 'name'> | null;
}

export interface Saldos {
  caixa: number;
  custos: number;
  socios: { user_id: number; name: string; saldo: number }[];
  total: number;
}

export interface Documento {
  id: number;
  nome: string;
  mime?: string | null;
  tamanho: number;
  created_at: string;
}
