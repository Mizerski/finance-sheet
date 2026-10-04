import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ID_CAMPO_PERGUNTA, useAssistente } from '../assistente-context'

/** Caixa de texto da pergunta: Enter envia, Shift+Enter quebra a linha. Enquanto responde, o botão para. */
export function CampoPergunta() {
  const { enviar, parar, respondendo, aberto } = useAssistente()
  const [texto, setTexto] = useState('')
  const campo = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (aberto) campo.current?.focus()
  }, [aberto])

  // Cresce com o texto até umas 6 linhas.
  useEffect(() => {
    const el = campo.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [texto])

  function mandar(e?: FormEvent) {
    e?.preventDefault()
    if (respondendo || !texto.trim()) return
    enviar(texto)
    setTexto('')
  }

  function aoTeclar(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) mandar(e)
  }

  return (
    <form onSubmit={mandar} className="flex items-end gap-2 border-t-2 border-contorno p-3">
      <label htmlFor={ID_CAMPO_PERGUNTA} className="sr-only">
        Sua pergunta
      </label>
      <textarea
        id={ID_CAMPO_PERGUNTA}
        ref={campo}
        rows={1}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={aoTeclar}
        placeholder="Pergunte sobre seu dinheiro ou o app"
        className={cn(
          'min-h-10 flex-1 resize-none border-2 border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground',
          'focus-visible:shadow-[3px_3px_0_0_var(--ring)]',
        )}
      />
      {respondendo ? (
        <Button type="button" variant="outline" size="icon-lg" onClick={parar} aria-label="Parar a resposta" title="Parar a resposta">
          <Square className="fill-current" />
        </Button>
      ) : (
        <Button type="submit" size="icon-lg" disabled={!texto.trim()} aria-label="Enviar pergunta" title="Enviar (Enter)">
          <ArrowUp className="stroke-3" />
        </Button>
      )}
    </form>
  )
}
