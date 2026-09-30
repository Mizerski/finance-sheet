import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { CARD, CABECALHO_CARD, TITULO_CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'

interface PrimeirosPassosProps {
  saldoDefinido: boolean
  temCategorias: boolean
  temLancamentos: boolean
  onDefinirSaldo: () => void
}

const ACAO =
  'font-semibold text-foreground underline decoration-2 underline-offset-4 outline-none hover:decoration-vermelho focus-visible:outline-2 focus-visible:outline-ring'

/** Guia para a conta vazia, em três blocos numerados; some quando os três passos estão feitos. */
export function PrimeirosPassos({ saldoDefinido, temCategorias, temLancamentos, onDefinirSaldo }: PrimeirosPassosProps) {
  if (saldoDefinido && temCategorias && temLancamentos) return null

  return (
    <Card className={CARD}>
      <header className={cn(CABECALHO_CARD, 'flex-wrap')}>
        <h2 className={TITULO_CARD}>Primeiros passos</h2>
        <p className="text-sm text-muted-foreground">Três passos para a planilha começar a projetar o seu saldo.</p>
      </header>
      <ol className="grid text-sm sm:grid-cols-3">
        <Passo numero={1} feito={saldoDefinido} cor="bg-vermelho">
          <button type="button" className={ACAO} onClick={onDefinirSaldo}>
            Informe o saldo inicial
          </button>{' '}
          <span className="text-muted-foreground">e a partir de que dia ele vale</span>
        </Passo>
        <Passo numero={2} feito={temCategorias} cor="bg-azul">
          <Link to="/organizacao" className={ACAO}>
            Crie categorias
          </Link>{' '}
          <span className="text-muted-foreground">de entrada e de saída</span>
        </Passo>
        <Passo numero={3} feito={temLancamentos} cor="bg-amarelo">
          <Link to="/lancamentos" className={ACAO}>
            Cadastre lançamentos
          </Link>{' '}
          <span className="text-muted-foreground">(salário, contas, gastos do dia a dia)</span>
        </Passo>
      </ol>
    </Card>
  )
}

function Passo({ numero, feito, cor, children }: { numero: number; feito: boolean; cor: string; children: ReactNode }) {
  return (
    <li className="flex items-stretch border-foreground not-last:border-b-2 sm:not-last:border-r-2 sm:not-last:border-b-0">
      {/* Faixa de cor com o número; feito, a faixa fica preta com o ✓. */}
      <span
        className={cn(
          'flex w-12 shrink-0 items-center justify-center border-r-2 border-foreground font-heading text-2xl font-bold tabular-nums',
          feito ? 'bg-foreground text-background' : cor,
          !feito && cor === 'bg-amarelo' ? 'text-foreground' : !feito && 'text-papel',
        )}
      >
        {feito ? <Check className="size-5" strokeWidth={3} aria-label="Feito" /> : numero}
      </span>
      <span className={cn('p-3', feito && 'text-muted-foreground line-through decoration-foreground/40')}>{children}</span>
    </li>
  )
}
