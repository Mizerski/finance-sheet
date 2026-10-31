import { useCallback, useEffect, useRef, useState, type PointerEvent as EventoPonteiro } from 'react'
import type { DataISO } from '@/shared/lib/datas'

/** Quanto tempo segurar uma linha de dia até "pegar" o dia, em milissegundos. */
export const TEMPO_SEGURAR = 600

/** Quanto o ponteiro pode mexer enquanto segura; passou disso, é rolagem ou seleção, não o gesto. */
const TOLERANCIA_PX = 8

/** Distância da borda da janela em que a página rola sozinha durante o arraste; embaixo, acima da barra do celular. */
const BORDA_ROLAGEM = { cima: 96, baixo: 112 }

/** Pixels rolados por quadro perto da borda. */
const PASSO_ROLAGEM = 14

/** O que o dia pego leva: quantos lançamentos e o efeito deles no saldo. */
export interface ResumoArraste {
  quantos: number
  centavos: number
}

/** Segurando (enchendo a linha) ou arrastando (o dia já foi pego), com o destino sob o ponteiro. */
export interface EstadoArraste {
  fase: 'segurando' | 'arrastando'
  de: DataISO
  resumo: ResumoArraste
  /** Linha válida sob o ponteiro (no cálculo e diferente da de origem). */
  destino?: DataISO
  /** Onde o ponteiro estava ao pegar, para a etiqueta nascer no lugar. */
  inicio: { x: number; y: number }
  toque: boolean
}

/** Papel de uma linha no gesto, para o visual dela. */
export type PapelNoArraste = 'segurando' | 'origem' | 'destino'

/** O dia que está sendo segurado ou arrastado, o destino sob o ponteiro ou nada. */
export function papelNoArraste(arraste: EstadoArraste | null, data: DataISO): PapelNoArraste | undefined {
  if (!arraste) return undefined
  if (arraste.de === data) return arraste.fase === 'segurando' ? 'segurando' : 'origem'
  return arraste.destino === data ? 'destino' : undefined
}

interface OpcoesArrastarDia {
  /** O que o dia levaria; null quando não há nada para levar (o dia não pode ser pego). */
  resumir: (data: DataISO) => ResumoArraste | null
  aoSoltar: (de: DataISO, para: DataISO) => void
}

/** Depois de soltar, o clique que o navegador ainda manda não abre o popover da linha. */
function engolirProximoClique() {
  const engolir = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }
  window.addEventListener('click', engolir, { capture: true, once: true })
  window.setTimeout(() => window.removeEventListener('click', engolir, { capture: true }), 0)
}

/**
 * `area` vai no contêiner das tabelas: lá o toque não rola a página enquanto o dia está pego (o ouvinte precisa existir
 * antes do dedo encostar para o navegador deixar cancelar a rolagem).
 *
 * Segurar uma linha de dia (`data-dia`, com `data-no-calculo` quando entra no cálculo) por `TEMPO_SEGURAR` pega o dia;
 * soltar sobre outra linha válida chama `aoSoltar`. Mexer antes do tempo, Esc ou soltar fora cancelam.
 */
export function useArrastarDia({ resumir, aoSoltar }: OpcoesArrastarDia) {
  const [arraste, setArraste] = useState<EstadoArraste | null>(null)
  const opcoes = useRef({ resumir, aoSoltar })
  const encerrar = useRef<(() => void) | null>(null)
  const arrastando = useRef(false)
  const area = useRef<HTMLDivElement>(null)

  useEffect(() => {
    opcoes.current = { resumir, aoSoltar }
  })

  useEffect(() => () => encerrar.current?.(), [])

  useEffect(() => {
    const el = area.current
    if (!el) return
    const segurarToque = (ev: TouchEvent) => {
      if (arrastando.current && ev.cancelable) ev.preventDefault()
    }
    el.addEventListener('touchmove', segurarToque, { passive: false })
    return () => el.removeEventListener('touchmove', segurarToque)
  }, [])

  const iniciar = useCallback((e: EventoPonteiro, dia: { data: DataISO; noCalculo: boolean }) => {
    if (e.button !== 0 || !e.isPrimary || !dia.noCalculo || encerrar.current) return
    const resumo = opcoes.current.resumir(dia.data)
    if (!resumo) return

    const id = e.pointerId
    const toque = e.pointerType !== 'mouse'
    const inicio = { x: e.clientX, y: e.clientY }
    const ponteiro = { ...inicio }
    let fase: EstadoArraste['fase'] = 'segurando'
    let destino: DataISO | undefined
    let quadro = 0
    const selecaoAntes = document.body.style.userSelect
    document.body.style.userSelect = 'none'

    const acharDestino = () => {
      const linha = document.elementFromPoint(ponteiro.x, ponteiro.y)?.closest<HTMLElement>('[data-dia]')
      const data = linha?.dataset.dia
      const novo = data && data !== dia.data && linha.dataset.noCalculo !== undefined ? data : undefined
      if (novo === destino) return
      destino = novo
      setArraste((a) => a && { ...a, destino: novo })
    }

    const acompanhar = () => {
      const passo =
        ponteiro.y < BORDA_ROLAGEM.cima
          ? -PASSO_ROLAGEM
          : ponteiro.y > window.innerHeight - BORDA_ROLAGEM.baixo
            ? PASSO_ROLAGEM
            : 0
      if (passo) window.scrollBy(0, passo)
      acharDestino()
      quadro = requestAnimationFrame(acompanhar)
    }

    const pegar = () => {
      fase = 'arrastando'
      arrastando.current = true
      setArraste({ fase, de: dia.data, resumo, inicio: { ...ponteiro }, toque })
      if (toque) navigator.vibrate?.(15)
      quadro = requestAnimationFrame(acompanhar)
    }

    const mover = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return
      ponteiro.x = ev.clientX
      ponteiro.y = ev.clientY
      if (fase === 'segurando' && Math.hypot(ponteiro.x - inicio.x, ponteiro.y - inicio.y) > TOLERANCIA_PX) fim()
    }

    const soltar = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return
      const pego = fase === 'arrastando'
      const para = destino
      fim()
      if (!pego) return
      engolirProximoClique()
      if (para) opcoes.current.aoSoltar(dia.data, para)
    }

    const cancelar = (ev: PointerEvent) => {
      if (ev.pointerId === id) fim()
    }

    const teclar = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape') return
      ev.preventDefault()
      ev.stopPropagation()
      if (fase === 'arrastando') window.addEventListener('pointerup', engolirProximoClique, { once: true })
      fim()
    }

    const semMenu = (ev: Event) => ev.preventDefault()

    const relogio = window.setTimeout(pegar, TEMPO_SEGURAR)
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', cancelar)
    window.addEventListener('keydown', teclar, { capture: true })
    window.addEventListener('contextmenu', semMenu)

    function fim() {
      window.clearTimeout(relogio)
      cancelAnimationFrame(quadro)
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', cancelar)
      window.removeEventListener('keydown', teclar, { capture: true })
      window.removeEventListener('contextmenu', semMenu)
      document.body.style.userSelect = selecaoAntes
      arrastando.current = false
      encerrar.current = null
      setArraste(null)
    }

    encerrar.current = fim
    setArraste({ fase, de: dia.data, resumo, inicio, toque })
  }, [])

  return { arraste, iniciar, area }
}
