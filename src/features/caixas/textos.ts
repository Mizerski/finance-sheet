import { formatarDiaMes } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import type { ResumoBeneficio } from './beneficio'
import type { Caixa } from './caixa'
import type { ResumoCartao } from './cartao'

/** O que o tipo quer dizer, em linguagem simples (formulário e lista de caixas). */
export const EXPLICACAO_TIPO = {
  conta: 'Dinheiro livre: banco, carteira. Paga qualquer conta, soma no total e tem risco, metas e reserva.',
  investimento:
    'Dinheiro aplicado: poupança, CDB, corretora. Fica fora do risco, e a meta que manda dinheiro para ela conta o saldo dela.',
  beneficio:
    'Dinheiro carimbado: vale-refeição, vale-alimentação. Só paga alguns gastos, por isso fica fora do total e mostra quanto dá por dia até a recarga.',
  cartao:
    'Compras que você paga depois: elas somam na fatura, que sai sozinha da conta escolhida no dia do vencimento.',
} as const

/** Uma linha sobre o benefício para listas curtas (seletor de caixa): "R$ 21/dia até 01/11", "Falta a partir de 27/10"… */
export function resumoCurtoBeneficio(caixa: Caixa, resumo: ResumoBeneficio | null): { texto: string; alerta: boolean } {
  if (!resumo) return { texto: `Começa em ${formatarDiaMes(caixa.dataSaldoInicial)}`, alerta: false }
  if (resumo.primeiroNegativo) return { texto: `Falta a partir de ${formatarDiaMes(resumo.primeiroNegativo)}`, alerta: true }
  if (!resumo.recarga) return { texto: 'Sem recarga lançada', alerta: false }
  if (resumo.porDiaCentavos === null) return { texto: `Recarga em ${formatarDiaMes(resumo.recarga.data)}`, alerta: false }
  return { texto: `${formatarBRL(resumo.porDiaCentavos)}/dia até ${formatarDiaMes(resumo.recarga.data)}`, alerta: false }
}

/** Uma linha sobre o cartão para listas curtas: "Fatura R$ 831 vence 15/10", "Passou do limite"… */
export function resumoCurtoCartao(caixa: Caixa, resumo: ResumoCartao | null): { texto: string; alerta: boolean } {
  if (!resumo) return { texto: `Começa em ${formatarDiaMes(caixa.dataSaldoInicial)}`, alerta: false }
  if (resumo.disponivelCentavos !== null && resumo.disponivelCentavos < 0) return { texto: 'Passou do limite', alerta: true }
  const proxima = resumo.fechada ?? resumo.aberta
  if (proxima.valorCentavos === 0) return { texto: `Cartão · fecha ${formatarDiaMes(resumo.aberta.fechamento)}`, alerta: false }
  return { texto: `Fatura ${formatarBRL(proxima.valorCentavos)} vence ${formatarDiaMes(proxima.vencimento)}`, alerta: false }
}
