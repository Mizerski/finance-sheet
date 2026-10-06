import { formatarData, formatarMesAno, nomeDoMes } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { COR_RISCO } from '../constants/cores'
import { maiorDosMeses, NIVEIS, NIVEL, type RiscoDoMes } from '../utils/risco'

interface FaixaMesesProps {
  meses: RiscoDoMes[]
  /** Nome acessível da faixa ("Hoje", "Com a conta nova"). */
  rotulo: string
  /** Mostra o rótulo em cima da faixa. */
  comRotulo?: boolean
  /** Maior saldo da escala; para comparar duas faixas, as duas recebem o mesmo. Sem ele, o maior destes meses. */
  maximoCentavos?: number
  /** Mostra embaixo o nome dos níveis que aparecem, com a cor de cada um. */
  legenda?: boolean
  /** Torna cada mês clicável (ex.: abrir o mês na planilha). */
  onMes?: (mes: string) => void
}

/**
 * Uma barra por mês: a altura é quanto sobra no dia mais apertado do mês e a cor é o nível do risco. Sem números
 * dentro (número pequeno ao lado do mês parecia data); o valor exato fica no `title` e no texto para leitor de tela.
 */
export function FaixaMeses({ meses, rotulo, comRotulo, maximoCentavos, legenda, onMes }: FaixaMesesProps) {
  const maximo = maximoCentavos ?? maiorDosMeses(meses)
  const niveis = NIVEIS.filter((n) => meses.some((m) => m.nivel === n))

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
          const ano = i === 0 || mes === 0 ? m.mes.slice(2, 4) : ''
          const saldo = m.menorSaldo.valorCentavos
          const falta = saldo < 0
          const altura = falta || maximo <= 0 ? 0 : (saldo / maximo) * 100
          const descricao = `${formatarMesAno(`${m.mes}-01`)}: ${NIVEL[m.nivel].nome}. ${
            falta ? 'Falta dinheiro em' : 'Dia mais apertado'
          } ${formatarData(m.menorSaldo.data)}, com ${formatarBRL(saldo)}`
          const conteudo = (
            <>
              <span className="flex h-12 items-end justify-center px-[3px] pt-1 sm:h-14 sm:px-1.5">
                {falta ? (
                  <span className="flex h-full w-full flex-col items-center justify-end gap-0.5">
                    <span className="text-[0.65rem] leading-none font-extrabold text-negativo">!</span>
                    <span className={cn('h-1.5 w-full border-2 border-b-0 border-contorno', COR_RISCO[5].bloco)} />
                  </span>
                ) : (
                  <span
                    className={cn('w-full border-2 border-b-0 border-contorno', COR_RISCO[m.nivel].bloco)}
                    style={{ height: `max(${altura}%, 0.375rem)` }}
                  />
                )}
              </span>
              <span className="flex flex-col items-center border-t-2 border-contorno py-1 leading-none">
                <span className="text-[0.65rem] font-semibold uppercase">
                  <span className="sm:hidden">{nomeDoMes(mes, 'curto').charAt(0)}</span>
                  <span className="hidden sm:inline">{nomeDoMes(mes, 'curto')}</span>
                </span>
                <span className="h-[0.6rem] text-[0.55rem] text-muted-foreground tabular-nums">{ano && `’${ano}`}</span>
              </span>
            </>
          )
          return (
            <li key={m.mes} className="min-w-0" title={descricao}>
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
      {legenda && (
        <ul aria-hidden className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {niveis.map((n) => (
            <li key={n} className="flex items-center gap-1.5">
              <span className={cn('size-2.5 border-[1.5px] border-contorno', COR_RISCO[n].bloco)} />
              {NIVEL[n].nome}
            </li>
          ))}
          <li>· barra mais alta, mais dinheiro sobrando</li>
        </ul>
      )}
    </div>
  )
}
