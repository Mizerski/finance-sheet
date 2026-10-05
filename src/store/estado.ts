import { contaPrincipal, type Caixa } from '@/features/caixas/caixa'
import type { Categoria } from '@/features/categorias/categoria'
import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { Configuracao } from '@/features/projecao/configuracao'
import type { Pasta } from '@/features/pastas/pasta'
import type { Tag } from '@/features/tags/tag'

/**
 * Formato de DadosFinancas no arquivo local e no backup; aumente e converta os dados antigos se o formato mudar.
 * Versão 4: recorrência semanal. Os dados da versão 3 continuam válidos, sem conversão; o número novo
 * só impede que um app antigo, que não conhece a recorrência semanal, importe um backup novo.
 * Versão 5: prazo opcional nas metas de economia. Também sem conversão (meta sem prazo continua válida).
 * Versão 6: caixas. O saldo inicial (`config`) vira a "Conta principal" e todo lançamento e meta ganha `caixaId`.
 * Versão 7: transferência entre contas (`tipo: 'transferencia'` com `caixaDestinoId`) e meta sem valor alvo
 * (cofrinho). Sem conversão; o número novo só impede que um app antigo, que trataria a transferência como gasto
 * e exige o alvo, importe um backup novo.
 * Versão 8: o que já estava guardado fora do app ao criar a meta (`jaGuardadoCentavos`). Sem conversão; o número
 * novo impede que um app antigo importe o backup e perca esse valor.
 * Versão 9: valor de um dia só num recorrente (`excecoes`: valor real ou 0 = pulado). Sem conversão; o número novo
 * impede que um app antigo importe o backup e volte esses dias ao valor normal.
 * Versão 10: cartão de crédito (`tipo: 'cartao'` com `cartao`: fechamento, vencimento, conta que paga e limite).
 * Sem conversão; o número novo impede que um app antigo importe um backup com um tipo de caixa que ele não conhece.
 * Versão 11: conta de investimento (`investimento` na conta). Sem conversão; o número novo impede que um app antigo
 * importe o backup e trate o investimento como conta do dia a dia.
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
 * Até a versão 5, o saldo inicial vira a "Conta principal", e todos os lançamentos e metas passam a ser dela.
 * Sem nenhum caixa (arquivo novo), cria a Conta principal com o saldo padrão.
 */
export function atualizarDados(dados: DadosFinancasSalvos, novoId: () => string = () => crypto.randomUUID()): DadosFinancas {
  const tags = 'tags' in dados && Array.isArray(dados.tags) ? dados.tags : []
  const pastas = 'pastas' in dados && Array.isArray(dados.pastas) ? dados.pastas : []

  if ('caixas' in dados && Array.isArray(dados.caixas)) {
    const caixas = dados.caixas.length ? dados.caixas : [contaPrincipal(novoId())]
    // Antes da versão 7, o destino não tinha interface: só a transferência pode ter um.
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

/** Sem o que é só calculado na tela (o saldo da conta de investimento), para não ir para o arquivo nem o banco. */
function semCalculados(meta: MetaEconomia): MetaEconomia {
  if (meta.naContaCentavos === undefined) return meta
  const copia = { ...meta }
  delete copia.naContaCentavos
  return copia
}

function semDestino(l: Lancamento): Lancamento {
  const copia = { ...l }
  delete copia.caixaDestinoId
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
    case 'lancamento/salvarVarios': {
      // Os que não mudaram mantêm a referência (a projeção de cada caixa só recalcula se a lista dele mudou).
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
      // Como no banco (on delete set null): os lançamentos ficam, sem tag.
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
      // Como no banco (on delete set null): os lançamentos ficam, sem pasta.
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
