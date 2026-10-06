import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { BotaoOcultarSaldos } from '@/features/projecao/components/BotaoOcultarSaldos'
import type { Projecao } from '@/features/projecao/utils/projecao'
import { COR_RISCO } from '@/features/risco/constants/cores'
import { DataForte, SaldoForte } from '@/features/risco/components/Destaques'
import { LegendaCompleta } from '@/features/risco/components/LegendaRisco'
import { ConselhoRisco, FraseDiaApertado } from '@/features/risco/components/MensagemRisco'
import type { RiscoDaVisao } from '@/features/risco/utils/risco-por-conta'
import { diasDeGastos, NIVEL, textoDias } from '@/features/risco/utils/risco'
import { Ajuda } from '@/shared/components/Ajuda'
import { Forma } from '@/shared/components/Forma'
import { formatarData, nomeDoMes, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CARD, ROTULO, VALOR_DESTAQUE, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { ArrowRight } from '@/shared/ui/icones'

interface ResumoPlanilhaProps {
  /** As projeções da visão (caixa escolhido ou Total), uma por ano do intervalo. */
  projecoes: Projecao[]
  hoje: DataISO
  /** Dinheiro separado nas metas hoje (fora do saldo, que é o disponível). */
  separado: number
  /** null em benefício e cartão, que não têm risco. */
  risco: RiscoDaVisao | null
  /** Saldo no fim do ano exibido (era o "Fim de 2026" do cabeçalho). */
  fimDoAno: { ano: number; centavos: number | null }
}

/** Saldo no fim de um dia ou do último dia projetado de um mês ("2026-10"). */
function saldoDoDia(projecoes: Projecao[], filtro: (data: DataISO) => boolean): { data: DataISO; centavos: number } | null {
  const ano = projecoes.find((p) => p.dias.some((d) => filtro(d.data)))
  const dia = ano?.dias.findLast((d) => filtro(d.data) && d.saldoCentavos !== null)
  return dia ? { data: dia.data, centavos: dia.saldoCentavos! } : null
}

/**
 * O que a pessoa quer saber ao abrir a planilha, em números grandes: quanto tem hoje, quanto terá no fim do mês e se
 * o caixa aperta nos próximos 12 meses. Substitui o card de risco (a faixa dos meses fica nos cabeçalhos de cada mês,
 * e os detalhes, em Economias).
 */
export function ResumoPlanilha({ projecoes, hoje, separado, risco, fimDoAno }: ResumoPlanilhaProps) {
  const saldoHoje = saldoDoDia(projecoes, (d) => d === hoje)
  const mes = hoje.slice(0, 7)
  const fimDoMes = saldoDoDia(projecoes, (d) => d.startsWith(mes))
  if (!saldoHoje && !fimDoMes) return null

  return (
    <Card className={cn(CARD, 'grid overflow-hidden md:grid-cols-3')}>
      <Numero rotulo="Saldo hoje" centavos={saldoHoje?.centavos ?? null} acao={<BotaoOcultarSaldos className="-my-2 -mr-2" />}>
        {separado > 0 ? (
          <>
            Mais <span className={cn('font-medium text-foreground', VALOR_SALDO)}>{formatarBRL(separado)}</span>{' '}
            separados nas metas
          </>
        ) : (
          <>Disponível no fim de {formatarData(hoje)}</>
        )}
      </Numero>
      <Numero rotulo={`Fim de ${nomeDoMes(Number(mes.slice(5, 7)) - 1)}`} centavos={fimDoMes?.centavos ?? null}>
        {fimDoMes && <>Previsto para {formatarData(fimDoMes.data)}{fimDoAno.centavos !== null && ' · '}</>}
        {fimDoAno.centavos !== null && (
          <>
            Fim de {fimDoAno.ano}:{' '}
            <span className={cn('font-medium tabular-nums', VALOR_SALDO, fimDoAno.centavos < 0 ? 'text-negativo' : 'text-foreground')}>
              {formatarBRL(fimDoAno.centavos)}
            </span>
          </>
        )}
      </Numero>
      {risco && <Risco risco={risco} />}
    </Card>
  )
}

interface NumeroProps {
  rotulo: string
  centavos: number | null
  /** Botão no canto do rótulo (o olho que oculta os saldos). */
  acao?: ReactNode
  children?: ReactNode
}

function Numero({ rotulo, centavos, acao, children }: NumeroProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 border-b-2 border-contorno px-4 py-3 last:border-b-0 sm:px-5 md:border-r-2 md:border-b-0 md:last:border-r-0">
      <span className="flex items-center justify-between gap-2">
        <span className={cn(ROTULO, 'text-muted-foreground')}>{rotulo}</span>
        {acao}
      </span>
      <span
        className={cn(
          VALOR_DESTAQUE,
          VALOR_SALDO,
          'text-[1.75rem] leading-none whitespace-nowrap md:text-[1.5rem] lg:text-[2rem]',
          centavos !== null && centavos < 0 && 'text-negativo',
        )}
      >
        {centavos === null ? '—' : formatarBRL(centavos)}
      </span>
      {children && <span className="text-xs text-muted-foreground">{children}</span>}
    </div>
  )
}

/** O nível em bloco de cor com o nome escrito (a cor nunca é a única pista) e o dia mais apertado embaixo. */
function Risco({ risco }: { risco: RiscoDaVisao }) {
  const cores = COR_RISCO[risco.nivel]
  const falta = risco.menorSaldo.valorCentavos < 0
  const dias = diasDeGastos(risco.menorSaldo.valorCentavos, risco.referenciaCentavos)

  return (
    <div className="flex min-w-0 flex-col gap-1.5 px-4 py-3 sm:px-5">
      <span className="flex items-center gap-2">
        <span className={cn(ROTULO, 'text-muted-foreground')}>
          Risco{risco.caixa ? ` · ${risco.caixa.nome}` : ''}
        </span>
        <Ajuda titulo="Risco do caixa" largo>
          <p>
            <FraseDiaApertado risco={risco} />
          </p>
          <p>
            <ConselhoRisco risco={risco} />
          </p>
          <p className="text-muted-foreground">
            O app olha os próximos 12 meses. Na planilha, a cor atrás do saldo de cada dia mostra como ele está, e o topo
            de cada mês mostra o dia mais apertado.
          </p>
          {risco.caixa && (
            <p className="text-muted-foreground">
              Você tem mais de uma conta: o app mostra a que fica mais apertada, {risco.caixa.nome}.
            </p>
          )}
          <LegendaCompleta />
        </Ajuda>
      </span>
      <span
        className={cn(
          'flex items-center gap-2 self-start border-2 border-contorno px-2.5 py-1 font-heading text-[1.5rem] leading-none font-bold uppercase sm:text-[1.75rem]',
          cores.bloco,
        )}
      >
        <Forma forma="triangulo" cor="tinta" className="size-4" />
        {NIVEL[risco.nivel].nome}
      </span>
      <span className="text-xs text-muted-foreground">
        {falta ? 'Falta dinheiro em ' : 'Mais apertado: '}
        <DataForte data={falta && risco.primeiroNegativo ? risco.primeiroNegativo : risco.menorSaldo.data} />
        {!falta && (
          <>
            , com <SaldoForte centavos={risco.menorSaldo.valorCentavos} />
            {dias !== null && <> (dá para {textoDias(dias)} de gastos)</>}
          </>
        )}
        {' · '}
        <Link
          to="/economias"
          className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-ring"
        >
          Ver em Economias
          <ArrowRight className="size-3" />
        </Link>
      </span>
    </div>
  )
}
