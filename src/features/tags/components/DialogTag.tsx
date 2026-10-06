import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { Tag } from '../model/tag'
import { FormularioTag } from './FormularioTag'

interface DialogTagProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = nova tag. */
  tag?: Tag
  /** Chamado com a tag depois de salvar (ex.: para escolhê-la no lançamento). */
  onSalvar?: (tag: Tag) => void
}

export function DialogTag({ aberto, onOpenChange, tag, onSalvar }: DialogTagProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className={cn(CAMADA, 'gap-5 sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>{tag ? 'Editar tag' : 'Nova tag'}</DialogTitle>
          <DialogDescription>A tag diz se um gasto era necessário ou dava para evitar.</DialogDescription>
        </DialogHeader>
        <FormularioTag
          tag={tag}
          onConcluir={(salva) => {
            onSalvar?.(salva)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
