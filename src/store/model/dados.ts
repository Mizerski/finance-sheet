import { contaPrincipal, type Caixa } from '@/features/caixas/model/caixa'
import type { Categoria } from '@/features/categorias/model/categoria'
import type { MetaEconomia } from '@/features/economias/model/meta'
import type { Lancamento } from '@/features/lancamentos/model/lancamento'
import type { Configuracao } from '@/features/projecao/model/configuracao'
import type { Pasta } from '@/features/pastas/model/pasta'
import type { Tag } from '@/features/tags/model/tag'

/**
 * Versão do formato de `DadosFinancas` no arquivo local e no backup.
 * Aumente e converta os dados antigos se o formato mudar; o histórico fica em `store/doc/versoes-dos-dados.md`.
 */
export const VERSAO_DADOS = 11

/** O que fica salvo (Supabase na web, arquivo local no desktop). */
export interface DadosFinancas {
  /** Contas e benefícios, cada um com o próprio saldo inicial (a partir da versão 6 dos dados). */
  caixas: Caixa[]
  categorias: Categoria[]
  lancamentos: Lancamento[]
  /** Metas de economia (a partir da versão 2 dos dados). */
  metas: MetaEconomia[]
  /** Tags das saídas (a partir da versão 3 dos dados). */
  tags: Tag[]
  /** Pastas da tela de lançamentos (a partir da versão 3 dos dados). */
  pastas: Pasta[]
}

/** Dados das versões 3 a 5: um único saldo inicial, sem caixas. */
export interface DadosFinancasV5 {
  config: Configuracao
  /** false enquanto o usuário não salvou um saldo inicial (vale o padrão: R$ 0 em 1º de janeiro). */
  configDefinida: boolean
  categorias: Categoria[]
  lancamentos: Omit<Lancamento, 'caixaId' | 'caixaDestinoId'>[]
  metas: Omit<MetaEconomia, 'caixaId'>[]
  tags: Tag[]
  pastas: Pasta[]
}

/** Dados da versão 2, antes das tags e das pastas. */
export type DadosFinancasV2 = Omit<DadosFinancasV5, 'tags' | 'pastas'>

/** Dados da versão 1, antes das metas de economia. */
export type DadosFinancasV1 = Omit<DadosFinancasV2, 'metas'>

export type DadosFinancasSalvos = DadosFinancas | DadosFinancasV5 | DadosFinancasV2 | DadosFinancasV1

/**
 * Converte dados salvos em versões anteriores para o formato atual.
 * Até a versão 5, o saldo inicial vira a "Conta principal", dona de todos os lançamentos e metas.
 * Sem nenhum caixa (arquivo novo), cria a Conta principal com o saldo padrão.
 */
export function atualizarDados(dados: DadosFinancasSalvos, novoId: () => string = () => crypto.randomUUID()): DadosFinancas {
  const tags = 'tags' in dados && Array.isArray(dados.tags) ? dados.tags : []
  const pastas = 'pastas' in dados && Array.isArray(dados.pastas) ? dados.pastas : []

  if ('caixas' in dados && Array.isArray(dados.caixas)) {
    const caixas = dados.caixas.length ? dados.caixas : [contaPrincipal(novoId())]
    const lancamentos = dados.lancamentos.map((l) => (l.caixaDestinoId && l.tipo !== 'transferencia' ? semDestino(l) : l))
    return { ...dados, caixas, lancamentos, tags, pastas }
  }

  const v5 = dados as DadosFinancasV5 | DadosFinancasV2 | DadosFinancasV1
  const principal = contaPrincipal(novoId(), v5.config, v5.configDefinida)
  const metas = 'metas' in v5 && Array.isArray(v5.metas) ? v5.metas : []
  return {
    caixas: [principal],
    categorias: v5.categorias,
    lancamentos: v5.lancamentos.map((l) => ({ ...l, caixaId: principal.id })),
    metas: metas.map((m) => ({ ...m, caixaId: principal.id })),
    tags,
    pastas,
  }
}

/** Antes da versão 7 o destino não tinha interface: só a transferência pode ter um. */
function semDestino(l: Lancamento): Lancamento {
  const copia = { ...l }
  delete copia.caixaDestinoId
  return copia
}
