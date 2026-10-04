import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from '@/shared/ui/icones'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'

interface MaisDetalhesProps {
  /** Texto do botão fechado ("Ver quanto dá em cada nível"). */
  rotulo: string
  /** Texto do botão aberto; sem ele, "Esconder detalhes". */
  rotuloAberto?: string
  className?: string
  children: ReactNode
}

/** Detalhe secundário que abre e fecha no lugar, para o card não mostrar tudo de uma vez. */
export function MaisDetalhes({ rotulo, rotuloAberto = 'Esconder detalhes', className, children }: MaisDetalhesProps) {
  const [aberto, setAberto] = useState(false)
  const id = useId()

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => setAberto((a) => !a)}
        className={cn(
          ROTULO,
          '-mx-1 flex items-center gap-1 self-start px-1 py-0.5 font-semibold text-foreground transition-colors duration-100 outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        )}
      >
        <ChevronDown aria-hidden strokeWidth={3} className={cn('size-3 transition-transform duration-100', aberto && 'rotate-180')} />
        {aberto ? rotuloAberto : rotulo}
      </button>
      {aberto && (
        <div id={id} className="flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  )
}
