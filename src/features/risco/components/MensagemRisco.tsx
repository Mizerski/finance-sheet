import { diasDeGastos, textoDias, type AnaliseRisco } from '../utils/risco'
import { CONSELHO, CONSELHO_NEGATIVO } from '../constants/textos'
import { DataForte, Forte, SaldoForte } from './Destaques'

/**
 * O dia mais apertado em uma frase, em linguagem de todo dia: quanto sobra e para quantos dias de gastos isso dá.
 * `curta` deixa os dias de fora (vão para a ajuda).
 */
export function FraseDiaApertado({ risco, curta }: { risco: AnaliseRisco; curta?: boolean }) {
  const { menorSaldo, referenciaCentavos, nivel, primeiroDiaNoNivel } = risco
  const dias = diasDeGastos(menorSaldo.valorCentavos, referenciaCentavos)
  const antes = nivel >= 3 && primeiroDiaNoNivel < menorSaldo.data && (
    <>
      {' '}
      Começa a apertar em <DataForte data={primeiroDiaNoNivel} />.
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
      O momento mais apertado é <DataForte data={menorSaldo.data} />: {nivel >= 4 ? 'sobram só' : 'sobram'}{' '}
      <SaldoForte centavos={menorSaldo.valorCentavos} /> na conta
      {dias !== null && !curta && (
        <>
          , o que dá para <Forte>{textoDias(dias)}</Forte> de gastos
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
        vai faltar dinheiro a partir de <DataForte data={primeiroNegativo} />. No pior dia,{' '}
        <DataForte data={menorSaldo.data} />, a conta fica em <SaldoForte centavos={menorSaldo.valorCentavos} />
      </>
    )
  }
  return (
    <>
      em <DataForte data={menorSaldo.data} /> a conta fica em <SaldoForte centavos={menorSaldo.valorCentavos} />
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
