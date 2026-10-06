import { useId, type ReactNode } from 'react'
import { ChevronDown } from '@/shared/ui/icones'
import type { FormaDaPagina } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'
import { Forma } from './Forma'

interface SecaoProps {
  titulo: ReactNode
  forma: FormaDaPagina
  /** Quantidade de itens, no bloco preto ao lado do título. */
  contagem?: number
  /** A conclusão em uma linha, à vista também com a seção fechada (alerta nunca fica escondido). */
  resumo?: ReactNode
  aberta: boolean
  onAlternar: () => void
  /** Botões à direita do título (ex.: "Nova meta"), fora do botão que abre e fecha. */
  acoes?: ReactNode
  children: ReactNode
}

/**
 * Um grupo de cards da tela que abre e fecha pelo título, para a página não virar uma pilha solta de cards.
 * O título é um botão grande com a seta num quadradinho com sombra (afunda ao clicar, amarelo no hover).
 */
export function Secao({ titulo, forma, contagem, resumo, aberta, onAlternar, acoes, children }: SecaoProps) {
  const id = useId()

  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${id}-titulo`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-contorno pb-2">
        <h2 id={`${id}-titulo`} className="min-w-0 flex-1 basis-72">
          <button
            type="button"
            aria-expanded={aberta}
            aria-controls={id}
            onClick={onAlternar}
            className="group flex w-full items-center gap-3 py-1 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center border-2 border-contorno bg-card shadow-bloco-sm transition duration-100 group-hover:bg-amarelo group-hover:text-tinta group-active:translate-x-0.5 group-active:translate-y-0.5 group-active:shadow-none motion-reduce:group-active:translate-0"
            >
              <ChevronDown className={cn('size-6 transition-transform duration-100', !aberta && '-rotate-90')} />
            </span>
            <Forma {...forma} className="size-5 shrink-0" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className="font-heading text-lg leading-tight font-extrabold uppercase sm:text-xl">{titulo}</span>
                {contagem !== undefined && (
                  <span className="bg-foreground px-1.5 py-1 text-xs leading-none font-semibold text-background tabular-nums">
                    {contagem}
                  </span>
                )}
              </span>
              {resumo && <span className="text-sm text-muted-foreground">{resumo}</span>}
            </span>
          </button>
        </h2>
        {acoes}
      </div>
      {aberta && (
        <div id={id} className="flex flex-col gap-4">
          {children}
        </div>
      )}
    </section>
  )
}
