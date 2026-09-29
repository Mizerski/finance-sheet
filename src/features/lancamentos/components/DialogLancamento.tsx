import { CAMADA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { Lancamento } from '../lancamento'
import { FormularioLancamento } from './FormularioLancamento'

interface DialogLancamentoProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = novo lançamento. */
  lancamento?: Lancamento
}

export function DialogLancamento({ aberto, onOpenChange, lancamento }: DialogLancamentoProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-lg')}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-medium tracking-tight">
            {lancamento ? 'Editar lançamento' : 'Novo lançamento'}
          </DialogTitle>
          <DialogDescription>
            {lancamento
              ? 'As mudanças refletem na planilha e no dashboard na hora.'
              : 'Entradas e saídas, únicas ou recorrentes, entram na projeção do ano.'}
          </DialogDescription>
        </DialogHeader>
        {/* O conteúdo desmonta ao fechar, então o formulário sempre abre com o estado inicial. */}
        <FormularioLancamento lancamento={lancamento} onConcluir={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
