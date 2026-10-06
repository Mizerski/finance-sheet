import type { ReactNode } from 'react'
import { BOTAO, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Sparkles } from '@/shared/ui/icones'

interface CaixaSugestaoProps {
  /** Pergunta ou assunto em caixa alta ("Já lançado antes"). */
  titulo: string
  /** Texto do botão; sem ele, "Usar". */
  rotuloUsar?: string
  onUsar: () => void
  className?: string
  children: ReactNode
}

/**
 * Uma sugestão que a pessoa aceita com um clique, no visual do "Cabe no seu bolso?" das metas: contorno, faixa amarela
 * à esquerda, a frase com o que o app sugere e o botão "Usar". Nunca muda nada sozinha.
 */
export function CaixaSugestao({ titulo, rotuloUsar = 'Usar', onUsar, className, children }: CaixaSugestaoProps) {
  return (
    <section
      aria-label={titulo}
      className={cn('flex flex-col gap-2 border-2 border-l-8 border-contorno border-l-amarelo bg-economia-suave p-3 text-sm', className)}
    >
      <h3 className={cn(ROTULO, 'flex items-center gap-1.5')}>
        <Sparkles aria-hidden className="size-3" />
        {titulo}
      </h3>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="min-w-0 flex-1">{children}</p>
        <Button type="button" variant="outline" className={cn(BOTAO, 'h-8 px-3')} onClick={onUsar}>
          {rotuloUsar}
        </Button>
      </div>
    </section>
  )
}
