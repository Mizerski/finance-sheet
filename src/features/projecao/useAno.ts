import { useNavigate, useSearch } from '@tanstack/react-router'
import { primeiraData } from '@/features/caixas/caixa'
import { useFinancas } from '@/store/financas-context'
import { intervaloDeAnos, limitarAno, type IntervaloAnos } from './anos'

const ANO_ATUAL = new Date().getFullYear()

export interface AnoSelecionado {
  ano: number
  anoAtual: number
  intervalo: IntervaloAnos
  /** Troca o ano na URL, mantendo os outros parâmetros da tela. */
  irParaAno: (ano: number) => void
}

/** Ano exibido nas telas, lido do `?ano=` da URL (ano atual quando ausente). */
export function useAno(): AnoSelecionado {
  const { estado } = useFinancas()
  const busca = useSearch({ from: '__root__' })
  const navigate = useNavigate()
  const intervalo = intervaloDeAnos(primeiraData(estado.caixas), ANO_ATUAL)

  return {
    ano: limitarAno(busca.ano ?? ANO_ATUAL, intervalo),
    anoAtual: ANO_ATUAL,
    intervalo,
    irParaAno: (ano) =>
      navigate({
        to: '.',
        search: (anterior) => ({ ...anterior, ano: ano === ANO_ATUAL ? undefined : limitarAno(ano, intervalo) }),
        replace: true,
        resetScroll: false,
      }),
  }
}
