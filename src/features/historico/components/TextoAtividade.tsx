import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import type { Atividade } from '../model/atividade'
import { COR_TOM } from '../constants/textos'
import { regexDosNomes } from '../utils/destaque'

/** Valores em reais dentro da frase ("R$ 1.250,00", com o espaço inseparável do `formatarBRL`). */
const DINHEIRO = /(R\$\s[\d.]+,\d{2})/

interface TextoAtividadeProps {
  atividade: Atividade
  /** No extrato: os nomes citados (lançamento, tag, conta…) ganham negrito e sublinhado amarelo. */
  destacarNomes?: boolean
}

/** Um trecho sem dinheiro, com os nomes citados sublinhados. */
function comNomes(trecho: string, nomes: RegExp | null, chave: number): ReactNode {
  if (!nomes) return trecho
  return trecho.split(nomes).map((parte, i) =>
    i % 2 === 1 ? (
      <span
        key={`${chave}-${i}`}
        className="font-semibold underline decoration-amarelo decoration-[3px] underline-offset-4 [text-decoration-skip-ink:none]"
      >
        {parte}
      </span>
    ) : (
      parte
    ),
  )
}

/** A frase da atividade com os valores em negrito, na cor do assunto (entrada azul, saída vermelha, economia ocre). */
export function TextoAtividade({ atividade, destacarNomes }: TextoAtividadeProps) {
  const cor = atividade.tom && COR_TOM[atividade.tom]
  const lista = destacarNomes ? atividade.detalhe?.nomes : undefined
  const nomes = lista?.length ? regexDosNomes(lista) : null
  return (
    <span className="min-w-0 text-sm [overflow-wrap:anywhere]">
      {atividade.texto.split(DINHEIRO).map((parte, i) =>
        i % 2 === 1 ? (
          <span key={i} className={cn('font-semibold whitespace-nowrap tabular-nums', cor)}>
            {parte}
          </span>
        ) : (
          comNomes(parte, nomes, i)
        ),
      )}
    </span>
  )
}
