import type { ReactNode } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { formatarData, formatarMesAno, nomeDoMes } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CARD, ROTULO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import type { CapacidadePoupanca } from '../capacidade'
import type { MetaEconomia } from '../meta'
import type { EfeitoNaMeta, Sugestao } from '../sugestoes'

interface CardSugestoesProps {
  sugestoes: Sugestao[]
  capacidade: CapacidadePoupanca | null
  onAplicar: (meta: MetaEconomia) => void
  onNovaMeta: () => void
}

/** Momentos bons para guardar mais: começo de mês, aumento de entrada e dinheiro extra. */
export function CardSugestoes({ sugestoes, capacidade, onAplicar, onNovaMeta }: CardSugestoesProps) {
  if (sugestoes.length === 0) return null

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Sugestões"
        faixa="bg-azul"
        contagem={sugestoes.length}
        descricao="Momentos em que guardar mais pesa menos, calculados pelos seus lançamentos"
      />
      <ul className="flex flex-col">
        {sugestoes.map((s) => (
          <li
            key={s.tipo === 'novo-mes' ? 'novo-mes' : s.tipo === 'aumento' ? `aumento-${s.aumento.mes}` : `extra-${s.entrada.lancamentoId}`}
            className="flex flex-col gap-2 border-b border-border px-4 py-4 last:border-b-0 sm:px-5"
          >
            {s.tipo === 'novo-mes' ? (
              <NovoMes sugestao={s} capacidade={capacidade} />
            ) : (
              <Evento sugestao={s} onAplicar={onAplicar} onNovaMeta={onNovaMeta} />
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

function Valor({ centavos, className }: { centavos: number; className?: string }) {
  return <span className={cn('font-semibold tabular-nums', className ?? 'text-foreground')}>{formatarBRL(centavos)}</span>
}

function NovoMes({
  sugestao: { resumo },
  capacidade,
}: {
  sugestao: Extract<Sugestao, { tipo: 'novo-mes' }>
  capacidade: CapacidadePoupanca | null
}) {
  const mes = nomeDoMes(resumo.mes)
  return (
    <>
      <Titulo>
        <Sparkles className="size-3.5" aria-hidden />
        Novo mês
      </Titulo>
      <p className="text-sm text-muted-foreground">
        <span className="capitalize">{mes}</span> fechou com sobra de{' '}
        <Valor centavos={resumo.sobraCentavos} className={resumo.sobraCentavos < 0 ? 'text-negativo' : undefined} />:
        entraram <Valor centavos={resumo.entradasCentavos} className="text-entrada" />, saíram{' '}
        <Valor centavos={resumo.saidasCentavos} className="text-saida" /> e{' '}
        <Valor centavos={resumo.economiaCentavos} className="text-economia" /> foram para as metas.
        {resumo.anoFechado && (
          <>
            {' '}
            Em {resumo.ano}, a sobra somou <Valor centavos={resumo.anoFechado.sobraCentavos} /> e as metas guardaram{' '}
            <Valor centavos={resumo.anoFechado.economiaCentavos} className="text-economia" />.
          </>
        )}{' '}
        Começo de mês é uma boa hora para rever as metas
        {capacidade && capacidade.capacidadeCentavos > 0 ? (
          <>
            : cabem <Valor centavos={capacidade.capacidadeCentavos} className="text-economia" /> a mais por mês.
          </>
        ) : (
          '.'
        )}
      </p>
    </>
  )
}

function Evento({
  sugestao: s,
  onAplicar,
  onNovaMeta,
}: {
  sugestao: Exclude<Sugestao, { tipo: 'novo-mes' }>
  onAplicar: (meta: MetaEconomia) => void
  onNovaMeta: () => void
}) {
  const guardar = <Valor centavos={s.guardarCentavos} className="text-economia" />

  return (
    <>
      {s.tipo === 'aumento' ? (
        <>
          <Titulo>Aumento de entrada</Titulo>
          <p className="text-sm text-muted-foreground">
            Em <span className="font-semibold text-foreground">{formatarMesAno(`${s.aumento.mes}-01`)}</span> as
            entradas mensais sobem de <Valor centavos={s.aumento.antesCentavos} /> para{' '}
            <Valor centavos={s.aumento.depoisCentavos} className="text-entrada" />. Combine agora guardar metade do
            aumento ({guardar} por mês) a partir desse mês: o que você já recebe continua igual, então não pesa.
          </p>
        </>
      ) : (
        <>
          <Titulo>Entrada extra</Titulo>
          <p className="text-sm text-muted-foreground">
            Em <span className="font-semibold text-foreground">{formatarData(s.entrada.data)}</span> entra{' '}
            <Valor centavos={s.entrada.valorCentavos} className="text-entrada" /> ({s.entrada.descricao}). Guardar
            metade ({guardar}) no aporte seguinte faz esse dinheiro virar progresso em vez de sumir no mês.
          </p>
        </>
      )}

      {s.efeito ? (
        <Efeito
          efeito={s.efeito}
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

/** O que muda na meta principal e o atalho para aplicar. */
function Efeito({
  efeito,
  rotulo,
  onAplicar,
}: {
  efeito: EfeitoNaMeta
  rotulo: string
  onAplicar: (meta: MetaEconomia) => void
}) {
  const { meta, nova, conclusaoAntes, conclusaoDepois, menorSaldo } = efeito
  const negativo = menorSaldo !== null && menorSaldo.valorCentavos < 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <p className="min-w-0 flex-1 basis-60 text-sm text-muted-foreground">
        Em <span className="font-semibold text-foreground">{meta.nome}</span>
        {conclusaoDepois ? (
          <>
            , a meta fica completa em <span className="font-semibold text-foreground">{formatarMesAno(conclusaoDepois)}</span>
            {conclusaoAntes && conclusaoAntes.slice(0, 7) !== conclusaoDepois.slice(0, 7) && (
              <> em vez de {formatarMesAno(conclusaoAntes)}</>
            )}
            .
          </>
        ) : (
          '.'
        )}
        {negativo && menorSaldo && (
          <>
            {' '}
            <span className="font-semibold text-negativo">Atenção:</span> com isso o saldo fica em{' '}
            <span className={cn('font-semibold text-negativo tabular-nums', VALOR_SALDO)}>
              {formatarBRL(menorSaldo.valorCentavos)}
            </span>{' '}
            em {formatarData(menorSaldo.data)}.
          </>
        )}
      </p>
      <Button
        variant={negativo ? 'outline' : 'default'}
        className={cn(BOTAO, 'h-8 px-3')}
        onClick={() => onAplicar(nova)}
      >
        {rotulo}
      </Button>
    </div>
  )
}
