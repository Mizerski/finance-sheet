import type { TipoMovimento } from './lancamento'

/** Cor da opção ativa nos seletores de tipo: saída em vermelho e entrada em azul, como nas tabelas. */
export const COR_ATIVA_TIPO: Record<TipoMovimento, string> = {
  entrada: 'bg-azul text-sobre-bloco hover:bg-azul hover:text-sobre-bloco',
  saida: 'bg-vermelho text-sobre-bloco hover:bg-vermelho hover:text-sobre-bloco',
}
