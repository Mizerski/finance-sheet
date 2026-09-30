import { RouterProvider } from '@tanstack/react-router'
import { AvisoAtualizacao } from '@/features/atualizacao/components/AvisoAtualizacao'
import { criarArmazenamentoLocal } from '@/store/armazenamento-local'
import { FinancasProvider } from '@/store/FinancasProvider'
import { router } from '../router'

const armazenamento = criarArmazenamentoLocal()

/** Desktop: sem login, dados num arquivo no computador. */
export function RaizDesktop() {
  return (
    <FinancasProvider armazenamento={armazenamento}>
      <RouterProvider router={router} />
      <AvisoAtualizacao />
    </FinancasProvider>
  )
}
