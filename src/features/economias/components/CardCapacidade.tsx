import type { ReactNode } from 'react'
import { formatarData, formatarMesAno } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { CARD, ROTULO, VALOR_DESTAQUE, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { MESES_DA_CAPACIDADE, type CapacidadePoupanca } from '../capacidade'

/** Quanto ainda cabe guardar por mês, pela projeção do saldo, e por quê. */
export function CardCapacidade({ capacidade }: { capacidade: CapacidadePoupanca }) {
  const { capacidadeCentavos, menorSaldo, sobraMediaCentavos, economiaMediaCentavos } = capacidade
  const negativo = menorSaldo !== null && menorSaldo.valorCentavos < 0

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Quanto dá para guardar"
        faixa="bg-amarelo"
        descricao={`Próximos ${MESES_DA_CAPACIDADE} meses, pela projeção do saldo, além das metas atuais`}
      />

      <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={cn('text-[2.75rem]', VALOR_DESTAQUE, capacidadeCentavos > 0 && 'text-economia')}>
            {formatarBRL(capacidadeCentavos)}
          </span>
          <span className={cn(ROTULO, 'text-muted-foreground')}>por mês, a mais</span>
        </p>
        <p className="text-sm text-muted-foreground">
          <Explicacao capacidade={capacidade} />
        </p>
      </div>

      <dl className="grid grid-cols-3 border-t-2 border-foreground">
        <Dado rotulo="Sobra média" curto="Sobra">
          <span className={cn(sobraMediaCentavos < 0 && 'text-negativo')}>{formatarBRL(sobraMediaCentavos)}</span>
        </Dado>
        <Dado rotulo="Metas por mês" curto="Metas">
          <span className="text-economia">{formatarBRL(economiaMediaCentavos)}</span>
        </Dado>
        <Dado rotulo="Menor saldo" curto="Mín. saldo">
          {menorSaldo ? (
            <span className="flex flex-col">
              <span className={cn(VALOR_SALDO, negativo && 'text-negativo')}>{formatarBRL(menorSaldo.valorCentavos)}</span>
              <span className="text-xs font-normal text-muted-foreground">{formatarData(menorSaldo.data)}</span>
            </span>
          ) : (
            '—'
          )}
        </Dado>
      </dl>
    </Card>
  )
}

function Dado({ rotulo, curto, children }: { rotulo: string; curto: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-foreground px-3 py-2.5 not-last:border-r-2 first:pl-4 sm:first:pl-5">
      <dt className={cn(ROTULO, 'truncate text-muted-foreground')}>
        <span className="sm:hidden">{curto}</span>
        <span className="hidden sm:inline">{rotulo}</span>
      </dt>
      <dd className="text-sm font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

/** A narrativa: de onde vem o valor e o que o limita. */
function Explicacao({ capacidade }: { capacidade: CapacidadePoupanca }) {
  const { capacidadeCentavos, motivo, limite, menorSaldo, primeiroAporte, fim } = capacidade
  const periodo = `de ${formatarMesAno(primeiroAporte, 'curto')} a ${formatarMesAno(fim, 'curto')}`

  if (motivo === 'negativo' && menorSaldo) {
    return (
      <>
        O saldo projetado fica negativo em{' '}
        <span className="font-semibold text-foreground">{formatarData(menorSaldo.data)}</span> (
        <span className={cn('font-semibold text-negativo tabular-nums', VALOR_SALDO)}>
          {formatarBRL(menorSaldo.valorCentavos)}
        </span>
        ). Antes de guardar mais, é preciso cobrir essa diferença cortando gastos ou adiando aportes.
      </>
    )
  }

  if (motivo === 'sobra') {
    return capacidadeCentavos === 0 ? (
      <>Nos próximos meses sai tanto quanto entra, então um aporte novo só consumiria o saldo que já está na conta.</>
    ) : (
      <>
        É a sua sobra média: guardando esse valor todo dia 1º, {periodo}, o saldo não fica negativo e o dinheiro que
        já está na conta continua lá.
      </>
    )
  }

  // Motivo `saldo`: a sobra existe, mas chega tarde demais para o dia mais apertado.
  const dia = limite && <span className="font-semibold text-foreground">{formatarData(limite.data)}</span>
  return capacidadeCentavos === 0 ? (
    <>
      O saldo projetado chega perto de zero em {dia}, então não sobra espaço para um aporte novo {periodo} sem deixar
      a conta no vermelho.
    </>
  ) : (
    <>
      Guardando esse valor todo dia 1º, {periodo}, o saldo projetado não fica negativo. É menos que a sobra média
      porque o saldo aperta em {dia}.
    </>
  )
}
