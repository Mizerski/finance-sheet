import type { KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { CORES_CATEGORIA, GRUPOS_CORES_CATEGORIA } from '../cores'

interface SeletorCorProps {
  id?: string
  valor: string
  onChange: (hex: string) => void
}

/** Paleta de cores de categoria como um grupo de rádio só, dividido por família (setas percorrem todas). */
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
    <div id={id} role="radiogroup" aria-label="Cor" onKeyDown={aoTeclar} className="flex flex-col gap-3">
      {GRUPOS_CORES_CATEGORIA.map((grupo) => (
        <div key={grupo.nome} role="group" aria-label={grupo.nome} className="flex flex-col gap-1.5">
          <span aria-hidden className={cn(ROTULO, 'text-muted-foreground')}>
            {grupo.nome}
          </span>
          <div className="flex flex-wrap gap-2">
            {grupo.cores.map((c) => {
              const i = CORES_CATEGORIA.findIndex((x) => x.hex === c.hex)
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
                    'flex size-8 items-center justify-center rounded-full text-papel ring-offset-2 ring-offset-card transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    ativo && 'ring-2 ring-foreground',
                  )}
                  style={{ backgroundColor: c.hex }}
                >
                  {ativo && <Check strokeWidth={3} className="size-4" />}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
