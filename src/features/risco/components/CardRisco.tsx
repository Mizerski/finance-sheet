import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { formatarMesAno } from '@/shared/lib/datas'
import { CARD, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { COR_RISCO } from '../cores'
import { NIVEL, percentualDoMes, type AnaliseRisco } from '../risco'
import type { ContextoRisco } from '../simulacao'
import { DinheiroForte, Forte } from './Destaques'
import { FaixaMeses } from './FaixaMeses'
import { LegendaCompleta } from './LegendaRisco'
import { ConselhoRisco, FraseDiaApertado } from './MensagemRisco'
import { SeloRisco } from './SeloRisco'
import { SimuladorConta } from './SimuladorConta'

interface CardRiscoProps {
  risco: AnaliseRisco
  /** Os dados atuais, para simular uma conta nova. */
  contexto: ContextoRisco
}

/**
 * O risco do caixa nos próximos 12 meses, em 5 níveis, e o simulador de conta nova.
 * De cara, só o nível, o dia mais apertado e os meses; a régua e a legenda ficam no "?".
 */
export function CardRisco({ risco, contexto }: CardRiscoProps) {
  const { nivel, meses, diasPorNivel, fim, referenciaCentavos } = risco
  const cores = COR_RISCO[nivel]
  const percentual = percentualDoMes(risco.menorSaldo.valorCentavos, referenciaCentavos)

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Risco do caixa"
        faixa={cores.bloco}
        forma={{ forma: 'triangulo', cor: 'tinta' }}
        ajuda={
          <Ajuda titulo="Risco do caixa" largo>
            <p>
              Quanto dinheiro sobra na sua conta, dia a dia, de hoje até {formatarMesAno(fim, 'curto')}.
            </p>
            <p>
              A régua compara o saldo de cada dia com o que você gasta num mês (
              <DinheiroForte centavos={referenciaCentavos} />
              ). Os aportes das metas já estão descontados.
              {percentual !== null && risco.menorSaldo.valorCentavos >= 0 && (
                <>
                  {' '}
                  No dia mais apertado, sobram <Forte>{percentual < 1 ? 'menos de 1%' : `${percentual}%`}</Forte> disso.
                </>
              )}
            </p>
            <span className={cn(ROTULO, 'mt-1 text-muted-foreground')}>O que quer dizer cada nível · dias em cada um</span>
            <LegendaCompleta diasPorNivel={diasPorNivel} />
          </Ajuda>
        }
        acoes={<SeloRisco nivel={nivel} className="h-6 px-2 text-xs" />}
      />

      <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-2 lg:items-center">
        <CaixaDestaque fundo={cores.suave} faixa={cores.faixa}>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn('font-heading text-[1.75rem] leading-none font-extrabold uppercase', cores.texto)}>
              {NIVEL[nivel].nome}
            </span>
            <span className={cn(ROTULO, 'text-foreground/70')}>nível {nivel} de 5</span>
          </p>
          <p>
            <FraseDiaApertado risco={risco} curta />
          </p>
          <p>
            <ConselhoRisco risco={risco} />
          </p>
        </CaixaDestaque>

        <FaixaMeses meses={meses} rotulo="Mês a mês: o nível do dia mais apertado de cada mês" comRotulo />
      </div>

      <SimuladorConta risco={risco} contexto={contexto} />
    </Card>
  )
}
