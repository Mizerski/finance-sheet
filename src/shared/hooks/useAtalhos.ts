import { useEffect, useRef } from 'react'

/** Tecla (`KeyboardEvent.key`, letras em minúsculas) → ação. */
export type MapaAtalhos = Partial<Record<string, () => void>>

/** Não rouba teclas de quem está digitando, de combinações do sistema nem de dialogs e popovers abertos. */
function ignorar(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return true
  const alvo = e.target instanceof HTMLElement ? e.target : null
  if (alvo?.closest('input, textarea, select, [contenteditable="true"], [role=radiogroup]')) return true
  return document.querySelector('[role=dialog], [role=listbox], [role=menu]') !== null
}

/**
 * Atalhos de teclado enquanto o componente está montado e `ativo`
 * (ex.: uma página que continua na tela enquanto a próxima carrega passa false).
 */
export function useAtalhos(mapa: MapaAtalhos, ativo = true) {
  const atual = useRef<MapaAtalhos>({})
  useEffect(() => {
    atual.current = ativo ? mapa : {}
  })

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (ignorar(e)) return
      const acao = atual.current[e.key.length === 1 ? e.key.toLowerCase() : e.key]
      if (!acao) return
      e.preventDefault()
      acao()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])
}
