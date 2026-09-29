import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Link,
  retainSearchParams,
} from '@tanstack/react-router'
import { CategoriasPage } from '@/features/categorias/CategoriasPage'
import { validarFiltros } from '@/features/lancamentos/filtros'
import { validarPeriodo } from '@/features/dashboard/periodo'
import { validarAno } from '@/features/projecao/anos'
import { LancamentosPage } from '@/features/lancamentos/LancamentosPage'
import { PlanilhaPage } from '@/features/planilha/PlanilhaPage'
import { AppLayout } from './layout/AppLayout'

const rootRoute = createRootRoute({
  component: AppLayout,
  // Ano exibido em todas as telas; continua na URL ao trocar de página.
  validateSearch: validarAno,
  search: { middlewares: [retainSearchParams(['ano'])] },
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
  validateSearch: validarFiltros,
  component: LancamentosPage,
})

const categoriasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/categorias',
  component: CategoriasPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  // Período do relatório (?de=&ate=); sem ele, o ano inteiro.
  validateSearch: validarPeriodo,
  // Recharts só é baixado ao abrir o dashboard.
  component: lazyRouteComponent(() => import('@/features/dashboard/DashboardPage'), 'DashboardPage'),
})

const routeTree = rootRoute.addChildren([
  planilhaRoute,
  lancamentosRoute,
  categoriasRoute,
  dashboardRoute,
])

export const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
