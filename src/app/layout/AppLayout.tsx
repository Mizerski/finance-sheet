import { Link, Outlet } from '@tanstack/react-router'
import { BotaoSair } from '@/features/autenticacao/components/BotaoSair'
import { BotaoBackup } from '@/features/backup/components/BotaoBackup'
import { BotaoLembrete } from '@/features/lembrete/components/BotaoLembrete'
import { SaldoProjetado } from '@/features/projecao/components/SaldoProjetado'
import { Forma } from '@/shared/components/Forma'
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
        <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background">
          {/* Abaixo de 76rem, o menu desce para uma linha própria: marca, saldos e menu não cabem juntos. */}
          <div className="flex flex-col gap-3 px-4 py-3 min-[76rem]:flex-row min-[76rem]:items-center min-[76rem]:justify-between">
            <div className="flex items-center justify-between gap-3 sm:gap-6 min-[76rem]:justify-start">
              <Marca />
              <SaldoProjetado />
            </div>
            <div className="flex min-w-0 items-center gap-1">
              <Menu />
              {EH_DESKTOP && <BotaoLembrete />}
              {EH_DESKTOP && <BotaoBackup />}
              <BotaoSair />
            </div>
          </div>
        </header>

        <main className="px-4 pt-5 pb-8">
          <Outlet />
        </main>

        <AtalhosGlobais />
      </div>
    </MemoriaNavegacaoProvider>
  )
}

/**
 * Abas em blocos com contorno e sombra dura, que afundam ao clicar como os botões; a ativa fica afundada, em preto.
 * Cada aba abre a tela como o usuário a deixou.
 */
function Menu() {
  const { buscaPara } = useMemoriaNavegacao()

  return (
    // Folga embaixo e à direita para a sombra dura não ser cortada pela rolagem do celular.
    <nav className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-[3px] pb-[3px] [scrollbar-width:none] min-[76rem]:flex-initial">
      {ITENS_MENU.map(({ to, rotulo, forma }, i) => (
        <Link
          key={to}
          to={to}
          title={`${rotulo} (atalho ${i + 1})`}
          search={buscaPara(to)}
          activeOptions={{ exact: true, includeSearch: false }}
          className="flex h-9 shrink-0 grow items-center justify-center gap-2 border-2 border-foreground px-3 text-xs font-semibold tracking-[0.06em] uppercase transition-[color,background-color,box-shadow,translate] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px] min-[76rem]:grow-0"
          inactiveProps={{ className: 'bg-card shadow-bloco-sm hover:bg-amarelo active:shadow-none' }}
          activeProps={{ className: 'bg-foreground text-background motion-safe:translate-x-[2px] motion-safe:translate-y-[2px]' }}
        >
          <Forma {...forma} className="size-3" />
          {rotulo}
        </Link>
      ))}
    </nav>
  )
}
