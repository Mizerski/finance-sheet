import { useEffect, useRef } from 'react'
import { SquarePen, X } from '@/shared/ui/icones'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { Forma } from '@/shared/components/Forma'
import { TITULO_CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useAssistente, type Fase, type SituacaoMotor } from '../context/assistente-context'
import { infoModelo } from '../constants/modelos'
import { useDadosFinanceiros, useRetratoFinanceiro } from '../hooks/useDadosFinanceiros'
import { CampoPergunta } from './CampoPergunta'
import { Conversa } from './Conversa'
import { EscolhaModelo } from './EscolhaModelo'
import { OpcoesAssistente } from './OpcoesAssistente'
import { ProgressoDownload } from './ProgressoDownload'

const SITUACAO: Record<SituacaoMotor, string> = {
  desligado: 'desligado',
  ligando: 'ligando…',
  ligado: 'pronto',
}

/**
 * Painel lateral, não modal: o app e os atalhos continuam funcionando com ele aberto.
 * Esc fecha, e o foco volta para onde estava.
 */
export function PainelAssistente() {
  const { aberto, setAberto, fase, motor, mensagens, novaConversa, erro } = useAssistente()
  const anterior = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!aberto) return
    anterior.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return () => anterior.current?.focus()
  }, [aberto])

  if (!aberto) return null

  return (
    <aside
      aria-label="Assistente"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !e.defaultPrevented) setAberto(false)
      }}
      className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l-2 border-contorno bg-background shadow-bloco-lg duration-150 min-[34rem]:w-[28rem] motion-safe:animate-in motion-safe:slide-in-from-right-8 motion-safe:fade-in-0"
    >
      <span
        aria-hidden
        className="h-1.5 shrink-0 bg-[linear-gradient(to_right,var(--vermelho)_0_33.34%,var(--azul)_33.34%_66.67%,var(--amarelo)_66.67%)] dark:bg-[linear-gradient(to_right,var(--vermelho)_0_calc(33.34%_-_1px),var(--contorno)_0_calc(33.34%_+_1px),var(--azul)_0_calc(66.67%_-_1px),var(--contorno)_0_calc(66.67%_+_1px),var(--amarelo)_0)]"
      />
      <header className="flex items-stretch border-b-2 border-contorno">
        <span aria-hidden className="flex w-12 shrink-0 items-end justify-center gap-0.5 border-r-2 border-contorno bg-tinta pb-3">
          <Forma forma="circulo" cor="azul" className="size-2.5" />
          <Forma forma="triangulo" cor="amarelo" className="size-3.5" />
          <Forma forma="quadrado" cor="vermelho" className="size-2" />
        </span>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 py-2 pr-2 pl-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className={TITULO_CARD}>Assistente</h2>
            <p className="truncate text-xs text-muted-foreground">{subtitulo(fase, motor)}</p>
          </div>
          <div className="flex shrink-0 items-center">
            {fase.tipo === 'pronto' && mensagens.length > 0 && (
              <Button variant="ghost" size="icon" className="rounded-full" onClick={novaConversa} aria-label="Nova conversa" title="Nova conversa">
                <SquarePen />
              </Button>
            )}
            {fase.tipo === 'pronto' && <OpcoesAssistente id={fase.id} />}
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setAberto(false)} aria-label="Fechar o assistente" title="Fechar (Esc)">
              <X />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Conteudo fase={fase} />
      </div>
      {fase.tipo === 'pronto' && erro && (
        <p role="alert" className={cn('border-t-2 border-contorno px-4 py-2 text-xs text-negativo')}>
          {erro}
        </p>
      )}
      {fase.tipo === 'pronto' && <CampoPergunta />}
      <ContextoDoPrompt />
    </aside>
  )
}

/** Com o painel aberto, calcula o retrato e entrega ao provider os dados que vão no prompt e nas ferramentas. */
function ContextoDoPrompt() {
  const { definirContexto } = useAssistente()
  const dados = useDadosFinanceiros()
  const retrato = useRetratoFinanceiro(dados)
  useEffect(() => definirContexto(retrato, dados), [retrato, dados, definirContexto])
  return null
}

function subtitulo(fase: Fase, motor: SituacaoMotor): string {
  switch (fase.tipo) {
    case 'pronto':
      return `${infoModelo(fase.id).nome} · ${SITUACAO[motor]}`
    case 'baixando':
      return 'Baixando o modelo'
    case 'escolher':
      return 'IA que roda no seu computador'
    default:
      return ''
  }
}

function Conteudo({ fase }: { fase: Fase }) {
  switch (fase.tipo) {
    case 'carregando':
      return <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
    case 'semMotor':
      return (
        <EstadoVazio
          titulo="Assistente indisponível"
          descricao="O motor do assistente não veio com esta instalação. Instale a versão mais recente do app."
        />
      )
    case 'escolher':
      return <EscolhaModelo />
    case 'baixando':
      return <ProgressoDownload fase={fase} />
    case 'pronto':
      return <Conversa />
  }
}
