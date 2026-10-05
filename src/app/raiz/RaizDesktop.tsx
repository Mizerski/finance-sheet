import { RouterProvider } from '@tanstack/react-router'
import { AssistenteProvider } from '@/features/assistente/context/AssistenteProvider'
import { AvisoAtualizacao } from '@/features/atualizacao/components/AvisoAtualizacao'
import { criarArmazenamentoLocal } from '@/store/repositorio/armazenamento-local'
import { FinancasProvider } from '@/store/context/FinancasProvider'
import { router } from '../router'

const armazenamento = criarArmazenamentoLocal()

/** Desktop: sem login, dados num arquivo no computador, e o assistente com IA local. */
export function RaizDesktop() {
  return (
    <FinancasProvider armazenamento={armazenamento}>
      <AssistenteProvider>
        <RouterProvider router={router} />
        <AvisoAtualizacao />
      </AssistenteProvider>
    </FinancasProvider>
  )
}
