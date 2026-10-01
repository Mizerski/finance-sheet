import { cn } from '@/shared/lib/utils'
import { COR_RISCO } from '../cores'
import { NIVEIS, NIVEL, type NivelRisco } from '../risco'

/** Os cinco níveis com o que cada um quer dizer e, se houver, quantos dias do período ficam nele. */
export function LegendaCompleta({ diasPorNivel }: { diasPorNivel?: Record<NivelRisco, number> }) {
  return (
    <ul className="flex flex-col border-2 border-foreground" aria-label="O que quer dizer cada nível">
      {NIVEIS.map((n) => {
        const dias = diasPorNivel?.[n] ?? 0
        return (
          <li
            key={n}
            className={cn(
              'flex items-center gap-2.5 border-foreground px-3 py-2 text-sm not-last:border-b-2',
              COR_RISCO[n].suave,
            )}
          >
            <span
              aria-hidden
              className={cn(
                'flex size-6 shrink-0 items-center justify-center border-2 border-foreground text-xs font-bold tabular-nums',
                COR_RISCO[n].bloco,
              )}
            >
              {n}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="font-semibold uppercase">{NIVEL[n].nome}</strong>
              <span className="text-foreground/80">: {NIVEL[n].significado}</span>
            </span>
            {diasPorNivel && (
              <span className={cn('shrink-0 text-xs tabular-nums', dias > 0 ? 'font-semibold' : 'text-muted-foreground')}>
                {dias} {dias === 1 ? 'dia' : 'dias'}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
