import { useEffect, useRef, useState } from 'react'
import { traduzirErro } from '@/shared/lib/erros'
import { buscarAtualizacao, instalarAtualizacao, type Atualizacao } from './atualizador'

export type EstadoAtualizacao =
  | { etapa: 'nenhuma' }
  | { etapa: 'disponivel'; versao: string }
  | { etapa: 'baixando'; versao: string; progresso: number | null }
  | { etapa: 'erro'; versao: string; mensagem: string }

/** Confere uma vez, ao abrir o app, se há versão nova. Fora do app instalado (dev) não confere. */
export function useAtualizacao() {
  const [estado, setEstado] = useState<EstadoAtualizacao>({ etapa: 'nenhuma' })
  const atualizacao = useRef<Atualizacao | null>(null)

  useEffect(() => {
    if (import.meta.env.DEV) return
    let ativo = true
    buscarAtualizacao().then((encontrada) => {
      if (!ativo || !encontrada) return
      atualizacao.current = encontrada
      setEstado({ etapa: 'disponivel', versao: encontrada.version })
    })
    return () => {
      ativo = false
    }
  }, [])

  async function instalar() {
    const encontrada = atualizacao.current
    if (!encontrada) return
    const versao = encontrada.version
    setEstado({ etapa: 'baixando', versao, progresso: null })
    try {
      await instalarAtualizacao(encontrada, (progresso) => setEstado({ etapa: 'baixando', versao, progresso }))
    } catch (erro) {
      setEstado({ etapa: 'erro', versao, mensagem: traduzirErro(erro) })
    }
  }

  function adiar() {
    setEstado({ etapa: 'nenhuma' })
  }

  return { estado, instalar, adiar }
}
