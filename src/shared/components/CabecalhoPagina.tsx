import type { ReactNode } from 'react'
import type { FormaDaPagina } from '@/shared/lib/formas'
import { TITULO_PAGINA } from '@/shared/lib/estilos'
import { Forma } from './Forma'

interface CabecalhoPaginaProps {
  titulo: ReactNode
  /** Forma da tela (`FORMA_PAGINA`), a mesma do menu. */
  forma: FormaDaPagina
  descricao?: ReactNode
  /** Botão "?" depois da descrição (`Ajuda`). */
  ajuda?: ReactNode
  acoes?: ReactNode
}

/** Título de cartaz com a forma da tela, descrição embaixo, ações à direita e régua preta fechando o bloco. */
export function CabecalhoPagina({ titulo, forma, descricao, ajuda, acoes }: CabecalhoPaginaProps) {
  return (
    <div className="flex flex-col gap-4 border-b-2 border-contorno pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex items-start gap-3 sm:min-w-64 sm:flex-1 sm:gap-4">
        <Forma {...forma} className="mt-0.5 size-7 sm:size-10" />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className={`${TITULO_PAGINA} [&>span]:font-light`}>{titulo}</h1>
          {(descricao || ajuda) && (
            <div className="flex items-center gap-1">
              {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
              {ajuda}
            </div>
          )}
        </div>
      </div>
      {acoes}
    </div>
  )
}
