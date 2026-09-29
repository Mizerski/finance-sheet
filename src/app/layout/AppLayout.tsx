import { Link, Outlet } from '@tanstack/react-router'
import { ArrowLeftRight, LayoutDashboard, Sheet, Tags, type LucideIcon } from 'lucide-react'
import { BotaoSair } from '@/features/autenticacao/components/BotaoSair'
import { SaldoProjetado } from '@/features/projecao/components/SaldoProjetado'
import { useMemoriaNavegacao } from '../navegacao/memoria-context'
import { MemoriaNavegacaoProvider } from '../navegacao/MemoriaNavegacaoProvider'

const ITENS: { to: '/' | '/lancamentos' | '/categorias' | '/dashboard'; rotulo: string; icone: LucideIcon }[] = [
  { to: '/', rotulo: 'Planilha', icone: Sheet },
  { to: '/lancamentos', rotulo: 'Lançamentos', icone: ArrowLeftRight },
  { to: '/categorias', rotulo: 'Categorias', icone: Tags },
  { to: '/dashboard', rotulo: 'Dashboard', icone: LayoutDashboard },
]

export function AppLayout() {
  return (
    <MemoriaNavegacaoProvider>
      <div className="min-h-svh bg-background">
        <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-4 sm:justify-start">
              <span className="flex items-center gap-2 text-[0.95rem] font-medium tracking-tight">
                <span aria-hidden className="size-5 rounded-full bg-primary" />
                Projeção Financeira
              </span>
              <SaldoProjetado />
            </div>
            <div className="flex min-w-0 items-center gap-1">
              <Menu />
              <BotaoSair />
            </div>
          </div>
        </header>

        <main className="px-4 pb-4">
          <Outlet />
        </main>
      </div>
    </MemoriaNavegacaoProvider>
  )
}

/** Cada aba abre a tela como o usuário a deixou (filtros, mês, período). */
function Menu() {
  const { buscaPara } = useMemoriaNavegacao()

  return (
    <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-full bg-muted p-1 sm:flex-none">
      {ITENS.map(({ to, rotulo, icone: Icone }) => (
        <Link
          key={to}
          to={to}
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
