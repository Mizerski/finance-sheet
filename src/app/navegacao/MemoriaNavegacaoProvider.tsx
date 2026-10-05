import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter, useSearch, type ParsedLocation } from '@tanstack/react-router'
import { MemoriaNavegacaoContext, type BuscaSalva } from './memoria-context'

interface Visita {
  busca: BuscaSalva
  /** Ano global (`?ano=`) no momento da visita; undefined = ano atual. */
  ano: unknown
}

/**
 * Datas absolutas (o período do dashboard) só valem para o ano em que foram escolhidas.
 * Se o ano mudou em outra tela, a rota volta sem elas e mostra o ano novo.
 */
const CHAVES_DO_ANO = ['de', 'ate']

/** Ano e caixa ficam de fora: o `retainSearchParams` da rota raiz já os mantém. */
function registrar(memoria: Record<string, Visita>, { pathname, search }: ParsedLocation): Record<string, Visita> {
  const { ano, caixa: _, ...busca } = search as BuscaSalva
  return { ...memoria, [pathname]: { busca, ano } }
}

/** Lembra a busca de cada rota para o menu voltar à tela como o usuário a deixou (tudo em memória). */
export function MemoriaNavegacaoProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { ano } = useSearch({ from: '__root__' })
  const [memoria, setMemoria] = useState(() => registrar({}, router.state.location))

  useEffect(
    () => router.subscribe('onResolved', ({ toLocation }) => setMemoria((m) => registrar(m, toLocation))),
    [router],
  )

  const valor = useMemo(
    () => ({
      buscaPara: (rota: string) => {
        const visita = memoria[rota]
        if (!visita) return {}
        if (visita.ano === ano) return visita.busca
        return Object.fromEntries(Object.entries(visita.busca).filter(([chave]) => !CHAVES_DO_ANO.includes(chave)))
      },
    }),
    [memoria, ano],
  )

  return <MemoriaNavegacaoContext value={valor}>{children}</MemoriaNavegacaoContext>
}
