import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Ajuda } from '@/shared/components/Ajuda'
import { Forma } from '@/shared/components/Forma'
import { BOTAO, CARD, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { COR_RISCO } from '../cores'
import type { RiscoDaVisao } from '../risco-por-conta'
import { FaixaMeses } from './FaixaMeses'
import { LegendaCompleta } from './LegendaRisco'
import { ConselhoRisco, FraseDiaApertado } from './MensagemRisco'
import { SeloRisco } from './SeloRisco'

interface ResumoRiscoPlanilhaProps {
  risco: RiscoDaVisao
  /** Abre o mês clicado na faixa ("2026-11"). */
  onMes: (mes: string) => void
}

/**
 * Faixa da planilha: o nível do caixa, o dia mais apertado e os próximos 12 meses (clicáveis).
 * A comparação com o mês de gastos, o conselho e a legenda das cores do saldo ficam no "?".
 */
export function ResumoRiscoPlanilha({ risco, onMes }: ResumoRiscoPlanilhaProps) {
  const cores = COR_RISCO[risco.nivel]

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <div className="flex items-stretch">
        <span
          aria-hidden
          className={cn('flex w-10 shrink-0 items-center justify-center border-r-2 border-contorno sm:w-12', cores.bloco)}
        >
          <Forma forma="triangulo" cor="tinta" className="size-5 sm:size-6" />
        </span>
        <div className="grid min-w-0 flex-1 gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn(ROTULO, 'whitespace-nowrap text-muted-foreground')}>Risco do caixa</span>
              {/* No Total com várias contas, o risco é o da conta mais apertada. */}
              {risco.caixa && <span className="text-sm font-semibold whitespace-nowrap">{risco.caixa.nome}</span>}
              <SeloRisco nivel={risco.nivel} />
              <Ajuda titulo="Risco do caixa" largo>
                <p>
                  <FraseDiaApertado risco={risco} />
                </p>
                <p>
                  <ConselhoRisco risco={risco} />
                </p>
                <p className="text-muted-foreground">
                  O fundo da coluna Saldo tem a cor do nível de cada dia. Clique num mês da faixa para abrir esse mês.
                </p>
                {risco.caixa && (
                  <p className="text-muted-foreground">
                    Com mais de uma conta, vale a mais apertada: cada dia tem a cor da conta em pior situação, e as
                    frases falam de {risco.caixa.nome}.
                  </p>
                )}
                <LegendaCompleta />
                <Button asChild variant="outline" className={cn(BOTAO, 'h-8 self-start px-3')}>
                  <Link to="/economias">
                    Detalhes e simulador de conta nova
                    <ArrowRight />
                  </Link>
                </Button>
              </Ajuda>
            </div>
            <p className="text-sm text-foreground">
              <FraseDiaApertado risco={risco} curta />
            </p>
          </div>
          <FaixaMeses meses={risco.meses} rotulo="Próximos 12 meses: clique para abrir o mês" onMes={onMes} />
        </div>
      </div>
    </Card>
  )
}
