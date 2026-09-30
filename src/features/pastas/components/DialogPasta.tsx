import { CAMADA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { Pasta } from '../pasta'
import { FormularioPasta } from './FormularioPasta'

interface DialogPastaProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = nova pasta. */
  pasta?: Pasta
}

export function DialogPasta({ aberto, onOpenChange, pasta }: DialogPastaProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(CAMADA, 'gap-5 sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className="text-lg font-medium tracking-tight">
            {pasta ? 'Editar pasta' : 'Nova pasta'}
          </DialogTitle>
          <DialogDescription>A pasta agrupa lançamentos na lista, sem mudar a projeção.</DialogDescription>
        </DialogHeader>
        <FormularioPasta pasta={pasta} onConcluir={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
