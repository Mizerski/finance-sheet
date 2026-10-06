import type { FormaDaPagina } from '@/shared/lib/formas'
import type { Escolha } from '../hooks/useFormularioCaixa'
import { ROTULO_TIPO_CAIXA } from '../model/caixa'

/** As respostas de "Que dinheiro é esse?", na ordem dos cartões. */
export const ESCOLHAS: Escolha[] = ['conta', 'investimento', 'beneficio', 'cartao']

export const ROTULO_ESCOLHA: Record<Escolha, string> = { ...ROTULO_TIPO_CAIXA, investimento: 'Investimento' }

/** Forma de cada escolha no cartão (decorativa). */
export const FORMA_ESCOLHA: Record<Escolha, Omit<FormaDaPagina, 'cor'>> = {
  conta: { forma: 'circulo' },
  investimento: { forma: 'semicirculo' },
  beneficio: { forma: 'quarto' },
  cartao: { forma: 'quadrado' },
}

export const PLACEHOLDER_NOME: Record<Escolha, string> = {
  conta: 'Ex.: Nubank, Carteira',
  investimento: 'Ex.: Tesouro, CDB, Corretora',
  beneficio: 'Ex.: Vale-refeição',
  cartao: 'Ex.: Cartão Nubank',
}
