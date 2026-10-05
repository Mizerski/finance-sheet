import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { COR_RISCO } from '../constants/cores'
import { NIVEL, type NivelRisco } from '../utils/risco'

/** Nome do nível num bloco na cor dele. */
export function SeloRisco({ nivel, curto, className }: { nivel: NivelRisco; curto?: boolean; className?: string }) {
  return (
    <Badge className={cn('border-contorno', COR_RISCO[nivel].bloco, className)}>
      {curto ? NIVEL[nivel].curto : NIVEL[nivel].nome}
    </Badge>
  )
}

/** Quadradinho na cor do nível, com contorno (legenda, cabeçalho do mês). */
export function QuadradoRisco({ nivel, className }: { nivel: NivelRisco; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-3 shrink-0 border-[1.5px] border-contorno', COR_RISCO[nivel].fundo, className)} />
}
