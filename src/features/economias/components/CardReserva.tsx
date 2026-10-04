import { Plus, RefreshCw } from '@/shared/ui/icones'
import { DinheiroForte, Forte } from '@/features/risco/components/Destaques'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CARD, ROTULO, VALOR_DESTAQUE } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import type { ResumoMeta } from '../aportes'
import type { MetaEconomia } from '../meta'
import { alvoDaReserva, MESES_DE_RESERVA, type GastoEssencial, type MesesDeReserva } from '../reserva'
import { BarraProgresso } from './BarraProgresso'

interface CardReservaProps {
  gasto: GastoEssencial
  meses: MesesDeReserva
  onMeses: (meses: MesesDeReserva) => void
  /** A meta usada como reserva, se houver, com a situação dela. */
  existente?: { meta: MetaEconomia; resumo: ResumoMeta }
  onCriar: (alvoCentavos: number) => void
  onAtualizarAlvo: (meta: MetaEconomia, alvoCentavos: number) => void
}

/** Quanto guardar para imprevistos: o gasto essencial de alguns meses, calculado pelos lançamentos. */
export function CardReserva({ gasto, meses, onMeses, existente, onCriar, onAtualizarAlvo }: CardReservaProps) {
  const alvo = alvoDaReserva(gasto.essencialMensalCentavos, meses)
  const { saidasMensaisCentavos: saidas, evitaveisMensaisCentavos: evitaveis, essencialMensalCentavos } = gasto

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Reserva de emergência"
        faixa="bg-amarelo"
        forma={{ forma: 'quadrado', cor: 'tinta' }}
        descricao="Para imprevistos"
        ajuda={
          <Ajuda titulo="Reserva de emergência">
            <p>Dinheiro guardado para imprevistos: perder o emprego, uma doença, o carro quebrar.</p>
            {essencialMensalCentavos > 0 && (
              <p>
                O gasto essencial é tudo o que sai nos próximos 12 meses (
                <DinheiroForte centavos={saidas} /> por mês)
                {evitaveis > 0 ? (
                  <>
                    {' '}
                    menos os gastos evitáveis (<DinheiroForte centavos={evitaveis} />
                    ), que numa emergência dá para cortar.
                  </>
                ) : (
                  <>. Marque os gastos supérfluos com uma tag evitável para tirá-los da conta.</>
                )}
              </p>
            )}
            <p>
              <Forte>Quantos meses guardar?</Forte> O costume é de 3 a 6 com salário fixo e de 6 a 12 com renda variável
              (autônomo, PJ).
            </p>
          </Ajuda>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <ControleSegmentado
          rotulo="Meses de gasto essencial"
          valor={String(meses)}
          opcoes={MESES_DE_RESERVA.map((m) => ({ valor: String(m), rotulo: `${m} meses` }))}
          onChange={(v) => onMeses(Number(v) as MesesDeReserva)}
          className="self-start"
        />

        {essencialMensalCentavos <= 0 ? (
          <p className="text-sm text-muted-foreground">
            Cadastre suas saídas em Lançamentos para calcular quanto a reserva precisa ter.
          </p>
        ) : (
          <>
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className={cn('text-[2.75rem] text-economia', VALOR_DESTAQUE)}>{formatarBRL(alvo)}</span>
              <span className={cn(ROTULO, 'text-muted-foreground')}>para {meses} meses</span>
            </p>
            <p className="text-sm">
              São {meses} meses de <Forte className="tabular-nums">{formatarBRL(essencialMensalCentavos)}</Forte>, o seu
              gasto essencial por mês.
            </p>
          </>
        )}
      </div>

      {essencialMensalCentavos > 0 &&
        (existente ? (
          <Existente {...existente} alvo={alvo} meses={meses} onAtualizarAlvo={onAtualizarAlvo} />
        ) : (
          <div className="border-t-2 border-contorno px-4 py-4 sm:px-5">
            <Button className={BOTAO} onClick={() => onCriar(alvo)}>
              <Plus />
              Criar meta de reserva
            </Button>
          </div>
        ))}
    </Card>
  )
}

/** Progresso da meta de reserva e, se o alvo dela ficou diferente do sugerido, o atalho para atualizar. */
function Existente({
  meta,
  resumo,
  alvo,
  meses,
  onAtualizarAlvo,
}: NonNullable<CardReservaProps['existente']> & {
  alvo: number
  meses: MesesDeReserva
  onAtualizarAlvo: CardReservaProps['onAtualizarAlvo']
}) {
  // Uma reserva sem valor alvo (cofrinho) também pede o valor sugerido.
  const diferente = meta.valorAlvoCentavos !== alvo

  return (
    <div className="flex flex-col gap-3 border-t-2 border-contorno px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={cn(ROTULO, 'truncate')}>{meta.nome}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{formatarBRL(resumo.guardadoCentavos)}</span>
          {meta.valorAlvoCentavos === undefined ? (
            ' guardados'
          ) : (
            <>
              {' '}
              de {formatarBRL(meta.valorAlvoCentavos)} · faltam{' '}
              <span className="font-semibold text-foreground">{formatarBRL(resumo.faltaCentavos)}</span>
            </>
          )}
        </span>
      </div>
      {meta.valorAlvoCentavos !== undefined && (
        <BarraProgresso percentual={resumo.percentual} rotulo={`Progresso de ${meta.nome}`} />
      )}
      {diferente && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="min-w-0 flex-1 basis-60 text-sm">
            {meta.valorAlvoCentavos === undefined ? (
              <>
                <Forte>A reserva não tem um valor para juntar.</Forte> Para{' '}
              </>
            ) : (
              <>
                <Forte>O alvo ficou desatualizado.</Forte> A meta pede {formatarBRL(meta.valorAlvoCentavos)}; para{' '}
              </>
            )}
            {meses} meses de gasto essencial, hoje seriam <Forte className="tabular-nums">{formatarBRL(alvo)}</Forte>.
          </p>
          <Button variant="outline" className={cn(BOTAO, 'h-8 px-3')} onClick={() => onAtualizarAlvo(meta, alvo)}>
            <RefreshCw />
            Atualizar alvo
          </Button>
        </div>
      )}
    </div>
  )
}
