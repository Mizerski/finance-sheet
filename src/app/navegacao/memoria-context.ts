import { createContext, useContext } from 'react'

/** Parâmetros de busca que uma tela tinha na última visita (filtros, mês, período…). */
export type BuscaSalva = Record<string, unknown>

export interface MemoriaNavegacao {
  /** Busca para voltar a uma rota como ela estava; `{}` se ainda não foi visitada. */
  buscaPara: (rota: string) => BuscaSalva
}

export const MemoriaNavegacaoContext = createContext<MemoriaNavegacao | null>(null)

export function useMemoriaNavegacao(): MemoriaNavegacao {
  const contexto = useContext(MemoriaNavegacaoContext)
  if (!contexto) throw new Error('useMemoriaNavegacao precisa estar dentro de <MemoriaNavegacaoProvider>')
  return contexto
}
