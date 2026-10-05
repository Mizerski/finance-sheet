import { ChevronLeft, ChevronRight } from '@/shared/ui/icones'
import { nomeDoMes } from '@/shared/lib/datas'
import { BOTAO_GRUPO, GRUPO } from '@/shared/lib/estilos'
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
  const viraAno = primeiro.ano !== ultimo.ano
  const formato = viraAno ? 'curto' : 'longo'
  const ano = (a: number) => <span className="font-light">{a}</span>

  return (
    <div className={cn(GRUPO, 'min-w-0', className)}>
      <Button
        variant="ghost"
        size="icon"
        className={BOTAO_GRUPO}
        onClick={onAnterior}
        disabled={!temAnterior}
        aria-label="Mês anterior"
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-0 flex-1 truncate border-x-2 border-contorno px-2 text-center font-heading text-sm leading-9 font-bold uppercase sm:w-60 sm:flex-none">
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
        className={BOTAO_GRUPO}
        onClick={onProximo}
        disabled={!temProximo}
        aria-label="Próximo mês"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
