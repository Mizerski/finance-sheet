import { ChevronLeft, ChevronRight } from '@/shared/ui/icones'
import { BOTAO_GRUPO, GRUPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useAno } from '../hooks/useAno'

/** Grupo "‹ 2026 ›" que troca o ano de todas as telas. */
export function SeletorAno() {
  const { ano, intervalo, irParaAno } = useAno()
  const noInicio = ano <= intervalo.min

  return (
    <div className={cn(GRUPO, 'shrink-0')}>
      <span className="flex" title={noInicio ? `Os dados começam em ${intervalo.min}` : undefined}>
        <Button
          variant="ghost"
          size="icon"
          className={BOTAO_GRUPO}
          onClick={() => irParaAno(ano - 1)}
          disabled={noInicio}
          aria-label="Ano anterior"
        >
          <ChevronLeft />
        </Button>
      </span>
      <span className="flex w-14 items-center justify-center border-x-2 border-contorno font-heading text-base font-bold tabular-nums" aria-live="polite">
        {ano}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={BOTAO_GRUPO}
        onClick={() => irParaAno(ano + 1)}
        disabled={ano >= intervalo.max}
        aria-label="Próximo ano"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
