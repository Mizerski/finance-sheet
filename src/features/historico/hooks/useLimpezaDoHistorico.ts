import { useEffect, useSyncExternalStore } from 'react'
import { useFinancas } from '@/store/context/financas-context'
import { assinarPrazoDoHistorico, escolherPrazoDoHistorico, limiteDoPrazo, prazoDoHistorico } from '../utils/limpeza'

/** Por quantos dias o histórico guarda os registros (0 = sem prazo), e a troca. */
export function usePrazoDoHistorico() {
  const prazo = useSyncExternalStore(assinarPrazoDoHistorico, prazoDoHistorico)
  return { prazo, escolher: escolherPrazoDoHistorico }
}

/**
 * Apaga sozinho os registros mais velhos que o prazo escolhido, ao abrir o app e ao trocar o prazo. Fica no
 * `AppLayout`, para valer mesmo sem abrir a aba Histórico.
 */
export function useLimpezaDoHistorico() {
  const { estado, dispatch } = useFinancas()
  const { prazo } = usePrazoDoHistorico()
  const maisAntiga = estado.atividades[0]?.em

  useEffect(() => {
    if (!prazo || !maisAntiga) return
    const antesDe = limiteDoPrazo(prazo, new Date())
    if (maisAntiga < antesDe) dispatch({ tipo: 'atividade/limpar', antesDe })
  }, [prazo, maisAntiga, dispatch])
}
