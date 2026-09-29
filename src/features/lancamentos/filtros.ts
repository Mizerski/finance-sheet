import type { Lancamento, Natureza, TipoMovimento } from './lancamento'

/** Filtros da tela de lançamentos, guardados na URL. */
export interface FiltrosLancamento {
  tipo?: TipoMovimento
  categoria?: string
  natureza?: Natureza
}

/** `validateSearch` da rota /lancamentos: ignora valores desconhecidos. */
export function validarFiltros(search: Record<string, unknown>): FiltrosLancamento {
  const filtros: FiltrosLancamento = {}
  if (search.tipo === 'entrada' || search.tipo === 'saida') filtros.tipo = search.tipo
  if (search.natureza === 'fixa' || search.natureza === 'variavel') filtros.natureza = search.natureza
  if (typeof search.categoria === 'string' && search.categoria) filtros.categoria = search.categoria
  return filtros
}

export function temFiltro(f: FiltrosLancamento): boolean {
  return Boolean(f.tipo || f.categoria || f.natureza)
}

/** Aplica os filtros e ordena: entradas primeiro, depois saídas, na ordem de cadastro. */
export function filtrarLancamentos(lista: Lancamento[], f: FiltrosLancamento): Lancamento[] {
  return lista
    .filter(
      (l) =>
        (!f.tipo || l.tipo === f.tipo) &&
        (!f.categoria || l.categoriaId === f.categoria) &&
        (!f.natureza || l.natureza === f.natureza),
    )
    .sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'entrada' ? -1 : 1))
}
