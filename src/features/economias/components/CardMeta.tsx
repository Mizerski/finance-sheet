import type { ReactNode } from 'react'
import { CalendarCheck, Pencil, Trash2 } from 'lucide-react'
import { formatarData, formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { Forma } from '@/shared/components/Forma'
import { BOTAO, CARD, ROTULO, TITULO_CARD, VALOR_DESTAQUE } from '@/shared/lib/estilos'
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
      <header className="flex items-stretch border-b-2 border-foreground">
        {/* Meia-lua amarela: a forma da tela Economias. */}
        <span aria-hidden className="flex w-12 shrink-0 items-center justify-center border-r-2 border-foreground bg-amarelo sm:w-14">
          <Forma forma="semicirculo" cor="tinta" className="size-7" />
        </span>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3 py-3 pr-2 pl-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className={cn('truncate', TITULO_CARD)}>{meta.nome}</h2>
            <p className="text-sm text-muted-foreground">
              <span className="tabular-nums">{formatarBRL(meta.aporteMensalCentavos)}</span> todo dia {meta.diaDoMes} ·
              desde {formatarData(meta.inicio)}
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

      <div className="flex flex-col gap-3 px-4 pt-4 pb-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
          <p className="flex items-baseline gap-2">
            <span className={cn('text-[2.75rem]', VALOR_DESTAQUE)}>{percentual}%</span>
            <span className={cn(ROTULO, 'text-muted-foreground')}>{resumo.concluida ? 'meta atingida' : 'guardado'}</span>
          </p>
          <p className="pb-1 text-sm text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{formatarBRL(resumo.guardadoCentavos)}</span> de{' '}
            {formatarBRL(meta.valorAlvoCentavos)}
          </p>
        </div>
        <BarraProgresso percentual={resumo.percentual} rotulo={`Progresso de ${meta.nome}`} />
      </div>

      {/* Três dados em colunas separadas por réguas, como uma tabela de cartaz. */}
      <dl className="grid grid-cols-3 border-y-2 border-foreground">
        <Dado rotulo="Falta">{formatarBRL(resumo.faltaCentavos)}</Dado>
        <Dado rotulo="Média por mês">{resumo.mediaCentavos === null ? '—' : formatarBRL(resumo.mediaCentavos)}</Dado>
        <Dado rotulo={`Até ${formatarMesAno(fimDoAno, 'curto')}`}>{formatarBRL(resumo.previstoFimDoAnoCentavos)}</Dado>
      </dl>

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <p className="text-sm text-muted-foreground">
          <Previsao resumo={resumo} />
        </p>

        <Button variant="outline" className={cn(BOTAO, 'self-start')} onClick={onAjustar}>
          <CalendarCheck />
          Quanto guardei em cada mês
        </Button>
      </div>
    </Card>
  )
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-foreground px-3 py-2.5 not-last:border-r-2 first:pl-4 sm:first:pl-5">
      <dt className={cn(ROTULO, 'truncate text-muted-foreground')}>{rotulo}</dt>
      <dd className="text-sm font-semibold tabular-nums">{children}</dd>
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
      Completa em <span className="font-semibold text-foreground">{formatarMesAno(conclusaoPrevista)}</span> {base}.{plano}
    </>
  )
}
