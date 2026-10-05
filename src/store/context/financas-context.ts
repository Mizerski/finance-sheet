import { createContext, useContext, type Dispatch } from 'react'
import type { AcaoFinancas, EstadoFinancas } from '../reducer/financas-reducer'

export interface FinancasContexto {
  estado: EstadoFinancas
  dispatch: Dispatch<AcaoFinancas>
}

export const FinancasContext = createContext<FinancasContexto | null>(null)

export function useFinancas(): FinancasContexto {
  const contexto = useContext(FinancasContext)
  if (!contexto) throw new Error('useFinancas precisa estar dentro de <FinancasProvider>')
  return contexto
}
