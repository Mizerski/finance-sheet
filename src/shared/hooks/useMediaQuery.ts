import { useCallback, useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  const assinar = useCallback(
    (aoMudar: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', aoMudar)
      return () => mql.removeEventListener('change', aoMudar)
    },
    [query],
  )

  return useSyncExternalStore(assinar, () => window.matchMedia(query).matches)
}
