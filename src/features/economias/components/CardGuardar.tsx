import type { ReactNode } from 'react'
import { COR_RISCO } from '@/features/risco/constants/cores'
import { DataForte, DinheiroForte, Forte, NomeNivel, SaldoForte } from '@/features/risco/components/Destaques'
import { SeloRisco } from '@/features/risco/components/SeloRisco'
import { NIVEIS, type AnaliseRisco, type NivelRisco } from '@/features/risco/utils/risco'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { Forma } from '@/shared/components/Forma'
import { MaisDetalhes } from '@/shared/components/MaisDetalhes'
import { deDataISO, formatarData, formatarMesAno, paraDataISO, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CARD, ROTULO, TITULO_CARD, VALOR_DESTAQUE, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Plus, RefreshCw } from '@/shared/ui/icones'
import type { MetaEconomia } from '../model/meta'
import type { ResumoMeta } from '../utils/aportes'
import type { CapacidadePoupanca } from '../utils/capacidade'
import { alvoDaReserva, MESES_DE_RESERVA, type GastoEssencial, type MesesDeReserva } from '../utils/reserva'
import { BarraProgresso } from './BarraProgresso'

interface CardGuardarProps {
  capacidade: CapacidadePoupanca
  risco: AnaliseRisco
  /** Quanto dá para guardar a mais por mês sem o caixa passar de cada nível. */
  porNivel: Record<NivelRisco, number>
  gasto: GastoEssencial
  meses: MesesDeReserva
  onMeses: (meses: MesesDeReserva) => void
  /** A meta usada como reserva, se houver, com a situação dela. */
  existente?: { meta: MetaEconomia; resumo: ResumoMeta }
  onCriarReserva: (alvoCentavos: number) => void
  onAtualizarAlvo: (meta: MetaEconomia, alvoCentavos: number) => void
}

/**
 * Quanto ainda cabe guardar por mês e para onde isso pode ir primeiro: a reserva de emergência. Eram dois cards que
 * respondiam a mesma pergunta ("quanto guardar?"); juntos, a reserva diz em quanto tempo o valor que cabe chega lá.
 */
export function CardGuardar(props: CardGuardarProps) {
  const { capacidade, risco, porNivel } = props
  const seguro = porNivel[risco.nivel]

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Quanto dá para guardar"
        faixa="bg-amarelo"
        forma={{ forma: 'quarto', cor: 'tinta' }}
        descricao="A mais por mês, além das metas"
        ajuda={
          <Ajuda titulo="Quanto dá para guardar">
            <p>
              Quanto você ainda consegue guardar <Forte>a mais por mês</Forte>, além das metas atuais, de{' '}
              {formatarMesAno(capacidade.primeiroAporte, 'curto')} a {formatarMesAno(capacidade.fim, 'curto')}, guardando
              todo dia 1º.
            </p>
            <p>
              O valor que o app sugere é o que deixa o risco do caixa como está. Guardar mais é possível, mas aperta o
              caixa: veja quanto em cada nível em "Ver os números".
            </p>
            <p>
              A <Forte>reserva de emergência</Forte> costuma ser o primeiro lugar para esse dinheiro: o card mostra quanto
              ela precisa ter e em quanto tempo você chega lá.
            </p>
          </Ajuda>
        }
      />

      <div className="grid lg:grid-cols-2">
        <div className="flex flex-col gap-4 border-b-2 border-contorno px-4 py-4 sm:px-5 lg:border-r-2 lg:border-b-0">
          <CaixaDestaque fundo="bg-economia-suave" faixa="border-l-amarelo">
            <p>
              <Conclusao capacidade={capacidade} risco={risco} seguro={seguro} />
            </p>
          </CaixaDestaque>
          <MaisDetalhes rotulo="Ver os números">
            {capacidade.motivo !== 'negativo' && capacidade.capacidadeCentavos > 0 && (
              <>
                <Escada risco={risco} porNivel={porNivel} />
                <p className="text-sm">
                  <Maximo capacidade={capacidade} seguro={seguro} />
                </p>
              </>
            )}
            <Numeros capacidade={capacidade} />
          </MaisDetalhes>
        </div>
        <Reserva {...props} seguro={seguro} />
      </div>
    </Card>
  )
}

/** Sobra média, metas por mês e menor saldo: as contas por trás do valor. */
function Numeros({ capacidade }: { capacidade: CapacidadePoupanca }) {
  const { menorSaldo, sobraMediaCentavos, economiaMediaCentavos } = capacidade
  const negativo = menorSaldo !== null && menorSaldo.valorCentavos < 0
  return (
    <dl className="grid grid-cols-3 border-2 border-contorno">
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
  )
}

function Dado({ rotulo, curto, children }: { rotulo: string; curto: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-contorno px-3 py-2.5 not-last:border-r-2">
      <dt className={cn(ROTULO, 'truncate text-muted-foreground')}>
        <span className="sm:hidden">{curto}</span>
        <span className="hidden sm:inline">{rotulo}</span>
      </dt>
      <dd className="text-sm font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

/** Mês em que a reserva fica completa guardando `porMes` a partir do primeiro aporte. */
function mesDeConclusao(primeiroAporte: DataISO, meses: number): DataISO {
  const d = deDataISO(primeiroAporte)
  d.setMonth(d.getMonth() + meses - 1)
  return paraDataISO(d)
}

/** Quanto a reserva precisa ter e, sem meta de reserva, em quanto tempo o valor que cabe por mês chega lá. */
function Reserva({
  capacidade,
  gasto,
  meses,
  onMeses,
  existente,
  onCriarReserva,
  onAtualizarAlvo,
  seguro,
}: CardGuardarProps & { seguro: number }) {
  const alvo = alvoDaReserva(gasto.essencialMensalCentavos, meses)
  const { saidasMensaisCentavos: saidas, evitaveisMensaisCentavos: evitaveis, essencialMensalCentavos } = gasto
  const mesesAteLa = seguro > 0 ? Math.ceil(alvo / seguro) : null

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Forma forma="quadrado" cor="amarelo" className="size-4" />
          <h3 className={cn(TITULO_CARD, 'text-base')}>Reserva de emergência</h3>
          <Ajuda titulo="Reserva de emergência">
            <p>Dinheiro guardado para imprevistos: perder o emprego, uma doença, o carro quebrar.</p>
            {essencialMensalCentavos > 0 && (
              <p>
                O gasto essencial é tudo o que sai nos próximos 12 meses (<DinheiroForte centavos={saidas} /> por mês)
                {evitaveis > 0 ? (
                  <>
                    {' '}
                    menos os gastos evitáveis (<DinheiroForte centavos={evitaveis} />
                    ), que numa emergência dá para cortar.
                  </>
                ) : (
                  <>. Marque os gastos supérfluos com uma tag evitável para tirá-los da conta.</>
                )}
              </p>
            )}
            <p>
              <Forte>Quantos meses guardar?</Forte> O costume é de 3 a 6 com salário fixo e de 6 a 12 com renda variável
              (autônomo, PJ).
            </p>
          </Ajuda>
        </div>
        <p className="text-sm text-muted-foreground">Para imprevistos: quantos meses de gastos você quer ter guardados?</p>
      </div>

      <ControleSegmentado
        rotulo="Meses de gasto essencial"
        valor={String(meses)}
        opcoes={MESES_DE_RESERVA.map((m) => ({ valor: String(m), rotulo: `${m} meses` }))}
        onChange={(v) => onMeses(Number(v) as MesesDeReserva)}
        className="self-start"
      />

      {essencialMensalCentavos <= 0 ? (
        <p className="text-sm text-muted-foreground">
          Cadastre suas saídas em Lançamentos para calcular quanto a reserva precisa ter.
        </p>
      ) : (
        <>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className={cn('text-[2rem] text-economia', VALOR_DESTAQUE)}>{formatarBRL(alvo)}</span>
            <span className={cn(ROTULO, 'text-muted-foreground')}>
              {meses} meses de {formatarBRL(essencialMensalCentavos)}
            </span>
          </p>
          {existente ? (
            <Existente {...existente} alvo={alvo} meses={meses} onAtualizarAlvo={onAtualizarAlvo} />
          ) : (
            <>
              <p className="text-sm">
                {mesesAteLa === null ? (
                  <>Hoje não sobra espaço para guardar mais: comece pela folga da conta e volte aqui.</>
                ) : (
                  <>
                    Guardando os <DinheiroForte centavos={seguro} /> que cabem por mês, você junta isso em{' '}
                    {mesesAteLa > 120 ? (
                      <Forte>mais de 10 anos</Forte>
                    ) : (
                      <>
                        <Forte>
                          {mesesAteLa} {mesesAteLa === 1 ? 'mês' : 'meses'}
                        </Forte>{' '}
                        ({formatarMesAno(mesDeConclusao(capacidade.primeiroAporte, mesesAteLa))})
                      </>
                    )}
                    .
                  </>
                )}
              </p>
              <Button className={cn(BOTAO, 'self-start')} onClick={() => onCriarReserva(alvo)}>
                <Plus />
                Criar meta de reserva
              </Button>
            </>
          )}
        </>
      )}
    </div>
  )
}

/** Progresso da meta de reserva e, se o alvo dela ficou diferente do sugerido, o atalho para atualizar. */
function Existente({
  meta,
  resumo,
  alvo,
  meses,
  onAtualizarAlvo,
}: NonNullable<CardGuardarProps['existente']> & {
  alvo: number
  meses: MesesDeReserva
  onAtualizarAlvo: CardGuardarProps['onAtualizarAlvo']
}) {
  const diferente = meta.valorAlvoCentavos !== alvo

  return (
    <div className="flex flex-col gap-3 border-t-2 border-contorno pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={cn(ROTULO, 'truncate')}>{meta.nome}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{formatarBRL(resumo.guardadoCentavos)}</span>
          {meta.valorAlvoCentavos === undefined ? (
            ' guardados'
          ) : (
            <>
              {' '}
              de {formatarBRL(meta.valorAlvoCentavos)} · faltam{' '}
              <span className="font-semibold text-foreground">{formatarBRL(resumo.faltaCentavos)}</span>
            </>
          )}
        </span>
      </div>
      {meta.valorAlvoCentavos !== undefined && (
        <BarraProgresso percentual={resumo.percentual} rotulo={`Progresso de ${meta.nome}`} />
      )}
      {diferente && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="min-w-0 flex-1 basis-60 text-sm">
            {meta.valorAlvoCentavos === undefined ? (
              <>
                <Forte>A reserva não tem um valor para juntar.</Forte> Para{' '}
              </>
            ) : (
              <>
                <Forte>O alvo ficou desatualizado.</Forte> A meta pede {formatarBRL(meta.valorAlvoCentavos)}; para{' '}
              </>
            )}
            {meses} meses de gasto essencial, hoje seriam <Forte className="tabular-nums">{formatarBRL(alvo)}</Forte>.
          </p>
          <Button variant="outline" className={cn(BOTAO, 'h-8 px-3')} onClick={() => onAtualizarAlvo(meta, alvo)}>
            <RefreshCw />
            Atualizar alvo
          </Button>
        </div>
      )}
    </div>
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
      <ol className="flex flex-col border-2 border-contorno">
        {degraus.map((n) => (
          <li
            key={n}
            className={cn('flex items-center gap-2 border-contorno px-3 py-2 text-sm not-last:border-b-2', COR_RISCO[n].suave)}
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
