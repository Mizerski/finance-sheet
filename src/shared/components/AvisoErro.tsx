import { X } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface AvisoErroProps {
  titulo: string
  mensagem: string
  onFechar: () => void
}

/** Aviso flutuante no rodapé da tela, para erros que não bloqueiam o uso. */
export function AvisoErro({ titulo, mensagem, onFechar }: AvisoErroProps) {
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-50 flex items-start gap-3 border-2 border-l-8 border-foreground border-l-vermelho bg-card p-4 text-sm shadow-bloco-lg sm:left-auto sm:max-w-md"
    >
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-heading font-bold text-negativo uppercase">{titulo}</p>
        <p className="text-foreground">{mensagem}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="-mt-1 -mr-1 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        aria-label="Fechar aviso"
        onClick={onFechar}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
