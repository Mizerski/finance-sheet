import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { EH_DESKTOP } from '@/shared/lib/plataforma'
import './index.css'

/** Cada versão carrega só o que usa: a web não inclui o Tauri, e o desktop não inclui o Supabase. */
const Raiz = EH_DESKTOP
  ? (await import('@/app/raiz/RaizDesktop')).RaizDesktop
  : (await import('@/app/raiz/RaizWeb')).RaizWeb

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Raiz />
  </StrictMode>,
)
