import type { DiaProjetado } from '@/features/projecao/projecao'

/** Valores das colunas de movimento da planilha. */
export interface ColunasPlanilha {
  entradasCentavos: number
  saidasFixasCentavos: number
  saidasVariaveisCentavos: number
}

/**
 * Como num extrato, a planilha mostra a transferência na conta: a que chega em Entradas e a que sai em Fixas
 * (recorrente) ou Diário (única). Nos relatórios ela fica de fora, porque não é entrada nem gasto.
 */
export function colunasDoDia(d: DiaProjetado): ColunasPlanilha {
  let fixas = d.saidasFixasCentavos
  let variaveis = d.saidasVariaveisCentavos
  for (const m of d.transferencias) {
    if (m.sentido !== 'saida') continue
    if (m.natureza === 'fixa') fixas += m.valorCentavos
    else variaveis += m.valorCentavos
  }
  return {
    entradasCentavos: d.entradasCentavos + d.transferenciaEntradaCentavos,
    saidasFixasCentavos: fixas,
    saidasVariaveisCentavos: variaveis,
  }
}

/** Soma das colunas dos dias (o rodapé do mês). */
export function somarColunas(dias: DiaProjetado[]): ColunasPlanilha {
  const total: ColunasPlanilha = { entradasCentavos: 0, saidasFixasCentavos: 0, saidasVariaveisCentavos: 0 }
  for (const d of dias) {
    const c = colunasDoDia(d)
    total.entradasCentavos += c.entradasCentavos
    total.saidasFixasCentavos += c.saidasFixasCentavos
    total.saidasVariaveisCentavos += c.saidasVariaveisCentavos
  }
  return total
}
