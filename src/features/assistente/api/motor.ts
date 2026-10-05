import { Channel, invoke } from '@tauri-apps/api/core'

export interface ModeloInstalavel {
  id: string
  bytes: number
  baixado: boolean
  /** Bytes de um download interrompido, que continua de onde parou. */
  parcial: number
}

export interface EstadoMotor {
  /** O llama-server veio com a instalação. */
  motor: boolean
  modelos: ModeloInstalavel[]
  /** Modelo carregado agora. */
  ligado: string | null
}

export interface PlacaDeVideo {
  nome: string
  memoriaMb: number
}

export interface Progresso {
  baixados: number
  total: number
}

/** Mensagem no formato da API do motor (compatível com a OpenAI), montada em `prompt.ts`. */
export type MensagemApi =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ChamadaApi[] }
  | { role: 'tool'; tool_call_id: string; content: string }

export interface ChamadaApi {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

/** Ferramenta que o modelo pediu: o front executa e devolve o resultado na rodada seguinte. */
export interface ChamadaFerramenta {
  id: string
  nome: string
  /** JSON dos argumentos, como o modelo escreveu. */
  argumentos: string
}

export interface FimDaResposta {
  cortada: boolean
  /** Ferramentas pedidas nesta rodada (vazia quando o modelo respondeu). */
  chamadas: ChamadaFerramenta[]
}

type EventoResposta =
  | { tipo: 'trecho'; texto: string }
  | { tipo: 'ferramentas'; chamadas: ChamadaFerramenta[] }
  | { tipo: 'fim'; cortada: boolean }

export const lerEstado = () => invoke<EstadoMotor>('assistente_estado')

export const lerPlacaDeVideo = () => invoke<PlacaDeVideo | null>('assistente_placa_de_video')

/** Resolve `true` ao concluir e `false` se foi cancelado. */
export function baixarModelo(id: string, onProgresso: (p: Progresso) => void): Promise<boolean> {
  const canal = new Channel<Progresso>()
  canal.onmessage = onProgresso
  return invoke<boolean>('assistente_baixar', { id, canal })
}

export const cancelarDownload = () => invoke<void>('assistente_cancelar_download')

export const excluirModelo = (id: string) => invoke<void>('assistente_excluir_modelo', { id })

export const ligar = (id: string) => invoke<void>('assistente_ligar', { id })

export const desligar = () => invoke<void>('assistente_desligar')

/**
 * Uma rodada do modelo, com o texto aos pedaços em `onTrecho`. Resolve com as ferramentas pedidas, se houver,
 * quando o comando termina e o último evento chega (os dois andam por caminhos separados).
 */
export function responder(
  mensagens: MensagemApi[],
  ferramentas: unknown[] | null,
  maxTokens: number,
  onTrecho: (texto: string) => void,
): Promise<FimDaResposta> {
  return new Promise((resolve, reject) => {
    let fim: FimDaResposta | null = null
    let chamadas: ChamadaFerramenta[] = []
    let terminou = false
    const concluir = () => fim && terminou && resolve(fim)
    const canal = new Channel<EventoResposta>()
    canal.onmessage = (evento) => {
      if (evento.tipo === 'trecho') onTrecho(evento.texto)
      else if (evento.tipo === 'ferramentas') chamadas = evento.chamadas
      else {
        fim = { cortada: evento.cortada, chamadas }
        concluir()
      }
    }
    invoke<void>('assistente_responder', { mensagens, ferramentas, maxTokens, canal }).then(() => {
      terminou = true
      concluir()
    }, reject)
  })
}

export const pararResposta = () => invoke<void>('assistente_parar_resposta')
