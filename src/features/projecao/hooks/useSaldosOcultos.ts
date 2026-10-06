import { useEffect } from 'react'
import { useFinancas } from '@/store/context/financas-context'

/** Saldos borrados até passar o mouse em cima (para mostrar a tela a alguém). Vale para o app todo. */
export function useSaldosOcultos() {
  const { estado, dispatch } = useFinancas()
  return { ocultos: estado.saldosOcultos, alternar: () => dispatch({ tipo: 'saldos/alternarVisibilidade' }) }
}

/** Marca o `<html>` com os saldos ocultos (o borrão é a regra `.valor-saldo` em index.css). Uma vez, no AppLayout. */
export function useAplicarSaldosOcultos() {
  const { estado } = useFinancas()
  useEffect(() => {
    document.documentElement.toggleAttribute('data-saldos-ocultos', estado.saldosOcultos)
  }, [estado.saldosOcultos])
}
