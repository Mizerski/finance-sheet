import { Link } from '@tanstack/react-router'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { formatarPercentual } from '@/shared/lib/percentual'
import { NO_ANTERIOR, NO_PERIODO, tipoDoPeriodo, type Periodo } from '@/shared/lib/periodo'
import { CartaoIndicador } from './CartaoIndicador'

/** Gastos com tags evitáveis no período e no período anterior. */
export interface ResumoEvitaveis {
  /** Alguma tag está marcada como evitável. */
  temTagEvitavel: boolean
  totalCentavos: number
  saidasCentavos: number
  /** Mesmo total no período anterior; null se ele não foi todo calculado. */
  anteriorCentavos: number | null
}

function comparar(atual: number, anterior: number, periodo: Periodo): string {
  const diferenca = atual - anterior
  const noAnterior = NO_ANTERIOR[tipoDoPeriodo(periodo)]
  if (diferenca === 0) return `o mesmo que ${noAnterior}`
  return `${formatarBRL(Math.abs(diferenca))} a ${diferenca > 0 ? 'mais' : 'menos'} que ${noAnterior}`
}

interface CartaoEvitaveisProps {
  resumo: ResumoEvitaveis
  periodo: Periodo
  className?: string
}

/** Indicador de gastos evitáveis (tags marcadas como evitáveis, ex.: Superficial). */
export function CartaoEvitaveis({ resumo, periodo, className }: CartaoEvitaveisProps) {
  const { temTagEvitavel, totalCentavos, saidasCentavos, anteriorCentavos } = resumo

  return (
    <CartaoIndicador
      rotulo={`Gastos evitáveis ${NO_PERIODO[tipoDoPeriodo(periodo)]}`}
      valor={temTagEvitavel ? formatarBRL(totalCentavos) : '—'}
      className={className}
      tom="amarelo"
      forma="triangulo"
      detalhe={
        temTagEvitavel ? (
          `${formatarPercentual(totalCentavos, saidasCentavos)} das saídas${
            anteriorCentavos === null ? '' : ` · ${comparar(totalCentavos, anteriorCentavos, periodo)}`
          }`
        ) : (
          <>
            Marque uma tag como evitável em{' '}
            <Link to="/organizacao" search={{ aba: 'tags' }} className="font-semibold underline decoration-2 underline-offset-4">
              Organização
            </Link>
          </>
        )
      }
    />
  )
}
