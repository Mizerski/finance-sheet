import type { ReactNode } from 'react'
import { CalendarCheck, Pencil, PiggyBank, Receipt, Trash2 } from '@/shared/ui/icones'
import { formatarData, formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { Forma } from '@/shared/components/Forma'
import { BOTAO, CARD, ROTULO, TITULO_CARD, VALOR_DESTAQUE } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import type { ResumoMeta } from '../utils/aportes'
import type { MetaEconomia } from '../model/meta'
import { BarraProgresso } from './BarraProgresso'

interface CardMetaProps {
  meta: MetaEconomia
  /** A meta em destaque no Dashboard (a próxima a terminar). */
  principal?: boolean
  resumo: ResumoMeta
  hoje: DataISO
  /** Nome da conta que recebe os aportes, quando o dinheiro vai para outra conta. */
  destino?: string
  /** Clique em qualquer parte do card (fora dos botões): abre o extrato da meta. */
  onVer: () => void
  onEditar: () => void
  onAjustar: () => void
  /** Tirar dinheiro da meta para usar. */
  onUsar: () => void
  /** Voltar a guardar numa meta encerrada. */
  onRetomar: () => void
  onExcluir: () => void
}

/** O card todo abre o extrato (como a linha de um lançamento); botões e links dentro dele seguem com a própria ação. */
export function CardMeta({
  meta,
  principal,
  resumo,
  hoje,
  destino,
  onVer,
  onEditar,
  onAjustar,
  onUsar,
  onRetomar,
  onExcluir,
}: CardMetaProps) {
  const percentual = Math.floor(resumo.percentual * 100)
  const fimDoAno = `${hoje.slice(0, 4)}-12-31`
  const atrasada = !!meta.prazo && !resumo.concluida && !resumo.noPrazo
  const alvo = meta.valorAlvoCentavos

  return (
    <Card
      onClick={(e) => !(e.target as HTMLElement).closest('button, a') && onVer()}
      className={cn(
        CARD,
        'cursor-pointer overflow-hidden transition duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-bloco-lg motion-reduce:hover:translate-0',
      )}
    >
      <header className="flex items-stretch border-b-2 border-contorno">
        <span aria-hidden className="flex w-12 shrink-0 items-center justify-center border-r-2 border-contorno bg-amarelo text-tinta sm:w-14">
          <Forma forma="semicirculo" cor="tinta" className="size-7" />
        </span>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3 py-3 pr-2 pl-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className={cn('min-w-0', TITULO_CARD)}>
                <button
                  type="button"
                  onClick={onVer}
                  title="Ver o extrato"
                  className="block max-w-full truncate text-left uppercase underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {meta.nome}
                </button>
              </h2>
              {principal && (
                <Badge className="shrink-0 border-contorno bg-amarelo text-tinta">Principal</Badge>
              )}
              {resumo.encerrada && (
                <Badge variant="outline" className="shrink-0 text-muted-foreground">
                  Encerrada
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="tabular-nums">{formatarBRL(meta.aporteMensalCentavos)}</span> todo dia {meta.diaDoMes} ·
              desde {formatarData(meta.inicio)}
              {meta.naContaCentavos !== undefined ? (
                <>
                  {' '}
                  · <span className="tabular-nums">{formatarBRL(meta.naContaCentavos)}</span> já na conta
                </>
              ) : (
                !!meta.jaGuardadoCentavos && (
                  <>
                    {' '}
                    · começou com <span className="tabular-nums">{formatarBRL(meta.jaGuardadoCentavos)}</span>
                  </>
                )
              )}
              {meta.prazo && <> · até {formatarMesAno(meta.prazo, 'curto')}</>}
              {destino && <> · vai para {destino}</>}
            </p>
          </div>
          <div className="flex shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground"
              onClick={onEditar}
              aria-label={`Editar ${meta.nome}`}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-destructive"
              onClick={onExcluir}
              aria-label={`Excluir ${meta.nome}`}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </header>

      {alvo === undefined ? (
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1 px-4 pt-4 pb-4 sm:px-5">
          <p className="flex items-baseline gap-2">
            <span className={cn('text-[2rem] sm:text-[2.75rem]', VALOR_DESTAQUE)}>
              {formatarBRL(resumo.guardadoCentavos)}
            </span>
            <span className={cn(ROTULO, 'text-muted-foreground')}>guardado</span>
          </p>
          <p className="pb-1 text-sm text-muted-foreground">sem valor alvo</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 pt-4 pb-4 sm:px-5">
          <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
            <p className="flex items-baseline gap-2">
              <span className={cn('text-[2.75rem]', VALOR_DESTAQUE)}>{percentual}%</span>
              <span className={cn(ROTULO, 'text-muted-foreground')}>{resumo.concluida ? 'meta atingida' : 'guardado'}</span>
            </p>
            <p className="pb-1 text-sm text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">{formatarBRL(resumo.guardadoCentavos)}</span> de{' '}
              {formatarBRL(alvo)}
            </p>
          </div>
          <BarraProgresso percentual={resumo.percentual} rotulo={`Progresso de ${meta.nome}`} />
        </div>
      )}

      <dl className="grid grid-cols-3 border-y-2 border-contorno">
        {alvo === undefined ? (
          <Dado rotulo="Por mês">{formatarBRL(meta.aporteMensalCentavos)}</Dado>
        ) : (
          <Dado rotulo="Falta">{formatarBRL(resumo.faltaCentavos)}</Dado>
        )}
        <Dado rotulo="Média por mês">{resumo.mediaCentavos === null ? '—' : formatarBRL(resumo.mediaCentavos)}</Dado>
        {alvo === undefined ? (
          <Dado rotulo="Em 12 meses">{formatarBRL(resumo.emUmAnoCentavos)}</Dado>
        ) : (
          <Dado rotulo={`Até ${formatarMesAno(fimDoAno, 'curto')}`}>{formatarBRL(resumo.previstoFimDoAnoCentavos)}</Dado>
        )}
      </dl>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-5">
        <CaixaDestaque
          fundo={atrasada ? 'bg-saida-suave' : 'bg-economia-suave'}
          faixa={atrasada ? 'border-l-vermelho' : 'border-l-amarelo'}
        >
          <p>
            {resumo.encerrada ? (
              <>
                <strong className="font-bold text-foreground">Encerrada em {formatarData(meta.encerradaEm!)}:</strong> não
                guarda mais. Na meta:{' '}
                <span className="font-semibold text-foreground tabular-nums">{formatarBRL(resumo.guardadoCentavos)}</span>.
              </>
            ) : alvo === undefined ? (
              <>
                <strong className="font-bold text-foreground">Guarda todo mês, sem fim:</strong> daqui a 12 meses, terá{' '}
                <span className="font-semibold text-foreground tabular-nums">{formatarBRL(resumo.emUmAnoCentavos)}</span>{' '}
                nesta meta.
              </>
            ) : (
              <Previsao resumo={resumo} />
            )}
          </p>
          {meta.prazo && !resumo.concluida && !resumo.encerrada && (
            <p>
              <SituacaoPrazo prazo={meta.prazo} resumo={resumo} hoje={hoje} />
            </p>
          )}
        </CaixaDestaque>

        <div className="mt-auto flex flex-wrap gap-2">
          <Button variant="outline" className={BOTAO} onClick={onVer}>
            <Receipt />
            Ver extrato
          </Button>
          <Button variant="outline" className={BOTAO} onClick={onAjustar}>
            <CalendarCheck />
            Quanto guardei em cada mês
          </Button>
          <Button variant="outline" className={BOTAO} onClick={onUsar}>
            <PiggyBank />
            Usar dinheiro
          </Button>
          {resumo.encerrada && (
            <Button variant="outline" className={BOTAO} onClick={onRetomar}>
              Voltar a guardar
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-contorno px-3 py-2.5 not-last:border-r-2 first:pl-4 sm:first:pl-5">
      <dt className={cn(ROTULO, 'truncate text-muted-foreground')}>{rotulo}</dt>
      <dd className="text-sm font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

/** Quando a meta termina no ritmo atual (média real) e, se for diferente, pelo plano. */
export function Previsao({ resumo }: { resumo: ResumoMeta }) {
  const { concluida, conclusaoPrevista, conclusaoNoPlano, mediaCentavos, ritmoCentavos } = resumo

  if (concluida && conclusaoPrevista) {
    return (
      <>
        <strong className="font-bold text-foreground">Meta atingida!</strong> O cofrinho encheu no aporte de{' '}
        {formatarData(conclusaoPrevista)}.
      </>
    )
  }
  if (!conclusaoPrevista) {
    return (
      <>
        <strong className="font-bold text-foreground">Sem previsão de término:</strong> no ritmo atual não entra
        dinheiro nesta meta.
      </>
    )
  }

  const base =
    mediaCentavos === null
      ? `guardando ${formatarBRL(ritmoCentavos)} por mês, como planejado`
      : `no seu ritmo de ${formatarBRL(ritmoCentavos)} por mês`
  const plano =
    conclusaoNoPlano && conclusaoNoPlano.slice(0, 7) !== conclusaoPrevista.slice(0, 7)
      ? ` Seguindo o plano, em ${formatarMesAno(conclusaoNoPlano)}.`
      : ''

  return (
    <>
      <strong className="font-bold text-foreground">Fica completa em {formatarMesAno(conclusaoPrevista)}</strong>, {base}.
      {plano}
    </>
  )
}

/** Se o plano cumpre o prazo e, se não cumpre, de quanto precisa ser o aporte para cumprir. */
export function SituacaoPrazo({ prazo, resumo, hoje }: { prazo: DataISO; resumo: ResumoMeta; hoje: DataISO }) {
  const quando = <span className="font-semibold text-foreground">{formatarMesAno(prazo)}</span>
  const forte = 'font-bold text-foreground'

  if (resumo.noPrazo) {
    return (
      <>
        <strong className={forte}>Chega a tempo</strong> do prazo de {quando}.
      </>
    )
  }
  if (prazo < hoje) {
    return (
      <>
        <strong className={cn(forte, 'text-negativo')}>O prazo passou:</strong> era {quando} e ainda faltam{' '}
        <span className="font-semibold text-foreground tabular-nums">{formatarBRL(resumo.faltaCentavos)}</span>.
      </>
    )
  }
  if (resumo.aporteParaOPrazoCentavos === null) {
    return (
      <>
        <strong className={cn(forte, 'text-negativo')}>Não dá mais a tempo:</strong> não há dia de aporte até o prazo
        de {quando}.
      </>
    )
  }
  return (
    <>
      <strong className={cn(forte, 'text-negativo')}>Está atrasada.</strong> Para chegar até {quando}, guarde{' '}
      <span className="font-bold text-economia tabular-nums">{formatarBRL(resumo.aporteParaOPrazoCentavos)}</span> por
      mês daqui em diante.
    </>
  )
}
