import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { Configuracao } from '@/features/projecao/configuracao'
import type { DataISO } from '@/shared/lib/datas'

/**
 * `conta`: conta bancária, com risco, metas, reserva e capacidade.
 * `beneficio`: vale-refeição, vale-alimentação… A recarga é uma entrada e os gastos são saídas; a projeção é a mesma.
 * `cartao`: cartão de crédito. As compras são saídas dele (o saldo negativo é o que se deve) e a fatura sai sozinha
 * da conta pagadora no vencimento, como transferência (ver `cartao.ts`).
 */
export type TipoCaixa = 'conta' | 'beneficio' | 'cartao'

/** Ciclo do cartão de crédito (só no tipo `cartao`). */
export interface CicloCartao {
  /** Dia em que a fatura fecha (1–31; se o mês não tiver, o último dia). */
  diaFechamento: number
  /** Dia do vencimento (1–31; se não for depois do fechamento, é no mês seguinte). */
  diaVencimento: number
  /** Conta de onde a fatura é paga. */
  contaPagadoraId: string
  /** Limite do cartão, só para mostrar quanto ainda dá para gastar. */
  limiteCentavos?: number
}

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
  /** Entra nos números do Total (saldo, Planilha, Dashboard, risco). Só vale para conta: leia com `somaNoTotal`. */
  entraNoTotal: boolean
  /** Posição no seletor (e nos atalhos Alt+1…9), do menor para o maior. */
  ordem: number
  /** Caixa arquivado some do seletor e do formulário, mas mantém o histórico (e continua no Total). */
  arquivado?: boolean
  /** Só (e sempre) no cartão de crédito. */
  cartao?: CicloCartao
  /**
   * Só em conta: conta de investimento (poupança, CDB, corretora). Fica fora do risco e não paga cartão nem é origem
   * de meta; a meta que manda dinheiro para ela conta o saldo dela como guardado (`naContaCentavos`).
   */
  investimento?: boolean
}

export const NOME_CONTA_PRINCIPAL = 'Conta principal'
/** Azul da paleta (`GRUPOS_CORES_CATEGORIA`). */
export const COR_CONTA_PRINCIPAL = '#1f45c4'

/**
 * Nome da visão sem `?caixa=`: a soma dos caixas que entram no total (as contas, em geral).
 * "Total" e não "Todos": os benefícios ficam fora dessa soma.
 */
export const NOME_TOTAL = 'Total'

export const ROTULO_TIPO_CAIXA: Record<TipoCaixa, string> = {
  conta: 'Conta',
  beneficio: 'Benefício',
  cartao: 'Cartão de crédito',
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

/**
 * Benefício nunca soma no Total (o dinheiro dele só paga alguns gastos); a conta e o cartão somam se `entraNoTotal`.
 * Com o cartão no Total, a compra baixa o Total no dia dela e o pagamento da fatura se anula (é entre caixas do Total).
 */
export function somaNoTotal(caixa: Caixa): boolean {
  return caixa.tipo !== 'beneficio' && caixa.entraNoTotal
}

/** Conta de investimento: dinheiro aplicado, fora do risco. */
export function ehInvestimento(caixa: Caixa): boolean {
  return caixa.tipo === 'conta' && !!caixa.investimento
}

/** Conta do dia a dia (não investimento): tem risco, paga cartão e é origem de metas. */
export function ehContaCorrente(caixa: Caixa): boolean {
  return caixa.tipo === 'conta' && !caixa.investimento
}

/** "Conta", "Investimento", "Benefício" ou "Cartão de crédito". */
export function rotuloDoCaixa(caixa: Caixa): string {
  return ehInvestimento(caixa) ? 'Investimento' : ROTULO_TIPO_CAIXA[caixa.tipo]
}

/** Cartão de crédito com o ciclo preenchido. */
export function ehCartao(caixa: Caixa): caixa is Caixa & { tipo: 'cartao'; cartao: CicloCartao } {
  return caixa.tipo === 'cartao' && !!caixa.cartao
}

/** Cartões cuja fatura sai desta conta. */
export function cartoesPagosPor(caixas: Caixa[], contaId: string): Caixa[] {
  return caixas.filter((c) => ehCartao(c) && c.cartao.contaPagadoraId === contaId)
}

/** Os que entram nos números do Total, na ordem. Arquivados continuam, para o histórico não mudar. */
export function caixasNoTotal(caixas: Caixa[]): Caixa[] {
  return ordenarCaixas(caixas.filter(somaNoTotal))
}

/** Primeira conta ativa do dia a dia: o caixa padrão de lançamentos e metas novos. */
export function primeiraConta(caixas: Caixa[]): Caixa | undefined {
  return caixasAtivos(caixas).find(ehContaCorrente) ?? caixasAtivos(caixas).find((c) => c.tipo === 'conta')
}

/** Data mais antiga entre os caixas (o primeiro dia com dados); null sem caixas. */
export function primeiraData(caixas: Caixa[]): DataISO | null {
  return caixas.reduce<DataISO | null>((min, c) => (!min || c.dataSaldoInicial < min ? c.dataSaldoInicial : min), null)
}

/** Lançamentos de um caixa (como origem ou destino de transferência). */
export function lancamentosDoCaixa(lancamentos: Lancamento[], caixaId: string): Lancamento[] {
  return lancamentos.filter((l) => l.caixaId === caixaId || l.caixaDestinoId === caixaId)
}

/** Metas que mexem no caixa: as que guardam dele e as que mandam o dinheiro para ele (destino). */
export function metasDoCaixa(metas: MetaEconomia[], caixaId: string): MetaEconomia[] {
  return metas.filter((m) => m.caixaId === caixaId || m.destinoId === caixaId)
}

/** Ela é a última conta ativa: arquivar ou excluir deixaria o app sem conta. */
export function ehUltimaConta(caixa: Caixa, caixas: Caixa[]): boolean {
  return caixa.tipo === 'conta' && !caixa.arquivado && caixasAtivos(caixas).filter((c) => c.tipo === 'conta').length <= 1
}

/** Quantos lançamentos, metas e cartões usam o caixa; só dá para excluir sem nenhum (senão, arquivar). */
export function usosDoCaixa(caixaId: string, lancamentos: Lancamento[], metas: MetaEconomia[], caixas: Caixa[] = []) {
  return {
    lancamentos: lancamentosDoCaixa(lancamentos, caixaId).length,
    metas: metasDoCaixa(metas, caixaId).length,
    cartoes: cartoesPagosPor(caixas, caixaId).length,
  }
}
