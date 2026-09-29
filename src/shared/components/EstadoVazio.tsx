import type { ReactNode } from 'react'

/** Mensagem centralizada para listas sem itens. */
export function EstadoVazio({ titulo, descricao, acao }: { titulo: string; descricao?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <div className="flex flex-col gap-1">
        <p className="font-medium">{titulo}</p>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </div>
  )
}
