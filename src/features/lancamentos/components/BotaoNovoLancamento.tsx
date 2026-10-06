import { useState } from 'react'
import { Plus } from '@/shared/ui/icones'
import { BOTAO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogLancamento } from './DialogLancamento'

interface BotaoNovoLancamentoProps {
  className?: string
  /** Classes da palavra "lançamento", para encurtar o botão para "Novo" onde falta espaço. */
  classeComplemento?: string
}

/** Cabeçalho: cria um lançamento de qualquer tela, sem precisar achar o dia na planilha (o mesmo do atalho N). */
export function BotaoNovoLancamento({ className, classeComplemento }: BotaoNovoLancamentoProps) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <Button
        className={cn(BOTAO, 'h-9 shrink-0 gap-1.5 px-3', className)}
        onClick={() => setAberto(true)}
        aria-label="Novo lançamento"
        title="Novo lançamento (atalho N)"
      >
        <Plus className="size-6" />
        <span>
          Novo<span className={classeComplemento}> lançamento</span>
        </span>
      </Button>
      <DialogLancamento aberto={aberto} onOpenChange={setAberto} />
    </>
  )
}
