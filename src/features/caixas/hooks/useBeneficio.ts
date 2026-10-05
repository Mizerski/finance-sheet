import { useMemo, useState } from 'react'
import { useProjecoesDosCaixas } from '@/features/projecao/hooks/useProjecoesDosCaixas'
import { paraDataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/context/financas-context'
import { caixasAtivos, lancamentosDoCaixa, type Caixa } from '../model/caixa'
import { idsDeRecarga, resumirBeneficio, type ResumoBeneficio } from '../utils/beneficio'

export interface BeneficioHoje {
  caixa: Caixa
  /** null se hoje está fora do cálculo do benefício (começa no futuro). */
  resumo: ResumoBeneficio | null
}

/** Saldo, próxima recarga e quanto dá por dia de cada benefício ativo, na ordem do seletor. */
export function useBeneficios(): BeneficioHoje[] {
  const { estado } = useFinancas()
  const { porCaixa } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const { caixas, lancamentos } = estado

  return useMemo(
    () =>
      caixasAtivos(caixas)
        .filter((c) => c.tipo === 'beneficio')
        .map((caixa) => ({
          caixa,
          resumo: resumirBeneficio(
            (porCaixa.get(caixa.id) ?? []).flatMap((p) => p.dias),
            idsDeRecarga(lancamentosDoCaixa(lancamentos, caixa.id)),
            hoje,
          ),
        })),
    [caixas, lancamentos, porCaixa, hoje],
  )
}

/** Resumo de hoje de um benefício (null se não for benefício ou se hoje está fora do cálculo dele). */
export function useResumoBeneficio(caixa: Caixa | null): ResumoBeneficio | null {
  const { estado } = useFinancas()
  const { porCaixa } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const projecoes = caixa ? porCaixa.get(caixa.id) : undefined
  const { lancamentos } = estado

  return useMemo(() => {
    if (!caixa || caixa.tipo !== 'beneficio' || !projecoes) return null
    return resumirBeneficio(
      projecoes.flatMap((p) => p.dias),
      idsDeRecarga(lancamentosDoCaixa(lancamentos, caixa.id)),
      hoje,
    )
  }, [caixa, projecoes, lancamentos, hoje])
}
