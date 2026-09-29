import { LogOut } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useSessao } from '../sessao-context'

export function BotaoSair() {
  const { usuario, sair } = useSessao()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground"
      aria-label={`Sair da conta ${usuario.email ?? ''}`}
      title={`Sair (${usuario.email ?? 'conta'})`}
      onClick={sair}
    >
      <LogOut className="size-4" />
    </Button>
  )
}
