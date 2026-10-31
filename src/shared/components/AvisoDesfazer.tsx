import { useEffect, useState } from 'react'
import { Check, Undo2, X } from '@/shared/ui/icones'
import { BOTAO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

/** Aviso do que acabou de mudar, com o "Desfazer" quando dá para voltar. */
export interface Aviso {
  /** Muda a cada ação, para o aviso reiniciar o tempo e ser anunciado de novo. */
  id: number
  mensagem: string
  onDesfazer?: () => void
}

interface AvisoDesfazerProps {
  aviso: Aviso | null
  onFechar: () => void
  /** Quanto tempo fica na tela; com o mouse ou o foco nele, espera. */
  duracao?: number
}

/**
 * Aviso flutuante preso embaixo (acima da barra de telas do celular), com "Desfazer" e ×; some sozinho depois de
 * `duracao`. O mesmo visual do aviso da seleção em lote.
 */
export function AvisoDesfazer({ aviso, onFechar, duracao = 8000 }: AvisoDesfazerProps) {
  const [pausado, setPausado] = useState(false)
  if (!aviso && pausado) setPausado(false)

  useEffect(() => {
    if (!aviso || pausado) return
    const id = window.setTimeout(onFechar, duracao)
    return () => window.clearTimeout(id)
  }, [aviso, pausado, duracao, onFechar])

  if (!aviso) return null

  return (
    <div
      key={aviso.id}
      role="status"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 border-2 border-contorno bg-card px-4 py-2 text-sm shadow-bloco-lg sm:left-auto sm:w-[30rem] lg:bottom-4"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPausado(false)}
    >
      <Check aria-hidden strokeWidth={3} className="size-6 shrink-0" />
      <p className="min-w-0 flex-1">{aviso.mensagem}</p>
      {aviso.onDesfazer && (
        <Button variant="outline" className={cn(BOTAO, 'h-8 px-3')} onClick={aviso.onDesfazer}>
          <Undo2 />
          Desfazer
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="-mr-2 rounded-full text-muted-foreground"
        aria-label="Fechar aviso"
        onClick={() => {
          setPausado(false)
          onFechar()
        }}
      >
        <X />
      </Button>
    </div>
  )
}
