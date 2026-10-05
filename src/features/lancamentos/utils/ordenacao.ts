import { CATEGORIA_DESCONHECIDA, type Categoria } from '@/features/categorias/model/categoria'
import type { Tag } from '@/features/tags/model/tag'
import type { Lancamento, Recorrencia } from '../model/lancamento'

/** Colunas da tabela de lançamentos que reorganizam a lista ao clicar no cabeçalho. */
export const CAMPOS_ORDEM = ['descricao', 'categoria', 'tag', 'natureza', 'recorrencia', 'valor'] as const
export type CampoOrdem = (typeof CAMPOS_ORDEM)[number]

export type Direcao = 'asc' | 'desc'

/** Na URL (`?ordem=`): o campo, com "-" na frente quando é decrescente (ex.: `-valor`). */
export type TextoOrdem = CampoOrdem | `-${CampoOrdem}`

export interface Ordem {
  campo: CampoOrdem
  direcao: Direcao
}

export function lerOrdem(texto: TextoOrdem | undefined): Ordem | null {
  if (!texto) return null
  const desc = texto.startsWith('-')
  return { campo: (desc ? texto.slice(1) : texto) as CampoOrdem, direcao: desc ? 'desc' : 'asc' }
}

export function validarOrdem(valor: unknown): TextoOrdem | undefined {
  if (typeof valor !== 'string') return undefined
  const campo = valor.startsWith('-') ? valor.slice(1) : valor
  return (CAMPOS_ORDEM as readonly string[]).includes(campo) ? (valor as TextoOrdem) : undefined
}

/** Valor começa do maior; o resto, de A a Z. */
const PRIMEIRA_DIRECAO: Record<CampoOrdem, Direcao> = {
  descricao: 'asc',
  categoria: 'asc',
  tag: 'asc',
  natureza: 'asc',
  recorrencia: 'asc',
  valor: 'desc',
}

/** Clicar na mesma coluna alterna a direção e, na terceira vez, volta à ordem padrão. */
export function proximaOrdem(atual: Ordem | null, campo: CampoOrdem): TextoOrdem | undefined {
  const primeira = PRIMEIRA_DIRECAO[campo]
  const direcao = atual?.campo !== campo ? primeira : atual.direcao === primeira ? (primeira === 'asc' ? 'desc' : 'asc') : null
  if (!direcao) return undefined
  return direcao === 'desc' ? `-${campo}` : campo
}

const COLLATOR = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

/** Mesma ordem das opções do formulário: única (pela data), semanal, mensal (pelo dia) e diária. */
const ORDEM_RECORRENCIA: Record<Recorrencia['tipo'], number> = { unica: 0, semanal: 1, mensal: 2, diaria: 3 }

function compararRecorrencia(a: Recorrencia, b: Recorrencia): number {
  if (a.tipo !== b.tipo) return ORDEM_RECORRENCIA[a.tipo] - ORDEM_RECORRENCIA[b.tipo]
  if (a.tipo === 'unica' && b.tipo === 'unica') return a.data.localeCompare(b.data)
  if (a.tipo === 'mensal' && b.tipo === 'mensal') return a.diaDoMes - b.diaDoMes
  if (a.tipo === 'semanal' && b.tipo === 'semanal') return (a.diasDaSemana[0] ?? 0) - (b.diasDaSemana[0] ?? 0)
  if (a.tipo === 'diaria' && b.tipo === 'diaria') return Number(a.apenasDiasUteis) - Number(b.apenasDiasUteis)
  return 0
}

/**
 * Reorganiza a lista pela coluna escolhida. Empates mantêm a ordem padrão (a ordenação é estável),
 * e saídas sem tag ficam sempre no fim, nas duas direções.
 */
export function ordenarLancamentos(
  lista: Lancamento[],
  ordem: Ordem | null,
  categorias: Map<string, Categoria>,
  tags: Map<string, Tag>,
): Lancamento[] {
  if (!ordem) return lista
  const sinal = ordem.direcao === 'asc' ? 1 : -1
  const nomeCategoria = (l: Lancamento) => (categorias.get(l.categoriaId) ?? CATEGORIA_DESCONHECIDA).nome
  const nomeTag = (l: Lancamento) => (l.tagId ? tags.get(l.tagId)?.nome : undefined)

  const comparar = (a: Lancamento, b: Lancamento): number => {
    switch (ordem.campo) {
      case 'descricao':
        return sinal * COLLATOR.compare(a.descricao, b.descricao)
      case 'categoria':
        return sinal * COLLATOR.compare(nomeCategoria(a), nomeCategoria(b))
      case 'tag': {
        const ta = nomeTag(a)
        const tb = nomeTag(b)
        if (!ta || !tb) return ta ? -1 : tb ? 1 : 0
        return sinal * COLLATOR.compare(ta, tb)
      }
      case 'natureza':
        return sinal * (a.natureza === b.natureza ? 0 : a.natureza === 'fixa' ? -1 : 1)
      case 'recorrencia':
        return sinal * compararRecorrencia(a.recorrencia, b.recorrencia)
      case 'valor':
        return sinal * (a.valorCentavos - b.valorCentavos)
    }
  }
  return [...lista].sort(comparar)
}
