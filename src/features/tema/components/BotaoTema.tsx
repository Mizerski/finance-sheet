import { Moon, Sun } from '@/shared/ui/icones'
import { Button } from '@/shared/ui/button'
import { useTema } from '../hooks/useTema'

/** Alterna entre o tema claro e o escuro. */
export function BotaoTema() {
  const { tema, escolherTema } = useTema()
  const escuro = tema === 'escuro'
  const rotulo = escuro ? 'Usar tema claro' : 'Usar tema escuro'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground"
      aria-label={rotulo}
      title={rotulo}
      onClick={() => escolherTema(escuro ? 'claro' : 'escuro')}
    >
      {escuro ? <Sun className="size-6" /> : <Moon className="size-6" />}
    </Button>
  )
}
