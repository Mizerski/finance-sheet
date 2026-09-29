import type { ReactNode } from 'react'

interface CabecalhoPaginaProps {
  titulo: ReactNode
  descricao?: ReactNode
  acoes?: ReactNode
}

export function CabecalhoPagina({ titulo, descricao, acoes }: CabecalhoPaginaProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium tracking-tight">{titulo}</h1>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes}
    </div>
  )
}
