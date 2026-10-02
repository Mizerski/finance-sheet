import { useEffect, useRef } from 'react'
import { useEscolherCaixa, useVisao } from './useVisao'

/** Alt+0 volta para o Total; Alt+1…9 escolhe o caixa nessa posição. Use uma vez, no layout. */
export function useAtalhosDeCaixa() {
  const { caixas } = useVisao()
  const escolher = useEscolherCaixa()
  const atual = useRef({ caixas, escolher })
  useEffect(() => {
    atual.current = { caixas, escolher }
  })

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !/^Digit\d$/.test(e.code)) return
      const { caixas, escolher } = atual.current
      if (caixas.length < 2) return
      // Não muda a tela por trás de um dialog aberto nem de quem está digitando.
      const alvo = e.target instanceof HTMLElement ? e.target : null
      if (alvo?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('[role=dialog]')) return
      const n = Number(e.code.slice(5))
      if (n > caixas.length) return
      e.preventDefault()
      escolher(n === 0 ? null : caixas[n - 1].id)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])
}
