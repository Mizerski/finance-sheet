import type { ReactNode } from 'react'
import { Plus, Sparkles } from '@/shared/ui/icones'
import { COR_RISCO } from '@/features/risco/constants/cores'
import { DataForte, Forte, NomeNivel, SaldoForte } from '@/features/risco/components/Destaques'
import type { AnaliseRisco } from '@/features/risco/utils/risco'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { formatarData, formatarMesAno, nomeDoMes } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CARD, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import type { MetaEconomia } from '../model/meta'
import type { EfeitoNaMeta, Sugestao } from '../utils/sugestoes'

interface CardSugestoesProps {
  sugestoes: Sugestao[]
  /** Risco do caixa hoje, para dizer se a sugestão o piora. */
  risco: AnaliseRisco | null
  /** Quanto dá para guardar a mais por mês sem piorar o risco do caixa. */
  guardarSemPiorarCentavos: number | null
  onAplicar: (meta: MetaEconomia) => void
  onNovaMeta: () => void
}

/**
 * Momentos bons para guardar mais: começo de mês, aumento de entrada e dinheiro extra. Em tela larga, em duas colunas
 * (a última ocupa a linha toda se sobrar sozinha), para as frases não ficarem compridas demais.
 */
export function CardSugestoes({ sugestoes, risco, guardarSemPiorarCentavos, onAplicar, onNovaMeta }: CardSugestoesProps) {
  if (sugestoes.length === 0) return null

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Sugestões"
        faixa="bg-azul"
        forma={{ forma: 'circulo', cor: 'amarelo' }}
        contagem={sugestoes.length}
        ajuda={
          <Ajuda titulo="Sugestões">
            <p>Momentos em que guardar mais pesa menos no seu bolso:</p>
            <ul className="flex list-disc flex-col gap-1.5 pl-4">
              <li>
                <Forte>Novo mês:</Forte> começo de mês é uma boa hora para rever as metas.
              </li>
              <li>
                <Forte>Aumento de entrada:</Forte> guardar metade do aumento não pesa, porque o que você já recebe
                continua igual.
              </li>
              <li>
                <Forte>Dinheiro extra:</Forte> guardar metade no aporte seguinte faz esse dinheiro virar progresso em vez
                de sumir no mês.
              </li>
            </ul>
            <p className="text-muted-foreground">Cada sugestão diz também o que acontece com o risco do caixa.</p>
          </Ajuda>
        }
      />
      <ul className="-mb-0.5 grid lg:grid-cols-2">
        {sugestoes.map((s) => (
          <li
            key={s.tipo === 'novo-mes' ? 'novo-mes' : s.tipo === 'aumento' ? `aumento-${s.aumento.mes}` : `extra-${s.entrada.lancamentoId}`}
            className="flex min-w-0 flex-col gap-2.5 border-b-2 border-contorno px-4 py-4 sm:px-5 lg:odd:border-r-2 lg:last:odd:col-span-2 lg:last:odd:border-r-0"
          >
            {s.tipo === 'novo-mes' ? (
              <NovoMes sugestao={s} guardarSemPiorarCentavos={guardarSemPiorarCentavos} risco={risco} />
            ) : (
              <Evento sugestao={s} risco={risco} onAplicar={onAplicar} onNovaMeta={onNovaMeta} />
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Titulo({ children }: { children: ReactNode }) {
  return <h3 className={cn(ROTULO, 'flex items-center gap-1.5 text-foreground')}>{children}</h3>
}

/** Número curto com rótulo, para ler de relance em vez de numa frase. */
function Numero({ rotulo, centavos, className }: { rotulo: string; centavos: number; className: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className={cn(ROTULO, 'text-foreground/70')}>{rotulo}</dt>
      <dd>
        <Valor centavos={centavos} className={className} />
      </dd>
    </div>
  )
}

function Valor({ centavos, className }: { centavos: number; className?: string }) {
  return <strong className={cn('font-bold tabular-nums', className ?? 'text-foreground')}>{formatarBRL(centavos)}</strong>
}

function NovoMes({
  sugestao: { resumo },
  guardarSemPiorarCentavos,
  risco,
}: {
  sugestao: Extract<Sugestao, { tipo: 'novo-mes' }>
  guardarSemPiorarCentavos: number | null
  risco: AnaliseRisco | null
}) {
  const mes = nomeDoMes(resumo.mes)
  const positiva = resumo.sobraCentavos >= 0
  return (
    <>
      <Titulo>
        <Sparkles className="size-3" aria-hidden />
        Novo mês
      </Titulo>
      <CaixaDestaque fundo={positiva ? 'bg-entrada-suave' : 'bg-negativo-suave'} faixa={positiva ? 'border-l-azul' : 'border-l-vermelho'}>
        <p>
          <Forte>
            <span className="capitalize">{mes}</span> fechou {positiva ? 'sobrando' : 'no vermelho:'}{' '}
            <Valor centavos={resumo.sobraCentavos} className={positiva ? undefined : 'text-negativo'} />.
          </Forte>
        </p>
        <dl className="flex flex-wrap gap-x-5 gap-y-1">
          <Numero rotulo="Entrou" centavos={resumo.entradasCentavos} className="text-entrada" />
          <Numero rotulo="Saiu" centavos={resumo.saidasCentavos} className="text-saida" />
          <Numero rotulo="Para as metas" centavos={resumo.economiaCentavos} className="text-economia" />
        </dl>
        {resumo.anoFechado && (
          <p>
            Em {resumo.ano}, sobraram <Valor centavos={resumo.anoFechado.sobraCentavos} /> e as metas guardaram{' '}
            <Valor centavos={resumo.anoFechado.economiaCentavos} className="text-economia" />.
          </p>
        )}
        {guardarSemPiorarCentavos !== null && guardarSemPiorarCentavos > 0 && risco ? (
          <p>
            Dá para guardar <Valor centavos={guardarSemPiorarCentavos} className="text-economia" /> a mais por mês e o
            caixa continua <NomeNivel nivel={risco.nivel} />.
          </p>
        ) : (
          risco &&
          risco.nivel >= 3 && (
            <p>
              O caixa está em <NomeNivel nivel={risco.nivel} />: antes de guardar mais, garanta a folga da conta.
            </p>
          )
        )}
      </CaixaDestaque>
    </>
  )
}

function Evento({
  sugestao: s,
  risco,
  onAplicar,
  onNovaMeta,
}: {
  sugestao: Exclude<Sugestao, { tipo: 'novo-mes' }>
  risco: AnaliseRisco | null
  onAplicar: (meta: MetaEconomia) => void
  onNovaMeta: () => void
}) {
  const guardar = <Valor centavos={s.guardarCentavos} className="text-economia" />

  return (
    <>
      {s.tipo === 'aumento' ? (
        <>
          <Titulo>Aumento de entrada</Titulo>
          <p className="text-sm">
            <Forte>Em {formatarMesAno(`${s.aumento.mes}-01`)} você passa a receber mais:</Forte> de{' '}
            <Valor centavos={s.aumento.antesCentavos} /> para{' '}
            <Valor centavos={s.aumento.depoisCentavos} className="text-entrada" /> por mês. Que tal guardar{' '}
            <Forte>metade do aumento</Forte> ({guardar} por mês) a partir daí?
          </p>
        </>
      ) : (
        <>
          <Titulo>Dinheiro extra</Titulo>
          <p className="text-sm">
            <Forte>Em {formatarData(s.entrada.data)} entra um dinheiro a mais:</Forte>{' '}
            <Valor centavos={s.entrada.valorCentavos} className="text-entrada" /> ({s.entrada.descricao}). Que tal guardar{' '}
            <Forte>metade</Forte> ({guardar}) no aporte seguinte?
          </p>
        </>
      )}

      {s.efeito ? (
        <Efeito
          efeito={s.efeito}
          risco={risco}
          rotulo={s.tipo === 'aumento' ? `+ ${formatarBRL(s.guardarCentavos)} por mês` : `Guardar ${formatarBRL(s.guardarCentavos)}`}
          onAplicar={onAplicar}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="min-w-0 flex-1 basis-60 text-sm text-muted-foreground">
            {s.terminaAntes ? (
              <>
                <span className="font-semibold text-foreground">{s.terminaAntes}</span> fica completa antes disso. Crie
                outra meta para guardar parte desse dinheiro.
              </>
            ) : (
              'Nenhuma meta em andamento recebe esse valor. Crie uma para guardar parte dele.'
            )}
          </p>
          <Button variant="outline" className={cn(BOTAO, 'h-8 px-3')} onClick={onNovaMeta}>
            <Plus />
            Nova meta
          </Button>
        </div>
      )}
    </>
  )
}

/** O que muda na meta principal e no risco do caixa, e o atalho para aplicar. */
function Efeito({
  efeito,
  risco,
  rotulo,
  onAplicar,
}: {
  efeito: EfeitoNaMeta
  risco: AnaliseRisco | null
  rotulo: string
  onAplicar: (meta: MetaEconomia) => void
}) {
  const { meta, nova, conclusaoAntes, conclusaoDepois, menorSaldo, nivel } = efeito
  const negativo = menorSaldo !== null && menorSaldo.valorCentavos < 0
  const piora = !!risco && nivel !== null && nivel > risco.nivel
  const arriscado = negativo || (piora && nivel >= 4)
  const cores = nivel ? COR_RISCO[nivel] : null

  return (
    <CaixaDestaque fundo={cores?.suave ?? 'bg-economia-suave'} faixa={cores?.faixa ?? 'border-l-amarelo'}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="min-w-0 flex-1 basis-60">
          Em <Forte>{meta.nome}</Forte>
          {conclusaoDepois ? (
            <>
              , a meta fica completa em <Forte>{formatarMesAno(conclusaoDepois)}</Forte>
              {conclusaoAntes && conclusaoAntes.slice(0, 7) !== conclusaoDepois.slice(0, 7) && (
                <> em vez de {formatarMesAno(conclusaoAntes)}</>
              )}
              .
            </>
          ) : (
            '.'
          )}{' '}
          {negativo && menorSaldo ? (
            <>
              <Forte className="text-negativo">Cuidado:</Forte> com isso falta dinheiro, e o saldo fica em{' '}
              <SaldoForte centavos={menorSaldo.valorCentavos} /> em <DataForte data={menorSaldo.data} />.
            </>
          ) : piora && risco && menorSaldo ? (
            <>
              <Forte>O caixa aperta:</Forte> passa de <NomeNivel nivel={risco.nivel} /> para <NomeNivel nivel={nivel} />{' '}
              (em <DataForte data={menorSaldo.data} /> sobram <SaldoForte centavos={menorSaldo.valorCentavos} />).
            </>
          ) : (
            nivel && (
              <>
                Seu caixa continua <NomeNivel nivel={nivel} />.
              </>
            )
          )}
        </p>
        <Button
          variant={arriscado ? 'outline' : 'default'}
          className={cn(BOTAO, 'h-8 px-3', arriscado && 'bg-card')}
          onClick={() => onAplicar(nova)}
        >
          {rotulo}
        </Button>
      </div>
    </CaixaDestaque>
  )
}
