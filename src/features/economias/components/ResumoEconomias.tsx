import type { ReactNode } from 'react'
import { COR_RISCO } from '@/features/risco/constants/cores'
import { DinheiroForte, Forte } from '@/features/risco/components/Destaques'
import { FaixaMeses } from '@/features/risco/components/FaixaMeses'
import { LegendaCompleta } from '@/features/risco/components/LegendaRisco'
import { ConselhoRisco, FraseDiaApertado } from '@/features/risco/components/MensagemRisco'
import type { RiscoDaVisao } from '@/features/risco/utils/risco-por-conta'
import { diasDeGastos, NIVEL, textoDias } from '@/features/risco/utils/risco'
import { Ajuda } from '@/shared/components/Ajuda'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { Forma } from '@/shared/components/Forma'
import { formatarMesAno } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CARD, ROTULO, VALOR_DESTAQUE } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'

interface ResumoEconomiasProps {
  /** null sem conta para medir (nenhuma conta corrente no total). */
  risco: RiscoDaVisao | null
  /** Guardado hoje em todas as metas da visão. */
  guardadoCentavos: number
  /** Soma dos alvos; null se alguma meta é cofrinho (sem alvo). */
  alvoCentavos: number | null
  /** Quanto vai para as metas por mês, em média, nos próximos 12 meses. */
  porMesCentavos: number | null
  /** Quanto dá para guardar a mais por mês sem piorar o risco. */
  guardarSemPiorarCentavos: number | null
}

/**
 * O topo de Economias, junto do título: o risco do caixa, quanto já está nas metas e quanto ainda dá para guardar,
 * em números grandes; embaixo, a frase do dia mais apertado e o mês a mês em barras.
 */
export function ResumoEconomias({
  risco,
  guardadoCentavos,
  alvoCentavos,
  porMesCentavos,
  guardarSemPiorarCentavos,
}: ResumoEconomiasProps) {
  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <div className="grid md:grid-cols-3">
        {risco ? (
          <Risco risco={risco} />
        ) : (
          <Celula rotulo="Risco do caixa" valor="—">
            Sem conta para medir
          </Celula>
        )}
        <Celula rotulo="Nas metas" valor={formatarBRL(guardadoCentavos)} cor={guardadoCentavos > 0 ? 'text-economia' : undefined}>
          {alvoCentavos !== null && alvoCentavos > 0 && <>de {formatarBRL(alvoCentavos)}</>}
          {alvoCentavos !== null && alvoCentavos > 0 && !!porMesCentavos && ' · '}
          {!!porMesCentavos && <>{formatarBRL(porMesCentavos)} por mês</>}
          {!alvoCentavos && !porMesCentavos && 'Nenhuma meta guardando ainda'}
        </Celula>
        <Celula
          rotulo="Dá para guardar a mais"
          valor={guardarSemPiorarCentavos === null ? '—' : formatarBRL(guardarSemPiorarCentavos)}
          cor={guardarSemPiorarCentavos ? 'text-economia' : undefined}
        >
          {guardarSemPiorarCentavos === null ? 'Sem conta para medir' : 'por mês, sem piorar o risco'}
        </Celula>
      </div>

      {risco && (
        <div className="grid gap-4 border-t-2 border-contorno px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
          <CaixaDestaque fundo={COR_RISCO[risco.nivel].suave} faixa={COR_RISCO[risco.nivel].faixa}>
            <p>
              <FraseDiaApertado risco={risco} />
            </p>
            <p>
              <ConselhoRisco risco={risco} />
            </p>
          </CaixaDestaque>
          <FaixaMeses
            meses={risco.meses}
            rotulo="Mês a mês: quanto sobra no dia mais apertado"
            comRotulo
            legenda
          />
        </div>
      )}
    </Card>
  )
}

interface CelulaProps {
  rotulo: ReactNode
  valor: ReactNode
  cor?: string
  children?: ReactNode
}

function Celula({ rotulo, valor, cor, children }: CelulaProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 border-b-2 border-contorno px-4 py-3 last:border-b-0 sm:px-5 md:border-r-2 md:border-b-0 md:last:border-r-0">
      <span className={cn(ROTULO, 'text-muted-foreground')}>{rotulo}</span>
      <span className={cn(VALOR_DESTAQUE, 'text-[1.75rem] leading-none whitespace-nowrap md:text-[1.5rem] lg:text-[2rem]', cor)}>
        {valor}
      </span>
      {children && <span className="text-xs text-muted-foreground tabular-nums">{children}</span>}
    </div>
  )
}

/** O nível em bloco de cor com o nome escrito (a cor nunca é a única pista) e o que ele quer dizer embaixo. */
function Risco({ risco }: { risco: RiscoDaVisao }) {
  const { nivel, fim, referenciaCentavos, diasPorNivel } = risco
  const dias = diasDeGastos(risco.menorSaldo.valorCentavos, referenciaCentavos)
  const significado = NIVEL[nivel].significado

  return (
    <div className="flex min-w-0 flex-col gap-1.5 border-b-2 border-contorno px-4 py-3 sm:px-5 md:border-r-2 md:border-b-0">
      <span className="flex items-center gap-2">
        <span className={cn(ROTULO, 'text-muted-foreground')}>Risco do caixa{risco.caixa ? ` · ${risco.caixa.nome}` : ''}</span>
        <Ajuda titulo="Risco do caixa" largo>
          <p>Mostra quanto dinheiro sobra na sua conta, dia a dia, de hoje até {formatarMesAno(fim, 'curto')}.</p>
          <p>
            O app vê para quantos dias de gastos o dinheiro que sobra dá, contando que você gasta uns{' '}
            <DinheiroForte centavos={referenciaCentavos} /> por mês. O dinheiro das metas já está descontado.
            {dias !== null && risco.menorSaldo.valorCentavos >= 0 && (
              <>
                {' '}
                No momento mais apertado, dá para <Forte>{textoDias(dias)}</Forte>.
              </>
            )}
          </p>
          {risco.caixa && (
            <p className="text-muted-foreground">
              Você tem mais de uma conta: o app mostra a que fica mais apertada, {risco.caixa.nome}.
            </p>
          )}
          <span className={cn(ROTULO, 'mt-1 text-muted-foreground')}>
            O que quer dizer cada nível · quantos dias você passa em cada um
          </span>
          <LegendaCompleta diasPorNivel={diasPorNivel} />
        </Ajuda>
      </span>
      <span
        className={cn(
          'flex items-center gap-2 self-start border-2 border-contorno px-2.5 py-1 font-heading text-[1.5rem] leading-none font-bold uppercase sm:text-[1.75rem]',
          COR_RISCO[nivel].bloco,
        )}
      >
        <Forma forma="triangulo" cor="tinta" className="size-4" />
        {NIVEL[nivel].nome}
      </span>
      <span className="text-xs text-muted-foreground">
        No dia mais apertado, {significado.charAt(0).toLowerCase() + significado.slice(1)}
      </span>
    </div>
  )
}
