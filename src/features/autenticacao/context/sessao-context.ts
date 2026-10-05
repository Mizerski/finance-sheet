import { createContext, useContext } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export interface Sessao {
  supabase: SupabaseClient
  usuario: User
  sair: () => Promise<void>
}

export const SessaoContext = createContext<Sessao | null>(null)

export function useSessao(): Sessao {
  const sessao = useContext(SessaoContext)
  if (!sessao) throw new Error('useSessao precisa estar dentro de <PortaoAutenticacao>')
  return sessao
}
