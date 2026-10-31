import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatarDiaMes } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import type { EstadoArraste } from '../hooks/useArrastarDia'

/** Distância da etiqueta ao ponteiro: ao lado do mouse; no toque, acima do dedo, para não ficar escondida. */
const DESLOCAMENTO = { mouse: { x: 16, y: 16 }, toque: { x: -24, y: -88 } }

/**
 * Etiqueta que segue o ponteiro com o dia pego ("3 lançamentos · − R$ 2.789,00") e para onde vai.
 * Acompanha o ponteiro sozinha, para a planilha não renderizar a cada movimento.
 */
export function EtiquetaArraste({ arraste }: { arraste: EstadoArraste }) {
  const [posicao, setPosicao] = useState(arraste.inicio)

  useEffect(() => {
    const mover = (e: PointerEvent) => setPosicao({ x: e.clientX, y: e.clientY })
    window.addEventListener('pointermove', mover)
    return () => window.removeEventListener('pointermove', mover)
  }, [])

  const { quantos, centavos } = arraste.resumo
  const deslocamento = arraste.toque ? DESLOCAMENTO.toque : DESLOCAMENTO.mouse
  const sinal = centavos > 0 ? '+' : centavos < 0 ? '−' : ''
  const cor = centavos > 0 ? 'text-entrada' : centavos < 0 ? 'text-saida' : 'text-foreground'

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-50 flex items-stretch border-2 border-contorno bg-card shadow-bloco-lg"
      style={{ transform: `translate(${posicao.x + deslocamento.x}px, ${posicao.y + deslocamento.y}px)` }}
    >
      <span className="flex items-center border-r-2 border-contorno bg-amarelo px-3 font-heading text-2xl leading-none font-bold text-tinta tabular-nums">
        {quantos}
      </span>
      <span className="flex flex-col gap-1 px-3 py-2">
        <span className="text-sm whitespace-nowrap">
          {quantos === 1 ? 'lançamento' : 'lançamentos'}
          {sinal && (
            <>
              {' · '}
              <span className={cn('font-semibold tabular-nums', cor)}>
                {sinal} {formatarBRL(Math.abs(centavos))}
              </span>
            </>
          )}
        </span>
        <span className={cn(ROTULO, 'whitespace-nowrap text-muted-foreground')}>
          {arraste.destino ? `Soltar em ${formatarDiaMes(arraste.destino)}` : `De ${formatarDiaMes(arraste.de)} · solte num dia`}
        </span>
      </span>
    </div>,
    document.body,
  )
}
