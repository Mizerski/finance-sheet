import { useMemo, type ReactNode } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { PortaoAutenticacao } from '@/features/autenticacao/PortaoAutenticacao'
import { useSessao } from '@/features/autenticacao/sessao-context'
import { criarArmazenamentoSupabase } from '@/store/armazenamento-supabase'
import { FinancasProvider } from '@/store/FinancasProvider'
import { router } from '../router'

/** Web: login por e-mail e dados no Supabase. */
export function RaizWeb() {
  return (
    <PortaoAutenticacao>
      <FinancasDaSessao>
        <RouterProvider router={router} />
      </FinancasDaSessao>
    </PortaoAutenticacao>
  )
}

function FinancasDaSessao({ children }: { children: ReactNode }) {
  const { supabase, usuario } = useSessao()
  const armazenamento = useMemo(() => criarArmazenamentoSupabase(supabase, usuario.id), [supabase, usuario.id])
  return <FinancasProvider armazenamento={armazenamento}>{children}</FinancasProvider>
}
