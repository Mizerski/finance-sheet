export interface BuscaCaixa {
  /** Caixa exibido; sem ele, "Todos". Um id inválido ou de caixa arquivado também vale "Todos". */
  caixa?: string
}

/** Parte do `validateSearch` da rota raiz: o caixa vale para todas as telas, como o ano. */
export function validarCaixa(search: Record<string, unknown>): BuscaCaixa {
  return typeof search.caixa === 'string' && search.caixa ? { caixa: search.caixa } : {}
}
