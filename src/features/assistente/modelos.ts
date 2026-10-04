import type { PlacaDeVideo } from './api'

/** Como cada modelo do catálogo do Rust (`catalogo.rs`) aparece para a pessoa, pelo `id`. */
export interface InfoModelo {
  nome: string
  /** Uma palavra para o cartão de escolha. */
  perfil: string
  frase: string
  /** Sabe chamar as ferramentas (`ferramentas.ts`); sem isso, responde só com o retrato. */
  ferramentas: boolean
}

export const INFO_MODELO: Record<string, InfoModelo> = {
  'qwen3.5-4b': {
    nome: 'Qwen 3.5 · 4B',
    perfil: 'Mais esperto',
    frase: 'Respostas melhores. Rápido com placa de vídeo; sem ela, escreve devagar.',
    ferramentas: true,
  },
  'gemma4-e2b': {
    nome: 'Gemma 4 · E2B',
    perfil: 'Mais rápido',
    frase: 'Respostas mais curtas e simples, mas quase duas vezes mais rápido em computador sem placa de vídeo.',
    ferramentas: true,
  },
}

export const infoModelo = (id: string): InfoModelo =>
  INFO_MODELO[id] ?? { nome: id, perfil: id, frase: '', ferramentas: false }

/** Placa com memória para o modelo maior inteiro (com folga para o contexto). */
const MEMORIA_PARA_O_MAIOR_MB = 4000

/** Com placa de vídeo, o mais esperto; sem ela, o mais rápido. */
export function modeloRecomendado(placa: PlacaDeVideo | null): string {
  return placa && placa.memoriaMb >= MEMORIA_PARA_O_MAIOR_MB ? 'qwen3.5-4b' : 'gemma4-e2b'
}

/** "2,7 GB", "850 MB". */
export function formatarTamanho(bytes: number): string {
  const gb = bytes / 1e9
  if (gb >= 1) return `${gb.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB`
  return `${Math.round(bytes / 1e6).toLocaleString('pt-BR')} MB`
}
