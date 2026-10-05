import { useContext } from 'react'
import { LogOut } from '@/shared/ui/icones'
import { Button } from '@/shared/ui/button'
import { SessaoContext } from '../context/sessao-context'

/** Some sem sessão (no desktop, que não tem login). */
export function BotaoSair() {
  const sessao = useContext(SessaoContext)
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
      <LogOut className="size-6" />
    </Button>
  )
}
