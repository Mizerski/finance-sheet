import type { ReactNode } from 'react'
import { ROTULO, VALOR_DESTAQUE } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'

/**
 * Peças do extrato ("nota fiscal") de um item: um cupom com contorno, o valor grande no topo, linhas de rótulo e
 * valor alinhadas como numa nota e separadores tracejados entre as partes. Só para ler; editar fica num botão.
 */
export function CupomExtrato({ children }: { children: ReactNode }) {
  return <div className="flex flex-col border-2 border-contorno bg-card text-sm">{children}</div>
}

interface TopoExtratoProps {
  rotulo: string
  /** O valor já formatado. */
  valor: ReactNode
  /** Cor do valor (`text-saida`, `text-entrada`, `text-economia`…). */
  cor?: string
  /** Uma linha embaixo do valor ("por vez · todo dia 6"). */
  children?: ReactNode
}

export function TopoExtrato({ rotulo, valor, cor, children }: TopoExtratoProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 pt-4 pb-3 text-center">
      <span className={cn(ROTULO, 'text-muted-foreground')}>{rotulo}</span>
      <span className={cn(VALOR_DESTAQUE, 'text-[2.25rem]', cor)}>{valor}</span>
      {children && <span className="text-xs text-muted-foreground">{children}</span>}
    </div>
  )
}

/** Uma parte do cupom, com a régua tracejada em cima e um título opcional. */
export function ParteExtrato({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col border-t-2 border-dashed border-contorno px-4 py-3">
      {titulo && <span className={cn(ROTULO, 'pb-1.5 text-muted-foreground')}>{titulo}</span>}
      <dl className="flex flex-col">{children}</dl>
    </div>
  )
}

interface LinhaExtratoProps {
  rotulo: ReactNode
  children: ReactNode
  /** Linha de total: em negrito, com a régua fina em cima. */
  total?: boolean
}

/** Rótulo à esquerda e valor à direita, como numa nota. */
export function LinhaExtrato({ rotulo, children, total }: LinhaExtratoProps) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 py-1',
        total && 'mt-1 border-t border-border pt-2 font-semibold',
      )}
    >
      <dt className={cn('shrink-0', total ? 'text-foreground' : 'text-muted-foreground')}>{rotulo}</dt>
      <dd className="min-w-0 text-right [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}
