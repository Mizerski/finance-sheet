import type { ReactNode } from 'react'
import { formatarData, formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { aporteParaOPrazo, resumirMeta } from '../aportes'
import type { CapacidadePoupanca } from '../capacidade'
import type { MetaEconomia } from '../meta'

interface DiagnosticoMetaProps {
  /** A meta como está no formulário (o aporte pode ser zero enquanto não foi preenchido). */
  rascunho: MetaEconomia
  /** Capacidade sem esta meta: o espaço que ela tem no fluxo. */
  capacidade: CapacidadePoupanca | null
  hoje: DataISO
  onUsarAporte: (centavos: number) => void
}

/** Diz quanto guardar para cumprir o prazo e se o aporte cabe no fluxo projetado, com atalhos para usar o valor. */
export function DiagnosticoMeta({ rascunho, capacidade, hoje, onUsarAporte }: DiagnosticoMetaProps) {
  const { prazo, aporteMensalCentavos: aporte } = rascunho
  const paraOPrazo = aporteParaOPrazo(rascunho)
  const temCapacidade = capacidade !== null && aporte > 0
  if (paraOPrazo === null && !temCapacidade) return null

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

      {temCapacidade && <Folga rascunho={rascunho} capacidade={capacidade} hoje={hoje} onUsarAporte={onUsarAporte} />}
    </section>
  )
}

/** Compara o aporte com o que cabe por mês nos próximos 12 meses. */
function Folga({
  rascunho,
  capacidade,
  hoje,
  onUsarAporte,
}: Omit<DiagnosticoMetaProps, 'capacidade'> & { capacidade: CapacidadePoupanca }) {
  const aporte = rascunho.aporteMensalCentavos
  const cabe = capacidade.capacidadeCentavos

  if (capacidade.motivo === 'negativo' && capacidade.menorSaldo) {
    return (
      <Linha situacao={<Situacao cabe={false} />}>
        O saldo projetado já fica negativo em{' '}
        <span className="font-semibold text-foreground">{formatarData(capacidade.menorSaldo.data)}</span>; um aporte
        novo aumenta a diferença.
      </Linha>
    )
  }

  if (aporte <= cabe) {
    return (
      <Linha situacao={<Situacao cabe />}>
        Depois deste aporte ainda sobram{' '}
        <span className="font-semibold text-foreground tabular-nums">{formatarBRL(cabe - aporte)}</span> por mês nos
        próximos 12 meses.
      </Linha>
    )
  }

  // Com o que cabe, quando a meta termina (e se perde o prazo).
  const conclusao = cabe > 0 ? resumirMeta({ ...rascunho, aporteMensalCentavos: cabe }, hoje).conclusaoNoPlano : null
  const depoisDoPrazo = conclusao && rascunho.prazo && conclusao > rascunho.prazo

  return (
    <Linha situacao={<Situacao cabe={false} />} acao={cabe > 0 && <Usar centavos={cabe} onUsarAporte={onUsarAporte} />}>
      Passa <span className="font-semibold text-saida tabular-nums">{formatarBRL(aporte - cabe)}</span> do que cabe
      por mês ({formatarBRL(cabe)}).
      {conclusao ? (
        <>
          {' '}
          Com {formatarBRL(cabe)}, a meta fica completa em{' '}
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
