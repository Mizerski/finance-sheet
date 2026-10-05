import { createContext, useContext } from 'react'
import type { ModeloInstalavel, PlacaDeVideo, Progresso } from '../api/motor'
import type { DadosFerramentas } from '../utils/ferramentas'

export interface MensagemChat {
  id: string
  papel: 'usuario' | 'assistente'
  texto: string
  /** Só nas do assistente: escrevendo, parada pela pessoa, cortada no limite ou com erro (o texto é o erro). */
  situacao?: 'escrevendo' | 'parada' | 'cortada' | 'erro'
  /** O que o assistente consultou para responder (uma linha por ferramenta), para a pessoa ver de onde vêm os números. */
  consultas?: string[]
}

/** Onde o painel está: sem motor na instalação, escolhendo/baixando o modelo ou pronto para conversar. */
export type Fase =
  | { tipo: 'carregando' }
  | { tipo: 'semMotor' }
  | { tipo: 'escolher' }
  /** `inicio` e `baixadosNoInicio` dão a velocidade (o download pode continuar de um pedaço). */
  | { tipo: 'baixando'; id: string; progresso: Progresso; inicio: number; baixadosNoInicio: number }
  | { tipo: 'pronto'; id: string }

export type SituacaoMotor = 'desligado' | 'ligando' | 'ligado'

export interface AssistenteContexto {
  aberto: boolean
  setAberto: (aberto: boolean) => void
  fase: Fase
  motor: SituacaoMotor
  modelos: ModeloInstalavel[]
  /** `undefined` enquanto não conferiu; `null` sem placa. */
  placa: PlacaDeVideo | null | undefined
  /** Erro de download ou de ligar o motor, fora da conversa. */
  erro: string | null
  mensagens: MensagemChat[]
  respondendo: boolean
  baixar: (id: string) => void
  cancelarDownload: () => void
  /** Volta para a escolha de modelo (sem apagar o atual até o novo terminar de baixar). */
  trocarModelo: () => void
  voltarDaEscolha: () => void
  excluir: (id: string) => Promise<void>
  enviar: (texto: string) => void
  parar: () => void
  novaConversa: () => void
  /** O painel informa o retrato de hoje (vai no prompt) e os dados que as ferramentas consultam. */
  definirContexto: (retrato: string, dados: DadosFerramentas) => void
}

/** Campo da pergunta, focado pelo atalho A. */
export const ID_CAMPO_PERGUNTA = 'assistente-pergunta'

export const AssistenteContext = createContext<AssistenteContexto | null>(null)

export function useAssistente(): AssistenteContexto {
  const contexto = useContext(AssistenteContext)
  if (!contexto) throw new Error('useAssistente precisa estar dentro de <AssistenteProvider>')
  return contexto
}
