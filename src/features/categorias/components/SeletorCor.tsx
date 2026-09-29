import type { KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { CORES_CATEGORIA } from '../cores'

interface SeletorCorProps {
  id?: string
  valor: string
  onChange: (hex: string) => void
}

/** Paleta de cores de categoria como grupo de rádio (setas mudam a cor). */
export function SeletorCor({ id, valor, onChange }: SeletorCorProps) {
  const atual = CORES_CATEGORIA.findIndex((c) => c.hex === valor.toLowerCase())

  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    const passo = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!passo) return
    e.preventDefault()
    const proximo = (Math.max(atual, 0) + passo + CORES_CATEGORIA.length) % CORES_CATEGORIA.length
    onChange(CORES_CATEGORIA[proximo].hex)
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')[proximo]?.focus()
  }

  return (
    <div id={id} role="radiogroup" aria-label="Cor" onKeyDown={aoTeclar} className="flex flex-wrap gap-2">
      {CORES_CATEGORIA.map((c, i) => {
        const ativo = i === atual
        return (
          <button
            key={c.hex}
            type="button"
            role="radio"
            aria-checked={ativo}
            aria-label={c.nome}
            title={c.nome}
            tabIndex={ativo || (atual < 0 && i === 0) ? 0 : -1}
            onClick={() => onChange(c.hex)}
            className={cn(
              'flex size-8 items-center justify-center rounded-full text-primary-foreground ring-offset-2 ring-offset-card transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring',
              ativo && 'ring-2 ring-foreground/30',
            )}
            style={{ backgroundColor: c.hex }}
          >
            {ativo && <Check className="size-4" />}
          </button>
        )
      })}
    </div>
  )
}
