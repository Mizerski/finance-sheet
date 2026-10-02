import { validarPeriodo, type BuscaPeriodo } from '@/shared/lib/periodo'

export interface BuscaDashboard extends BuscaPeriodo {
  /** Pasta detalhada por categoria no card de pastas. */
  pasta?: string
}

/** `validateSearch` do dashboard: período (`?de=&ate=`) e pasta detalhada. */
export function validarBuscaDashboard(search: Record<string, unknown>): BuscaDashboard {
  const pasta = typeof search.pasta === 'string' && search.pasta ? search.pasta : undefined
  return { ...validarPeriodo(search), ...(pasta && { pasta }) }
}
