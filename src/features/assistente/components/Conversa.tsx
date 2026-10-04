import { useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Forma } from '@/shared/components/Forma'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { useAssistente, type MensagemChat } from '../assistente-context'
import { PERGUNTAS_PRONTAS } from '../perguntas'
import { TextoFormatado } from './TextoFormatado'

/** Mensagens da conversa; vazia, mostra perguntas prontas. Acompanha a resposta enquanto ela é escrita. */
export function Conversa() {
  const { mensagens, enviar, respondendo } = useAssistente()
  const lista = useRef<HTMLDivElement>(null)
  // Só segue o fim se a pessoa não rolou para cima para reler.
  const noFim = useRef(true)

  useEffect(() => {
    const el = lista.current
    if (el && noFim.current) el.scrollTop = el.scrollHeight
  }, [mensagens])

  if (mensagens.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-end gap-4 overflow-y-auto p-4">
        <span aria-hidden className="flex items-end gap-1">
          <Forma forma="circulo" cor="azul" className="size-6" />
          <Forma forma="triangulo" cor="amarelo" className="size-8" />
          <Forma forma="quadrado" cor="vermelho" className="size-5" />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="font-heading text-xl leading-tight font-bold uppercase">Como posso ajudar?</p>
          <p className="text-sm text-muted-foreground">Pergunte sobre o seu dinheiro ou sobre como usar o app.</p>
        </div>
        {PERGUNTAS_PRONTAS.map(({ grupo, perguntas }) => (
          <div key={grupo} className="flex flex-col gap-2">
            <p className={cn(ROTULO, 'text-muted-foreground')}>{grupo}</p>
            {perguntas.map((p) => (
              <button
                key={p}
                type="button"
                disabled={respondendo}
                onClick={() => enviar(p)}
                className="border-2 border-contorno bg-card px-3 py-2 text-left text-sm shadow-bloco-sm transition-[background-color,box-shadow,translate] duration-100 outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:shadow-none disabled:opacity-50 motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px]"
              >
                {p}
              </button>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={lista}
      onScroll={(e) => {
        const el = e.currentTarget
        noFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
      }}
      role="log"
      aria-live="polite"
      aria-busy={respondendo}
      className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
    >
      {mensagens.map((m) => (
        <Bolha key={m.id} mensagem={m} />
      ))}
    </div>
  )
}

const AVISO: Partial<Record<NonNullable<MensagemChat['situacao']>, string>> = {
  parada: 'Você parou a resposta.',
  cortada: 'A resposta ficou longa e foi cortada. Peça para continuar.',
}

function Bolha({ mensagem }: { mensagem: MensagemChat }) {
  if (mensagem.papel === 'usuario') {
    return (
      <div className="max-w-[85%] self-end bg-foreground px-3 py-2 text-sm whitespace-pre-wrap text-background [overflow-wrap:anywhere]">
        {mensagem.texto}
      </div>
    )
  }
  if (mensagem.situacao === 'erro') {
    return (
      <CaixaDestaque fundo="bg-negativo-suave" faixa="border-l-vermelho" className="max-w-[92%] self-start">
        <p>
          <strong className="font-semibold">Não deu certo:</strong> {mensagem.texto}
        </p>
      </CaixaDestaque>
    )
  }
  const escrevendo = mensagem.situacao === 'escrevendo'
  const aviso = mensagem.situacao && AVISO[mensagem.situacao]
  return (
    <div className="flex max-w-[92%] flex-col gap-1.5 self-start">
      {mensagem.consultas && mensagem.consultas.length > 0 && (
        <ul aria-label="O que o assistente consultou" className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {mensagem.consultas.map((c, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Search aria-hidden className="mt-0.5 size-3 shrink-0" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="border-2 border-contorno bg-card px-3 py-2 text-sm shadow-bloco-sm">
        {mensagem.texto ? (
          <TextoFormatado texto={mensagem.texto} />
        ) : escrevendo ? (
          <Pensando />
        ) : (
          <span className="text-muted-foreground">Sem resposta.</span>
        )}
      </div>
      {aviso && <p className="text-xs text-muted-foreground">{aviso}</p>}
    </div>
  )
}

/** Enquanto o modelo lê a pergunta: as três formas acendendo em sequência. */
function Pensando() {
  return (
    <span role="status" className="flex items-center gap-1.5 py-1">
      <span className="sr-only">Pensando…</span>
      {(['circulo', 'triangulo', 'quadrado'] as const).map((forma, i) => (
        <Forma
          key={forma}
          forma={forma}
          cor={(['azul', 'amarelo', 'vermelho'] as const)[i]}
          className="size-2.5 motion-safe:animate-pulse"
        />
      ))}
    </span>
  )
}
