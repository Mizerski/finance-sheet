import { deDataISO, type DataISO } from '@/shared/lib/datas'
import type { Lancamento, Natureza, Recorrencia, TipoLancamento } from '../model/lancamento'
import { fimDepoisDe, MAX_VEZES, parcelasDe } from './parcelas'

/**
 * Estado do formulário. Guarda os campos de todos os tipos de recorrência,
 * para nada se perder ao alternar entre única, semanal, mensal e diária.
 */
export interface RascunhoLancamento {
  /** Na transferência, a conta de onde o dinheiro sai. */
  caixaId: string
  /** Só vale na transferência: a conta que recebe ('' = ainda não escolhida). */
  caixaDestinoId: string
  descricao: string
  tipo: TipoLancamento
  valorCentavos: number
  categoriaId: string
  /** '' = sem tag. Só vale para saídas. */
  tagId: string
  /** '' = sem pasta. */
  pastaId: string
  natureza: Natureza
  recorrencia: Recorrencia['tipo']
  data: DataISO | undefined
  /** 0 (domingo) a 6 (sábado). */
  diasDaSemana: number[]
  diaDoMes: string
  apenasDiasUteis: boolean
  inicio: DataISO | undefined
  /** Só vale com `duracao` 'data'. */
  fim: DataISO | undefined
  /** Até quando o recorrente acontece: sem fim, um número de vezes (parcelas) ou até uma data. */
  duracao: Duracao
  /** Quantas vezes, como digitado; com `duracao` 'vezes', o fim sai daqui (`fimDepoisDe`). */
  vezes: string
  /** Com `duracao` 'vezes': o valor digitado é o total, e cada vez fica com o total dividido. */
  valorEhTotal: boolean
  /** Dias com outro valor (0 = pulado), mudados no dia da planilha; só valem no recorrente. */
  excecoes: Record<DataISO, number>
}

export type Duracao = 'sem' | 'vezes' | 'data'

export type ErrosLancamento = Partial<Record<keyof RascunhoLancamento, string>>

/** Muda um campo do rascunho (o mesmo `alterar` no formulário completo e nos passos). */
export type AlterarRascunho = <K extends keyof RascunhoLancamento>(campo: K, valor: RascunhoLancamento[K]) => void

/** Rascunho de um lançamento novo na `data` (hoje, ou o dia clicado na planilha), no caixa padrão. */
export function rascunhoVazio(data: DataISO, caixaId: string): RascunhoLancamento {
  return {
    caixaId,
    caixaDestinoId: '',
    descricao: '',
    tipo: 'saida',
    valorCentavos: 0,
    categoriaId: '',
    tagId: '',
    pastaId: '',
    natureza: 'variavel',
    recorrencia: 'unica',
    data,
    diasDaSemana: [deDataISO(data).getDay()],
    diaDoMes: String(Number(data.slice(8, 10))),
    apenasDiasUteis: false,
    inicio: undefined,
    fim: undefined,
    duracao: 'sem',
    vezes: '',
    valorEhTotal: false,
    excecoes: {},
  }
}

export function rascunhoDe(l: Lancamento, hoje: DataISO): RascunhoLancamento {
  const r = l.recorrencia
  return {
    ...rascunhoVazio(hoje, l.caixaId),
    caixaDestinoId: l.caixaDestinoId ?? '',
    descricao: l.descricao,
    tipo: l.tipo,
    valorCentavos: l.valorCentavos,
    categoriaId: l.categoriaId,
    tagId: l.tagId ?? '',
    pastaId: l.pastaId ?? '',
    natureza: l.natureza,
    recorrencia: r.tipo,
    data: r.tipo === 'unica' ? r.data : hoje,
    ...(r.tipo === 'semanal' && { diasDaSemana: r.diasDaSemana }),
    ...(r.tipo === 'mensal' && { diaDoMes: String(r.diaDoMes) }),
    ...(r.tipo === 'diaria' && { apenasDiasUteis: r.apenasDiasUteis }),
    inicio: l.inicio,
    fim: l.fim,
    ...duracaoDe(l, hoje),
    excecoes: l.excecoes ?? {},
  }
}

/** Um recorrente com fim aparece como número de vezes (parcelas); se forem vezes demais, como data. */
function duracaoDe(l: Lancamento, hoje: DataISO): Pick<RascunhoLancamento, 'duracao' | 'vezes'> {
  if (!l.fim || l.recorrencia.tipo === 'unica') return { duracao: 'sem', vezes: '' }
  const parcelas = parcelasDe(l, hoje)
  return parcelas ? { duracao: 'vezes', vezes: String(parcelas.total) } : { duracao: 'data', vezes: '' }
}

/** O número de vezes digitado, se for válido (1 a `MAX_VEZES`). */
export function lerVezes(r: RascunhoLancamento): number | null {
  const vezes = Number(r.vezes)
  return r.vezes.trim() && Number.isInteger(vezes) && vezes >= 1 && vezes <= MAX_VEZES ? vezes : null
}

/**
 * Troca o tipo mantendo a categoria só se ela for do novo tipo. Na transferência, a origem precisa ser uma conta
 * e o destino, outra conta (`contas` são os ids das contas ativas, na ordem do seletor).
 */
export function trocarTipo(
  r: RascunhoLancamento,
  tipo: TipoLancamento,
  tipoDaCategoria: TipoLancamento | undefined,
  contas: string[],
): RascunhoLancamento {
  const novo = { ...r, tipo, categoriaId: tipoDaCategoria === tipo ? r.categoriaId : '' }
  if (tipo !== 'transferencia') return novo
  const origem = contas.includes(r.caixaId) ? r.caixaId : (contas[0] ?? r.caixaId)
  const destino = r.caixaDestinoId && r.caixaDestinoId !== origem ? r.caixaDestinoId : contas.find((id) => id !== origem)
  return { ...novo, caixaId: origem, caixaDestinoId: destino ?? '' }
}

/**
 * Ao virar recorrente, um lançamento novo começa na data que estava escolhida. No mensal, o dia do mês é o dia do
 * começo (não há campo de dia separado).
 */
export function trocarRecorrencia(
  r: RascunhoLancamento,
  recorrencia: RascunhoLancamento['recorrencia'],
  novo: boolean,
  hoje: DataISO,
): RascunhoLancamento {
  const inicio = recorrencia !== 'unica' && novo && !r.inicio ? (r.data ?? hoje) : r.inicio
  return comInicio({ ...r, recorrencia }, inicio)
}

/** Muda o começo; no mensal, o dia do mês acompanha o dia do começo. */
export function comInicio(r: RascunhoLancamento, inicio: DataISO | undefined): RascunhoLancamento {
  return { ...r, inicio, ...(r.recorrencia === 'mensal' && inicio && { diaDoMes: String(Number(inicio.slice(8, 10))) }) }
}

function lerDiaDoMes(texto: string): number | null {
  const dia = Number(texto)
  return Number.isInteger(dia) && dia >= 1 && dia <= 31 ? dia : null
}

export function validarLancamento(r: RascunhoLancamento, categoriasValidas: Set<string>): ErrosLancamento {
  const erros: ErrosLancamento = {}
  if (!r.descricao.trim()) erros.descricao = 'Informe uma descrição.'
  if (r.valorCentavos <= 0) erros.valorCentavos = 'Informe um valor maior que zero.'
  if (r.tipo !== 'transferencia' && !categoriasValidas.has(r.categoriaId)) erros.categoriaId = 'Escolha uma categoria.'
  if (r.tipo === 'transferencia' && !r.caixaDestinoId) erros.caixaDestinoId = 'Escolha a conta que recebe.'
  if (r.tipo === 'transferencia' && r.caixaDestinoId && r.caixaDestinoId === r.caixaId) {
    erros.caixaDestinoId = 'Escolha uma conta diferente da de origem.'
  }
  if (r.recorrencia === 'unica' && !r.data) erros.data = 'Escolha a data.'
  if (r.recorrencia === 'semanal' && r.diasDaSemana.length === 0) {
    erros.diasDaSemana = 'Escolha pelo menos um dia da semana.'
  }
  if (r.recorrencia === 'mensal' && lerDiaDoMes(r.diaDoMes) === null) {
    erros.diaDoMes = 'Use um dia entre 1 e 31.'
  }
  if (r.recorrencia !== 'unica' && r.duracao === 'data' && !r.fim) erros.fim = 'Escolha até quando.'
  if (r.recorrencia !== 'unica' && r.duracao === 'data' && r.inicio && r.fim && r.fim < r.inicio) {
    erros.fim = 'O fim não pode ser antes do começo.'
  }
  if (r.recorrencia !== 'unica' && r.duracao === 'vezes') {
    if (!r.inicio) erros.inicio = 'Escolha quando começa, para contar as vezes.'
    if (lerVezes(r) === null) erros.vezes = `Use um número de 1 a ${MAX_VEZES}.`
  }
  return erros
}

/** Converte um rascunho já validado em lançamento. */
export function paraLancamento(r: RascunhoLancamento, id: string): Lancamento {
  const recorrencia: Recorrencia =
    r.recorrencia === 'unica'
      ? { tipo: 'unica', data: r.data! }
      : r.recorrencia === 'semanal'
        ? { tipo: 'semanal', diasDaSemana: [...new Set(r.diasDaSemana)].sort((a, b) => a - b) }
        : r.recorrencia === 'mensal'
          ? { tipo: 'mensal', diaDoMes: lerDiaDoMes(r.diaDoMes)! }
          : { tipo: 'diaria', apenasDiasUteis: r.apenasDiasUteis }

  const excecoes = r.recorrencia !== 'unica' && Object.keys(r.excecoes).length > 0 ? { excecoes: r.excecoes } : {}
  const transferencia = r.tipo === 'transferencia'
  const vezes = r.recorrencia !== 'unica' && r.duracao === 'vezes' ? lerVezes(r) : null
  const valorCentavos = vezes && r.valorEhTotal ? Math.round(r.valorCentavos / vezes) : r.valorCentavos

  const base: Lancamento = {
    id,
    caixaId: r.caixaId,
    ...(transferencia && { caixaDestinoId: r.caixaDestinoId }),
    descricao: r.descricao.trim(),
    tipo: r.tipo,
    valorCentavos,
    categoriaId: transferencia ? '' : r.categoriaId,
    ...(r.tipo === 'saida' && r.tagId && { tagId: r.tagId }),
    ...(r.pastaId && { pastaId: r.pastaId }),
    natureza: transferencia ? naturezaDaTransferencia(r.recorrencia) : r.natureza,
    recorrencia,
    ...excecoes,
  }
  if (r.recorrencia === 'unica') return base
  const comInicio = { ...base, inicio: r.inicio }
  const fim = r.duracao === 'data' ? r.fim : vezes ? fimDepoisDe(comInicio, vezes) : undefined
  return { ...comInicio, fim }
}

/** A transferência que se repete é um compromisso (fixa); a única, variável. */
export function naturezaDaTransferencia(recorrencia: Recorrencia['tipo']): Natureza {
  return recorrencia === 'unica' ? 'variavel' : 'fixa'
}
