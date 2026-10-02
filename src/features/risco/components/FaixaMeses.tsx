import { formatarData, formatarMesAno, nomeDoMes } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { COR_RISCO } from '../cores'
import { NIVEL, type RiscoDoMes } from '../risco'

interface FaixaMesesProps {
  meses: RiscoDoMes[]
  /** Nome acessível da faixa ("Hoje", "Com a conta nova"). */
  rotulo: string
  /** Mostra o rótulo em cima da faixa. */
  comRotulo?: boolean
  /** Torna cada mês clicável (ex.: abrir o mês na planilha). */
  onMes?: (mes: string) => void
}

/** Um bloco por mês na cor do risco do dia mais apertado, como uma régua de cartaz. */
export function FaixaMeses({ meses, rotulo, comRotulo, onMes }: FaixaMesesProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {comRotulo && <span className={cn(ROTULO, 'text-muted-foreground')}>{rotulo}</span>}
      <ol
        aria-label={rotulo}
        className="grid border-2 border-contorno bg-card"
        style={{ gridTemplateColumns: `repeat(${meses.length}, minmax(0, 1fr))` }}
      >
        {meses.map((m, i) => {
          const mes = Number(m.mes.slice(5, 7)) - 1
          // O ano aparece no primeiro mês e em janeiro, para a virada ficar clara.
          const ano = i === 0 || mes === 0 ? m.mes.slice(2, 4) : ''
          const descricao = `${formatarMesAno(`${m.mes}-01`)}: ${NIVEL[m.nivel].nome}. Dia mais apertado ${formatarData(m.menorSaldo.data)}, com ${formatarBRL(m.menorSaldo.valorCentavos)}`
          const conteudo = (
            <>
              <span className="flex flex-col items-center py-1 leading-none">
                {/* No celular, 13 meses não cabem com três letras: fica a inicial (o nome completo vai no title). */}
                <span className="text-[0.65rem] font-semibold uppercase">
                  <span className="sm:hidden">{nomeDoMes(mes, 'curto').charAt(0)}</span>
                  <span className="hidden sm:inline">{nomeDoMes(mes, 'curto')}</span>
                </span>
                <span className="h-[0.6rem] text-[0.55rem] text-muted-foreground tabular-nums">{ano && `’${ano}`}</span>
              </span>
              <span
                className={cn(
                  'flex h-6 items-center justify-center border-t-2 border-contorno text-[0.65rem] font-bold tabular-nums sm:h-7 sm:text-xs',
                  COR_RISCO[m.nivel].bloco,
                )}
              >
                {m.nivel}
              </span>
            </>
          )
          return (
            <li key={m.mes} className="min-w-0 border-contorno not-first:border-l-2" title={descricao}>
              {onMes ? (
                <button
                  type="button"
                  onClick={() => onMes(m.mes)}
                  aria-label={`${descricao}. Abrir o mês`}
                  className="flex w-full flex-col outline-none transition-colors duration-100 hover:bg-amarelo dark:hover:bg-selecao-forte focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {conteudo}
                </button>
              ) : (
                <div className="flex flex-col">
                  <span className="sr-only">{descricao}</span>
                  <span aria-hidden className="flex flex-col">
                    {conteudo}
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
