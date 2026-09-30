import type { ReactNode } from 'react'
import type { FormaDaPagina } from '@/shared/lib/formas'
import { TITULO_PAGINA } from '@/shared/lib/estilos'
import { Forma } from './Forma'

interface CabecalhoPaginaProps {
  titulo: ReactNode
  /** Forma da tela (`FORMA_PAGINA`), a mesma do menu. */
  forma: FormaDaPagina
  descricao?: ReactNode
  acoes?: ReactNode
}

/** Título de cartaz com a forma da tela, descrição embaixo, ações à direita e régua preta fechando o bloco. */
export function CabecalhoPagina({ titulo, forma, descricao, acoes }: CabecalhoPaginaProps) {
  return (
    // O título não fica mais estreito que 16rem: sem espaço, as ações descem para a linha de baixo.
    <div className="flex flex-col gap-4 border-b-2 border-foreground pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex items-start gap-3 sm:min-w-64 sm:flex-1 sm:gap-4">
        <Forma {...forma} className="mt-0.5 size-7 sm:size-10" />
        <div className="flex min-w-0 flex-col gap-2">
          {/* A parte secundária do título (ano, contexto) vem num span e fica em peso leve. */}
          <h1 className={`${TITULO_PAGINA} [&>span]:font-light`}>{titulo}</h1>
          {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
        </div>
      </div>
      {acoes}
    </div>
  )
}
