import { ehFiltroHistorico, type FiltroHistorico } from '@/features/historico/utils/filtro'

/** Abas da tela Organização. Categorias é a padrão e não aparece na URL. */
export type Aba = 'categorias' | 'tags' | 'pastas' | 'caixas' | 'historico'

export interface BuscaOrganizacao {
  aba?: Exclude<Aba, 'categorias'>
  /** Só na aba Histórico: o que mostrar (sem ele, tudo). */
  tipo?: Exclude<FiltroHistorico, 'tudo'>
}

/** `validateSearch` da rota /organizacao. */
export function validarAba(search: Record<string, unknown>): BuscaOrganizacao {
  const { aba, tipo } = search
  if (aba === 'historico') return { aba, ...(ehFiltroHistorico(tipo) && tipo !== 'tudo' && { tipo }) }
  return aba === 'tags' || aba === 'pastas' || aba === 'caixas' ? { aba } : {}
}
