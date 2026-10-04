import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { Caixa } from '../caixa'
import { FormularioCaixa } from './FormularioCaixa'

interface DialogCaixaProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = novo caixa. */
  caixa?: Caixa
}

export function DialogCaixa({ aberto, onOpenChange, caixa }: DialogCaixaProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-2xl')}>
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>{caixa ? 'Editar caixa' : 'Novo caixa'}</DialogTitle>
          <DialogDescription>
            Cada caixa tem o próprio saldo. Categorias, tags e pastas valem para todos.
          </DialogDescription>
        </DialogHeader>
        <FormularioCaixa key={caixa?.id ?? 'novo'} caixa={caixa} onConcluir={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
