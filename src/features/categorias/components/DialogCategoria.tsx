import type { TipoMovimento } from '@/features/lancamentos/lancamento'
import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { Categoria } from '../categoria'
import { FormularioCategoria } from './FormularioCategoria'

interface DialogCategoriaProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = nova categoria. */
  categoria?: Categoria
  tipoInicial?: TipoMovimento
  /** Chamado com a categoria depois de salvar (ex.: para escolhê-la no lançamento). */
  onSalvar?: (categoria: Categoria) => void
}

export function DialogCategoria({ aberto, onOpenChange, categoria, tipoInicial, onSalvar }: DialogCategoriaProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(CAMADA, 'gap-5 sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>
            {categoria ? 'Editar categoria' : 'Nova categoria'}
          </DialogTitle>
          <DialogDescription>A cor identifica a categoria na planilha e nos gráficos.</DialogDescription>
        </DialogHeader>
        <FormularioCategoria
          categoria={categoria}
          tipoInicial={tipoInicial}
          onConcluir={(salva) => {
            onSalvar?.(salva)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
