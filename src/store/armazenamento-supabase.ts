import type { SupabaseClient } from '@supabase/supabase-js'
import type { Categoria } from '@/features/categorias/categoria'
import type { Lancamento, Natureza, Recorrencia, TipoMovimento } from '@/features/lancamentos/lancamento'
import type { Armazenamento } from './armazenamento'
import type { AcaoFinancas, DadosFinancas, EstadoFinancas } from './estado'
import { estadoVazio } from './estado'

/* Tradução entre o estado do app (camelCase) e as tabelas do Supabase (snake_case). */

interface LinhaCategoria {
  id: string
  nome: string
  cor: string
  tipo: TipoMovimento
}

interface LinhaLancamento {
  id: string
  descricao: string
  tipo: TipoMovimento
  valor_centavos: number
  categoria_id: string | null
  natureza: Natureza
  recorrencia: Recorrencia
  inicio: string | null
  fim: string | null
}

interface LinhaConfiguracao {
  saldo_inicial_centavos: number
  data_saldo_inicial: string
}

const COLUNAS_LANCAMENTO = 'id, descricao, tipo, valor_centavos, categoria_id, natureza, recorrencia, inicio, fim'

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

function deLinhaLancamento(l: LinhaLancamento): Lancamento {
  return {
    id: l.id,
    descricao: l.descricao,
    tipo: l.tipo,
    valorCentavos: l.valor_centavos,
    categoriaId: l.categoria_id ?? '',
    natureza: l.natureza,
    recorrencia: l.recorrencia,
    ...(l.inicio && { inicio: l.inicio }),
    ...(l.fim && { fim: l.fim }),
  }
}

function paraLinhaLancamento(l: Lancamento, idsCategorias: Set<string>): LinhaLancamento {
  return {
    id: l.id,
    descricao: l.descricao,
    tipo: l.tipo,
    valor_centavos: l.valorCentavos,
    // Categoria vazia ou já excluída vira null (a chave estrangeira não aceita id inexistente).
    categoria_id: idsCategorias.has(l.categoriaId) ? l.categoriaId : null,
    natureza: l.natureza,
    recorrencia: l.recorrencia,
    inicio: l.inicio ?? null,
    fim: l.fim ?? null,
  }
}

/** Carrega tudo o que é do usuário logado (o RLS filtra por ele). */
async function carregarDados(supabase: SupabaseClient): Promise<DadosFinancas> {
  const [categorias, lancamentos, configuracao] = await Promise.all([
    selecionarTodas<LinhaCategoria>(supabase, 'categorias', 'id, nome, cor, tipo'),
    selecionarTodas<LinhaLancamento>(supabase, 'lancamentos', COLUNAS_LANCAMENTO),
    supabase.from('configuracoes').select('saldo_inicial_centavos, data_saldo_inicial').maybeSingle<LinhaConfiguracao>(),
  ])
  if (configuracao.error) throw configuracao.error

  const cfg = configuracao.data
  return {
    config: cfg
      ? { saldoInicialCentavos: cfg.saldo_inicial_centavos, dataSaldoInicial: cfg.data_saldo_inicial }
      : estadoVazio().config,
    configDefinida: cfg !== null,
    categorias: categorias.map((c): Categoria => ({ id: c.id, nome: c.nome, cor: c.cor, tipo: c.tipo })),
    lancamentos: lancamentos.map(deLinhaLancamento),
  }
}

/**
 * Grava no banco o efeito de uma ação já aplicada na tela.
 * `antes` é o estado anterior à ação. Devolve null para ações que não são salvas.
 */
function persistir(
  supabase: SupabaseClient,
  usuarioId: string,
  acao: AcaoFinancas,
  antes: EstadoFinancas,
): (() => Promise<void>) | null {
  // O Supabase só executa a consulta quando ela é aguardada; por isso a fila recebe funções.
  const rodar = (consulta: () => PromiseLike<{ error: unknown }>) => async () => {
    const { error } = await consulta()
    if (error) throw error
  }

  switch (acao.tipo) {
    case 'config/atualizar': {
      const config = { ...antes.config, ...acao.config }
      return rodar(() =>
        supabase.from('configuracoes').upsert({
          user_id: usuarioId,
          saldo_inicial_centavos: config.saldoInicialCentavos,
          data_saldo_inicial: config.dataSaldoInicial,
          atualizado_em: new Date().toISOString(),
        }),
      )
    }
    case 'categoria/salvar': {
      const { id, nome, cor, tipo } = acao.categoria
      return rodar(() => supabase.from('categorias').upsert({ id, nome, cor, tipo }))
    }
    case 'categoria/excluir':
      return rodar(() => supabase.from('categorias').delete().eq('id', acao.id))
    case 'lancamento/salvar': {
      const linha = paraLinhaLancamento(acao.lancamento, new Set(antes.categorias.map((c) => c.id)))
      return rodar(() => supabase.from('lancamentos').upsert(linha))
    }
    case 'lancamento/excluir':
      return rodar(() => supabase.from('lancamentos').delete().eq('id', acao.id))
    case 'dados/importar':
      // Backup só existe no desktop; na web, falha e a tela volta ao que está no banco.
      return async () => {
        throw new Error('Importar backup só está disponível no app desktop.')
      }
    case 'dados/carregar':
    case 'saldos/alternarVisibilidade':
      return null
  }
}

/** Web: os dados do usuário logado, no Supabase. */
export function criarArmazenamentoSupabase(supabase: SupabaseClient, usuarioId: string): Armazenamento {
  return {
    carregar: () => carregarDados(supabase),
    gravacao: (acao, antes) => persistir(supabase, usuarioId, acao, antes),
  }
}