import type { Categoria } from '@/features/categorias/categoria'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { Configuracao } from '@/features/projecao/configuracao'

/** O que fica salvo no banco (Supabase). */
export interface DadosFinancas {
  config: Configuracao
  /** false enquanto o usuário não salvou um saldo inicial (vale o padrão: R$ 0 em 1º de janeiro). */
  configDefinida: boolean
  categorias: Categoria[]
  lancamentos: Lancamento[]
}

export interface EstadoFinancas extends DadosFinancas {
  /** Saldos borrados na tela até passar o mouse em cima. */
  saldosOcultos: boolean
}

export type AcaoFinancas =
  | { tipo: 'dados/carregar'; dados: DadosFinancas }
  | { tipo: 'config/atualizar'; config: Partial<Configuracao> }
  | { tipo: 'categoria/salvar'; categoria: Categoria }
  | { tipo: 'categoria/excluir'; id: string }
  | { tipo: 'lancamento/salvar'; lancamento: Lancamento }
  | { tipo: 'lancamento/excluir'; id: string }
  | { tipo: 'saldos/alternarVisibilidade' }

/** Substitui o item com o mesmo id ou adiciona no fim. */
function salvar<T extends { id: string }>(lista: T[], item: T): T[] {
  return lista.some((x) => x.id === item.id)
    ? lista.map((x) => (x.id === item.id ? item : x))
    : [...lista, item]
}

export function financasReducer(estado: EstadoFinancas, acao: AcaoFinancas): EstadoFinancas {
  switch (acao.tipo) {
    case 'dados/carregar':
      return { ...estado, ...acao.dados }
    case 'config/atualizar':
      return { ...estado, config: { ...estado.config, ...acao.config }, configDefinida: true }
    case 'categoria/salvar':
      return { ...estado, categorias: salvar(estado.categorias, acao.categoria) }
    case 'categoria/excluir':
      // Como no banco (on delete set null): os lançamentos ficam, sem categoria.
      return {
        ...estado,
        categorias: estado.categorias.filter((c) => c.id !== acao.id),
        lancamentos: estado.lancamentos.map((l) => (l.categoriaId === acao.id ? { ...l, categoriaId: '' } : l)),
      }
    case 'lancamento/salvar':
      return { ...estado, lancamentos: salvar(estado.lancamentos, acao.lancamento) }
    case 'lancamento/excluir':
      return { ...estado, lancamentos: estado.lancamentos.filter((l) => l.id !== acao.id) }
    case 'saldos/alternarVisibilidade':
      return { ...estado, saldosOcultos: !estado.saldosOcultos }
  }
}

/** Estado antes de carregar os dados do usuário. */
export function estadoVazio(): EstadoFinancas {
  return {
    config: { saldoInicialCentavos: 0, dataSaldoInicial: `${new Date().getFullYear()}-01-01` },
    configDefinida: false,
    categorias: [],
    lancamentos: [],
    saldosOcultos: false,
  }
}
