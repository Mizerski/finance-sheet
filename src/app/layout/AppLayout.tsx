import { Link, Outlet } from '@tanstack/react-router'
import { BotaoAssistente } from '@/features/assistente/components/BotaoAssistente'
import { PainelAssistente } from '@/features/assistente/components/PainelAssistente'
import { SeletorCaixa } from '@/features/caixas/components/SeletorCaixa'
import { useAtalhosDeCaixa } from '@/features/caixas/hooks/useAtalhosDeCaixa'
import { useVisao } from '@/features/caixas/hooks/useVisao'
import { BotaoNovoLancamento } from '@/features/lancamentos/components/BotaoNovoLancamento'
import { useAplicarSaldosOcultos } from '@/features/projecao/hooks/useSaldosOcultos'
import { Forma } from '@/shared/components/Forma'
import { Marca } from '@/shared/components/Marca'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { BLOCO_CABECALHO, BLOCO_SOLTO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { EH_DESKTOP } from '@/shared/lib/plataforma'
import { AtalhosGlobais } from '../atalhos/AtalhosGlobais'
import { useMemoriaNavegacao } from '../navegacao/memoria-context'
import { MemoriaNavegacaoProvider } from '../navegacao/MemoriaNavegacaoProvider'
import { ITENS_MENU } from './itens-menu'
import { MenuInferior } from './MenuInferior'
import { MenuMais } from './MenuMais'

/**
 * Larguras em que marca, saldos e menu cabem numa linha só; abaixo, o menu desce para uma linha própria.
 * Com o seletor de caixa (2 ou mais caixas), a linha única precisa de mais espaço.
 */
const LINHA_UNICA = {
  normal: {
    cabecalho: 'min-[70rem]:flex-row min-[70rem]:items-center min-[70rem]:justify-between',
    marca: 'min-[70rem]:justify-start',
    menu: 'min-[70rem]:flex-initial',
    aba: 'min-[70rem]:grow-0',
  },
  comCaixas: {
    cabecalho: 'min-[83rem]:flex-row min-[83rem]:items-center min-[83rem]:justify-between',
    marca: 'min-[83rem]:justify-start',
    menu: 'min-[83rem]:flex-initial min-[83rem]:shrink-0',
    aba: 'min-[83rem]:grow-0',
  },
}

/**
 * No desktop, o cabeçalho ainda tem o botão Assistente: a linha única começa mais tarde
 * (80rem sem o seletor de caixa, 93rem com ele), para a página nunca rolar na horizontal.
 */
const LINHA_UNICA_DESKTOP = {
  normal: {
    cabecalho: 'min-[80rem]:flex-row min-[80rem]:items-center min-[80rem]:justify-between',
    marca: 'min-[80rem]:justify-start',
    menu: 'min-[80rem]:flex-initial',
    aba: 'min-[80rem]:grow-0',
  },
  comCaixas: {
    cabecalho: 'min-[93rem]:flex-row min-[93rem]:items-center min-[93rem]:justify-between',
    marca: 'min-[93rem]:justify-start',
    menu: 'min-[93rem]:flex-initial min-[93rem]:shrink-0',
    aba: 'min-[93rem]:grow-0',
  },
}

type LinhaUnica = (typeof LINHA_UNICA)['normal']

/** Na tela larga, o botão de criar diz só "Novo" até sobrar espaço para o nome inteiro (100rem). */
const NOVO_CURTO = 'max-[100rem]:hidden'

/**
 * A partir de 64rem, o menu fica no cabeçalho; abaixo, as telas vão para a barra de baixo (`MenuInferior`), a marca
 * divide a linha com o Assistente e o "Mais", e o caixa e o "Novo lançamento" (largo) ficam na linha de baixo.
 * Os saldos ficam no resumo da Planilha, em números grandes.
 */
export function AppLayout() {
  useAtalhosDeCaixa()
  useAplicarSaldosOcultos()
  const { caixas } = useVisao()
  const larguras = EH_DESKTOP ? LINHA_UNICA_DESKTOP : LINHA_UNICA
  const linha = caixas.length >= 2 ? larguras.comCaixas : larguras.normal
  const telaLarga = useMediaQuery('(min-width: 64rem)')

  return (
    <MemoriaNavegacaoProvider>
      <div className="min-h-svh bg-background">
        <header className="sticky top-0 z-40 border-b-2 border-contorno bg-background">
          <div className={cn('flex flex-col gap-3 px-4 py-3', linha.cabecalho)}>
            <div className={cn('flex min-w-0 items-center justify-between gap-2 sm:gap-6', linha.marca)}>
              <Marca />
              {telaLarga ? (
                <SeletorCaixa className="max-w-48" />
              ) : (
                <div className="flex items-center gap-1">
                  {EH_DESKTOP && <BotaoAssistente />}
                  <MenuMais />
                </div>
              )}
            </div>
            {telaLarga ? (
              <div className="flex min-w-0 items-center gap-1">
                <Menu linha={linha} />
                <BotaoNovoLancamento className="mb-[3px] ml-1" classeComplemento={NOVO_CURTO} />
                {EH_DESKTOP && <BotaoAssistente />}
                <MenuMais />
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <SeletorCaixa className="mb-[3px] max-w-[11rem]" />
                <BotaoNovoLancamento className="mb-[3px] flex-1" />
              </div>
            )}
          </div>
        </header>

        <main className="px-4 pt-5 pb-8 max-lg:pb-24">
          <Outlet />
        </main>
        <MenuInferior />

        <AtalhosGlobais />
        {EH_DESKTOP && <PainelAssistente />}
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
    <nav className={cn('flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-[3px] pb-[3px] [scrollbar-width:none]', linha.menu)}>
      {ITENS_MENU.map(({ to, rotulo, forma }, i) => (
        <Link
          key={to}
          to={to}
          title={`${rotulo} (atalho ${i + 1})`}
          search={buscaPara(to)}
          activeOptions={{ exact: true, includeSearch: false }}
          className={cn(BLOCO_CABECALHO, 'grow justify-center', linha.aba)}
          inactiveProps={{ className: BLOCO_SOLTO }}
          activeProps={{ className: 'bg-foreground text-background motion-safe:translate-x-[2px] motion-safe:translate-y-[2px]' }}
        >
          <Forma {...forma} className="size-3" />
          {rotulo}
        </Link>
      ))}
    </nav>
  )
}
