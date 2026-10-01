import type { ReactNode } from 'react'
import { COR_RISCO } from '@/features/risco/cores'
import { DataForte, DinheiroForte, Forte, NomeNivel, SaldoForte } from '@/features/risco/components/Destaques'
import { SeloRisco } from '@/features/risco/components/SeloRisco'
import { NIVEIS, type AnaliseRisco, type NivelRisco } from '@/features/risco/risco'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { MaisDetalhes } from '@/shared/components/MaisDetalhes'
import { formatarData, formatarMesAno } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CARD, ROTULO, VALOR_DESTAQUE, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import type { CapacidadePoupanca } from '../capacidade'

interface CardCapacidadeProps {
  capacidade: CapacidadePoupanca
  risco: AnaliseRisco
  /** Quanto dá para guardar a mais por mês sem o caixa passar de cada nível. */
  porNivel: Record<NivelRisco, number>
}

/**
 * Quanto ainda cabe guardar por mês: o valor que não piora o risco do caixa em destaque,
 * o quanto cada nível mais apertado permitiria e o limite (saldo sem ficar negativo).
 */
export function CardCapacidade({ capacidade, risco, porNivel }: CardCapacidadeProps) {
  const { menorSaldo, sobraMediaCentavos, economiaMediaCentavos, primeiroAporte, fim } = capacidade
  const negativo = menorSaldo !== null && menorSaldo.valorCentavos < 0
  const seguro = porNivel[risco.nivel]

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Quanto dá para guardar"
        faixa="bg-amarelo"
        forma={{ forma: 'quarto', cor: 'tinta' }}
        ajuda={
          <Ajuda titulo="Quanto dá para guardar">
            <p>
              Quanto você ainda consegue guardar <Forte>a mais por mês</Forte>, além das metas atuais, de{' '}
              {formatarMesAno(primeiroAporte, 'curto')} a {formatarMesAno(fim, 'curto')}, guardando todo dia 1º.
            </p>
            <p>
              O valor em destaque é o que deixa o risco do caixa como está. Guardar mais é possível, mas aperta o caixa:
              veja quanto em cada nível nos detalhes do card.
            </p>
          </Ajuda>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={cn('text-[2.75rem]', VALOR_DESTAQUE, seguro > 0 && 'text-economia')}>
            {formatarBRL(seguro)}
          </span>
          <span className={cn(ROTULO, 'text-muted-foreground')}>por mês, sem piorar o risco</span>
        </p>
        <CaixaDestaque fundo="bg-economia-suave" faixa="border-l-amarelo">
          <p>
            <Conclusao capacidade={capacidade} risco={risco} seguro={seguro} />
          </p>
        </CaixaDestaque>

        {!negativo && capacidade.capacidadeCentavos > 0 && (
          <MaisDetalhes rotulo="Ver quanto dá em cada nível">
            <Escada risco={risco} porNivel={porNivel} />
            <p className="text-sm">
              <Maximo capacidade={capacidade} seguro={seguro} />
            </p>
          </MaisDetalhes>
        )}
      </div>

      <dl className="grid grid-cols-3 border-t-2 border-foreground">
        <Dado rotulo="Sobra média" curto="Sobra">
          <span className={cn(sobraMediaCentavos < 0 && 'text-negativo')}>{formatarBRL(sobraMediaCentavos)}</span>
        </Dado>
        <Dado rotulo="Metas por mês" curto="Metas">
          <span className="text-economia">{formatarBRL(economiaMediaCentavos)}</span>
        </Dado>
        <Dado rotulo="Menor saldo" curto="Mín. saldo">
          {menorSaldo ? (
            <span className="flex flex-col">
              <span className={cn(VALOR_SALDO, negativo && 'text-negativo')}>{formatarBRL(menorSaldo.valorCentavos)}</span>
              <span className="text-xs font-normal text-muted-foreground">{formatarData(menorSaldo.data)}</span>
            </span>
          ) : (
            '—'
          )}
        </Dado>
      </dl>
    </Card>
  )
}

/**
 * "Quanto mais você guarda, mais o caixa aperta": do nível atual ao 5, o valor até onde cada um vai.
 * Níveis com o mesmo valor do anterior são pulados (a sobra média, e não o saldo, é que limita).
 */
function Escada({ risco, porNivel }: { risco: AnaliseRisco; porNivel: Record<NivelRisco, number> }) {
  const degraus = NIVEIS.filter((n) => n >= risco.nivel).filter(
    (n, i, lista) => i === 0 || porNivel[n] > porNivel[lista[i - 1]],
  )

  return (
    <div className="flex flex-col gap-1.5">
      <span className={cn(ROTULO, 'text-muted-foreground')}>Quanto mais você guarda, mais o caixa aperta</span>
      <ol className="flex flex-col border-2 border-foreground">
        {degraus.map((n) => (
          <li
            key={n}
            className={cn('flex items-center gap-2 border-foreground px-3 py-2 text-sm not-last:border-b-2', COR_RISCO[n].suave)}
          >
            <span className="min-w-0 flex-1">
              Até <DinheiroForte centavos={porNivel[n]} /> por mês
              {n === 5 && <span className="text-foreground/75"> · o limite: o saldo chega perto de zero</span>}
            </span>
            <SeloRisco nivel={n} />
          </li>
        ))}
      </ol>
      {degraus.length === 1 && (
        <p className="text-xs text-muted-foreground">
          Guardar mais que isso usaria o dinheiro que já está na conta, então o valor é o mesmo em todos os níveis.
        </p>
      )}
    </div>
  )
}

function Dado({ rotulo, curto, children }: { rotulo: string; curto: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-foreground px-3 py-2.5 not-last:border-r-2 first:pl-4 sm:first:pl-5">
      <dt className={cn(ROTULO, 'truncate text-muted-foreground')}>
        <span className="sm:hidden">{curto}</span>
        <span className="hidden sm:inline">{rotulo}</span>
      </dt>
      <dd className="text-sm font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

/** A conclusão em uma frase: o valor seguro ou por que não sobra espaço. */
function Conclusao({ capacidade, risco, seguro }: { capacidade: CapacidadePoupanca; risco: AnaliseRisco; seguro: number }) {
  const { capacidadeCentavos: limite, motivo, limite: diaLimite, menorSaldo } = capacidade

  if (motivo === 'negativo' && menorSaldo) {
    return (
      <>
        <Forte>Primeiro, cubra o buraco.</Forte> O saldo fica negativo em <DataForte data={menorSaldo.data} /> (
        <SaldoForte centavos={menorSaldo.valorCentavos} />
        ). Antes de guardar mais, corte gastos ou adie aportes.
      </>
    )
  }

  if (limite === 0) {
    return (
      <>
        <Forte>Não sobra espaço agora.</Forte>{' '}
        {motivo === 'sobra' ? (
          <>Nos próximos meses sai tanto quanto entra, então guardar mais usaria o dinheiro que já está na conta.</>
        ) : (
          <>
            O saldo chega perto de zero em {diaLimite && <DataForte data={diaLimite.data} />}, então um aporte novo
            deixaria a conta no vermelho.
          </>
        )}
      </>
    )
  }

  return seguro > 0 ? (
    <>
      Guardando <Forte>até {formatarBRL(seguro)} a mais por mês</Forte>, seu caixa continua{' '}
      <NomeNivel nivel={risco.nivel} /> e o dinheiro que já está na conta fica lá.
    </>
  ) : (
    <>
      Seu caixa já está em <NomeNivel nivel={risco.nivel} /> no limite do nível:{' '}
      <Forte>qualquer valor a mais o deixa mais apertado.</Forte>
    </>
  )
}

/** O máximo (saldo sem ficar negativo) e o que o limita: a sobra média ou o dia em que o saldo aperta. */
function Maximo({ capacidade, seguro }: { capacidade: CapacidadePoupanca; seguro: number }) {
  const { capacidadeCentavos: limite, motivo, limite: diaLimite, sobraMediaCentavos } = capacidade
  return (
    <>
      {limite === seguro ? 'Esse também é o máximo' : <>O máximo é <DinheiroForte centavos={limite} /> por mês</>}
      {motivo === 'sobra' ? (
        <>
          : é o que <Forte>sobra por mês, em média</Forte>. Mais que isso usaria o dinheiro que já está na conta.
        </>
      ) : (
        <>
          , menos que a sobra média de <DinheiroForte centavos={sobraMediaCentavos} />, porque o saldo aperta em{' '}
          {diaLimite && <DataForte data={diaLimite.data} />}. Mais que isso deixaria a conta negativa.
        </>
      )}
    </>
  )
}
