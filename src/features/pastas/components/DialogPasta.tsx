import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { Pasta } from '../pasta'
import { FormularioPasta } from './FormularioPasta'

interface DialogPastaProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = nova pasta. */
  pasta?: Pasta
  /** Chamado com a pasta depois de salvar (ex.: para escolhê-la no lançamento). */
  onSalvar?: (pasta: Pasta) => void
}

export function DialogPasta({ aberto, onOpenChange, pasta, onSalvar }: DialogPastaProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(CAMADA, 'gap-5 sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>
            {pasta ? 'Editar pasta' : 'Nova pasta'}
          </DialogTitle>
          <DialogDescription>A pasta agrupa lançamentos na lista, sem mudar a projeção.</DialogDescription>
        </DialogHeader>
        <FormularioPasta
          pasta={pasta}
          onConcluir={(salva) => {
            onSalvar?.(salva)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
