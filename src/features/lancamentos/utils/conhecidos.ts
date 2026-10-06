import type { Lancamento, Natureza, TipoLancamento } from '../model/lancamento'
import type { RascunhoLancamento } from './formulario'

/**
 * Um "lugar conhecido": uma descrição que já foi lançada, com o jeito da última vez (tipo, categoria, tag, pasta,
 * conta e valor). Serve de modelo para lançar de novo sem preencher tudo. Não é salvo: sai dos próprios lançamentos.
 */
export interface Conhecido {
  chave: string
  descricao: string
  tipo: TipoLancamento
  categoriaId: string
  tagId: string
  pastaId: string
  caixaId: string
  caixaDestinoId: string
  natureza: Natureza
  valorCentavos: number
  /** Quantas vezes essa descrição foi cadastrada. */
  usos: number
}

/** Descrição sem maiúsculas, acentos e espaços repetidos, para "Mercado" e "mercado " serem o mesmo lugar. */
export function chaveDe(descricao: string): string {
  return descricao
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Os lugares conhecidos, do mais usado ao menos (empate: o mais recente primeiro); cada um com a última vez. */
export function lugaresConhecidos(lancamentos: readonly Lancamento[]): Conhecido[] {
  const porChave = new Map<string, Conhecido & { ordem: number }>()
  lancamentos.forEach((l, ordem) => {
    const chave = chaveDe(l.descricao)
    if (!chave) return
    const usos = (porChave.get(chave)?.usos ?? 0) + 1
    porChave.set(chave, {
      chave,
      descricao: l.descricao.trim(),
      tipo: l.tipo,
      categoriaId: l.categoriaId,
      tagId: l.tagId ?? '',
      pastaId: l.pastaId ?? '',
      caixaId: l.caixaId,
      caixaDestinoId: l.caixaDestinoId ?? '',
      natureza: l.natureza,
      valorCentavos: l.valorCentavos,
      usos,
      ordem,
    })
  })
  return [...porChave.values()].sort((a, b) => b.usos - a.usos || b.ordem - a.ordem)
}

/**
 * O lugar conhecido que combina com o que está sendo digitado: o mesmo nome ou, a partir de 3 letras, o mais usado
 * que começa assim. Nada se o rascunho já está igual a ele (a sugestão já foi usada).
 */
export function conhecidoPara(conhecidos: readonly Conhecido[], r: RascunhoLancamento): Conhecido | undefined {
  const chave = chaveDe(r.descricao)
  if (chave.length < 2) return undefined
  const achado =
    conhecidos.find((c) => c.chave === chave) ?? (chave.length >= 3 ? conhecidos.find((c) => c.chave.startsWith(chave)) : undefined)
  if (!achado) return undefined
  const jaUsado =
    achado.tipo === r.tipo &&
    achado.categoriaId === r.categoriaId &&
    achado.tagId === r.tagId &&
    achado.caixaId === r.caixaId &&
    chaveDe(achado.descricao) === chave
  return jaUsado ? undefined : achado
}

/**
 * Preenche o rascunho como da última vez; o valor só entra se ainda não foi digitado. Uma conta que não está mais
 * ativa (`contaAtiva` falso) não volta: fica a do rascunho.
 */
export function aplicarConhecido(
  r: RascunhoLancamento,
  c: Conhecido,
  contaAtiva: (caixaId: string) => boolean,
): RascunhoLancamento {
  return {
    ...r,
    descricao: c.descricao,
    tipo: c.tipo,
    categoriaId: c.categoriaId,
    tagId: c.tipo === 'saida' ? c.tagId : '',
    pastaId: c.pastaId,
    caixaId: contaAtiva(c.caixaId) ? c.caixaId : r.caixaId,
    caixaDestinoId: c.caixaDestinoId && contaAtiva(c.caixaDestinoId) ? c.caixaDestinoId : r.caixaDestinoId,
    natureza: c.natureza,
    valorCentavos: r.valorCentavos > 0 ? r.valorCentavos : c.valorCentavos,
  }
}
