import { validarPeriodo, type Periodo } from '@/shared/lib/periodo'
import type { Lancamento, Natureza, TipoMovimento } from './lancamento'

/** Filtros da tela de lançamentos, guardados na URL. */
export interface FiltrosLancamento {
  /** Só os lançamentos que acontecem entre `de` e `ate` (as duas datas juntas, como no Dashboard). */
  de?: string
  ate?: string
  /** Texto buscado na descrição. */
  q?: string
  tipo?: TipoMovimento
  categoria?: string
  natureza?: Natureza
  /** Id da tag ou FILTRO_SEM_TAG. */
  tag?: string
}

/** Id do campo de busca, focado pelo atalho `/`. */
export const ID_BUSCA = 'busca-lancamentos'

/** Filtro de tag que mostra as saídas ainda sem tag. */
export const FILTRO_SEM_TAG = 'sem'

/** Filtros válidos da busca: ignora valores desconhecidos. */
function validarFiltros(search: Record<string, unknown>): FiltrosLancamento {
  const filtros: FiltrosLancamento = {}
  // Sem trim: o espaço digitado no fim precisa continuar no campo.
  if (typeof search.q === 'string' && search.q) filtros.q = search.q
  if (search.tipo === 'entrada' || search.tipo === 'saida') filtros.tipo = search.tipo
  if (search.natureza === 'fixa' || search.natureza === 'variavel') filtros.natureza = search.natureza
  if (typeof search.categoria === 'string' && search.categoria) filtros.categoria = search.categoria
  if (typeof search.tag === 'string' && search.tag) filtros.tag = search.tag
  return { ...filtros, ...validarPeriodo(search) }
}

/** O período do filtro de data, ou null sem ele. */
export function periodoDoFiltro(f: FiltrosLancamento): Periodo | null {
  return f.de && f.ate ? { de: f.de, ate: f.ate } : null
}

/** Busca da rota /lancamentos: os filtros e as pastas fechadas na lista. */
export interface BuscaLancamentos extends FiltrosLancamento {
  /** Chaves dos grupos de pasta fechados (id da pasta ou CHAVE_SEM_PASTA). */
  fechadas?: string[]
}

/** `validateSearch` da rota /lancamentos. */
export function validarBusca(search: Record<string, unknown>): BuscaLancamentos {
  const busca: BuscaLancamentos = validarFiltros(search)
  const fechadas = Array.isArray(search.fechadas) ? search.fechadas.filter((c) => typeof c === 'string' && c) : []
  if (fechadas.length > 0) busca.fechadas = fechadas
  return busca
}

export function temFiltro(f: FiltrosLancamento): boolean {
  return Boolean(f.q?.trim()) || contarFiltros(f) > 0
}

/** Filtros escolhidos além da busca (data, tipo, natureza, categoria e tag). */
export function contarFiltros(f: FiltrosLancamento): number {
  return [f.de, f.tipo, f.categoria, f.natureza, f.tag].filter(Boolean).length
}

/** Sem acento e em minúsculas, para "agua" achar "Água". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

function passaNaTag(l: Lancamento, tag: string | undefined, idsTags: Set<string>): boolean {
  if (!tag) return true
  // Tag já excluída conta como sem tag.
  if (tag === FILTRO_SEM_TAG) return l.tipo === 'saida' && !(l.tagId && idsTags.has(l.tagId))
  return l.tagId === tag
}

/**
 * Aplica os filtros e ordena: entradas primeiro, depois saídas, na ordem de cadastro.
 * `noPeriodo` tem os lançamentos que acontecem no período do filtro de data (ausente sem ele).
 */
export function filtrarLancamentos(
  lista: Lancamento[],
  f: FiltrosLancamento,
  idsTags: Set<string>,
  noPeriodo?: Map<string, unknown>,
): Lancamento[] {
  const busca = normalizar(f.q ?? '')
  return lista
    .filter(
      (l) =>
        (!noPeriodo || noPeriodo.has(l.id)) &&
        (!busca || normalizar(l.descricao).includes(busca)) &&
        (!f.tipo || l.tipo === f.tipo) &&
        (!f.categoria || l.categoriaId === f.categoria) &&
        (!f.natureza || l.natureza === f.natureza) &&
        passaNaTag(l, f.tag, idsTags),
    )
    .sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'entrada' ? -1 : 1))
}
