import type { ResumoAno } from '@/features/projecao/projecao'
import { formatarData, nomeDoDiaDaSemana, deDataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { NO_PERIODO, tipoDoPeriodo, type Periodo } from '@/shared/lib/periodo'
import { CartaoEvitaveis, type ResumoEvitaveis } from './CartaoEvitaveis'
import { CartaoIndicador } from './CartaoIndicador'

interface IndicadoresProps {
  /** Resumo dos dias do período (resumirAno serve para qualquer lista de dias). */
  resumo: ResumoAno
  evitaveis: ResumoEvitaveis
  periodo: Periodo
}

export function Indicadores({ resumo, evitaveis, periodo }: IndicadoresProps) {
  const noPeriodo = NO_PERIODO[tipoDoPeriodo(periodo)]
  const fixas = resumo.totalSaidasFixasCentavos
  const variaveis = resumo.totalSaidasVariaveisCentavos
  const economia = resumo.totalEconomiaCentavos
  const sobra = resumo.totalEntradasCentavos - resumo.totalSaidasCentavos - economia
  const menor = resumo.menorSaldo

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <CartaoIndicador
        rotulo={`Entradas ${noPeriodo}`}
        tom="azul"
        forma="circulo"
        valor={formatarBRL(resumo.totalEntradasCentavos)}
        detalhe={`Sobra ${noPeriodo}: ${formatarBRL(sobra)}`}
      />
      <CartaoIndicador
        rotulo={`Saídas ${noPeriodo}`}
        tom="vermelho"
        forma="quadrado"
        valor={formatarBRL(resumo.totalSaidasCentavos)}
        detalhe={`${formatarBRL(fixas)} fixas · ${formatarBRL(variaveis)} variáveis${
          economia > 0 ? ` · ${formatarBRL(economia)} guardados nas metas` : ''
        }`}
      />
      <CartaoIndicador
        rotulo="Saldo final projetado"
        forma="quarto"
        valor={resumo.saldoFinalCentavos === null ? '—' : formatarBRL(resumo.saldoFinalCentavos)}
        negativo={(resumo.saldoFinalCentavos ?? 0) < 0}
        saldo
        detalhe={`Em ${formatarData(periodo.ate)}`}
      />
      <CartaoIndicador
        rotulo={`Menor saldo ${noPeriodo}`}
        forma="semicirculo"
        valor={menor ? formatarBRL(menor.valorCentavos) : '—'}
        negativo={(menor?.valorCentavos ?? 0) < 0}
        saldo
        detalhe={
          menor
            ? `Em ${formatarData(menor.data)}, ${nomeDoDiaDaSemana(deDataISO(menor.data).getDay(), 'longo')}${
                menor.valorCentavos < 0 ? ' · conta no negativo' : ''
              }`
            : 'Sem dias no cálculo'
        }
      />
      {/* Quinto cartão: ocupa a linha inteira enquanto a grade tem duas colunas. */}
      <CartaoEvitaveis resumo={evitaveis} periodo={periodo} className="sm:col-span-2 xl:col-span-1" />
    </div>
  )
}
