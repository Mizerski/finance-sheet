import type { DataISO } from '@/shared/lib/datas'
import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { Lancamento } from '../model/lancamento'
import { FormularioLancamento } from './FormularioLancamento'

interface DialogLancamentoProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = novo lançamento. */
  lancamento?: Lancamento
  /** Data sugerida para um lançamento novo (ex.: o dia clicado na planilha). */
  dataInicial?: DataISO
}

export function DialogLancamento({ aberto, onOpenChange, lancamento, dataInicial }: DialogLancamentoProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-lg')}
      >
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>
            {lancamento ? 'Editar lançamento' : 'Novo lançamento'}
          </DialogTitle>
          <DialogDescription>
            {lancamento
              ? 'As mudanças refletem na planilha e no dashboard na hora.'
              : 'Entradas e saídas, únicas ou recorrentes, entram na projeção do ano.'}
          </DialogDescription>
        </DialogHeader>
        <FormularioLancamento lancamento={lancamento} dataInicial={dataInicial} onConcluir={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
