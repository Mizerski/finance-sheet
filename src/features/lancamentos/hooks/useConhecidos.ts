import { useMemo } from 'react'
import { caixasAtivos } from '@/features/caixas/model/caixa'
import { useFinancas } from '@/store/context/financas-context'
import { aplicarConhecido, lugaresConhecidos, type Conhecido } from '../utils/conhecidos'
import type { RascunhoLancamento } from '../utils/formulario'

/** Os lugares conhecidos (descrições já lançadas) e como aplicar um deles ao rascunho. */
export function useConhecidos() {
  const { estado } = useFinancas()
  const conhecidos = useMemo(() => lugaresConhecidos(estado.lancamentos), [estado.lancamentos])
  const ativos = useMemo(() => new Set(caixasAtivos(estado.caixas).map((c) => c.id)), [estado.caixas])
  const aplicar = (r: RascunhoLancamento, c: Conhecido) => aplicarConhecido(r, c, (id) => ativos.has(id))
  return { conhecidos, aplicar }
}
