import { useState, type CSSProperties } from 'react'
import type { DateRange } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { IntervaloAnos } from '@/features/projecao/anos'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { deDataISO, formatarData, paraDataISO } from '@/shared/lib/datas'
import { BOTAO, CAMADA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import {
  deslocar,
  diasDoPeriodo,
  limitarPeriodo,
  periodoDe,
  rotuloDoPeriodo,
  tipoDoPeriodo,
  type Periodo,
  type Unidade,
} from '../periodo'

interface SeletorPeriodoProps {
  periodo: Periodo
  /** Anos que a projeção calcula; o calendário não sai deles. */
  intervalo: IntervaloAnos
  hoje: string
  onChange: (periodo: Periodo) => void
}

const UNIDADES: { valor: Unidade; rotulo: string }[] = [
  { valor: 'dia', rotulo: 'Dia' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'mes', rotulo: 'Mês' },
  { valor: 'ano', rotulo: 'Ano' },
]

/** Células de 36px: os atalhos cabem na largura de um mês e os dias ficam fáceis de tocar. */
const CELULA_CALENDARIO = { '--cell-size': 'calc(var(--spacing) * 9)' } as CSSProperties

function contarDias(n: number) {
  return `${n} ${n === 1 ? 'dia' : 'dias'}`
}

/** Pílula "‹ março de 2026 ›": as setas andam um período, o centro abre o calendário. */
export function SeletorPeriodo({ periodo, intervalo, hoje, onChange }: SeletorPeriodoProps) {
  const [aberto, setAberto] = useState(false)
  const [rascunho, setRascunho] = useState<DateRange | undefined>()
  const doisMeses = useMediaQuery('(min-width: 48rem)')
  const tipo = tipoDoPeriodo(periodo)
  const inicio = `${intervalo.min}-01-01`
  const fim = `${intervalo.max}-12-31`

  const aplicar = (novo: Periodo) => {
    onChange(limitarPeriodo(novo, intervalo))
    setAberto(false)
  }

  // Atalhos partem de hoje quando ele está no período aberto, senão do início do período.
  const referencia = hoje >= periodo.de && hoje <= periodo.ate ? hoje : periodo.de

  // 1º clique marca o início e o 2º o fim (o padrão do DayPicker estenderia o intervalo anterior).
  const escolherDia = (dia: Date) =>
    setRascunho((r) => (!r?.from || r.to ? { from: dia, to: undefined } : dia < r.from ? { from: dia, to: r.from } : { from: r.from, to: dia }))

  const de = rascunho?.from && paraDataISO(rascunho.from)
  const ate = rascunho?.to && paraDataISO(rascunho.to)

  return (
    <div className="flex min-w-0 items-center gap-1 rounded-full bg-card p-1 ring-1 ring-border">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => aplicar(deslocar(periodo, -1))}
        disabled={periodo.de <= inicio}
        aria-label="Período anterior"
      >
        <ChevronLeft />
      </Button>

      <Popover
        open={aberto}
        onOpenChange={(abrir) => {
          if (abrir) setRascunho({ from: deDataISO(periodo.de), to: deDataISO(periodo.ate) })
          setAberto(abrir)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 min-w-0 flex-1 rounded-full px-3 font-medium tabular-nums sm:w-56 sm:flex-none"
            aria-label={`Período do relatório: ${rotuloDoPeriodo(periodo)}. Alterar`}
          >
            <CalendarDays className="text-muted-foreground" />
            <span className="truncate">{rotuloDoPeriodo(periodo)}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className={cn(CAMADA, 'flex w-auto flex-col gap-3')}>
          <div role="group" aria-label="Período inteiro" className="flex gap-1 rounded-full bg-muted p-1">
            {UNIDADES.map((u) => (
              <button
                key={u.valor}
                type="button"
                aria-pressed={tipo === u.valor}
                onClick={() => aplicar(periodoDe(u.valor, referencia))}
                className={cn(
                  'flex-1 rounded-full px-3 py-1.5 text-[0.8125rem] text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                  tipo === u.valor && 'bg-card text-foreground shadow-sm',
                )}
              >
                {u.rotulo}
              </button>
            ))}
          </div>

          <Calendar
            mode="range"
            locale={ptBR}
            numberOfMonths={doisMeses ? 2 : 1}
            captionLayout="dropdown"
            startMonth={new Date(intervalo.min, 0, 1)}
            endMonth={new Date(intervalo.max, 11, 1)}
            disabled={[{ before: deDataISO(inicio) }, { after: deDataISO(fim) }]}
            defaultMonth={deDataISO(periodo.de)}
            selected={rascunho}
            onSelect={(_, dia) => escolherDia(dia)}
            style={CELULA_CALENDARIO}
            classNames={{ root: 'w-full' }}
            className="bg-transparent p-0"
          />

          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <p className="text-xs text-muted-foreground tabular-nums">
              {de && ate
                ? `${formatarData(de)} – ${formatarData(ate)} · ${contarDias(diasDoPeriodo({ de, ate }))}`
                : de
                  ? `Início em ${formatarData(de)} · escolha o fim`
                  : 'Escolha o início'}
            </p>
            <Button className={BOTAO} disabled={!de} onClick={() => de && aplicar({ de, ate: ate ?? de })}>
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => aplicar(deslocar(periodo, 1))}
        disabled={periodo.ate >= fim}
        aria-label="Próximo período"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
