import { CAMADA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { Tag } from '../tag'
import { FormularioTag } from './FormularioTag'

interface DialogTagProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = nova tag. */
  tag?: Tag
}

export function DialogTag({ aberto, onOpenChange, tag }: DialogTagProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(CAMADA, 'gap-5 sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className="text-lg font-medium tracking-tight">{tag ? 'Editar tag' : 'Nova tag'}</DialogTitle>
          <DialogDescription>A tag diz se um gasto era necessário ou dava para evitar.</DialogDescription>
        </DialogHeader>
        <FormularioTag tag={tag} onConcluir={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
