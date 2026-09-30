import { PontoCor } from '@/shared/components/PontoCor'
import { Badge } from '@/shared/ui/badge'
import type { Tag } from '../tag'

/** Tag de um lançamento em formato de pílula, com a cor dela. */
export function PilulaTag({ tag }: { tag: Pick<Tag, 'nome' | 'cor'> }) {
  return (
    <Badge variant="outline" className="gap-1.5 rounded-full font-normal text-muted-foreground">
      <PontoCor cor={tag.cor} />
      {tag.nome}
    </Badge>
  )
}
