import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/app/router'
import { PortaoAutenticacao } from '@/features/autenticacao/PortaoAutenticacao'
import { FinancasProvider } from '@/store/FinancasProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PortaoAutenticacao>
      <FinancasProvider>
        <RouterProvider router={router} />
      </FinancasProvider>
    </PortaoAutenticacao>
  </StrictMode>,
)
