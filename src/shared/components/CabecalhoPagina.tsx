import type { ReactNode } from 'react'

interface CabecalhoPaginaProps {
  titulo: ReactNode
  descricao?: ReactNode
  acoes?: ReactNode
}

export function CabecalhoPagina({ titulo, descricao, acoes }: CabecalhoPaginaProps) {
  return (
    // O título não fica mais estreito que 16rem: sem espaço, as ações descem para a linha de baixo.
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 sm:min-w-64 sm:flex-1">
        <h1 className="text-2xl font-medium tracking-tight">{titulo}</h1>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes}
    </div>
  )
}
