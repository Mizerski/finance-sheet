import type { DataISO } from '@/shared/lib/datas'
import type { Lancamento, Natureza, Recorrencia, TipoMovimento } from './lancamento'

/**
 * Estado do formulário. Guarda os campos de todos os tipos de recorrência,
 * para nada se perder ao alternar entre única, mensal e diária.
 */
export interface RascunhoLancamento {
  descricao: string
  tipo: TipoMovimento
  valorCentavos: number
  categoriaId: string
  natureza: Natureza
  recorrencia: Recorrencia['tipo']
  data: DataISO | undefined
  diaDoMes: string
  apenasDiasUteis: boolean
  inicio: DataISO | undefined
  fim: DataISO | undefined
}

export type ErrosLancamento = Partial<Record<keyof RascunhoLancamento, string>>

export function rascunhoVazio(hoje: DataISO): RascunhoLancamento {
  return {
    descricao: '',
    tipo: 'saida',
    valorCentavos: 0,
    categoriaId: '',
    natureza: 'variavel',
    recorrencia: 'unica',
    data: hoje,
    diaDoMes: String(Number(hoje.slice(8, 10))),
    apenasDiasUteis: false,
    inicio: undefined,
    fim: undefined,
  }
}

export function rascunhoDe(l: Lancamento, hoje: DataISO): RascunhoLancamento {
  const r = l.recorrencia
  return {
    ...rascunhoVazio(hoje),
    descricao: l.descricao,
    tipo: l.tipo,
    valorCentavos: l.valorCentavos,
    categoriaId: l.categoriaId,
    natureza: l.natureza,
    recorrencia: r.tipo,
    data: r.tipo === 'unica' ? r.data : hoje,
    ...(r.tipo === 'mensal' && { diaDoMes: String(r.diaDoMes) }),
    ...(r.tipo === 'diaria' && { apenasDiasUteis: r.apenasDiasUteis }),
    inicio: l.inicio,
    fim: l.fim,
  }
}

function lerDiaDoMes(texto: string): number | null {
  const dia = Number(texto)
  return Number.isInteger(dia) && dia >= 1 && dia <= 31 ? dia : null
}

export function validarLancamento(r: RascunhoLancamento, categoriasValidas: Set<string>): ErrosLancamento {
  const erros: ErrosLancamento = {}
  if (!r.descricao.trim()) erros.descricao = 'Informe uma descrição.'
  if (r.valorCentavos <= 0) erros.valorCentavos = 'Informe um valor maior que zero.'
  if (!categoriasValidas.has(r.categoriaId)) erros.categoriaId = 'Escolha uma categoria.'
  if (r.recorrencia === 'unica' && !r.data) erros.data = 'Escolha a data.'
  if (r.recorrencia === 'mensal' && lerDiaDoMes(r.diaDoMes) === null) {
    erros.diaDoMes = 'Use um dia entre 1 e 31.'
  }
  if (r.recorrencia !== 'unica' && r.inicio && r.fim && r.fim < r.inicio) {
    erros.fim = 'O fim não pode ser antes do início.'
  }
  return erros
}

/** Converte um rascunho já validado em lançamento. */
export function paraLancamento(r: RascunhoLancamento, id: string): Lancamento {
  const recorrencia: Recorrencia =
    r.recorrencia === 'unica'
      ? { tipo: 'unica', data: r.data! }
      : r.recorrencia === 'mensal'
        ? { tipo: 'mensal', diaDoMes: lerDiaDoMes(r.diaDoMes)! }
        : { tipo: 'diaria', apenasDiasUteis: r.apenasDiasUteis }

  const limites = r.recorrencia === 'unica' ? {} : { inicio: r.inicio, fim: r.fim }

  return {
    id,
    descricao: r.descricao.trim(),
    tipo: r.tipo,
    valorCentavos: r.valorCentavos,
    categoriaId: r.categoriaId,
    natureza: r.natureza,
    recorrencia,
    ...limites,
  }
}
