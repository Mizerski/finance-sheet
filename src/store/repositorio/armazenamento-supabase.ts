import type { SupabaseClient } from '@supabase/supabase-js'
import { contaPrincipal, type Caixa, type TipoCaixa } from '@/features/caixas/model/caixa'
import type { Categoria } from '@/features/categorias/model/categoria'
import type { MetaEconomia, Resgate } from '@/features/economias/model/meta'
import type { Lancamento, Natureza, Recorrencia, TipoLancamento, TipoMovimento } from '@/features/lancamentos/model/lancamento'
import type { Pasta } from '@/features/pastas/model/pasta'
import type { Tag } from '@/features/tags/model/tag'
import type { Armazenamento } from './armazenamento'
import type { DadosFinancas } from '../model/dados'
import type { AcaoFinancas, EstadoFinancas } from '../reducer/financas-reducer'

interface LinhaCategoria {
  id: string
  nome: string
  cor: string
  tipo: TipoMovimento
}

interface LinhaCaixa {
  id: string
  nome: string
  cor: string
  tipo: TipoCaixa
  saldo_inicial_centavos: number
  data_saldo_inicial: string
  saldo_definido: boolean
  entra_no_total: boolean
  ordem: number
  arquivado: boolean
  dia_fechamento: number | null
  dia_vencimento: number | null
  conta_pagadora_id: string | null
  limite_centavos: number | null
  investimento: boolean
}

interface LinhaLancamento {
  id: string
  caixa_id: string
  caixa_destino_id: string | null
  descricao: string
  tipo: TipoLancamento
  valor_centavos: number
  categoria_id: string | null
  tag_id: string | null
  pasta_id: string | null
  natureza: Natureza
  recorrencia: Recorrencia
  inicio: string | null
  fim: string | null
  excecoes: Record<string, number> | null
}

interface LinhaMeta {
  id: string
  caixa_id: string
  destino_id: string | null
  nome: string
  valor_alvo_centavos: number | null
  aporte_mensal_centavos: number
  ja_guardado_centavos: number
  dia_do_mes: number
  inicio: string
  prazo: string | null
  ajustes: Record<string, number>
  resgates: Resgate[] | null
  encerrada_em: string | null
}

const COLUNAS_CAIXA =
  'id, nome, cor, tipo, saldo_inicial_centavos, data_saldo_inicial, saldo_definido, entra_no_total, ordem, arquivado, dia_fechamento, dia_vencimento, conta_pagadora_id, limite_centavos, investimento'
const COLUNAS_LANCAMENTO = 'id, caixa_id, caixa_destino_id, descricao, tipo, valor_centavos, categoria_id, tag_id, pasta_id, natureza, recorrencia, inicio, fim, excecoes'
const COLUNAS_META =
  'id, caixa_id, destino_id, nome, valor_alvo_centavos, aporte_mensal_centavos, ja_guardado_centavos, dia_do_mes, inicio, prazo, ajustes, resgates, encerrada_em'

/** Gravações em lote vão em partes: a exclusão leva os ids na URL, que tem limite de tamanho. */
const TAMANHO_LOTE = 100

function emLotes<T>(itens: T[]): T[][] {
  return Array.from({ length: Math.ceil(itens.length / TAMANHO_LOTE) }, (_, i) =>
    itens.slice(i * TAMANHO_LOTE, (i + 1) * TAMANHO_LOTE),
  )
}

/** O PostgREST devolve no máximo 1000 linhas por consulta; busca página por página. */
const TAMANHO_PAGINA = 1000

async function selecionarTodas<T>(supabase: SupabaseClient, tabela: string, colunas: string): Promise<T[]> {
  const linhas: T[] = []
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await supabase
      .from(tabela)
      .select(colunas)
      .order('criado_em')
      .order('id')
      .range(inicio, inicio + TAMANHO_PAGINA - 1)
    if (error) throw error
    linhas.push(...(data as T[]))
    if (data.length < TAMANHO_PAGINA) return linhas
  }
}

function deLinhaCaixa(c: LinhaCaixa): Caixa {
  return {
    id: c.id,
    nome: c.nome,
    cor: c.cor,
    tipo: c.tipo,
    saldoInicialCentavos: c.saldo_inicial_centavos,
    dataSaldoInicial: c.data_saldo_inicial,
    saldoDefinido: c.saldo_definido,
    entraNoTotal: c.entra_no_total,
    ordem: c.ordem,
    ...(c.arquivado && { arquivado: true }),
    ...(c.investimento && { investimento: true }),
    ...(c.tipo === 'cartao' &&
      c.dia_fechamento !== null &&
      c.dia_vencimento !== null &&
      c.conta_pagadora_id && {
        cartao: {
          diaFechamento: c.dia_fechamento,
          diaVencimento: c.dia_vencimento,
          contaPagadoraId: c.conta_pagadora_id,
          ...(c.limite_centavos !== null && { limiteCentavos: c.limite_centavos }),
        },
      }),
  }
}

function paraLinhaCaixa(c: Caixa): LinhaCaixa {
  return {
    id: c.id,
    nome: c.nome,
    cor: c.cor,
    tipo: c.tipo,
    saldo_inicial_centavos: c.saldoInicialCentavos,
    data_saldo_inicial: c.dataSaldoInicial,
    saldo_definido: c.saldoDefinido,
    entra_no_total: c.entraNoTotal,
    ordem: c.ordem,
    arquivado: c.arquivado ?? false,
    dia_fechamento: c.cartao?.diaFechamento ?? null,
    dia_vencimento: c.cartao?.diaVencimento ?? null,
    conta_pagadora_id: c.cartao?.contaPagadoraId ?? null,
    limite_centavos: c.cartao?.limiteCentavos ?? null,
    investimento: c.investimento ?? false,
  }
}

function deLinhaLancamento(l: LinhaLancamento): Lancamento {
  return {
    id: l.id,
    caixaId: l.caixa_id,
    ...(l.caixa_destino_id && { caixaDestinoId: l.caixa_destino_id }),
    descricao: l.descricao,
    tipo: l.tipo,
    valorCentavos: l.valor_centavos,
    categoriaId: l.categoria_id ?? '',
    ...(l.tag_id && { tagId: l.tag_id }),
    ...(l.pasta_id && { pastaId: l.pasta_id }),
    natureza: l.natureza,
    recorrencia: l.recorrencia,
    ...(l.inicio && { inicio: l.inicio }),
    ...(l.fim && { fim: l.fim }),
    ...(l.excecoes && Object.keys(l.excecoes).length && { excecoes: l.excecoes }),
  }
}

/** Ids que existem no banco: um id vazio ou já excluído vira null (a chave estrangeira não aceita id inexistente). */
interface IdsValidos {
  categorias: Set<string>
  tags: Set<string>
  pastas: Set<string>
}

function paraLinhaLancamento(l: Lancamento, ids: IdsValidos): LinhaLancamento {
  return {
    id: l.id,
    caixa_id: l.caixaId,
    caixa_destino_id: l.caixaDestinoId ?? null,
    descricao: l.descricao,
    tipo: l.tipo,
    valor_centavos: l.valorCentavos,
    categoria_id: ids.categorias.has(l.categoriaId) ? l.categoriaId : null,
    tag_id: l.tagId && ids.tags.has(l.tagId) ? l.tagId : null,
    pasta_id: l.pastaId && ids.pastas.has(l.pastaId) ? l.pastaId : null,
    natureza: l.natureza,
    recorrencia: l.recorrencia,
    inicio: l.inicio ?? null,
    fim: l.fim ?? null,
    excecoes: l.excecoes ?? {},
  }
}

function deLinhaMeta(m: LinhaMeta): MetaEconomia {
  return {
    id: m.id,
    caixaId: m.caixa_id,
    ...(m.destino_id && { destinoId: m.destino_id }),
    nome: m.nome,
    ...(m.valor_alvo_centavos !== null && { valorAlvoCentavos: m.valor_alvo_centavos }),
    aporteMensalCentavos: m.aporte_mensal_centavos,
    ...(m.ja_guardado_centavos > 0 && { jaGuardadoCentavos: m.ja_guardado_centavos }),
    diaDoMes: m.dia_do_mes,
    inicio: m.inicio,
    ...(m.prazo && { prazo: m.prazo }),
    ajustes: m.ajustes ?? {},
    ...(m.resgates?.length && { resgates: m.resgates }),
    ...(m.encerrada_em && { encerradaEm: m.encerrada_em }),
  }
}

function paraLinhaMeta(m: MetaEconomia): LinhaMeta {
  return {
    id: m.id,
    caixa_id: m.caixaId,
    destino_id: m.destinoId ?? null,
    nome: m.nome,
    valor_alvo_centavos: m.valorAlvoCentavos ?? null,
    aporte_mensal_centavos: m.aporteMensalCentavos,
    ja_guardado_centavos: m.jaGuardadoCentavos ?? 0,
    dia_do_mes: m.diaDoMes,
    inicio: m.inicio,
    prazo: m.prazo ?? null,
    ajustes: m.ajustes,
    resgates: m.resgates ?? [],
    encerrada_em: m.encerradaEm ?? null,
  }
}

/** Carrega tudo o que é do usuário logado (o RLS filtra por ele). */
async function carregarDados(supabase: SupabaseClient, usuarioId: string): Promise<DadosFinancas> {
  const [caixas, categorias, tags, pastas, lancamentos, metas] = await Promise.all([
    selecionarTodas<LinhaCaixa>(supabase, 'caixas', COLUNAS_CAIXA),
    selecionarTodas<LinhaCategoria>(supabase, 'categorias', 'id, nome, cor, tipo'),
    selecionarTodas<Tag>(supabase, 'tags', 'id, nome, cor, evitavel'),
    selecionarTodas<Pasta>(supabase, 'pastas', 'id, nome, cor'),
    selecionarTodas<LinhaLancamento>(supabase, 'lancamentos', COLUNAS_LANCAMENTO),
    selecionarTodas<LinhaMeta>(supabase, 'metas_economia', COLUNAS_META),
  ])

  return {
    caixas: caixas.length ? caixas.map(deLinhaCaixa) : [await criarContaPrincipal(supabase, usuarioId)],
    categorias: categorias.map((c): Categoria => ({ id: c.id, nome: c.nome, cor: c.cor, tipo: c.tipo })),
    lancamentos: lancamentos.map(deLinhaLancamento),
    metas: metas.map(deLinhaMeta),
    tags: tags.map(({ id, nome, cor, evitavel }) => ({ id, nome, cor, evitavel })),
    pastas: pastas.map(({ id, nome, cor }) => ({ id, nome, cor })),
  }
}

/** Usuário novo (a migração dos caixas já criou a Conta principal de quem existia). */
async function criarContaPrincipal(supabase: SupabaseClient, usuarioId: string): Promise<Caixa> {
  const caixa = contaPrincipal(crypto.randomUUID())
  const { error } = await supabase.from('caixas').insert({ ...paraLinhaCaixa(caixa), user_id: usuarioId })
  if (error) throw error
  return caixa
}

/**
 * Gravação do efeito de uma ação já aplicada na tela. Devolve funções porque o Supabase só executa a consulta
 * quando ela é aguardada.
 */
function persistir(
  supabase: SupabaseClient,
  acao: AcaoFinancas,
  antes: EstadoFinancas,
): (() => Promise<void>) | null {
  const rodar = (consulta: () => PromiseLike<{ error: unknown }>) => async () => {
    const { error } = await consulta()
    if (error) throw error
  }

  switch (acao.tipo) {
    case 'caixa/salvar':
      return rodar(() => supabase.from('caixas').upsert(paraLinhaCaixa(acao.caixa)))
    case 'caixa/excluir':
      return rodar(() => supabase.from('caixas').delete().eq('id', acao.id))
    case 'categoria/salvar': {
      const { id, nome, cor, tipo } = acao.categoria
      return rodar(() => supabase.from('categorias').upsert({ id, nome, cor, tipo }))
    }
    case 'categoria/excluir':
      return rodar(() => supabase.from('categorias').delete().eq('id', acao.id))
    case 'lancamento/salvar': {
      const linha = paraLinhaLancamento(acao.lancamento, {
        categorias: new Set(antes.categorias.map((c) => c.id)),
        tags: new Set(antes.tags.map((t) => t.id)),
        pastas: new Set(antes.pastas.map((p) => p.id)),
      })
      return rodar(() => supabase.from('lancamentos').upsert(linha))
    }
    case 'lancamento/excluir':
      return rodar(() => supabase.from('lancamentos').delete().eq('id', acao.id))
    case 'lancamento/salvarVarios': {
      const ids = {
        categorias: new Set(antes.categorias.map((c) => c.id)),
        tags: new Set(antes.tags.map((t) => t.id)),
        pastas: new Set(antes.pastas.map((p) => p.id)),
      }
      const lotes = emLotes(acao.lancamentos.map((l) => paraLinhaLancamento(l, ids)))
      return async () => {
        for (const linhas of lotes) await rodar(() => supabase.from('lancamentos').upsert(linhas))()
      }
    }
    case 'lancamento/excluirVarios': {
      const lotes = emLotes(acao.ids)
      return async () => {
        for (const ids of lotes) await rodar(() => supabase.from('lancamentos').delete().in('id', ids))()
      }
    }
    case 'meta/salvar':
      return rodar(() => supabase.from('metas_economia').upsert(paraLinhaMeta(acao.meta)))
    case 'meta/excluir':
      return rodar(() => supabase.from('metas_economia').delete().eq('id', acao.id))
    case 'tag/salvar': {
      const { id, nome, cor, evitavel } = acao.tag
      return rodar(() => supabase.from('tags').upsert({ id, nome, cor, evitavel }))
    }
    case 'tag/excluir':
      return rodar(() => supabase.from('tags').delete().eq('id', acao.id))
    case 'pasta/salvar': {
      const { id, nome, cor } = acao.pasta
      return rodar(() => supabase.from('pastas').upsert({ id, nome, cor }))
    }
    case 'pasta/excluir':
      return rodar(() => supabase.from('pastas').delete().eq('id', acao.id))
    case 'dados/importar':
      return async () => {
        throw new Error('Importar backup só está disponível no app desktop.')
      }
    case 'dados/carregar':
    case 'saldos/alternarVisibilidade':
      return null
  }
}

/**
 * Web: os dados do usuário logado, no Supabase.
 * A tradução entre o estado (camelCase) e as tabelas (snake_case) fica só neste arquivo.
 */
export function criarArmazenamentoSupabase(supabase: SupabaseClient, usuarioId: string): Armazenamento {
  return {
    carregar: () => carregarDados(supabase, usuarioId),
    gravacao: (acao, antes) => persistir(supabase, acao, antes),
  }
}