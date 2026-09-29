import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface OpcaoSegmentada<T extends string> {
  valor: T
  rotulo: ReactNode
}

interface ControleSegmentadoProps<T extends string> {
  /** Nome acessível do grupo. */
  rotulo: string
  valor: T
  opcoes: OpcaoSegmentada<T>[]
  onChange: (valor: T) => void
  id?: string
  desabilitado?: boolean
  className?: string
}

/** Grupo de opções exclusivas em pílula (trilho `bg-muted`, item ativo `bg-card`). */
export function ControleSegmentado<T extends string>({
  rotulo,
  valor,
  opcoes,
  onChange,
  id,
  desabilitado,
  className,
}: ControleSegmentadoProps<T>) {
  // Setas movem a seleção, como num grupo de rádio.
  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    const passo = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!passo) return
    e.preventDefault()
    const atual = opcoes.findIndex((o) => o.valor === valor)
    const proximo = (atual + passo + opcoes.length) % opcoes.length
    onChange(opcoes[proximo].valor)
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')[proximo]?.focus()
  }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={rotulo}
      onKeyDown={aoTeclar}
      className={cn('flex gap-1 rounded-full bg-muted p-1', className)}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            tabIndex={ativo ? 0 : -1}
            disabled={desabilitado}
            onClick={() => onChange(o.valor)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
              ativo && 'bg-card text-foreground shadow-sm',
            )}
          >
            {o.rotulo}
          </button>
        )
      })}
    </div>
  )
}
