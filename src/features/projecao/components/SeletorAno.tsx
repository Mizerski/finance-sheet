import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useAno } from '../useAno'

/** Pílula "‹ 2026 ›" que troca o ano de todas as telas. */
export function SeletorAno() {
  const { ano, intervalo, irParaAno } = useAno()
  const noInicio = ano <= intervalo.min

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-card p-1 ring-1 ring-border">
      {/* O title fica no span porque botão desabilitado não recebe o hover. */}
      <span title={noInicio ? `Os dados começam em ${intervalo.min}` : undefined}>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => irParaAno(ano - 1)}
          disabled={noInicio}
          aria-label="Ano anterior"
        >
          <ChevronLeft />
        </Button>
      </span>
      <span className="w-12 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {ano}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => irParaAno(ano + 1)}
        disabled={ano >= intervalo.max}
        aria-label="Próximo ano"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
