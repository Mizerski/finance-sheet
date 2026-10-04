import { useMemo, useState } from 'react'
import { useProjecoesDosCaixas } from '@/features/projecao/projecoes-por-caixa'
import { paraDataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/financas-context'
import { caixasAtivos, ehCartao, type Caixa } from './caixa'
import { resumirCartao, type ResumoCartao } from './cartao'

export interface CartaoHoje {
  caixa: Caixa
  /** null se hoje está fora do cálculo do cartão (começa no futuro). */
  resumo: ResumoCartao | null
}

/** Faturas e limite de hoje de cada cartão ativo, na ordem do seletor. */
export function useCartoes(): CartaoHoje[] {
  const { estado } = useFinancas()
  const { porCaixa } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const { caixas } = estado

  return useMemo(
    () =>
      caixasAtivos(caixas)
        .filter(ehCartao)
        .map((caixa) => ({
          caixa,
          resumo: resumirCartao((porCaixa.get(caixa.id) ?? []).flatMap((p) => p.dias), caixa.cartao, hoje),
        })),
    [caixas, porCaixa, hoje],
  )
}

/** Resumo de hoje de um cartão (null se não for cartão ou se hoje está fora do cálculo dele). */
export function useResumoCartao(caixa: Caixa | null): ResumoCartao | null {
  const { porCaixa } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const projecoes = caixa ? porCaixa.get(caixa.id) : undefined

  return useMemo(() => {
    if (!caixa || !ehCartao(caixa) || !projecoes) return null
    return resumirCartao(projecoes.flatMap((p) => p.dias), caixa.cartao, hoje)
  }, [caixa, projecoes, hoje])
}
