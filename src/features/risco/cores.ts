import type { NivelRisco } from './risco'

interface CoresNivel {
  /** Bloco forte com o texto em contraste (selo, faixa dos meses). */
  bloco: string
  /** Só o fundo forte (quadradinho da legenda, faixa do cabeçalho do card). */
  fundo: string
  /** Fundo suave de célula e de caixa de texto. */
  suave: string
  /** Texto na cor do nível, sobre o papel ou o fundo suave. */
  texto: string
  /** Faixa grossa à esquerda de uma caixa (`border-l-*`). */
  faixa: string
}

/** Cores de cada nível do risco (tokens em index.css): azul, azul-claro, amarelo, laranja e vermelho. */
export const COR_RISCO: Record<NivelRisco, CoresNivel> = {
  1: {
    bloco: 'bg-risco-1 text-papel',
    fundo: 'bg-risco-1',
    suave: 'bg-risco-1-suave',
    texto: 'text-risco-1-texto',
    faixa: 'border-l-risco-1',
  },
  2: {
    bloco: 'bg-risco-2 text-foreground',
    fundo: 'bg-risco-2',
    suave: 'bg-risco-2-suave',
    texto: 'text-risco-2-texto',
    faixa: 'border-l-risco-2',
  },
  3: {
    bloco: 'bg-risco-3 text-foreground',
    fundo: 'bg-risco-3',
    suave: 'bg-risco-3-suave',
    texto: 'text-risco-3-texto',
    faixa: 'border-l-risco-3',
  },
  4: {
    bloco: 'bg-risco-4 text-foreground',
    fundo: 'bg-risco-4',
    suave: 'bg-risco-4-suave',
    texto: 'text-risco-4-texto',
    faixa: 'border-l-risco-4',
  },
  5: {
    bloco: 'bg-risco-5 text-papel',
    fundo: 'bg-risco-5',
    suave: 'bg-risco-5-suave',
    texto: 'text-risco-5-texto',
    faixa: 'border-l-risco-5',
  },
}
