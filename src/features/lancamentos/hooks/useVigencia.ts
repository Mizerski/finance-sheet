import { useState } from 'react'
import type { DataISO } from '@/shared/lib/datas'
import type { Lancamento } from '../model/lancamento'
import { paraLancamento, type RascunhoLancamento } from '../utils/formulario'
import { dividirEm, mudaOcorrencias, recorrenteEmAndamento, validarVigencia } from '../utils/vigencia'

export type Vigencia = 'daqui' | 'sempre'

/**
 * Num recorrente que já aconteceu, a pergunta "a mudança vale daqui para frente ou desde o início?" (menos quando o
 * início ou o fim mudou). Igual no formulário completo e na edição em passos do modo simples.
 */
export function useVigencia(lancamento: Lancamento | undefined, rascunho: RascunhoLancamento, hoje: DataISO) {
  const [vigencia, setVigencia] = useState<Vigencia>('daqui')
  const [aPartirDe, setAPartirDe] = useState<DataISO>(hoje)

  const editado = lancamento && paraLancamento(rascunho, lancamento.id)
  const perguntar =
    !!lancamento &&
    !!editado &&
    recorrenteEmAndamento(lancamento, hoje) &&
    editado.inicio === lancamento.inicio &&
    editado.fim === lancamento.fim &&
    mudaOcorrencias(lancamento, editado)
  /** Original que termina na véspera de `aPartirDe`, quando a mudança vale daqui para frente. */
  const dividirDe = perguntar && vigencia === 'daqui' ? lancamento : undefined
  const erro = dividirDe ? validarVigencia(dividirDe, aPartirDe) : undefined

  /** O que vai ser salvo (o editado, ou o original encerrado e o novo a partir da data); null com a data errada. */
  function salvos(novoId: string): Lancamento[] | null {
    if (dividirDe && editado) return erro ? null : dividirEm(dividirDe, editado, aPartirDe, novoId)
    return [editado ?? paraLancamento(rascunho, novoId)]
  }

  return { perguntar, vigencia, setVigencia, aPartirDe, setAPartirDe, erro, salvos }
}

export type VigenciaEstado = ReturnType<typeof useVigencia>
