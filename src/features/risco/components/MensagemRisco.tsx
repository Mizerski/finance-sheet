import { formatarBRL } from '@/shared/lib/dinheiro'
import { percentualDoMes, type AnaliseRisco } from '../utils/risco'
import { CONSELHO, CONSELHO_NEGATIVO } from '../constants/textos'
import { DataForte, Forte, SaldoForte } from './Destaques'

/**
 * O dia mais apertado em uma frase: quanto sobra e quanto isso é de um mês de gastos.
 * `curta` deixa de fora a comparação com o mês de gastos (vai para a ajuda).
 */
export function FraseDiaApertado({ risco, curta }: { risco: AnaliseRisco; curta?: boolean }) {
  const { menorSaldo, referenciaCentavos, nivel, primeiroDiaNoNivel } = risco
  const percentual = percentualDoMes(menorSaldo.valorCentavos, referenciaCentavos)
  const antes = nivel >= 3 && primeiroDiaNoNivel < menorSaldo.data && (
    <>
      {' '}
      O aperto começa em <DataForte data={primeiroDiaNoNivel} />.
    </>
  )

  if (menorSaldo.valorCentavos < 0) {
    return (
      <>
        Com o que está cadastrado, <FraseFalta risco={risco} />.
      </>
    )
  }
  return (
    <>
      No dia mais apertado, <DataForte data={menorSaldo.data} />, {nivel >= 4 ? 'sobram só' : 'sobram'}{' '}
      <SaldoForte centavos={menorSaldo.valorCentavos} /> na conta
      {percentual !== null && !curta && (
        <>
          : <Forte>{percentual < 1 ? 'menos de 1%' : `${percentual}%`} do que você gasta num mês</Forte> (
          <span className="tabular-nums">{formatarBRL(referenciaCentavos)}</span>)
        </>
      )}
      .{antes}
    </>
  )
}

/**
 * Quando falta dinheiro: desde quando o saldo fica negativo e o pior dia.
 * "o saldo fica negativo a partir de 03/11/2026, e o pior dia é 04/09/2027, com -R$ 1.050,00"
 */
export function FraseFalta({ risco }: { risco: AnaliseRisco }) {
  const { primeiroNegativo, menorSaldo } = risco
  if (primeiroNegativo && primeiroNegativo < menorSaldo.data) {
    return (
      <>
        o saldo fica negativo a partir de <DataForte data={primeiroNegativo} />, e o pior dia é{' '}
        <DataForte data={menorSaldo.data} />, com <SaldoForte centavos={menorSaldo.valorCentavos} />
      </>
    )
  }
  return (
    <>
      em <DataForte data={menorSaldo.data} /> o saldo fica em <SaldoForte centavos={menorSaldo.valorCentavos} />
    </>
  )
}

/** Desde quando o caixa fica no pior nível, se for antes do dia mais apertado: " a partir de 05/10/2026". */
export function DesdeQuando({ risco }: { risco: AnaliseRisco }) {
  if (risco.primeiroDiaNoNivel >= risco.menorSaldo.data) return null
  return (
    <>
      {' '}
      a partir de <DataForte data={risco.primeiroDiaNoNivel} />
    </>
  )
}

/** Título e conselho do nível ("Pouca folga. Uma conta nova…"). */
export function ConselhoRisco({ risco }: { risco: AnaliseRisco }) {
  const conselho = risco.menorSaldo.valorCentavos < 0 ? CONSELHO_NEGATIVO : CONSELHO[risco.nivel]
  return (
    <>
      <Forte>{conselho.titulo}</Forte> {conselho.texto}
    </>
  )
}
