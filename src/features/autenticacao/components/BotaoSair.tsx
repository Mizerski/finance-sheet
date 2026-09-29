import { useContext } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { SessaoContext } from '../sessao-context'

export function BotaoSair() {
  const sessao = useContext(SessaoContext)
  // Sem sessão (app desktop, que não tem login): não há de onde sair.
  if (!sessao) return null
  const { usuario, sair } = sessao

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
