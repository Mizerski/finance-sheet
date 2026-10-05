import type { Caixa } from '@/features/caixas/model/caixa'
import type { Categoria } from '@/features/categorias/model/categoria'
import type { MetaEconomia } from '@/features/economias/model/meta'
import type { Lancamento } from '@/features/lancamentos/model/lancamento'
import type { Pasta } from '@/features/pastas/model/pasta'
import type { Tag } from '@/features/tags/model/tag'
import type { DadosFinancas } from '../model/dados'

/** Sem o que é só calculado na tela (o saldo da conta de investimento), para não ir para o arquivo nem o banco. */
function semCalculados(meta: MetaEconomia): MetaEconomia {
  if (meta.naContaCentavos === undefined) return meta
  const copia = { ...meta }
  delete copia.naContaCentavos
  return copia
}

export interface EstadoFinancas extends DadosFinancas {
  /** Saldos borrados na tela até passar o mouse em cima. */
  saldosOcultos: boolean
}

export type AcaoFinancas =
  | { tipo: 'dados/carregar'; dados: DadosFinancas }
  /** Troca tudo pelo conteúdo de um backup (só no desktop). Ao contrário de carregar, é salvo. */
  | { tipo: 'dados/importar'; dados: DadosFinancas }
  /** Cria ou altera um caixa, inclusive o saldo inicial dele. */
  | { tipo: 'caixa/salvar'; caixa: Caixa }
  /** Só para caixa sem lançamentos nem metas (os outros são arquivados). */
  | { tipo: 'caixa/excluir'; id: string }
  | { tipo: 'categoria/salvar'; categoria: Categoria }
  | { tipo: 'categoria/excluir'; id: string }
  | { tipo: 'lancamento/salvar'; lancamento: Lancamento }
  | { tipo: 'lancamento/excluir'; id: string }
  /** Vários de uma vez: edição em lote na lista de lançamentos e o "Desfazer" dela (inclusive de uma exclusão). */
  | { tipo: 'lancamento/salvarVarios'; lancamentos: Lancamento[] }
  | { tipo: 'lancamento/excluirVarios'; ids: string[] }
  | { tipo: 'meta/salvar'; meta: MetaEconomia }
  | { tipo: 'meta/excluir'; id: string }
  | { tipo: 'tag/salvar'; tag: Tag }
  | { tipo: 'tag/excluir'; id: string }
  | { tipo: 'pasta/salvar'; pasta: Pasta }
  | { tipo: 'pasta/excluir'; id: string }
  | { tipo: 'saldos/alternarVisibilidade' }

/** Substitui o item com o mesmo id ou adiciona no fim. */
function salvar<T extends { id: string }>(lista: T[], item: T): T[] {
  return lista.some((x) => x.id === item.id)
    ? lista.map((x) => (x.id === item.id ? item : x))
    : [...lista, item]
}

/**
 * Excluir categoria, tag ou pasta deixa os lançamentos sem ela, como o `on delete set null` do banco.
 * Em `lancamento/salvarVarios`, os que não mudaram mantêm a referência, para a projeção de cada caixa só recalcular se a lista dele mudou.
 */
export function financasReducer(estado: EstadoFinancas, acao: AcaoFinancas): EstadoFinancas {
  switch (acao.tipo) {
    case 'dados/carregar':
    case 'dados/importar':
      return { ...estado, ...acao.dados }
    case 'caixa/salvar':
      return { ...estado, caixas: salvar(estado.caixas, acao.caixa) }
    case 'caixa/excluir':
      return { ...estado, caixas: estado.caixas.filter((c) => c.id !== acao.id) }
    case 'categoria/salvar':
      return { ...estado, categorias: salvar(estado.categorias, acao.categoria) }
    case 'categoria/excluir':
      return {
        ...estado,
        categorias: estado.categorias.filter((c) => c.id !== acao.id),
        lancamentos: estado.lancamentos.map((l) => (l.categoriaId === acao.id ? { ...l, categoriaId: '' } : l)),
      }
    case 'lancamento/salvar':
      return { ...estado, lancamentos: salvar(estado.lancamentos, acao.lancamento) }
    case 'lancamento/excluir':
      return { ...estado, lancamentos: estado.lancamentos.filter((l) => l.id !== acao.id) }
    case 'lancamento/salvarVarios': {
      const porId = new Map(acao.lancamentos.map((l) => [l.id, l]))
      const existentes = new Set(estado.lancamentos.map((l) => l.id))
      return {
        ...estado,
        lancamentos: [
          ...estado.lancamentos.map((l) => porId.get(l.id) ?? l),
          ...acao.lancamentos.filter((l) => !existentes.has(l.id)),
        ],
      }
    }
    case 'lancamento/excluirVarios': {
      const ids = new Set(acao.ids)
      return { ...estado, lancamentos: estado.lancamentos.filter((l) => !ids.has(l.id)) }
    }
    case 'meta/salvar':
      return { ...estado, metas: salvar(estado.metas, semCalculados(acao.meta)) }
    case 'meta/excluir':
      return { ...estado, metas: estado.metas.filter((m) => m.id !== acao.id) }
    case 'tag/salvar':
      return { ...estado, tags: salvar(estado.tags, acao.tag) }
    case 'tag/excluir':
      return {
        ...estado,
        tags: estado.tags.filter((t) => t.id !== acao.id),
        lancamentos: estado.lancamentos.map((l) => {
          if (l.tagId !== acao.id) return l
          const { tagId: _, ...semTag } = l
          return semTag
        }),
      }
    case 'pasta/salvar':
      return { ...estado, pastas: salvar(estado.pastas, acao.pasta) }
    case 'pasta/excluir':
      return {
        ...estado,
        pastas: estado.pastas.filter((p) => p.id !== acao.id),
        lancamentos: estado.lancamentos.map((l) => {
          if (l.pastaId !== acao.id) return l
          const { pastaId: _, ...semPasta } = l
          return semPasta
        }),
      }
    case 'saldos/alternarVisibilidade':
      return { ...estado, saldosOcultos: !estado.saldosOcultos }
  }
}

/** Estado antes de carregar os dados do usuário. */
export function estadoVazio(): EstadoFinancas {
  return {
    caixas: [],
    categorias: [],
    lancamentos: [],
    metas: [],
    tags: [],
    pastas: [],
    saldosOcultos: false,
  }
}
