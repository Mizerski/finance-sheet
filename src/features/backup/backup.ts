import type { Categoria } from '@/features/categorias/categoria'
import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { Pasta } from '@/features/pastas/pasta'
import type { Tag } from '@/features/tags/tag'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import {
  atualizarDados,
  VERSAO_DADOS,
  type DadosFinancas,
  type DadosFinancasV1,
  type DadosFinancasV2,
} from '@/store/estado'

/* Arquivo de backup do app desktop: os mesmos dados do arquivo local, com a identificação do app. */

const APP = 'projecao-financeira'

export interface Backup {
  /** Data em que o backup foi exportado. */
  exportadoEm: DataISO
  dados: DadosFinancas
}

export function nomeDoBackup(hoje: Date): string {
  return `${APP}-backup-${paraDataISO(hoje)}.json`
}

export function gerarBackup(
  { config, configDefinida, categorias, lancamentos, metas, tags, pastas }: DadosFinancas,
  agora: Date,
): string {
  const dados: DadosFinancas = { config, configDefinida, categorias, lancamentos, metas, tags, pastas }
  return JSON.stringify({ app: APP, versao: VERSAO_DADOS, exportadoEm: paraDataISO(agora), dados }, null, 2)
}

type Objeto = Record<string, unknown>

const ehObjeto = (v: unknown): v is Objeto => typeof v === 'object' && v !== null && !Array.isArray(v)
const ehTexto = (v: unknown): v is string => typeof v === 'string'
const ehData = (v: unknown): v is DataISO => ehTexto(v) && /^\d{4}-\d{2}-\d{2}$/.test(v)
const ehCentavos = (v: unknown): v is number => Number.isSafeInteger(v)
const ehTipo = (v: unknown) => v === 'entrada' || v === 'saida'

function ehRecorrencia(r: unknown): boolean {
  if (!ehObjeto(r)) return false
  switch (r.tipo) {
    case 'unica':
      return ehData(r.data)
    case 'mensal':
      return Number.isInteger(r.diaDoMes) && (r.diaDoMes as number) >= 1 && (r.diaDoMes as number) <= 31
    case 'diaria':
      return typeof r.apenasDiasUteis === 'boolean'
    default:
      return false
  }
}

function ehCategoria(c: unknown): c is Categoria {
  return ehObjeto(c) && ehTexto(c.id) && ehTexto(c.nome) && ehTexto(c.cor) && /^#[0-9a-f]{6}$/i.test(c.cor) && ehTipo(c.tipo)
}

function ehTag(t: unknown): t is Tag {
  return ehObjeto(t) && ehTexto(t.id) && ehTexto(t.nome) && ehTexto(t.cor) && /^#[0-9a-f]{6}$/i.test(t.cor) && typeof t.evitavel === 'boolean'
}

function ehPasta(p: unknown): p is Pasta {
  return ehObjeto(p) && ehTexto(p.id) && ehTexto(p.nome) && ehTexto(p.cor) && /^#[0-9a-f]{6}$/i.test(p.cor)
}

function ehLancamento(l: unknown): l is Lancamento {
  return (
    ehObjeto(l) &&
    ehTexto(l.id) &&
    ehTexto(l.descricao) &&
    ehTipo(l.tipo) &&
    ehCentavos(l.valorCentavos) &&
    l.valorCentavos >= 0 &&
    ehTexto(l.categoriaId) &&
    (l.tagId === undefined || ehTexto(l.tagId)) &&
    (l.pastaId === undefined || ehTexto(l.pastaId)) &&
    (l.natureza === 'fixa' || l.natureza === 'variavel') &&
    ehRecorrencia(l.recorrencia) &&
    (l.inicio === undefined || ehData(l.inicio)) &&
    (l.fim === undefined || ehData(l.fim))
  )
}

function ehMeta(m: unknown): m is MetaEconomia {
  return (
    ehObjeto(m) &&
    ehTexto(m.id) &&
    ehTexto(m.nome) &&
    ehCentavos(m.valorAlvoCentavos) &&
    m.valorAlvoCentavos > 0 &&
    ehCentavos(m.aporteMensalCentavos) &&
    m.aporteMensalCentavos >= 0 &&
    Number.isInteger(m.diaDoMes) &&
    (m.diaDoMes as number) >= 1 &&
    (m.diaDoMes as number) <= 31 &&
    ehData(m.inicio) &&
    ehObjeto(m.ajustes) &&
    Object.entries(m.ajustes).every(([mes, v]) => /^\d{4}-\d{2}$/.test(mes) && ehCentavos(v) && v >= 0)
  )
}

/** Dados da versão 1 (sem metas), da 2 (sem tags e pastas) ou da atual. */
function ehDados(d: unknown, versao: number): d is DadosFinancas | DadosFinancasV2 | DadosFinancasV1 {
  return (
    ehObjeto(d) &&
    ehObjeto(d.config) &&
    ehCentavos(d.config.saldoInicialCentavos) &&
    ehData(d.config.dataSaldoInicial) &&
    typeof d.configDefinida === 'boolean' &&
    Array.isArray(d.categorias) &&
    d.categorias.every(ehCategoria) &&
    Array.isArray(d.lancamentos) &&
    d.lancamentos.every(ehLancamento) &&
    (versao < 2 || (Array.isArray(d.metas) && d.metas.every(ehMeta))) &&
    (versao < 3 ||
      (Array.isArray(d.tags) && d.tags.every(ehTag) && Array.isArray(d.pastas) && d.pastas.every(ehPasta)))
  )
}

/** Lê o conteúdo de um arquivo de backup. Lança um erro com a explicação se ele não puder ser importado. */
export function lerBackup(texto: string): Backup {
  let arquivo: unknown
  try {
    arquivo = JSON.parse(texto)
  } catch {
    throw new Error('O arquivo não é um backup válido.')
  }
  if (!ehObjeto(arquivo) || arquivo.app !== APP) {
    throw new Error('Este arquivo não é um backup da Projeção Financeira.')
  }
  if (typeof arquivo.versao === 'number' && arquivo.versao > VERSAO_DADOS) {
    throw new Error('Este backup foi feito numa versão mais nova do app. Atualize o app para importá-lo.')
  }

  // Backups de versões anteriores continuam valendo e são convertidos para o formato atual.
  const versao = arquivo.versao
  const d = arquivo.dados
  if (
    typeof versao !== 'number' ||
    !Number.isInteger(versao) ||
    versao < 1 ||
    !ehData(arquivo.exportadoEm) ||
    !ehDados(d, versao)
  ) {
    throw new Error('O backup está incompleto ou foi alterado e não pode ser importado.')
  }

  const atual = atualizarDados(d)
  return {
    exportadoEm: arquivo.exportadoEm,
    dados: {
      config: { saldoInicialCentavos: d.config.saldoInicialCentavos, dataSaldoInicial: d.config.dataSaldoInicial },
      configDefinida: d.configDefinida,
      categorias: d.categorias.map(({ id, nome, cor, tipo }) => ({ id, nome, cor, tipo })),
      lancamentos: d.lancamentos,
      metas: atual.metas.map(({ id, nome, valorAlvoCentavos, aporteMensalCentavos, diaDoMes, inicio, ajustes }) => ({
        id,
        nome,
        valorAlvoCentavos,
        aporteMensalCentavos,
        diaDoMes,
        inicio,
        ajustes: { ...ajustes },
      })),
      tags: atual.tags.map(({ id, nome, cor, evitavel }) => ({ id, nome, cor, evitavel })),
      pastas: atual.pastas.map(({ id, nome, cor }) => ({ id, nome, cor })),
    },
  }
}
