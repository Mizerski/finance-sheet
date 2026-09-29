import { ChevronLeft, ChevronRight } from 'lucide-react'
import { nomeDoMes } from '@/shared/lib/datas'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface MesVisivel {
  ano: number
  /** 0–11 */
  mes: number
}

interface NavegacaoMesesProps {
  /** Meses visíveis, em ordem; podem atravessar a virada do ano. */
  meses: MesVisivel[]
  temAnterior: boolean
  temProximo: boolean
  onAnterior: () => void
  onProximo: () => void
  className?: string
}

export function NavegacaoMeses({ meses, temAnterior, temProximo, onAnterior, onProximo, className }: NavegacaoMesesProps) {
  const primeiro = meses[0]
  const ultimo = meses[meses.length - 1]
  // Atravessando o ano, os meses viram abreviações para os dois anos caberem.
  const viraAno = primeiro.ano !== ultimo.ano
  const formato = viraAno ? 'curto' : 'longo'
  const ano = (a: number) => <span className="font-normal text-muted-foreground">{a}</span>

  return (
    <div className={cn('flex min-w-0 items-center gap-1 rounded-full bg-card p-1 ring-1 ring-border', className)}>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={onAnterior}
        disabled={!temAnterior}
        aria-label="Mês anterior"
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-0 flex-1 truncate px-1 text-center text-sm font-medium capitalize sm:w-52 sm:flex-none">
        {meses.length === 1 ? (
          <>
            {nomeDoMes(primeiro.mes)} {ano(primeiro.ano)}
          </>
        ) : viraAno ? (
          <>
            {nomeDoMes(primeiro.mes, formato)} {ano(primeiro.ano)} – {nomeDoMes(ultimo.mes, formato)} {ano(ultimo.ano)}
          </>
        ) : (
          <>
            {nomeDoMes(primeiro.mes)} – {nomeDoMes(ultimo.mes)} {ano(primeiro.ano)}
          </>
        )}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={onProximo}
        disabled={!temProximo}
        aria-label="Próximo mês"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
