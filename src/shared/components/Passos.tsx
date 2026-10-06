import type { ReactNode, RefObject } from 'react'
import { BOTAO, RODAPE_DIALOG, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { ChevronLeft } from '@/shared/ui/icones'

interface CabecalhoPassosProps {
  indice: number
  total: number
  /** id da pergunta, que dá nome aos grupos de escolha do passo. */
  id: string
  titulo: RefObject<HTMLHeadingElement | null>
  children: ReactNode
}

/** "Passo 2 de 5", a régua de blocos (cheios até o atual) e a pergunta do passo. */
export function CabecalhoPassos({ indice, total, id, titulo, children }: CabecalhoPassosProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className={cn(ROTULO, 'text-muted-foreground')}>
          Passo {indice + 1} de {total}
        </span>
        <div aria-hidden className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn('h-2 flex-1 border-2 border-contorno', i <= indice ? 'bg-foreground' : 'bg-card')} />
          ))}
        </div>
      </div>
      <h3 ref={titulo} id={id} tabIndex={-1} className="font-heading text-xl leading-tight font-bold outline-none">
        {children}
      </h3>
    </>
  )
}

interface RodapePassosProps {
  /** No primeiro passo, Cancelar (fecha) em vez de Voltar. */
  primeiro: boolean
  onVoltar: () => void
  /** Texto do botão principal (Continuar, Pular, Salvar…); ele envia o formulário. */
  rotuloAvancar: string
  /** Abre o formulário completo com o que já foi respondido. */
  onVerTudo: () => void
}

/** Voltar (ou Cancelar) à esquerda, avançar à direita e o link para ver todos os campos de uma vez. */
export function RodapePassos({ primeiro, onVoltar, rotuloAvancar, onVerTudo }: RodapePassosProps) {
  return (
    <>
      <DialogFooter className={cn(RODAPE_DIALOG, 'flex-row justify-between gap-2 sm:justify-between')}>
        {primeiro ? (
          <DialogClose asChild>
            <Button type="button" variant="outline" className={BOTAO}>
              Cancelar
            </Button>
          </DialogClose>
        ) : (
          <Button type="button" variant="outline" className={cn(BOTAO, 'pl-2')} onClick={onVoltar}>
            <ChevronLeft className="size-6" />
            Voltar
          </Button>
        )}
        <Button type="submit" className={BOTAO}>
          {rotuloAvancar}
        </Button>
      </DialogFooter>
      <button
        type="button"
        onClick={onVerTudo}
        className="self-center px-1 text-xs text-muted-foreground underline underline-offset-4 transition-colors duration-100 outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-ring"
      >
        Ver todos os campos de uma vez
      </button>
    </>
  )
}

/** A lista da conferência, com contorno; cada linha é uma `LinhaConferir`. */
export function ListaConferir({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col border-2 border-contorno">{children}</dl>
}

interface LinhaConferirProps {
  rotulo: string
  /** Abre o passo da resposta. */
  onMudar: () => void
  children: ReactNode
}

/** Uma resposta na conferência: rótulo, valor e "Mudar". */
export function LinhaConferir({ rotulo, onMudar, children }: LinhaConferirProps) {
  return (
    <div className="flex min-h-12 items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
      <dt className={cn(ROTULO, 'w-24 shrink-0 text-muted-foreground')}>{rotulo}</dt>
      <dd className="min-w-0 flex-1 text-sm [overflow-wrap:anywhere]">{children}</dd>
      <button
        type="button"
        onClick={onMudar}
        aria-label={`Mudar ${rotulo.replace('?', '').toLowerCase()}`}
        className="shrink-0 self-center px-1 py-1 text-xs font-semibold underline underline-offset-4 transition-colors duration-100 outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-ring"
      >
        Mudar
      </button>
    </div>
  )
}
