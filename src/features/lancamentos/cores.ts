import type { TipoMovimento } from './lancamento'

/** Cor da opção ativa nos seletores de tipo: saída em vermelho e entrada em azul, como nas tabelas. */
export const COR_ATIVA_TIPO: Record<TipoMovimento, string> = {
  entrada: 'bg-azul text-papel hover:bg-azul',
  saida: 'bg-vermelho text-papel hover:bg-vermelho',
}
