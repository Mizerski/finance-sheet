import { Link } from '@tanstack/react-router'
import { Forma } from '@/shared/components/Forma'
import { useMemoriaNavegacao } from '../navegacao/memoria-context'
import { ITENS_MENU } from './itens-menu'

/**
 * Abaixo de 64rem as cinco telas ficam numa barra presa embaixo, todas à vista e com alvo grande (64px de altura),
 * em vez de uma faixa que rolava escondida no cabeçalho. A ativa fica em bloco preto. Os nomes ficam em caixa normal,
 * e não alta, para "Lançamentos" e "Organização" caberem inteiros em 360px.
 */
export function MenuInferior() {
  const { buscaPara } = useMemoriaNavegacao()

  return (
    <nav
      aria-label="Telas"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-2 border-contorno bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {ITENS_MENU.map(({ to, rotulo, forma }) => (
        <Link
          key={to}
          to={to}
          search={buscaPara(to)}
          activeOptions={{ exact: true, includeSearch: false }}
          className="flex h-16 min-w-0 flex-col items-center justify-center gap-1.5 border-l-2 border-contorno text-[0.625rem] font-semibold tracking-[-0.01em] transition-colors duration-100 outline-none first:border-l-0 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring min-[24rem]:text-[0.6875rem] min-[30rem]:text-xs min-[30rem]:tracking-normal"
          inactiveProps={{ className: 'hover:bg-amarelo hover:text-tinta' }}
          activeProps={{ className: 'bg-foreground text-background' }}
        >
          <Forma {...forma} className="size-4" />
          <span className="max-w-full truncate">{rotulo}</span>
        </Link>
      ))}
    </nav>
  )
}
