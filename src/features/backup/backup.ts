import type { Categoria } from '@/features/categorias/categoria'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { VERSAO_DADOS, type DadosFinancas } from '@/store/estado'

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

export function gerarBackup({ config, configDefinida, categorias, lancamentos }: DadosFinancas, agora: Date): string {
  const dados: DadosFinancas = { config, configDefinida, categorias, lancamentos }
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

function ehLancamento(l: unknown): l is Lancamento {
  return (
    ehObjeto(l) &&
    ehTexto(l.id) &&
    ehTexto(l.descricao) &&
    ehTipo(l.tipo) &&
    ehCentavos(l.valorCentavos) &&
    l.valorCentavos >= 0 &&
    ehTexto(l.categoriaId) &&
    (l.natureza === 'fixa' || l.natureza === 'variavel') &&
    ehRecorrencia(l.recorrencia) &&
    (l.inicio === undefined || ehData(l.inicio)) &&
    (l.fim === undefined || ehData(l.fim))
  )
}

function ehDados(d: unknown): d is DadosFinancas {
  return (
    ehObjeto(d) &&
    ehObjeto(d.config) &&
    ehCentavos(d.config.saldoInicialCentavos) &&
    ehData(d.config.dataSaldoInicial) &&
    typeof d.configDefinida === 'boolean' &&
    Array.isArray(d.categorias) &&
    d.categorias.every(ehCategoria) &&
    Array.isArray(d.lancamentos) &&
    d.lancamentos.every(ehLancamento)
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

  const d = arquivo.dados
  if (arquivo.versao !== VERSAO_DADOS || !ehData(arquivo.exportadoEm) || !ehDados(d)) {
    throw new Error('O backup está incompleto ou foi alterado e não pode ser importado.')
  }

  return {
    exportadoEm: arquivo.exportadoEm,
    dados: {
      config: { saldoInicialCentavos: d.config.saldoInicialCentavos, dataSaldoInicial: d.config.dataSaldoInicial },
      configDefinida: d.configDefinida,
      categorias: d.categorias.map(({ id, nome, cor, tipo }) => ({ id, nome, cor, tipo })),
      lancamentos: d.lancamentos,
    },
  }
}
