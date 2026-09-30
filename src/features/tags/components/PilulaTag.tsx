import { Badge } from '@/shared/ui/badge'
import type { Tag } from '../tag'

/** Tag de um lançamento: etiqueta com contorno preto e a cor dela numa faixa à esquerda. */
export function PilulaTag({ tag }: { tag: Pick<Tag, 'nome' | 'cor'> }) {
  return (
    <Badge variant="outline" className="gap-0 overflow-hidden p-0 pr-1.5">
      <span aria-hidden className="mr-1.5 w-1.5 self-stretch" style={{ backgroundColor: tag.cor }} />
      {tag.nome}
    </Badge>
  )
}
