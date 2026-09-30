import { nomeDoDiaDaSemana } from '@/shared/lib/datas'
import { cn } from '@/shared/lib/utils'

/** Domingo a sábado, na mesma ordem do calendário. */
const DIAS = [0, 1, 2, 3, 4, 5, 6]

interface SeletorDiasSemanaProps {
  /** id do rótulo do campo, que dá nome ao grupo. */
  rotuloId: string
  /** 0 (domingo) a 6 (sábado). */
  valor: number[]
  onChange: (dias: number[]) => void
  invalido?: boolean
}

/** Faixa com os sete dias; cada um liga e desliga sozinho (pode marcar vários, ex.: terça e quinta). */
export function SeletorDiasSemana({ rotuloId, valor, onChange, invalido }: SeletorDiasSemanaProps) {
  const alternar = (dia: number) =>
    onChange(valor.includes(dia) ? valor.filter((d) => d !== dia) : [...valor, dia].sort((a, b) => a - b))

  return (
    <div
      role="group"
      aria-labelledby={rotuloId}
      className={cn(
        'grid grid-cols-7 border-2 border-foreground bg-card',
        invalido && 'border-destructive shadow-[3px_3px_0_0_var(--destructive)]',
      )}
    >
      {DIAS.map((dia) => {
        const marcado = valor.includes(dia)
        return (
          <button
            key={dia}
            type="button"
            aria-pressed={marcado}
            aria-label={nomeDoDiaDaSemana(dia, 'longo')}
            title={nomeDoDiaDaSemana(dia, 'longo')}
            onClick={() => alternar(dia)}
            className={cn(
              'flex min-h-9 items-center justify-center border-l-2 border-foreground px-1 text-xs font-semibold uppercase transition-colors outline-none first:border-l-0 hover:bg-amarelo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:tracking-[0.06em]',
              marcado && 'bg-foreground text-background hover:bg-foreground',
            )}
          >
            {nomeDoDiaDaSemana(dia)}
          </button>
        )
      })}
    </div>
  )
}
