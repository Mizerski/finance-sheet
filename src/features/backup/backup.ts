import type { Caixa } from '@/features/caixas/caixa'
import type { Categoria } from '@/features/categorias/categoria'
import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { Pasta } from '@/features/pastas/pasta'
import type { Tag } from '@/features/tags/tag'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { atualizarDados, VERSAO_DADOS, type DadosFinancas, type DadosFinancasSalvos } from '@/store/estado'

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
  { caixas, categorias, lancamentos, metas, tags, pastas }: DadosFinancas,
  agora: Date,
): string {
  const dados: DadosFinancas = { caixas, categorias, lancamentos, metas, tags, pastas }
  return JSON.stringify({ app: APP, versao: VERSAO_DADOS, exportadoEm: paraDataISO(agora), dados }, null, 2)
}

type Objeto = Record<string, unknown>

const ehObjeto = (v: unknown): v is Objeto => typeof v === 'object' && v !== null && !Array.isArray(v)
const ehTexto = (v: unknown): v is string => typeof v === 'string'
const ehData = (v: unknown): v is DataISO => ehTexto(v) && /^\d{4}-\d{2}-\d{2}$/.test(v)
const ehCentavos = (v: unknown): v is number => Number.isSafeInteger(v)
const ehTipo = (v: unknown) => v === 'entrada' || v === 'saida'
/** A partir da versão 7, o lançamento também pode ser uma transferência. */
const ehTipoLancamento = (v: unknown) => ehTipo(v) || v === 'transferencia'
const ehCor = (v: unknown) => ehTexto(v) && /^#[0-9a-f]{6}$/i.test(v)

function ehRecorrencia(r: unknown): boolean {
  if (!ehObjeto(r)) return false
  switch (r.tipo) {
    case 'unica':
      return ehData(r.data)
    case 'semanal':
      return (
        Array.isArray(r.diasDaSemana) &&
        r.diasDaSemana.length > 0 &&
        r.diasDaSemana.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      )
    case 'mensal':
      return Number.isInteger(r.diaDoMes) && (r.diaDoMes as number) >= 1 && (r.diaDoMes as number) <= 31
    case 'diaria':
      return typeof r.apenasDiasUteis === 'boolean'
    default:
      return false
  }
}

function ehCaixa(c: unknown): c is Caixa {
  return (
    ehObjeto(c) &&
    ehTexto(c.id) &&
    ehTexto(c.nome) &&
    ehCor(c.cor) &&
    (c.tipo === 'conta' || c.tipo === 'beneficio') &&
    ehCentavos(c.saldoInicialCentavos) &&
    ehData(c.dataSaldoInicial) &&
    typeof c.saldoDefinido === 'boolean' &&
    typeof c.entraNoTotal === 'boolean' &&
    Number.isInteger(c.ordem) &&
    (c.arquivado === undefined || typeof c.arquivado === 'boolean')
  )
}

function ehCategoria(c: unknown): c is Categoria {
  return ehObjeto(c) && ehTexto(c.id) && ehTexto(c.nome) && ehCor(c.cor) && ehTipo(c.tipo)
}

function ehTag(t: unknown): t is Tag {
  return ehObjeto(t) && ehTexto(t.id) && ehTexto(t.nome) && ehCor(t.cor) && typeof t.evitavel === 'boolean'
}

function ehPasta(p: unknown): p is Pasta {
  return ehObjeto(p) && ehTexto(p.id) && ehTexto(p.nome) && ehCor(p.cor)
}

/** A partir da versão 6, todo lançamento e meta tem `caixaId` de um caixa do backup. */
function ehDoCaixa(item: Objeto, versao: number, caixas: Set<string>): boolean {
  if (versao < 6) return true
  return (
    ehTexto(item.caixaId) &&
    caixas.has(item.caixaId) &&
    (item.caixaDestinoId === undefined || (ehTexto(item.caixaDestinoId) && caixas.has(item.caixaDestinoId))) &&
    (item.destinoId === undefined || (ehTexto(item.destinoId) && caixas.has(item.destinoId)))
  )
}

function ehLancamento(l: unknown): l is Omit<Lancamento, 'caixaId'> {
  return (
    ehObjeto(l) &&
    ehTexto(l.id) &&
    ehTexto(l.descricao) &&
    ehTipoLancamento(l.tipo) &&
    // Transferência sempre tem destino, diferente da origem (que o backup confere em `ehDoCaixa`).
    (l.tipo !== 'transferencia' || (ehTexto(l.caixaDestinoId) && l.caixaDestinoId !== l.caixaId)) &&
    ehCentavos(l.valorCentavos) &&
    l.valorCentavos >= 0 &&
    ehTexto(l.categoriaId) &&
    (l.tagId === undefined || ehTexto(l.tagId)) &&
    (l.pastaId === undefined || ehTexto(l.pastaId)) &&
    (l.natureza === 'fixa' || l.natureza === 'variavel') &&
    ehRecorrencia(l.recorrencia) &&
    (l.inicio === undefined || ehData(l.inicio)) &&
    (l.fim === undefined || ehData(l.fim)) &&
    // A partir da versão 9: valor de um dia só (0 = pulado).
    (l.excecoes === undefined ||
      (ehObjeto(l.excecoes) && Object.entries(l.excecoes).every(([data, v]) => ehData(data) && ehCentavos(v) && v >= 0)))
  )
}

function ehMeta(m: unknown): m is Omit<MetaEconomia, 'caixaId'> {
  return (
    ehObjeto(m) &&
    ehTexto(m.id) &&
    ehTexto(m.nome) &&
    // A partir da versão 7, a meta pode não ter valor alvo (cofrinho).
    (m.valorAlvoCentavos === undefined || (ehCentavos(m.valorAlvoCentavos) && m.valorAlvoCentavos > 0)) &&
    ehCentavos(m.aporteMensalCentavos) &&
    m.aporteMensalCentavos >= 0 &&
    // A partir da versão 8: o que já estava guardado fora do app.
    (m.jaGuardadoCentavos === undefined || (ehCentavos(m.jaGuardadoCentavos) && m.jaGuardadoCentavos > 0)) &&
    Number.isInteger(m.diaDoMes) &&
    (m.diaDoMes as number) >= 1 &&
    (m.diaDoMes as number) <= 31 &&
    ehData(m.inicio) &&
    (m.prazo === undefined || ehData(m.prazo)) &&
    ehObjeto(m.ajustes) &&
    Object.entries(m.ajustes).every(([mes, v]) => /^\d{4}-\d{2}$/.test(mes) && ehCentavos(v) && v >= 0) &&
    // A partir da versão 7: dinheiro usado e meta encerrada.
    (m.resgates === undefined || (Array.isArray(m.resgates) && m.resgates.every(ehResgate))) &&
    (m.encerradaEm === undefined || ehData(m.encerradaEm))
  )
}

function ehResgate(r: unknown): boolean {
  return ehObjeto(r) && ehTexto(r.id) && ehData(r.data) && ehCentavos(r.valorCentavos) && r.valorCentavos > 0
}

/** Dados da versão 1 (sem metas), da 2 (sem tags e pastas), de 3 a 5 (sem caixas) ou da atual. */
function ehDados(d: unknown, versao: number): d is DadosFinancasSalvos {
  if (!ehObjeto(d)) return false
  const caixas = versao >= 6 && Array.isArray(d.caixas) && d.caixas.every(ehCaixa) ? d.caixas : null
  const idsCaixas = new Set(caixas?.map((c) => c.id))
  return (
    (versao >= 6
      ? caixas !== null && caixas.length > 0
      : ehObjeto(d.config) &&
        ehCentavos(d.config.saldoInicialCentavos) &&
        ehData(d.config.dataSaldoInicial) &&
        typeof d.configDefinida === 'boolean') &&
    Array.isArray(d.categorias) &&
    d.categorias.every(ehCategoria) &&
    Array.isArray(d.lancamentos) &&
    d.lancamentos.every((l) => ehLancamento(l) && ehDoCaixa(l, versao, idsCaixas)) &&
    (versao < 2 || (Array.isArray(d.metas) && d.metas.every((m) => ehMeta(m) && ehDoCaixa(m, versao, idsCaixas)))) &&
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

  // Versões anteriores à 6 ganham a Conta principal, com o saldo inicial do backup.
  const atual = atualizarDados(d)
  return {
    exportadoEm: arquivo.exportadoEm,
    dados: {
      caixas: atual.caixas.map(
        ({ id, nome, cor, tipo, saldoInicialCentavos, dataSaldoInicial, saldoDefinido, entraNoTotal, ordem, arquivado }) => ({
          id,
          nome,
          cor,
          tipo,
          saldoInicialCentavos,
          dataSaldoInicial,
          saldoDefinido,
          entraNoTotal,
          ordem,
          ...(arquivado && { arquivado: true }),
        }),
      ),
      categorias: atual.categorias.map(({ id, nome, cor, tipo }) => ({ id, nome, cor, tipo })),
      lancamentos: atual.lancamentos,
      metas: atual.metas.map(
        ({
          id,
          caixaId,
          destinoId,
          nome,
          valorAlvoCentavos,
          aporteMensalCentavos,
          jaGuardadoCentavos,
          diaDoMes,
          inicio,
          prazo,
          ajustes,
          resgates,
          encerradaEm,
        }) => ({
          id,
          caixaId,
          ...(destinoId && { destinoId }),
          nome,
          ...(valorAlvoCentavos !== undefined && { valorAlvoCentavos }),
          aporteMensalCentavos,
          ...(jaGuardadoCentavos && { jaGuardadoCentavos }),
          diaDoMes,
          inicio,
          ...(prazo && { prazo }),
          ajustes: { ...ajustes },
          ...(resgates?.length && { resgates: resgates.map(({ id, data, valorCentavos }) => ({ id, data, valorCentavos })) }),
          ...(encerradaEm && { encerradaEm }),
        }),
      ),
      tags: atual.tags.map(({ id, nome, cor, evitavel }) => ({ id, nome, cor, evitavel })),
      pastas: atual.pastas.map(({ id, nome, cor }) => ({ id, nome, cor })),
    },
  }
}
