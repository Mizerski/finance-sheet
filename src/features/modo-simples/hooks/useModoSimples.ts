import { useSyncExternalStore } from 'react'
import { assinarModoSimples, escolherModoSimples, modoSimplesLigado } from '../utils/modo-simples'

export function useModoSimples() {
  const ligado = useSyncExternalStore(assinarModoSimples, modoSimplesLigado)
  return { ligado, escolher: escolherModoSimples }
}
