import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { TelaCentralizada } from '@/shared/components/TelaCentralizada'
import { supabase } from '@/shared/lib/supabase'
import { SupabaseNaoConfigurado } from './components/SupabaseNaoConfigurado'
import { TelaEntrar } from './components/TelaEntrar'
import { SessaoContext } from './sessao-context'

/** Só mostra o app para quem está logado; antes disso, a tela de entrar. */
export function PortaoAutenticacao({ children }: { children: ReactNode }) {
  if (!supabase) return <SupabaseNaoConfigurado />
  return <ComSupabase supabase={supabase}>{children}</ComSupabase>
}

function ComSupabase({ supabase, children }: { supabase: SupabaseClient; children: ReactNode }) {
  // undefined = ainda verificando se há sessão salva.
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    // Dispara na hora com a sessão salva (INITIAL_SESSION) e depois a cada login, logout ou renovação.
    const { data } = supabase.auth.onAuthStateChange((_evento, nova) => setSessao(nova))
    return () => data.subscription.unsubscribe()
  }, [supabase])

  const usuario = sessao?.user
  const valor = useMemo(
    () => usuario && { supabase, usuario, sair: async () => void (await supabase.auth.signOut()) },
    [supabase, usuario],
  )

  if (sessao === undefined) return <TelaCentralizada titulo="Carregando…" />
  if (!valor) return <TelaEntrar supabase={supabase} />
  return <SessaoContext value={valor}>{children}</SessaoContext>
}
