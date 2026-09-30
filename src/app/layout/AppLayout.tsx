import { Link, Outlet } from '@tanstack/react-router'
import { BotaoSair } from '@/features/autenticacao/components/BotaoSair'
import { BotaoBackup } from '@/features/backup/components/BotaoBackup'
import { SaldoProjetado } from '@/features/projecao/components/SaldoProjetado'
import { Marca } from '@/shared/components/Marca'
import { EH_DESKTOP } from '@/shared/lib/plataforma'
import { AtalhosGlobais } from '../atalhos/AtalhosGlobais'
import { useMemoriaNavegacao } from '../navegacao/memoria-context'
import { MemoriaNavegacaoProvider } from '../navegacao/MemoriaNavegacaoProvider'
import { ITENS_MENU } from './itens-menu'

export function AppLayout() {
  return (
    <MemoriaNavegacaoProvider>
      <div className="min-h-svh bg-background">
        <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
          {/* Abaixo de 69rem, o menu desce para uma linha própria: marca, saldos e menu não cabem juntos. */}
          <div className="flex flex-col gap-3 p-4 min-[69rem]:flex-row min-[69rem]:items-center min-[69rem]:justify-between">
            <div className="flex items-center justify-between gap-3 sm:gap-4 min-[69rem]:justify-start">
              <Marca />
              <SaldoProjetado />
            </div>
            <div className="flex min-w-0 items-center gap-1">
              <Menu />
              {EH_DESKTOP && <BotaoBackup />}
              <BotaoSair />
            </div>
          </div>
        </header>

        <main className="px-4 pb-4">
          <Outlet />
        </main>

        <AtalhosGlobais />
      </div>
    </MemoriaNavegacaoProvider>
  )
}

/** Cada aba abre a tela como o usuário a deixou (filtros, mês, período). */
function Menu() {
  const { buscaPara } = useMemoriaNavegacao()

  return (
    <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-full bg-muted p-1 min-[69rem]:flex-initial">
      {ITENS_MENU.map(({ to, rotulo, icone: Icone }, i) => (
        <Link
          key={to}
          to={to}
          title={`${rotulo} (atalho ${i + 1})`}
          search={buscaPara(to)}
          activeOptions={{ exact: true, includeSearch: false }}
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: 'bg-card text-foreground shadow-sm' }}
        >
          <Icone className="size-3.5" />
          {rotulo}
        </Link>
      ))}
    </nav>
  )
}
