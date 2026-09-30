import type { ReactNode } from 'react'
import { TITULO_DIALOG } from '@/shared/lib/estilos'

/** Mensagem centralizada para listas sem itens. */
export function EstadoVazio({ titulo, descricao, acao }: { titulo: string; descricao?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <div className="flex flex-col gap-1.5">
        <p className={TITULO_DIALOG}>{titulo}</p>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </div>
  )
}
