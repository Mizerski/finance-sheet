import type { ReactNode } from 'react'
import { formatarData, formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, ROTULO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { aporteParaOPrazo, resumirMeta } from '../aportes'
import type { MetaEconomia } from '../meta'
import type { AvaliacaoMeta } from '../useAvaliacaoMeta'

interface DiagnosticoMetaProps {
  /** A meta como está no formulário (o aporte pode ser zero enquanto não foi preenchido). */
  rascunho: MetaEconomia
  /** A meta simulada no fluxo projetado, sobre as outras metas. */
  avaliacao: AvaliacaoMeta | null
  hoje: DataISO
  onUsarAporte: (centavos: number) => void
}

/** Diz quanto guardar para cumprir o prazo e se o aporte cabe no fluxo projetado, com atalhos para usar o valor. */
export function DiagnosticoMeta({ rascunho, avaliacao, hoje, onUsarAporte }: DiagnosticoMetaProps) {
  const { prazo, aporteMensalCentavos: aporte } = rascunho
  const paraOPrazo = aporteParaOPrazo(rascunho)
  const avaliar = avaliacao !== null && aporte > 0
  if (paraOPrazo === null && !avaliar) return null

  return (
    <section aria-label="Cabe no seu fluxo?" className="flex flex-col gap-3 border-2 border-foreground bg-muted/60 p-3">
      <h3 className={ROTULO}>Cabe no seu fluxo?</h3>

      {prazo && paraOPrazo !== null && (
        <Linha
          acao={
            paraOPrazo > 0 && paraOPrazo !== aporte && <Usar centavos={paraOPrazo} onUsarAporte={onUsarAporte} />
          }
        >
          Para completar até <span className="font-semibold text-foreground">{formatarMesAno(prazo)}</span>:{' '}
          <span className="font-semibold text-economia tabular-nums">{formatarBRL(paraOPrazo)}</span> por mês.
        </Linha>
      )}

      {avaliar && <Folga rascunho={rascunho} avaliacao={avaliacao} hoje={hoje} onUsarAporte={onUsarAporte} />}
    </section>
  )
}

/** Um saldo e o dia em que acontece: "R$ 48,18 em 13/10/2026". */
function SaldoNoDia({ saldo }: { saldo: { data: DataISO; valorCentavos: number } }) {
  return (
    <>
      <span
        className={cn('font-semibold tabular-nums', VALOR_SALDO, saldo.valorCentavos < 0 ? 'text-negativo' : 'text-foreground')}
      >
        {formatarBRL(saldo.valorCentavos)}
      </span>{' '}
      em <span className="font-semibold text-foreground">{formatarData(saldo.data)}</span>
    </>
  )
}

/** Simula a meta como está (dia, início e fim) e diz se o saldo aguenta nos próximos 12 meses. */
function Folga({
  rascunho,
  avaliacao,
  hoje,
  onUsarAporte,
}: Omit<DiagnosticoMetaProps, 'avaliacao'> & { avaliacao: AvaliacaoMeta }) {
  const aporte = rascunho.aporteMensalCentavos
  const { motivo, menorSaldo, maximoCentavos: maximo, negativoSemMeta, sobraMediaCentavos } = avaliacao

  if (motivo === 'negativo' && negativoSemMeta) {
    return (
      <Linha situacao={<Situacao cabe={false} />}>
        Mesmo sem esta meta, o saldo projetado fica em <SaldoNoDia saldo={negativoSemMeta} />; um aporte novo aumenta a
        diferença.
      </Linha>
    )
  }

  if (!motivo) {
    return (
      <Linha situacao={<Situacao cabe />}>
        {menorSaldo && (
          <>
            O saldo mais apertado nos próximos 12 meses fica em <SaldoNoDia saldo={menorSaldo} />.{' '}
          </>
        )}
        Nesta meta cabem até <span className="font-semibold text-foreground tabular-nums">{formatarBRL(maximo)}</span>{' '}
        por mês.
      </Linha>
    )
  }

  // Com o maior aporte que cabe, quando a meta termina (e se perde o prazo).
  const conclusao = maximo > 0 ? resumirMeta({ ...rascunho, aporteMensalCentavos: maximo }, hoje).conclusaoNoPlano : null
  const depoisDoPrazo = conclusao && rascunho.prazo && conclusao > rascunho.prazo

  return (
    <Linha
      situacao={<Situacao cabe={false} />}
      acao={maximo > 0 && maximo !== aporte && <Usar centavos={maximo} onUsarAporte={onUsarAporte} />}
    >
      {motivo === 'saldo' && menorSaldo ? (
        <>Com esse aporte, o saldo fica em <SaldoNoDia saldo={menorSaldo} />.</>
      ) : (
        <>
          É mais que a sua sobra média de{' '}
          <span className="font-semibold text-foreground tabular-nums">{formatarBRL(sobraMediaCentavos)}</span> por mês:
          a diferença sairia do dinheiro que já está na conta.
        </>
      )}
      {conclusao ? (
        <>
          {' '}
          Cabem até {formatarBRL(maximo)}; com esse valor, a meta fica completa em{' '}
          <span className="font-semibold text-foreground">{formatarMesAno(conclusao)}</span>
          {depoisDoPrazo ? ', depois do prazo.' : '.'}
        </>
      ) : (
        ' Para caber, reduza gastos ou adie o início da meta.'
      )}
    </Linha>
  )
}

function Linha({ situacao, acao, children }: { situacao?: ReactNode; acao?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <p className="min-w-0 flex-1 basis-60 text-sm text-muted-foreground">
        {situacao && <>{situacao} </>}
        {children}
      </p>
      {acao}
    </div>
  )
}

function Situacao({ cabe }: { cabe: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'mr-1 align-[0.1em]',
        cabe ? 'border-economia bg-economia-suave text-economia' : 'border-negativo bg-negativo-suave text-negativo',
      )}
    >
      {cabe ? 'Cabe' : 'Não cabe'}
    </Badge>
  )
}

function Usar({ centavos, onUsarAporte }: { centavos: number; onUsarAporte: (centavos: number) => void }) {
  return (
    <Button type="button" variant="outline" className={cn(BOTAO, 'h-8 px-3')} onClick={() => onUsarAporte(centavos)}>
      Usar {formatarBRL(centavos)}
    </Button>
  )
}
