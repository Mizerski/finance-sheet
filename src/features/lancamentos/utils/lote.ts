import type { Caixa } from '@/features/caixas/model/caixa'
import type { Categoria } from '@/features/categorias/model/categoria'
import type { Pasta } from '@/features/pastas/model/pasta'
import type { Tag } from '@/features/tags/model/tag'
import { ehTransferencia, type Lancamento } from '../model/lancamento'

/** Uma mudança aplicada a vários lançamentos de uma vez (id ausente = tirar a tag ou a pasta). */
export type AlteracaoLote =
  | { campo: 'categoria'; id: string }
  | { campo: 'tag'; id?: string }
  | { campo: 'pasta'; id?: string }
  | { campo: 'caixa'; id: string }

export interface ResultadoLote {
  /** Só os que mudaram, já com a mudança. */
  alterados: Lancamento[]
  /** Os mesmos lançamentos antes da mudança, para desfazer. */
  anteriores: Lancamento[]
  /** Os que não podem receber a mudança (categoria de outro tipo, tag numa entrada). */
  ignorados: number
  /** Frase curta para o aviso depois de aplicar. */
  mensagem: string
}

interface Nomes {
  categorias: Categoria[]
  tags: Tag[]
  pastas: Pasta[]
  caixas: Caixa[]
}

function contar(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`
}

/** Sem a tag ou sem a pasta (campos opcionais: ausente = nenhuma). */
function semCampo(l: Lancamento, campo: 'tagId' | 'pastaId'): Lancamento {
  const copia = { ...l }
  delete copia[campo]
  return copia
}

/** Aplica a mudança aos selecionados que podem recebê-la e diz o que aconteceu, em linguagem simples. */
export function aplicarEmLote(selecionados: Lancamento[], alteracao: AlteracaoLote, nomes: Nomes): ResultadoLote {
  let aptos = selecionados
  let mudar: (l: Lancamento) => Lancamento
  let feito: (n: number) => string
  let porque = ''

  switch (alteracao.campo) {
    case 'categoria': {
      const categoria = nomes.categorias.find((c) => c.id === alteracao.id)!
      aptos = selecionados.filter((l) => l.tipo === categoria.tipo)
      mudar = (l) => ({ ...l, categoriaId: categoria.id })
      feito = (n) => `Categoria ${categoria.nome} em ${contar(n, 'lançamento', 'lançamentos')}.`
      porque = categoria.tipo === 'saida' ? 'a categoria é de saída' : 'a categoria é de entrada'
      break
    }
    case 'tag': {
      const tag = nomes.tags.find((t) => t.id === alteracao.id)
      aptos = selecionados.filter((l) => l.tipo === 'saida')
      mudar = (l) => (tag ? { ...l, tagId: tag.id } : semCampo(l, 'tagId'))
      feito = (n) => (tag ? `Tag ${tag.nome} em ${contar(n, 'saída', 'saídas')}.` : `Tag tirada de ${contar(n, 'saída', 'saídas')}.`)
      porque = 'entradas não têm tag'
      break
    }
    case 'pasta': {
      const pasta = nomes.pastas.find((p) => p.id === alteracao.id)
      mudar = (l) => (pasta ? { ...l, pastaId: pasta.id } : semCampo(l, 'pastaId'))
      feito = (n) =>
        pasta
          ? `${contar(n, 'lançamento movido', 'lançamentos movidos')} para a pasta ${pasta.nome}.`
          : `${contar(n, 'lançamento tirado', 'lançamentos tirados')} da pasta.`
      break
    }
    case 'caixa': {
      const caixa = nomes.caixas.find((c) => c.id === alteracao.id)!
      aptos = selecionados.filter((l) => !ehTransferencia(l) || (caixa.tipo === 'conta' && l.caixaDestinoId !== caixa.id))
      mudar = (l) => ({ ...l, caixaId: caixa.id })
      porque =
        caixa.tipo === 'conta' ? `já são transferências para ${caixa.nome}` : 'transferência é só entre contas'
      feito = (n) => `${contar(n, 'lançamento movido', 'lançamentos movidos')} para ${caixa.nome}.`
      break
    }
  }

  const anteriores: Lancamento[] = []
  const alterados: Lancamento[] = []
  for (const l of aptos) {
    const novo = mudar(l)
    if (JSON.stringify(novo) === JSON.stringify(l)) continue
    anteriores.push(l)
    alterados.push(novo)
  }
  const ignorados = selecionados.length - aptos.length

  let mensagem =
    alterados.length > 0
      ? feito(alterados.length)
      : aptos.length > 0
        ? `Nada mudou: ${aptos.length === 1 ? 'ele já estava' : `os ${aptos.length} já estavam`} assim.`
        : 'Nada mudou.'
  if (ignorados > 0) mensagem += ` ${contar(ignorados, 'ficou como estava', 'ficaram como estavam')}: ${porque}.`

  return { alterados, anteriores, ignorados, mensagem }
}
