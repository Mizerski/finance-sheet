import type { TipoLancamento } from './lancamento'

/**
 * Cor da opção ativa nos seletores de tipo: saída em vermelho e entrada em azul, como nas tabelas.
 * Transferência não é entrada nem saída: fica no bloco preto da estrutura.
 */
export const COR_ATIVA_TIPO: Record<TipoLancamento, string> = {
  entrada: 'bg-azul text-sobre-bloco hover:bg-azul hover:text-sobre-bloco',
  saida: 'bg-vermelho text-sobre-bloco hover:bg-vermelho hover:text-sobre-bloco',
  transferencia: 'bg-foreground text-background hover:bg-foreground hover:text-background',
}
