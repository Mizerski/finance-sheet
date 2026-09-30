import type { Categoria } from '@/features/categorias/categoria'
import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { Configuracao } from '@/features/projecao/configuracao'

/** Formato de DadosFinancas no arquivo local e no backup; aumente e converta os dados antigos se o formato mudar. */
export const VERSAO_DADOS = 2

/** O que fica salvo (Supabase na web, arquivo local no desktop). */
export interface DadosFinancas {
  config: Configuracao
  /** false enquanto o usuário não salvou um saldo inicial (vale o padrão: R$ 0 em 1º de janeiro). */
  configDefinida: boolean
  categorias: Categoria[]
  lancamentos: Lancamento[]
  /** Metas de economia (a partir da versão 2 dos dados). */
  metas: MetaEconomia[]
}

/** Dados da versão 1, antes das metas de economia. */
export type DadosFinancasV1 = Omit<DadosFinancas, 'metas'>

/** Converte dados salvos em versões anteriores para o formato atual. */
export function atualizarDados(dados: DadosFinancas | DadosFinancasV1): DadosFinancas {
  return { ...dados, metas: 'metas' in dados && Array.isArray(dados.metas) ? dados.metas : [] }
}

export interface EstadoFinancas extends DadosFinancas {
  /** Saldos borrados na tela até passar o mouse em cima. */
  saldosOcultos: boolean
}

export type AcaoFinancas =
  | { tipo: 'dados/carregar'; dados: DadosFinancas }
  /** Troca tudo pelo conteúdo de um backup (só no desktop). Ao contrário de carregar, é salvo. */
  | { tipo: 'dados/importar'; dados: DadosFinancas }
  | { tipo: 'config/atualizar'; config: Partial<Configuracao> }
  | { tipo: 'categoria/salvar'; categoria: Categoria }
  | { tipo: 'categoria/excluir'; id: string }
  | { tipo: 'lancamento/salvar'; lancamento: Lancamento }
  | { tipo: 'lancamento/excluir'; id: string }
  | { tipo: 'meta/salvar'; meta: MetaEconomia }
  | { tipo: 'meta/excluir'; id: string }
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
    case 'dados/importar':
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
    case 'meta/salvar':
      return { ...estado, metas: salvar(estado.metas, acao.meta) }
    case 'meta/excluir':
      return { ...estado, metas: estado.metas.filter((m) => m.id !== acao.id) }
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
    metas: [],
    saldosOcultos: false,
  }
}
