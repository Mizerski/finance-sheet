import { useState, type KeyboardEvent } from 'react'
import { Check } from '@/shared/ui/icones'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { GRUPOS_CORES_CATEGORIA, type CorCategoria } from '../constants/cores'

interface SeletorCorProps {
  id?: string
  valor: string
  onChange: (hex: string) => void
}

/**
 * Paleta em quadradinhos, como um grupo de rádio só (setas percorrem todas); a escolhida fica afundada.
 * A cor salva que saiu da paleta continua disponível em "Atual".
 */
export function SeletorCor({ id, valor, onChange }: SeletorCorProps) {
  const hex = valor.toLowerCase()
  const [inicial] = useState(hex)
  const naPaleta = GRUPOS_CORES_CATEGORIA.some((g) => g.cores.some((c) => c.hex === inicial))
  const grupos = naPaleta
    ? GRUPOS_CORES_CATEGORIA
    : [{ nome: 'Atual', cores: [{ hex: inicial, nome: 'Cor atual' }] }, ...GRUPOS_CORES_CATEGORIA]
  const todas = grupos.flatMap((g) => g.cores)
  const atual = todas.findIndex((c) => c.hex === hex)

  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    const passo = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!passo) return
    e.preventDefault()
    const proximo = (Math.max(atual, 0) + passo + todas.length) % todas.length
    onChange(todas[proximo].hex)
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')[proximo]?.focus()
  }

  return (
    <div id={id} role="radiogroup" aria-label="Cor" onKeyDown={aoTeclar} className="flex flex-col gap-3">
      {grupos.map((grupo) => (
        <div key={grupo.nome} role="group" aria-label={grupo.nome} className="flex flex-col gap-1.5">
          <span aria-hidden className={cn(ROTULO, 'text-muted-foreground')}>
            {grupo.nome}
          </span>
          <div className="flex flex-wrap gap-2.5 pr-1 pb-1">
            {grupo.cores.map((c) => {
              const i = todas.indexOf(c)
              return (
                <Quadradinho
                  key={c.hex}
                  cor={c}
                  ativo={i === atual}
                  focavel={i === atual || (atual < 0 && i === 0)}
                  onClick={() => onChange(c.hex)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function Quadradinho({ cor, ativo, focavel, onClick }: { cor: CorCategoria; ativo: boolean; focavel: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativo}
      aria-label={cor.nome}
      title={cor.nome}
      tabIndex={focavel ? 0 : -1}
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center border-2 border-contorno transition-[translate,box-shadow] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        cor.clara ? 'text-tinta' : 'text-papel',
        ativo
          ? 'motion-safe:translate-x-[2px] motion-safe:translate-y-[2px]'
          : 'shadow-bloco-sm hover:shadow-bloco motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px] active:shadow-none',
      )}
      style={{ backgroundColor: cor.hex }}
    >
      {ativo && <Check strokeWidth={3.5} className="size-6" />}
    </button>
  )
}
