import { somarDias, type DataISO } from '@/shared/lib/datas'
import type { Lancamento } from './lancamento'

/*
 * Mudar ou excluir um lançamento recorrente vale para todas as ocorrências, inclusive as que já passaram.
 * Para preservar o histórico, a mudança pode valer só a partir de uma data: o lançamento antigo termina
 * na véspera e a versão nova começa nela.
 */

/** Recorrente que já aconteceu antes de `hoje` e ainda não terminou. */
export function recorrenteEmAndamento(l: Lancamento, hoje: DataISO): boolean {
  return l.recorrencia.tipo !== 'unica' && (!l.inicio || l.inicio < hoje) && (!l.fim || l.fim >= hoje)
}

/** A edição muda o valor, as datas, as contas ou a classificação das ocorrências (não só o nome ou a pasta). */
export function mudaOcorrencias(original: Lancamento, editado: Lancamento): boolean {
  return (
    original.tipo !== editado.tipo ||
    original.caixaId !== editado.caixaId ||
    (original.caixaDestinoId ?? '') !== (editado.caixaDestinoId ?? '') ||
    original.valorCentavos !== editado.valorCentavos ||
    original.categoriaId !== editado.categoriaId ||
    (original.tagId ?? '') !== (editado.tagId ?? '') ||
    original.natureza !== editado.natureza ||
    JSON.stringify(original.recorrencia) !== JSON.stringify(editado.recorrencia)
  )
}

/** Erro de uma data de vigência que cai depois do fim do lançamento original. */
export function validarVigencia(original: Lancamento, aPartirDe: DataISO): string | undefined {
  if (original.fim && aPartirDe > original.fim) return 'Escolha uma data até o fim deste lançamento.'
}

/**
 * Aplica a edição só a partir de `aPartirDe`: o original termina na véspera e a versão editada
 * (com `novoId`) começa nesse dia. Se a data não passa do início do original, vale a edição inteira.
 */
export function dividirEm(original: Lancamento, editado: Lancamento, aPartirDe: DataISO, novoId: string): Lancamento[] {
  if (original.inicio && aPartirDe <= original.inicio) return [editado]
  const antigo = { ...original, fim: somarDias(aPartirDe, -1) }
  const novo = editado.recorrencia.tipo === 'unica' ? { ...editado, id: novoId } : { ...editado, id: novoId, inicio: aPartirDe }
  return [antigo, novo]
}

/** Para de acontecer a partir de `hoje`, mantendo as ocorrências que já passaram. */
export function encerrar(l: Lancamento, hoje: DataISO): Lancamento {
  return { ...l, fim: somarDias(hoje, -1) }
}
