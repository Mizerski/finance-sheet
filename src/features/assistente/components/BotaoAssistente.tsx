import { Forma } from '@/shared/components/Forma'
import { cn } from '@/shared/lib/utils'
import { useAssistente } from '../context/assistente-context'

/**
 * Desktop: abre e fecha o painel do assistente (atalho A). Bloco como as abas do menu, em preto com as três
 * formas da marca (a identidade do assistente), para se destacar; aberto, fica afundado em amarelo.
 */
export function BotaoAssistente() {
  const { aberto, setAberto, fase } = useAssistente()
  const baixando = fase.tipo === 'baixando'

  return (
    <button
      type="button"
      onClick={() => setAberto(!aberto)}
      aria-expanded={aberto}
      title="Assistente (atalho A)"
      className={cn(
        'group relative mr-1 mb-[3px] ml-1 flex h-9 shrink-0 items-center gap-2 border-2 border-contorno px-2 sm:px-3 text-xs font-semibold tracking-[0.06em] uppercase transition-[color,background-color,box-shadow,translate] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px]',
        aberto
          ? 'bg-amarelo text-tinta motion-safe:translate-x-[2px] motion-safe:translate-y-[2px]'
          : 'bg-tinta text-papel shadow-bloco-sm hover:bg-amarelo hover:text-tinta active:shadow-none',
      )}
    >
      <span aria-hidden className="flex items-end gap-0.5">
        <Forma forma="circulo" cor="azul" className="size-2.5" />
        <Forma forma="triangulo" cor="amarelo" className={cn('size-2.5', aberto ? 'hidden' : 'group-hover:hidden')} />
        <Forma forma="triangulo" cor="tinta" className={cn('size-2.5', !aberto && 'hidden group-hover:block')} />
        <Forma forma="quadrado" cor="vermelho" className="size-2.5" />
      </span>
      <span className="sr-only sm:not-sr-only">Assistente</span>
      {baixando && (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 size-2.5 border border-contorno bg-amarelo motion-safe:animate-pulse"
        />
      )}
      {baixando && <span className="sr-only">(baixando o modelo)</span>}
    </button>
  )
}
