import { useState, type KeyboardEvent } from 'react'
import { ArrowLeft, Download } from '@/shared/ui/icones'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { Forma } from '@/shared/components/Forma'
import { BOTAO, ROTULO } from '@/shared/lib/estilos'
import type { FormaDaPagina } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { ModeloInstalavel, PlacaDeVideo } from '../api'
import { useAssistente } from '../assistente-context'
import { formatarTamanho, infoModelo, modeloRecomendado } from '../modelos'

const FORMA_MODELO: Record<string, FormaDaPagina> = {
  'qwen3.5-4b': { forma: 'circulo', cor: 'azul' },
  'gemma4-e2b': { forma: 'triangulo', cor: 'amarelo' },
}

/** Primeira vez (ou troca de modelo): explica, recomenda um modelo pela placa de vídeo e baixa. */
export function EscolhaModelo() {
  const { modelos, placa, baixar, voltarDaEscolha, erro } = useAssistente()
  const recomendado = placa === undefined ? undefined : modeloRecomendado(placa)
  const [escolhido, setEscolhido] = useState<string | undefined>(undefined)
  const atual = modelos.find((m) => m.baixado)
  // Um download pausado vem marcado, para continuar com um clique; na troca, nunca o modelo em uso.
  const pausado = modelos.find((m) => m.parcial > 0 && !m.baixado)
  const outro = modelos.find((m) => !m.baixado)
  const sugerido = recomendado && recomendado !== atual?.id ? recomendado : outro?.id
  const id = escolhido ?? pausado?.id ?? sugerido ?? modelos[0]?.id
  const modelo = modelos.find((m) => m.id === id)

  return (
    <div className="flex flex-col gap-4 p-4">
      {atual && (
        <Button variant="link" className="-ml-3 self-start" onClick={voltarDaEscolha}>
          <ArrowLeft />
          Voltar para a conversa
        </Button>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="font-heading text-xl leading-tight font-bold uppercase">
          {atual ? 'Trocar o modelo' : 'Tire dúvidas sobre o app e o seu dinheiro'}
        </p>
        <p className="text-sm text-muted-foreground">
          {atual
            ? 'O modelo novo substitui o atual quando terminar de baixar.'
            : 'O assistente explica como usar o app e como está o seu dinheiro, em português. Para funcionar, baixe uma vez o modelo de IA.'}
        </p>
      </div>

      <CaixaDestaque fundo="bg-entrada-suave" faixa="border-l-azul">
        <p>
          <strong className="font-semibold">Tudo roda no seu computador.</strong> Suas perguntas e seus dados não saem
          daqui, e depois de baixar funciona sem internet.
        </p>
      </CaixaDestaque>

      <div className="flex flex-col gap-2">
        <p className={cn(ROTULO, 'text-muted-foreground')}>Modelo</p>
        <OpcoesModelo modelos={modelos} valor={id} recomendado={recomendado} onChange={setEscolhido} />
        <LinhaPlaca placa={placa} />
      </div>

      {erro && (
        <p role="alert" className="text-sm text-negativo">
          {erro}
        </p>
      )}

      {modelo?.baixado ? (
        <Button className={cn(BOTAO, 'w-full')} disabled>
          Este é o modelo em uso
        </Button>
      ) : modelo && (
        <Button className={cn(BOTAO, 'w-full')} onClick={() => baixar(modelo.id)}>
          <Download />
          {modelo.parcial > 0
            ? `Continuar download (${formatarTamanho(modelo.parcial)} de ${formatarTamanho(modelo.bytes)})`
            : `Baixar ${formatarTamanho(modelo.bytes)}`}
        </Button>
      )}
    </div>
  )
}

function OpcoesModelo({
  modelos,
  valor,
  recomendado,
  onChange,
}: {
  modelos: ModeloInstalavel[]
  valor: string | undefined
  recomendado: string | undefined
  onChange: (id: string) => void
}) {
  // Setas trocam a escolha, como num grupo de rádio.
  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const atual = modelos.findIndex((m) => m.id === valor)
    const passo = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1
    const proximo = modelos[(atual + passo + modelos.length) % modelos.length]
    onChange(proximo.id)
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')[modelos.indexOf(proximo)]?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Modelo" onKeyDown={aoTeclar} className="grid gap-2 min-[26rem]:grid-cols-2">
      {modelos.map((m) => {
        const ativo = m.id === valor
        const info = infoModelo(m.id)
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={ativo}
            tabIndex={ativo ? 0 : -1}
            onClick={() => onChange(m.id)}
            className={cn(
              'group flex flex-col gap-1.5 border-2 border-contorno p-3 text-left transition-[background-color,box-shadow,translate] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              ativo
                ? 'bg-foreground text-background motion-safe:translate-x-[2px] motion-safe:translate-y-[2px]'
                : 'bg-card shadow-bloco-sm hover:bg-amarelo hover:text-tinta active:shadow-none motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px]',
            )}
          >
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.06em] uppercase">
              <Forma {...(FORMA_MODELO[m.id] ?? { forma: 'quadrado', cor: 'vermelho' })} className="size-3.5" />
              {info.perfil}
              {m.id === recomendado && (
                <span
                  className={cn(
                    'ml-auto border-[1.5px] px-1 py-0.5 text-[0.6rem] leading-none',
                    ativo ? 'border-background' : 'border-current',
                  )}
                >
                  Indicado
                </span>
              )}
            </span>
            <span className={cn('text-[0.8125rem] leading-snug', ativo ? 'text-background/85' : 'text-muted-foreground dark:group-hover:text-tinta/80')}>
              {info.frase}
            </span>
            <span className={cn('text-xs tabular-nums', ativo ? 'text-background/70' : 'text-muted-foreground dark:group-hover:text-tinta/80')}>
              {info.nome} · {formatarTamanho(m.bytes)}
              {m.baixado && ' · em uso'}
              {m.parcial > 0 && ` · pausado em ${Math.floor((m.parcial / m.bytes) * 100)}%`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function LinhaPlaca({ placa }: { placa: PlacaDeVideo | null | undefined }) {
  if (placa === undefined) return <p className="text-xs text-muted-foreground">Conferindo a placa de vídeo…</p>
  if (!placa)
    return (
      <p className="text-xs text-muted-foreground">
        Não achamos placa de vídeo: o assistente vai usar o processador, então as respostas saem mais devagar.
      </p>
    )
  return (
    <p className="text-xs text-muted-foreground">
      Placa de vídeo: <strong className="font-semibold text-foreground">{placa.nome}</strong> (
      <span className="tabular-nums">{Math.round(placa.memoriaMb / 1024)} GB</span>).
    </p>
  )
}
