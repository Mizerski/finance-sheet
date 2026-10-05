/** Abas da tela Organização. Categorias é a padrão e não aparece na URL. */
export type Aba = 'categorias' | 'tags' | 'pastas' | 'caixas'

export interface BuscaOrganizacao {
  aba?: Exclude<Aba, 'categorias'>
}

/** `validateSearch` da rota /organizacao. */
export function validarAba(search: Record<string, unknown>): BuscaOrganizacao {
  return search.aba === 'tags' || search.aba === 'pastas' || search.aba === 'caixas' ? { aba: search.aba } : {}
}
