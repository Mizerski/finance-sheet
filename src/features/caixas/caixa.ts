import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { Configuracao } from '@/features/projecao/configuracao'
import type { DataISO } from '@/shared/lib/datas'

/**
 * `conta`: conta bancária, com risco, metas, reserva e capacidade.
 * `beneficio`: vale-refeição, vale-alimentação… A recarga é uma entrada e os gastos são saídas; a projeção é a mesma.
 */
export type TipoCaixa = 'conta' | 'beneficio'

/**
 * Um fluxo de caixa com saldo inicial próprio. Cada lançamento e cada meta pertence a um caixa;
 * categorias, tags e pastas são compartilhadas entre eles.
 */
export interface Caixa extends Configuracao {
  id: string
  nome: string
  /** Cor em hexadecimal, da mesma paleta das categorias. */
  cor: string
  tipo: TipoCaixa
  /** false enquanto o usuário não salvou um saldo inicial (vale o padrão: R$ 0 em 1º de janeiro). */
  saldoDefinido: boolean
  /** Entra nos números de "Todos" (saldo, Planilha, Dashboard, risco). Padrão: true na conta, false no benefício. */
  entraNoTotal: boolean
  /** Posição no seletor (e nos atalhos Alt+1…9), do menor para o maior. */
  ordem: number
  /** Caixa arquivado some do seletor e do formulário, mas mantém o histórico (e continua em "Todos"). */
  arquivado?: boolean
}

export const NOME_CONTA_PRINCIPAL = 'Conta principal'
/** Azul da paleta (`GRUPOS_CORES_CATEGORIA`). */
export const COR_CONTA_PRINCIPAL = '#1f45c4'

export const ROTULO_TIPO_CAIXA: Record<TipoCaixa, string> = {
  conta: 'Conta',
  beneficio: 'Benefício',
}

/** Saldo inicial padrão de um caixa novo: R$ 0 em 1º de janeiro do ano atual. */
export function configPadrao(): Configuracao {
  return { saldoInicialCentavos: 0, dataSaldoInicial: `${new Date().getFullYear()}-01-01` }
}

/** O caixa criado para quem ainda não tem nenhum (dados antigos, usuário novo). */
export function contaPrincipal(id: string, config = configPadrao(), saldoDefinido = false): Caixa {
  return {
    id,
    nome: NOME_CONTA_PRINCIPAL,
    cor: COR_CONTA_PRINCIPAL,
    tipo: 'conta',
    saldoInicialCentavos: config.saldoInicialCentavos,
    dataSaldoInicial: config.dataSaldoInicial,
    saldoDefinido,
    entraNoTotal: true,
    ordem: 0,
  }
}

/** Na ordem do seletor: `ordem`, depois o nome. */
export function ordenarCaixas(caixas: Caixa[]): Caixa[] {
  return [...caixas].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Os que aparecem no seletor e no formulário, na ordem. */
export function caixasAtivos(caixas: Caixa[]): Caixa[] {
  return ordenarCaixas(caixas.filter((c) => !c.arquivado))
}

/** Os que entram nos números de "Todos", na ordem. Arquivados continuam, para o histórico não mudar. */
export function caixasNoTotal(caixas: Caixa[]): Caixa[] {
  return ordenarCaixas(caixas.filter((c) => c.entraNoTotal))
}

/** Primeira conta ativa: o caixa padrão de lançamentos e metas novos. */
export function primeiraConta(caixas: Caixa[]): Caixa | undefined {
  return caixasAtivos(caixas).find((c) => c.tipo === 'conta')
}

/** Data mais antiga entre os caixas (o primeiro dia com dados); null sem caixas. */
export function primeiraData(caixas: Caixa[]): DataISO | null {
  return caixas.reduce<DataISO | null>((min, c) => (!min || c.dataSaldoInicial < min ? c.dataSaldoInicial : min), null)
}

/** Lançamentos de um caixa (como origem ou destino de transferência). */
export function lancamentosDoCaixa(lancamentos: Lancamento[], caixaId: string): Lancamento[] {
  return lancamentos.filter((l) => l.caixaId === caixaId || l.caixaDestinoId === caixaId)
}

export function metasDoCaixa(metas: MetaEconomia[], caixaId: string): MetaEconomia[] {
  return metas.filter((m) => m.caixaId === caixaId)
}

/** Ela é a última conta ativa: arquivar ou excluir deixaria o app sem conta. */
export function ehUltimaConta(caixa: Caixa, caixas: Caixa[]): boolean {
  return caixa.tipo === 'conta' && !caixa.arquivado && caixasAtivos(caixas).filter((c) => c.tipo === 'conta').length <= 1
}

/** Quantos lançamentos e metas usam o caixa; só dá para excluir sem nenhum (senão, arquivar). */
export function usosDoCaixa(caixaId: string, lancamentos: Lancamento[], metas: MetaEconomia[]) {
  return {
    lancamentos: lancamentosDoCaixa(lancamentos, caixaId).length,
    metas: metasDoCaixa(metas, caixaId).length,
  }
}
