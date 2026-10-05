import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Link,
  redirect,
  retainSearchParams,
} from '@tanstack/react-router'
import { validarCaixa } from '@/features/caixas/utils/busca'
import { validarBuscaEconomias } from '@/features/economias/utils/busca'
import { EconomiasPage } from '@/features/economias/EconomiasPage'
import { validarBusca } from '@/features/lancamentos/utils/filtros'
import { validarBuscaDashboard } from '@/features/dashboard/utils/busca'
import { validarAno } from '@/features/projecao/utils/anos'
import { LancamentosPage } from '@/features/lancamentos/LancamentosPage'
import { validarAba } from '@/features/organizacao/utils/aba'
import { OrganizacaoPage } from '@/features/organizacao/OrganizacaoPage'
import { PlanilhaPage } from '@/features/planilha/PlanilhaPage'
import { AppLayout } from './layout/AppLayout'

/** Ano e caixa valem em todas as telas e continuam na URL ao trocar de página. */
const rootRoute = createRootRoute({
  component: AppLayout,
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

/** `?mes=`: primeiro mês visível na planilha. */
const planilhaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validarMes,
  component: PlanilhaPage,
})

/** Filtros, ordem e pastas fechadas da lista. */
const lancamentosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lancamentos',
  validateSearch: validarBusca,
  component: LancamentosPage,
})

/** `?aba=`: tags, pastas ou caixas; sem ela, categorias. */
const organizacaoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/organizacao',
  validateSearch: validarAba,
  component: OrganizacaoPage,
})

/** Endereço antigo da tela de categorias, que virou uma aba de Organização. */
const categoriasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/categorias',
  beforeLoad: () => {
    throw redirect({ to: '/organizacao', replace: true })
  },
})

/** `?reserva=`: meses da reserva de emergência (3, 6 ou 12). */
const economiasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/economias',
  validateSearch: validarBuscaEconomias,
  component: EconomiasPage,
})

/**
 * `?de=&ate=`: período do relatório (sem ele, o ano inteiro); `?pasta=`: pasta detalhada por categoria. O Recharts só
 * é baixado ao abrir esta tela.
 */
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  validateSearch: validarBuscaDashboard,
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
