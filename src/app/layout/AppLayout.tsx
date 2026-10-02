import { Link, Outlet } from '@tanstack/react-router'
import { BotaoSair } from '@/features/autenticacao/components/BotaoSair'
import { SeletorCaixa } from '@/features/caixas/components/SeletorCaixa'
import { useAtalhosDeCaixa } from '@/features/caixas/useAtalhosDeCaixa'
import { useVisao } from '@/features/caixas/useVisao'
import { BotaoBackup } from '@/features/backup/components/BotaoBackup'
import { BotaoLembrete } from '@/features/lembrete/components/BotaoLembrete'
import { SaldoProjetado } from '@/features/projecao/components/SaldoProjetado'
import { BotaoTema } from '@/features/tema/components/BotaoTema'
import { Forma } from '@/shared/components/Forma'
import { Marca } from '@/shared/components/Marca'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { cn } from '@/shared/lib/utils'
import { EH_DESKTOP } from '@/shared/lib/plataforma'
import { AtalhosGlobais } from '../atalhos/AtalhosGlobais'
import { useMemoriaNavegacao } from '../navegacao/memoria-context'
import { MemoriaNavegacaoProvider } from '../navegacao/MemoriaNavegacaoProvider'
import { ITENS_MENU } from './itens-menu'

/**
 * Larguras em que marca, saldos e menu cabem numa linha só; abaixo, o menu desce para uma linha própria.
 * Com o seletor de caixa (2 ou mais caixas), a linha única precisa de mais espaço.
 */
const LINHA_UNICA = {
  normal: {
    cabecalho: 'min-[76rem]:flex-row min-[76rem]:items-center min-[76rem]:justify-between',
    marca: 'min-[76rem]:justify-start',
    menu: 'min-[76rem]:flex-initial',
    aba: 'min-[76rem]:grow-0',
  },
  comCaixas: {
    cabecalho: 'min-[90rem]:flex-row min-[90rem]:items-center min-[90rem]:justify-between',
    marca: 'min-[90rem]:justify-start',
    // O menu não encolhe: se faltar espaço, quem cede é o nome do caixa (que trunca).
    menu: 'min-[90rem]:flex-initial min-[90rem]:shrink-0',
    aba: 'min-[90rem]:grow-0',
  },
}

type LinhaUnica = (typeof LINHA_UNICA)['normal']

export function AppLayout() {
  useAtalhosDeCaixa()
  const { caixas } = useVisao()
  const linha = caixas.length >= 2 ? LINHA_UNICA.comCaixas : LINHA_UNICA.normal
  // O caixa fica ao lado do saldo que ele explica; no celular, onde a primeira linha não tem espaço, abre a linha do menu.
  const telaLarga = useMediaQuery('(min-width: 40rem)')

  return (
    <MemoriaNavegacaoProvider>
      <div className="min-h-svh bg-background">
        <header className="sticky top-0 z-40 border-b-2 border-contorno bg-background">
          <div className={cn('flex flex-col gap-3 px-4 py-3', linha.cabecalho)}>
            <div className={cn('flex min-w-0 items-center justify-between gap-2 sm:gap-6', linha.marca)}>
              <Marca />
              <div className="flex min-w-0 items-center gap-3">
                {telaLarga && <SeletorCaixa className="max-w-48" />}
                <SaldoProjetado />
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-1">
              {!telaLarga && <SeletorCaixa className="mr-1 mb-[3px] max-w-[11rem]" />}
              <Menu linha={linha} />
              {EH_DESKTOP && <BotaoLembrete />}
              {EH_DESKTOP && <BotaoBackup />}
              <BotaoTema />
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
function Menu({ linha }: { linha: LinhaUnica }) {
  const { buscaPara } = useMemoriaNavegacao()

  return (
    // Folga embaixo e à direita para a sombra dura não ser cortada pela rolagem do celular.
    <nav className={cn('flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-[3px] pb-[3px] [scrollbar-width:none]', linha.menu)}>
      {ITENS_MENU.map(({ to, rotulo, forma }, i) => (
        <Link
          key={to}
          to={to}
          title={`${rotulo} (atalho ${i + 1})`}
          search={buscaPara(to)}
          activeOptions={{ exact: true, includeSearch: false }}
          className={cn(
            'flex h-9 shrink-0 grow items-center justify-center gap-2 border-2 border-contorno px-3 text-xs font-semibold tracking-[0.06em] uppercase transition-[color,background-color,box-shadow,translate] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px]',
            linha.aba,
          )}
          inactiveProps={{ className: 'bg-card shadow-bloco-sm hover:bg-amarelo hover:text-tinta active:shadow-none' }}
          activeProps={{ className: 'bg-foreground text-background motion-safe:translate-x-[2px] motion-safe:translate-y-[2px]' }}
        >
          <Forma {...forma} className="size-3" />
          {rotulo}
        </Link>
      ))}
    </nav>
  )
}
