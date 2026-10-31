import { cn } from '@/shared/lib/utils'
import type { Atividade } from '../model/atividade'
import { COR_TOM } from '../constants/textos'

/** Valores em reais dentro da frase ("R$ 1.250,00", com o espaço inseparável do `formatarBRL`). */
const DINHEIRO = /(R\$\s[\d.]+,\d{2})/

/** A frase da atividade com os valores em negrito, na cor do assunto (entrada azul, saída vermelha, economia ocre). */
export function TextoAtividade({ atividade }: { atividade: Atividade }) {
  const cor = atividade.tom && COR_TOM[atividade.tom]
  return (
    <span className="min-w-0 text-sm [overflow-wrap:anywhere]">
      {atividade.texto.split(DINHEIRO).map((parte, i) =>
        i % 2 === 1 ? (
          <span key={i} className={cn('font-semibold whitespace-nowrap tabular-nums', cor)}>
            {parte}
          </span>
        ) : (
          parte
        ),
      )}
    </span>
  )
}
