import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface OpcaoGrande<T extends string> {
  valor: T
  rotulo: ReactNode
  /** Uma frase curta embaixo do nome. */
  descricao?: ReactNode
  /** Forma ou ponto de cor antes do nome. */
  marca?: ReactNode
  /** Fundo quando escolhida, no lugar do preto (ex.: `bg-vermelho text-sobre-bloco` para saídas). */
  corAtiva?: string
}

interface EscolhaGrandeProps<T extends string> {
  /** id do título da pergunta, que dá nome ao grupo. */
  rotuloId: string
  valor: T | ''
  opcoes: OpcaoGrande<T>[]
  onChange: (valor: T) => void
  className?: string
}

/**
 * Uma pergunta com respostas em cartões grandes (alvo de 56px ou mais), para escolher sem mira fina.
 * A escolhida fica em bloco preto, afundada; as outras, em papel com sombra e hover amarelo.
 */
export function EscolhaGrande<T extends string>({ rotuloId, valor, opcoes, onChange, className }: EscolhaGrandeProps<T>) {
  const indiceAtual = Math.max(
    0,
    opcoes.findIndex((o) => o.valor === valor),
  )

  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    const passo = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!passo) return
    e.preventDefault()
    const proximo = (indiceAtual + passo + opcoes.length) % opcoes.length
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')[proximo]?.focus()
  }

  return (
    <div role="radiogroup" aria-labelledby={rotuloId} onKeyDown={aoTeclar} className={cn('grid gap-2', className)}>
      {opcoes.map((o, i) => {
        const ativo = o.valor === valor
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            tabIndex={i === indiceAtual ? 0 : -1}
            onClick={() => onChange(o.valor)}
            className={cn(
              'group flex min-h-14 flex-col justify-center gap-1 border-2 border-contorno px-3 py-2.5 text-left transition-[background-color,box-shadow,translate] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              ativo
                ? cn(o.corAtiva ?? 'bg-foreground text-background', 'motion-safe:translate-x-[2px] motion-safe:translate-y-[2px]')
                : 'bg-card shadow-bloco-sm hover:bg-amarelo hover:text-tinta active:shadow-none motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px]',
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              {o.marca}
              {o.rotulo}
            </span>
            {o.descricao && (
              <span
                className={cn(
                  'text-[0.8125rem] leading-snug',
                  ativo ? 'opacity-85' : 'text-muted-foreground group-hover:text-tinta/80',
                )}
              >
                {o.descricao}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
