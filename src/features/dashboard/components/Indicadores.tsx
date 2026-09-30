import type { ResumoAno } from '@/features/projecao/projecao'
import { formatarData, nomeDoDiaDaSemana, deDataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { SERIES } from '../graficos'
import { NO_PERIODO, tipoDoPeriodo, type Periodo } from '../periodo'
import { CartaoIndicador } from './CartaoIndicador'

/** `resumo` é o resumo dos dias do período (resumirAno serve para qualquer lista de dias). */
export function Indicadores({ resumo, periodo }: { resumo: ResumoAno; periodo: Periodo }) {
  const noPeriodo = NO_PERIODO[tipoDoPeriodo(periodo)]
  const fixas = resumo.totalSaidasFixasCentavos
  const variaveis = resumo.totalSaidasVariaveisCentavos
  const economia = resumo.totalEconomiaCentavos
  const sobra = resumo.totalEntradasCentavos - resumo.totalSaidasCentavos - economia
  const menor = resumo.menorSaldo

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <CartaoIndicador
        rotulo={`Entradas ${noPeriodo}`}
        corMarca={SERIES.entradas.color}
        valor={formatarBRL(resumo.totalEntradasCentavos)}
        detalhe={`Sobra ${noPeriodo}: ${formatarBRL(sobra)}`}
      />
      <CartaoIndicador
        rotulo={`Saídas ${noPeriodo}`}
        corMarca={SERIES.saidas.color}
        valor={formatarBRL(resumo.totalSaidasCentavos)}
        detalhe={`${formatarBRL(fixas)} fixas · ${formatarBRL(variaveis)} variáveis${
          economia > 0 ? ` · ${formatarBRL(economia)} guardados nas metas` : ''
        }`}
      />
      <CartaoIndicador
        rotulo="Saldo final projetado"
        valor={resumo.saldoFinalCentavos === null ? '—' : formatarBRL(resumo.saldoFinalCentavos)}
        negativo={(resumo.saldoFinalCentavos ?? 0) < 0}
        saldo
        detalhe={`Em ${formatarData(periodo.ate)}`}
      />
      <CartaoIndicador
        rotulo={`Menor saldo ${noPeriodo}`}
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
    </div>
  )
}
