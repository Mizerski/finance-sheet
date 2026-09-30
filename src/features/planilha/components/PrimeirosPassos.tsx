import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { CARD, TITULO_CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'

interface PrimeirosPassosProps {
  saldoDefinido: boolean
  temCategorias: boolean
  temLancamentos: boolean
  onDefinirSaldo: () => void
}

const ACAO = 'rounded-full text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring'

/** Guia para a conta vazia; some quando os três passos estão feitos. */
export function PrimeirosPassos({ saldoDefinido, temCategorias, temLancamentos, onDefinirSaldo }: PrimeirosPassosProps) {
  if (saldoDefinido && temCategorias && temLancamentos) return null

  return (
    <Card className={cn(CARD, 'gap-3 p-4 sm:p-5')}>
      <div className="flex flex-col gap-1">
        <h2 className={TITULO_CARD}>Primeiros passos</h2>
        <p className="text-sm text-muted-foreground">Três passos para a planilha começar a projetar o seu saldo.</p>
      </div>
      <ol className="flex flex-col gap-2.5 text-sm">
        <Passo numero={1} feito={saldoDefinido}>
          <button type="button" className={ACAO} onClick={onDefinirSaldo}>
            Informe o saldo inicial
          </button>{' '}
          <span className="text-muted-foreground">e a partir de que dia ele vale</span>
        </Passo>
        <Passo numero={2} feito={temCategorias}>
          <Link to="/organizacao" className={ACAO}>
            Crie categorias
          </Link>{' '}
          <span className="text-muted-foreground">de entrada e de saída</span>
        </Passo>
        <Passo numero={3} feito={temLancamentos}>
          <Link to="/lancamentos" className={ACAO}>
            Cadastre lançamentos
          </Link>{' '}
          <span className="text-muted-foreground">(salário, contas, gastos do dia a dia)</span>
        </Passo>
      </ol>
    </Card>
  )
}

function Passo({ numero, feito, children }: { numero: number; feito: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums',
          feito ? 'bg-saldo-suave text-saldo' : 'bg-muted text-muted-foreground',
        )}
      >
        {feito ? <Check className="size-3.5" aria-label="Feito" /> : numero}
      </span>
      <span className={cn(feito && 'text-muted-foreground line-through decoration-border')}>{children}</span>
    </li>
  )
}
