import type { ReactNode } from 'react'
import { COR_RISCO } from '@/features/risco/constants/cores'
import { DataForte, DinheiroForte, Forte, NomeNivel, SaldoForte } from '@/features/risco/components/Destaques'
import { SeloRisco } from '@/features/risco/components/SeloRisco'
import { Ajuda } from '@/shared/components/Ajuda'
import { MaisDetalhes } from '@/shared/components/MaisDetalhes'
import { formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { aporteParaOPrazo, resumirMeta } from '../utils/aportes'
import type { MetaEconomia } from '../model/meta'
import type { AvaliacaoMeta } from '../hooks/useAvaliacaoMeta'

interface DiagnosticoMetaProps {
  /** A meta como está no formulário (o aporte pode ser zero enquanto não foi preenchido). */
  rascunho: MetaEconomia
  /** A meta simulada no fluxo projetado, sobre as outras metas. */
  avaliacao: AvaliacaoMeta | null
  hoje: DataISO
  onUsarAporte: (centavos: number) => void
}

/**
 * Diz quanto guardar para cumprir o prazo, se o aporte cabe no fluxo projetado e como fica o risco do caixa,
 * com atalhos para usar o valor. A caixa ganha a cor do nível que o caixa teria com a meta.
 * Com o valor por mês em branco, sugere um (o maior que não piora o risco).
 */
export function DiagnosticoMeta({ rascunho, avaliacao, hoje, onUsarAporte }: DiagnosticoMetaProps) {
  const { prazo, aporteMensalCentavos: aporte } = rascunho
  const paraOPrazo = aporteParaOPrazo(rascunho)
  const avaliar = avaliacao !== null && aporte > 0
  const sugerir = avaliacao !== null && aporte === 0
  if (paraOPrazo === null && !avaliar && !sugerir) return null

  const nivel = avaliar ? avaliacao.nivel : null
  const cores = nivel ? COR_RISCO[nivel] : null

  return (
    <section
      aria-label="Cabe no seu bolso?"
      className={cn(
        'flex flex-col gap-3 border-2 border-l-8 border-contorno p-3 text-foreground',
        cores ? [cores.suave, cores.faixa] : 'bg-muted/60',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <h3 className={ROTULO}>Cabe no seu bolso?</h3>
          <Ajuda titulo="Cabe no seu bolso?">
            <p>
              O app coloca esta meta (dia, início e fim) junto com as outras e projeta os{' '}
              <Forte>próximos 12 meses</Forte>.
            </p>
            <p>
              <Forte>Cabe</Forte> quando o saldo nunca fica negativo e o aporte não passa do que sobra por mês, em média.
              A cor da caixa é o risco do caixa com a meta.
            </p>
            <p>
              <Forte>Sem piorar</Forte> é o maior aporte que deixa o risco como está; <Forte>no limite</Forte> é o maior
              que ainda cabe.
            </p>
            <p>Com o valor por mês em branco, o app sugere o maior que não piora o risco do caixa.</p>
          </Ajuda>
        </div>
        {nivel && (
          <span className="flex items-center gap-1.5 text-xs">
            Caixa: <SeloRisco nivel={nivel} />
          </span>
        )}
      </div>

      {prazo && paraOPrazo !== null && (
        <Linha
          acao={paraOPrazo > 0 && paraOPrazo !== aporte && <Usar centavos={paraOPrazo} onUsarAporte={onUsarAporte} />}
        >
          <Forte>Para chegar até {formatarMesAno(prazo)}:</Forte> guarde{' '}
          <DinheiroForte centavos={paraOPrazo} className="text-economia" /> por mês.
        </Linha>
      )}

      {avaliar && <Folga rascunho={rascunho} avaliacao={avaliacao} hoje={hoje} onUsarAporte={onUsarAporte} />}
      {sugerir && <Sugestao rascunho={rascunho} avaliacao={avaliacao} hoje={hoje} onUsarAporte={onUsarAporte} />}
    </section>
  )
}

/** Valor por mês em branco: o app sugere o maior que não piora o risco (ou, se qualquer um piora, o maior que cabe). */
function Sugestao({
  rascunho,
  avaliacao,
  hoje,
  onUsarAporte,
}: Omit<DiagnosticoMetaProps, 'avaliacao'> & { avaliacao: AvaliacaoMeta }) {
  const { negativoSemMeta, maximoCentavos: maximo, semPiorarCentavos: semPiorar, nivelSemMeta } = avaliacao

  if (negativoSemMeta) {
    return (
      <Linha situacao={<Situacao cabe={false} />}>
        <Forte>Seu saldo já fica negativo, mesmo sem esta meta:</Forte>{' '}
        <SaldoForte centavos={negativoSemMeta.valorCentavos} /> em <DataForte data={negativoSemMeta.data} />. Primeiro
        corte gastos ou adie contas.
      </Linha>
    )
  }
  if (maximo === 0) {
    return (
      <Linha>
        <Forte>Não sobra dinheiro para guardar</Forte> nos próximos 12 meses sem deixar o saldo negativo.
      </Linha>
    )
  }

  const valor = semPiorar > 0 ? semPiorar : maximo
  const resumo = resumirMeta({ ...rascunho, aporteMensalCentavos: valor }, hoje)

  return (
    <Linha acao={<Usar centavos={valor} onUsarAporte={onUsarAporte} />}>
      <Forte>Sugestão:</Forte> guarde <DinheiroForte centavos={valor} className="text-economia" /> por mês
      {semPiorar > 0 ? (
        <>
          , sem piorar seu caixa (continua <NomeNivel nivel={nivelSemMeta} />).
        </>
      ) : (
        <>. É o máximo que cabe, e o caixa fica mais apertado.</>
      )}
      {resumo.conclusaoNoPlano ? (
        <>
          {' '}
          A meta fica completa em <Forte>{formatarMesAno(resumo.conclusaoNoPlano)}</Forte>.
        </>
      ) : (
        rascunho.valorAlvoCentavos === undefined && (
          <>
            {' '}
            Em 12 meses, <DinheiroForte centavos={resumo.emUmAnoCentavos} />.
          </>
        )
      )}
    </Linha>
  )
}

/** Simula a meta como está (dia, início e fim) e diz se o saldo e o risco aguentam nos próximos 12 meses. */
function Folga({
  rascunho,
  avaliacao,
  hoje,
  onUsarAporte,
}: Omit<DiagnosticoMetaProps, 'avaliacao'> & { avaliacao: AvaliacaoMeta }) {
  const aporte = rascunho.aporteMensalCentavos
  const {
    motivo,
    menorSaldo,
    maximoCentavos: maximo,
    semPiorarCentavos: semPiorar,
    negativoSemMeta,
    sobraMediaCentavos,
    nivel,
    nivelSemMeta,
  } = avaliacao

  if (motivo === 'negativo' && negativoSemMeta) {
    return (
      <Linha situacao={<Situacao cabe={false} />}>
        <Forte>Seu saldo já fica negativo, mesmo sem esta meta:</Forte>{' '}
        <SaldoForte centavos={negativoSemMeta.valorCentavos} /> em <DataForte data={negativoSemMeta.data} />. Primeiro
        corte gastos ou adie contas.
      </Linha>
    )
  }

  const usarSemPiorar = semPiorar > 0 && semPiorar < aporte && (
    <Usar centavos={semPiorar} detalhe="sem piorar" onUsarAporte={onUsarAporte} />
  )
  const usarMaximo = !avaliacao.cabe && maximo > 0 && maximo !== semPiorar && maximo !== aporte && (
    <Usar centavos={maximo} detalhe="no limite" onUsarAporte={onUsarAporte} />
  )
  const acoes = (usarSemPiorar || usarMaximo) && (
    <div className="flex flex-wrap gap-2">
      {usarSemPiorar}
      {usarMaximo}
    </div>
  )
  const diaApertado = menorSaldo && (
    <>
      No dia mais apertado dos próximos 12 meses, <DataForte data={menorSaldo.data} />, sobram{' '}
      <SaldoForte centavos={menorSaldo.valorCentavos} />.
    </>
  )

  if (!motivo) {
    const piora = nivel !== null && nivel > nivelSemMeta
    return (
      <Linha
        situacao={<Situacao cabe />}
        acao={acoes}
        detalhes={
          <>
            <p>{diaApertado}</p>
            {piora && (
              <p>
                {semPiorar > 0 ? (
                  <>
                    Para não piorar o risco, guarde até <DinheiroForte centavos={semPiorar} /> por mês.
                  </>
                ) : (
                  <>Qualquer aporte nesta meta já deixa o caixa mais apertado.</>
                )}
              </p>
            )}
            <p>
              O máximo que cabe nesta meta é <DinheiroForte centavos={maximo} /> por mês.
            </p>
          </>
        }
      >
        {piora ? (
          <>
            <Forte>Mas o caixa aperta:</Forte> passa de <NomeNivel nivel={nivelSemMeta} /> para{' '}
            <NomeNivel nivel={nivel} />.
          </>
        ) : (
          nivel && (
            <>
              <Forte>Seu caixa continua</Forte> <NomeNivel nivel={nivel} />.
            </>
          )
        )}
      </Linha>
    )
  }

  const conclusao = maximo > 0 ? resumirMeta({ ...rascunho, aporteMensalCentavos: maximo }, hoje).conclusaoNoPlano : null
  const depoisDoPrazo = conclusao && rascunho.prazo && conclusao > rascunho.prazo

  return (
    <Linha
      situacao={<Situacao cabe={false} />}
      acao={acoes}
      detalhes={
        <>
          {motivo === 'sobra' && <p>A diferença sairia do dinheiro que já está na conta.</p>}
          {conclusao ? (
            <p>
              Cabem até <DinheiroForte centavos={maximo} />; com esse valor, a meta fica completa em{' '}
              <Forte>{formatarMesAno(conclusao)}</Forte>
              {depoisDoPrazo ? ', depois do prazo.' : '.'}
              {semPiorar > 0 && semPiorar < maximo && (
                <>
                  {' '}
                  Para o caixa continuar <NomeNivel nivel={nivelSemMeta} />, até <DinheiroForte centavos={semPiorar} />.
                </>
              )}
            </p>
          ) : (
            <p>Para caber, reduza gastos ou adie o início da meta.</p>
          )}
        </>
      }
    >
      {motivo === 'saldo' && menorSaldo ? (
        <>
          <Forte>Vai faltar dinheiro:</Forte> o saldo fica em <SaldoForte centavos={menorSaldo.valorCentavos} /> em{' '}
          <DataForte data={menorSaldo.data} />.
        </>
      ) : (
        <>
          <Forte>É mais do que sobra por mês</Forte> (<DinheiroForte centavos={sobraMediaCentavos} />, em média).
        </>
      )}
    </Linha>
  )
}

function Linha({
  situacao,
  acao,
  detalhes,
  children,
}: {
  situacao?: ReactNode
  acao?: ReactNode
  /** O porquê e os números de apoio, que abrem e fecham embaixo. */
  detalhes?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="min-w-0 flex-1 basis-60 text-sm">
          {situacao && <>{situacao} </>}
          {children}
        </p>
        {acao}
      </div>
      {detalhes && (
        <MaisDetalhes rotulo="Ver detalhes" className="text-sm">
          {detalhes}
        </MaisDetalhes>
      )}
    </div>
  )
}

function Situacao({ cabe }: { cabe: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'mr-1 align-[0.1em]',
        cabe ? 'border-contorno bg-card text-foreground' : 'border-negativo bg-negativo-suave text-negativo',
      )}
    >
      {cabe ? 'Cabe' : 'Não cabe'}
    </Badge>
  )
}

function Usar({
  centavos,
  detalhe,
  onUsarAporte,
}: {
  centavos: number
  /** Por que esse valor ("sem piorar", "no limite"). */
  detalhe?: string
  onUsarAporte: (centavos: number) => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(BOTAO, 'h-8 bg-card px-3')}
      onClick={() => onUsarAporte(centavos)}
    >
      Usar {formatarBRL(centavos)}
      {detalhe && <span className="font-normal normal-case tracking-normal">· {detalhe}</span>}
    </Button>
  )
}
