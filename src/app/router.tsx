import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Link,
  redirect,
  retainSearchParams,
} from '@tanstack/react-router'
import { validarCaixa } from '@/features/caixas/busca'
import { validarBuscaEconomias } from '@/features/economias/busca'
import { EconomiasPage } from '@/features/economias/EconomiasPage'
import { validarBusca } from '@/features/lancamentos/filtros'
import { validarBuscaDashboard } from '@/features/dashboard/periodo'
import { validarAno } from '@/features/projecao/anos'
import { LancamentosPage } from '@/features/lancamentos/LancamentosPage'
import { validarAba } from '@/features/organizacao/aba'
import { OrganizacaoPage } from '@/features/organizacao/OrganizacaoPage'
import { PlanilhaPage } from '@/features/planilha/PlanilhaPage'
import { AppLayout } from './layout/AppLayout'

const rootRoute = createRootRoute({
  component: AppLayout,
  // Ano e caixa exibidos em todas as telas; continuam na URL ao trocar de página.
  validateSearch: (search: Record<string, unknown>) => ({ ...validarAno(search), ...validarCaixa(search) }),
  search: { middlewares: [retainSearchParams(['ano', 'caixa'])] },
  notFoundComponent: () => (
    <p className="text-muted-foreground">
      Página não encontrada.{' '}
      <Link to="/" className="underline">
        Voltar para a planilha
      </Link>
    </p>
  ),
})

interface BuscaMes {
  /** Mês de 1 (janeiro) a 12 (dezembro). */
  mes?: number
}

function validarMes(search: Record<string, unknown>): BuscaMes {
  const mes = Number(search.mes)
  return Number.isInteger(mes) && mes >= 1 && mes <= 12 ? { mes } : {}
}

const planilhaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  // Primeiro mês visível na planilha.
  validateSearch: validarMes,
  component: PlanilhaPage,
})

const lancamentosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lancamentos',
  // Filtros e pastas fechadas na lista.
  validateSearch: validarBusca,
  component: LancamentosPage,
})

const organizacaoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/organizacao',
  // Aba aberta (?aba=tags, pastas ou caixas); sem ela, categorias.
  validateSearch: validarAba,
  component: OrganizacaoPage,
})

// Endereço antigo da tela de categorias, que virou uma aba de Organização.
const categoriasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/categorias',
  beforeLoad: () => {
    throw redirect({ to: '/organizacao', replace: true })
  },
})

const economiasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/economias',
  // Meses da reserva de emergência (?reserva=3, 6 ou 12).
  validateSearch: validarBuscaEconomias,
  component: EconomiasPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  // Período do relatório (?de=&ate=); sem ele, o ano inteiro. ?pasta= é a pasta detalhada por categoria.
  validateSearch: validarBuscaDashboard,
  // Recharts só é baixado ao abrir o dashboard.
  component: lazyRouteComponent(() => import('@/features/dashboard/DashboardPage'), 'DashboardPage'),
})

const routeTree = rootRoute.addChildren([
  planilhaRoute,
  lancamentosRoute,
  organizacaoRoute,
  categoriasRoute,
  economiasRoute,
  dashboardRoute,
])

export const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
