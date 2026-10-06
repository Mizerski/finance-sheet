import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Eye, EyeOff } from '@/shared/ui/icones'
import { useSaldosOcultos } from '../hooks/useSaldosOcultos'

/** O olho que borra (ou mostra) todos os saldos do app. */
export function BotaoOcultarSaldos({ className }: { className?: string }) {
  const { ocultos, alternar } = useSaldosOcultos()
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-9 shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground', className)}
      aria-label={ocultos ? 'Mostrar saldos' : 'Ocultar saldos'}
      title={ocultos ? 'Mostrar saldos' : 'Ocultar saldos'}
      aria-pressed={ocultos}
      onClick={alternar}
    >
      {ocultos ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
    </Button>
  )
}
