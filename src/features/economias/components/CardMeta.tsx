import type { ReactNode } from 'react'
import { CalendarCheck, Pencil, Trash2 } from 'lucide-react'
import { formatarData, formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import type { ResumoMeta } from '../aportes'
import type { MetaEconomia } from '../meta'
import { BarraProgresso } from './BarraProgresso'

interface CardMetaProps {
  meta: MetaEconomia
  resumo: ResumoMeta
  hoje: DataISO
  onEditar: () => void
  onAjustar: () => void
  onExcluir: () => void
}

export function CardMeta({ meta, resumo, hoje, onEditar, onAjustar, onExcluir }: CardMetaProps) {
  const percentual = Math.floor(resumo.percentual * 100)
  const fimDoAno = `${hoje.slice(0, 4)}-12-31`

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="truncate text-lg leading-none font-medium tracking-tight">{meta.nome}</h2>
          <p className="text-sm text-muted-foreground">
            <span className="tabular-nums">{formatarBRL(meta.aporteMensalCentavos)}</span> todo dia {meta.diaDoMes} ·
            desde {formatarData(meta.inicio)}
          </p>
        </div>
        <div className="-mr-2 flex shrink-0">
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
      </header>

      <div className="flex flex-col gap-4 px-4 pb-4 sm:px-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="flex items-baseline gap-1.5">
              {/* Número grande com algarismos proporcionais. */}
              <span className="text-2xl leading-none font-medium tracking-tight">{percentual}%</span>
              <span className="text-sm text-muted-foreground">{resumo.concluida ? 'meta atingida' : 'guardado'}</span>
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              <span className="font-medium text-foreground">{formatarBRL(resumo.guardadoCentavos)}</span> de{' '}
              {formatarBRL(meta.valorAlvoCentavos)}
            </p>
          </div>
          <BarraProgresso percentual={resumo.percentual} rotulo={`Progresso de ${meta.nome}`} />
        </div>

        <dl className="grid grid-cols-3 gap-3">
          <Dado rotulo="Falta">{formatarBRL(resumo.faltaCentavos)}</Dado>
          <Dado rotulo="Média por mês">
            {resumo.mediaCentavos === null ? '—' : formatarBRL(resumo.mediaCentavos)}
          </Dado>
          <Dado rotulo={`Até ${formatarMesAno(fimDoAno, 'curto')}`}>
            {formatarBRL(resumo.previstoFimDoAnoCentavos)}
          </Dado>
        </dl>

        <p className="text-sm text-muted-foreground">
          <Previsao resumo={resumo} />
        </p>

        <Button variant="outline" className={cn(BOTAO, 'self-start bg-card')} onClick={onAjustar}>
          <CalendarCheck />
          Quanto guardei em cada mês
        </Button>
      </div>
    </Card>
  )
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="truncate text-[0.68rem] tracking-wide text-muted-foreground uppercase">{rotulo}</dt>
      <dd className="text-sm font-medium tabular-nums">{children}</dd>
    </div>
  )
}

/** Quando a meta termina no ritmo atual (média real) e, se for diferente, pelo plano. */
function Previsao({ resumo }: { resumo: ResumoMeta }) {
  const { concluida, conclusaoPrevista, conclusaoNoPlano, mediaCentavos, ritmoCentavos } = resumo

  if (concluida && conclusaoPrevista) return <>Meta atingida no aporte de {formatarData(conclusaoPrevista)}.</>
  if (!conclusaoPrevista) return <>No ritmo atual não há aportes, então a meta não tem previsão de término.</>

  const base =
    mediaCentavos === null ? `pelo plano de ${formatarBRL(ritmoCentavos)} por mês` : `no seu ritmo de ${formatarBRL(ritmoCentavos)} por mês`
  const plano =
    conclusaoNoPlano && conclusaoNoPlano.slice(0, 7) !== conclusaoPrevista.slice(0, 7)
      ? ` Seguindo o plano, em ${formatarMesAno(conclusaoNoPlano)}.`
      : ''

  return (
    <>
      Completa em <span className="text-foreground">{formatarMesAno(conclusaoPrevista)}</span> {base}.{plano}
    </>
  )
}
