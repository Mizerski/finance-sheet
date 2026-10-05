import { Link } from '@tanstack/react-router'
import { ArrowRight, Check } from '@/shared/ui/icones'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL, formatarBRLSemSimbolo } from '@/shared/lib/dinheiro'
import { BOTAO, CARD, ROTULO, VALOR_DESTAQUE } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import type { ResumoMeta } from '../utils/aportes'
import type { Marco, ProgressoMeta } from '../utils/marcos'
import type { MetaComAlvo } from '../model/meta'
import { BarraProgresso } from './BarraProgresso'
import { Previsao, SituacaoPrazo } from './CardMeta'

interface CardMetaPrincipalProps {
  /** Ausente quando não há meta em andamento. */
  principal?: { meta: MetaComAlvo; resumo: ResumoMeta; progresso: ProgressoMeta }
  /** Quantas metas existem (para diferenciar "nenhuma meta" de "todas atingidas"). */
  totalDeMetas: number
  hoje: DataISO
}

/** A meta em destaque no Dashboard: progresso em marcos de 25% e o que falta para o próximo. */
export function CardMetaPrincipal({ principal, totalDeMetas, hoje }: CardMetaPrincipalProps) {
  const irParaEconomias = (
    <Button asChild variant="outline" className={cn(BOTAO, 'h-8 px-3')}>
      <Link to="/economias">
        {principal ? 'Economias' : 'Criar meta'}
        <ArrowRight />
      </Link>
    </Button>
  )

  if (!principal) {
    return (
      <Card className={cn(CARD, 'overflow-hidden')}>
        <CabecalhoCard
          titulo="Meta principal"
          faixa="bg-amarelo"
          forma={{ forma: 'semicirculo', cor: 'tinta' }}
          descricao={
            totalDeMetas > 0
              ? 'Todas as metas foram atingidas. Crie uma nova para continuar guardando.'
              : 'Nenhuma meta de economia ainda. Uma meta com nome e valor ajuda a guardar mais.'
          }
          acoes={irParaEconomias}
        />
      </Card>
    )
  }

  const { meta, resumo, progresso } = principal
  const percentual = Math.floor(resumo.percentual * 100)

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo={
          <>
            Meta principal <span className="font-light">{meta.nome}</span>
          </>
        }
        faixa="bg-amarelo"
        forma={{ forma: 'semicirculo', cor: 'tinta' }}
        descricao="A próxima a terminar entre as metas em andamento"
        acoes={irParaEconomias}
      />

      <div className="flex flex-col gap-3 px-4 pt-4 pb-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
          <p className="flex items-baseline gap-2">
            <span className={cn('text-[2.75rem]', VALOR_DESTAQUE)}>{percentual}%</span>
            <span className={cn(ROTULO, 'text-muted-foreground')}>guardado</span>
          </p>
          <p className="pb-1 text-sm text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{formatarBRL(resumo.guardadoCentavos)}</span> de{' '}
            {formatarBRL(meta.valorAlvoCentavos)}
          </p>
        </div>
        <BarraProgresso percentual={resumo.percentual} rotulo={`Progresso de ${meta.nome}`} />
      </div>

      <ol className="grid grid-cols-4 border-y-2 border-contorno">
        {progresso.marcos.map((m) => (
          <ItemMarco key={m.fracao} marco={m} proximo={m === progresso.proximo} />
        ))}
      </ol>

      <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">
        <ProximoPasso progresso={progresso} resumo={resumo} />{' '}
        <Previsao resumo={resumo} />
        {meta.prazo && (
          <>
            {' '}
            <SituacaoPrazo prazo={meta.prazo} resumo={resumo} hoje={hoje} />
          </>
        )}
      </p>
    </Card>
  )
}

function ItemMarco({ marco, proximo }: { marco: Marco; proximo: boolean }) {
  return (
    <li
      className={cn(
        'flex min-w-0 flex-col gap-1 border-contorno px-2 py-2.5 not-last:border-r-2 first:pl-4 sm:px-3 sm:first:pl-5',
        marco.atingido && 'bg-economia-suave',
        proximo && 'bg-amarelo text-tinta',
      )}
    >
      <span className={cn(ROTULO, 'flex items-center gap-1', marco.atingido && 'text-economia')}>
        {marco.fracao * 100}%{marco.atingido && <Check className="size-3 stroke-3" aria-label="atingido" />}
      </span>
      <span className="truncate text-xs font-semibold tabular-nums sm:text-sm">
        <span className="sm:hidden">{formatarBRLSemSimbolo(marco.valorCentavos)}</span>
        <span className="hidden sm:inline">{formatarBRL(marco.valorCentavos)}</span>
      </span>
      <span className={cn('truncate text-xs', !proximo && 'text-muted-foreground')}>
        {marco.data ? formatarMesAno(marco.data, 'curto') : '—'}
      </span>
    </li>
  )
}

/** O que falta para o próximo marco e, perto do fim, quantos aportes faltam. */
function ProximoPasso({ progresso, resumo }: { progresso: ProgressoMeta; resumo: ResumoMeta }) {
  const { proximo, aportesRestantes } = progresso
  if (!proximo) return null

  const falta = proximo.valorCentavos - resumo.guardadoCentavos
  const quase = aportesRestantes !== null && aportesRestantes > 0 && aportesRestantes <= 3

  return (
    <>
      {quase ? (
        <span className="font-semibold text-foreground">
          Só {aportesRestantes === 1 ? 'falta 1 aporte' : `faltam ${aportesRestantes} aportes`} para completar.
        </span>
      ) : (
        <>
          Próximo marco: <span className="font-semibold text-foreground">{proximo.fracao * 100}%</span>, faltam{' '}
          <span className="font-semibold text-foreground tabular-nums">{formatarBRL(Math.max(falta, 0))}</span>
          {proximo.data && <> (em {formatarMesAno(proximo.data, 'curto')})</>}.
        </>
      )}
    </>
  )
}
