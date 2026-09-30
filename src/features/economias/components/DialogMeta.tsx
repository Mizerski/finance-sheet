import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { MetaEconomia } from '../meta'
import { FormularioMeta, type SugestaoMeta } from './FormularioMeta'

interface DialogMetaProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = nova meta. */
  meta?: MetaEconomia
  sugestao?: SugestaoMeta
}

export function DialogMeta({ aberto, onOpenChange, meta, sugestao }: DialogMetaProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-lg')}
      >
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>
            {meta ? 'Editar meta' : 'Nova meta de economia'}
          </DialogTitle>
          <DialogDescription>Quanto você quer juntar e quanto separar do saldo a cada mês.</DialogDescription>
        </DialogHeader>
        {/* key: o formulário recomeça do zero ao trocar de meta. */}
        <FormularioMeta key={meta?.id ?? 'nova'} meta={meta} sugestao={sugestao} onConcluir={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
