/** Cores das colunas da planilha (tokens definidos em index.css). */
export const COR_COLUNA = {
  dia: 'text-muted-foreground',
  entrada: 'bg-entrada-suave text-entrada',
  saida: 'bg-saida-suave text-saida',
  economia: 'bg-economia-suave text-economia',
  saldo: 'bg-saldo-suave text-saldo',
  saldoNegativo: 'bg-negativo-suave text-negativo font-medium',
  foraDoCalculo: 'bg-muted/60',
} as const

/** Espaçamento compartilhado por cabeçalho, linhas e rodapé, para as colunas alinharem. */
export const CELULA = 'px-1 py-2 sm:px-3'

/** Coluna do dia: sem recuo à direita, que já é dado pela coluna seguinte. */
export const CELULA_DIA = 'py-2 pr-0 pl-2 sm:pl-3'
