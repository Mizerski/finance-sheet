import { MessagesSquare } from '@/shared/ui/icones'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useAssistente } from '../assistente-context'

/** Desktop: abre e fecha o painel do assistente (atalho A). */
export function BotaoAssistente() {
  const { aberto, setAberto, fase } = useAssistente()
  const baixando = fase.tipo === 'baixando'

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'relative shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground',
        aberto && 'bg-foreground/8 text-foreground',
      )}
      onClick={() => setAberto(!aberto)}
      aria-label="Assistente"
      aria-expanded={aberto}
      title="Assistente (atalho A)"
    >
      <MessagesSquare className="size-6" />
      {/* Download em andamento: um ponto amarelo, para a pessoa saber que continua mesmo com o painel fechado. */}
      {baixando && (
        <span aria-hidden className="absolute top-1.5 right-1.5 size-2 border border-contorno bg-amarelo motion-safe:animate-pulse" />
      )}
    </Button>
  )
}
