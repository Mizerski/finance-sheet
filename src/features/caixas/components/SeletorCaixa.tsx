import { useMemo, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, Settings2 } from '@/shared/ui/icones'
import { useProjecoesDosCaixas } from '@/features/projecao/projecoes-por-caixa'
import type { Projecao } from '@/features/projecao/projecao'
import { SeloRisco } from '@/features/risco/components/SeloRisco'
import { NIVEL, type NivelRisco } from '@/features/risco/risco'
import { useRiscosDasContas } from '@/features/risco/useRisco'
import { Forma } from '@/shared/components/Forma'
import { PontoCor } from '@/shared/components/PontoCor'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CAMADA, ROTULO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { NOME_TOTAL, somaNoTotal, type Caixa } from '../caixa'
import { resumoCurtoBeneficio } from '../textos'
import { useBeneficios } from '../useBeneficio'
import { useEscolherCaixa, useVisao } from '../useVisao'

/** A partir deste nível, o risco aparece no próprio botão: alerta fica sempre à vista, o "tudo certo" fica na lista. */
const NIVEL_ALERTA: NivelRisco = 3

/** Uma opção da lista: "Total" (caixa null) ou um caixa. */
interface Opcao {
  caixa: Caixa | null
  nome: string
  /** Linha curta embaixo do nome. */
  detalhe: string
  /** O detalhe é um alerta (benefício que fica sem saldo antes da recarga). */
  alerta: boolean
  saldoCentavos: number | null
  nivel: NivelRisco | null
}

function saldoDoDia(projecoes: Projecao[] | undefined, hoje: DataISO): number | null {
  const ano = Number(hoje.slice(0, 4))
  return projecoes?.find((p) => p.ano === ano)?.dias.find((d) => d.data === hoje)?.saldoCentavos ?? null
}

/** Lista do seletor: Total, as contas e os benefícios, com o saldo de hoje e o risco (contas) ou a recarga (benefícios). */
function useOpcoes(): { total: Opcao; contas: Opcao[]; beneficios: Opcao[]; noTotal: Caixa[] } {
  const { caixas } = useVisao()
  const { porCaixa, todos } = useProjecoesDosCaixas()
  const riscos = useRiscosDasContas()
  const beneficios = useBeneficios()
  const [hoje] = useState(() => paraDataISO(new Date()))

  return useMemo(() => {
    const nivelPorConta = new Map(riscos.map((r) => [r.caixa.id, r.analise.nivel]))
    const noTotal = caixas.filter(somaNoTotal)
    // O risco do Total é o da conta mais apertada entre as que somam nele.
    const niveisDoTotal = noTotal.flatMap((c) => nivelPorConta.get(c.id) ?? [])
    const resumoPorBeneficio = new Map(beneficios.map((b) => [b.caixa.id, b.resumo]))

    return {
      noTotal,
      total: {
        caixa: null,
        nome: NOME_TOTAL,
        detalhe: noTotal.length > 0 ? `Soma de ${noTotal.map((c) => c.nome).join(' + ')}` : 'Nenhum caixa soma no total',
        alerta: false,
        saldoCentavos: saldoDoDia(todos, hoje),
        nivel: niveisDoTotal.length > 0 ? (Math.max(...niveisDoTotal) as NivelRisco) : null,
      },
      contas: caixas
        .filter((c) => c.tipo === 'conta')
        .map((c) => ({
          caixa: c,
          nome: c.nome,
          detalhe: somaNoTotal(c) ? 'Conta' : 'Conta · fora do total',
          alerta: false,
          saldoCentavos: saldoDoDia(porCaixa.get(c.id), hoje),
          nivel: nivelPorConta.get(c.id) ?? null,
        })),
      beneficios: caixas
        .filter((c) => c.tipo === 'beneficio')
        .map((c) => {
          const { texto, alerta } = resumoCurtoBeneficio(c, resumoPorBeneficio.get(c.id) ?? null)
          return { caixa: c, nome: c.nome, detalhe: texto, alerta, saldoCentavos: saldoDoDia(porCaixa.get(c.id), hoje), nivel: null }
        }),
    }
  }, [caixas, porCaixa, todos, riscos, beneficios, hoje])
}

/**
 * Escolha do caixa que as telas mostram: um botão só, ao lado do saldo, que abre a lista com o saldo de hoje,
 * o risco de cada conta e a recarga de cada benefício. Só aparece com 2 ou mais caixas ativos.
 */
export function SeletorCaixa({ className }: { className?: string }) {
  const { caixas, caixa } = useVisao()
  const escolher = useEscolherCaixa()
  const [aberto, setAberto] = useState(false)
  const { total, contas, beneficios, noTotal } = useOpcoes()
  if (caixas.length < 2) return null

  const opcoes = [total, ...contas, ...beneficios]
  const atual = opcoes.find((o) => o.caixa?.id === caixa?.id) ?? total
  const temAlerta = (o: Opcao) => o.alerta || (o.nivel !== null && o.nivel >= NIVEL_ALERTA)
  // Alerta de outro caixa (ex.: o vale acaba antes da recarga) também fica à vista: um triângulo vermelho no botão.
  const alertasDeOutros = temAlerta(atual) ? [] : opcoes.filter((o) => o !== atual && o.caixa && temAlerta(o))
  const avisoOutros = alertasDeOutros.map((o) => `${o.nome}: ${o.alerta ? o.detalhe.toLowerCase() : NIVEL[o.nivel!].nome}`).join(' · ')
  // Posição nos atalhos: Alt+0 é o Total, Alt+1…9 seguem a ordem dos caixas.
  const tecla = (c: Caixa | null) => (c ? caixas.indexOf(c) + 1 : 0)
  const trocar = (c: Caixa | null) => {
    escolher(c?.id ?? null)
    setAberto(false)
  }
  const item = (o: Opcao) => (
    <ItemCaixa key={o.caixa?.id ?? 'total'} opcao={o} tecla={tecla(o.caixa)} ativo={o === atual} onEscolher={() => trocar(o.caixa)}>
      {o.caixa ? <PontoCor cor={o.caixa.cor} className="rounded-full" /> : <PontosDoTotal caixas={noTotal} />}
    </ItemCaixa>
  )

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        className={cn(
          'flex h-9 min-w-0 shrink items-center gap-2 border-2 border-contorno bg-card px-2.5 text-xs font-semibold tracking-[0.06em] uppercase shadow-bloco-sm transition-[background-color,box-shadow,translate] duration-100 outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:shadow-none motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px]',
          // Aberto, fica afundado como a aba ativa do menu.
          'data-[state=open]:bg-amarelo data-[state=open]:text-tinta data-[state=open]:shadow-none motion-safe:data-[state=open]:translate-x-[2px] motion-safe:data-[state=open]:translate-y-[2px]',
          className,
        )}
        aria-label={`Caixa exibido: ${atual.nome}. Trocar de caixa`}
        title={avisoOutros ? `Atenção em ${avisoOutros}` : 'Trocar de caixa (Alt+0…9)'}
      >
        {atual.caixa ? <PontoCor cor={atual.caixa.cor} className="size-3 rounded-full" /> : <PontosDoTotal caixas={noTotal} />}
        <span className="truncate">{atual.nome}</span>
        {atual.nivel && atual.nivel >= NIVEL_ALERTA && <SeloRisco nivel={atual.nivel} curto />}
        {atual.alerta && <Badge className="border-contorno bg-vermelho text-sobre-bloco">Falta</Badge>}
        {alertasDeOutros.length > 0 && (
          <>
            <Forma forma="triangulo" cor="vermelho" className="size-3" />
            <span className="sr-only">Atenção em {avisoOutros}</span>
          </>
        )}
        <ChevronDown aria-hidden strokeWidth={2.5} className="size-3 shrink-0" />
      </PopoverTrigger>

      <PopoverContent align="start" className={cn(CAMADA, 'w-[22rem] max-w-[calc(100vw-2rem)] gap-0 p-0')}>
        <p className={cn(ROTULO, 'border-b-2 border-contorno px-3 py-2 font-semibold')}>Ver o caixa</p>
        <ul className="flex flex-col py-1">{item(total)}</ul>
        {beneficios.length > 0 && <TituloGrupo>Contas</TituloGrupo>}
        <ul className="flex flex-col py-1">{contas.map(item)}</ul>
        {beneficios.length > 0 && (
          <>
            <TituloGrupo>Benefícios · fora do total</TituloGrupo>
            <ul className="flex flex-col py-1">{beneficios.map(item)}</ul>
          </>
        )}
        <div className="flex items-center justify-between gap-3 border-t-2 border-contorno px-3 py-2">
          <Link
            to="/organizacao"
            search={{ aba: 'caixas' }}
            onClick={() => setAberto(false)}
            className={cn(
              ROTULO,
              '-mx-1 flex items-center gap-1.5 px-1 py-1 font-semibold transition-colors duration-100 outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-ring',
            )}
          >
            <Settings2 aria-hidden className="size-3" />
            Gerenciar caixas
          </Link>
          <span className="text-[0.7rem] text-muted-foreground">Alt + número troca</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TituloGrupo({ children }: { children: ReactNode }) {
  return <p className={cn(ROTULO, 'border-t border-border px-3 pt-2.5 pb-0.5 text-muted-foreground')}>{children}</p>
}

/** Bolinhas sobrepostas dos caixas que somam no Total (até 3). */
function PontosDoTotal({ caixas }: { caixas: Caixa[] }) {
  return (
    <span aria-hidden className="flex shrink-0 -space-x-1">
      {caixas.slice(0, 3).map((c) => (
        <PontoCor key={c.id} cor={c.cor} className="size-3 rounded-full" />
      ))}
    </span>
  )
}

interface ItemCaixaProps {
  opcao: Opcao
  /** Número do atalho (Alt+n); acima de 9, sem atalho. */
  tecla: number
  ativo: boolean
  onEscolher: () => void
  /** Bolinha da cor. */
  children: ReactNode
}

/** Linha da lista: número do atalho em bloco (preto no escolhido), nome, detalhe, saldo de hoje e risco. */
function ItemCaixa({ opcao, tecla, ativo, onEscolher, children }: ItemCaixaProps) {
  const { nome, detalhe, alerta, saldoCentavos, nivel } = opcao
  return (
    <li>
      <button
        type="button"
        aria-current={ativo || undefined}
        onClick={onEscolher}
        className="grid w-full grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-2.5 px-3 py-2 text-left transition-colors duration-100 outline-none hover:bg-amarelo dark:hover:bg-selecao-forte focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <span
          aria-hidden
          className={cn(
            'flex size-5 items-center justify-center border-[1.5px] border-contorno text-[0.65rem] font-semibold tabular-nums',
            ativo ? 'bg-foreground text-background' : 'bg-card',
          )}
        >
          {tecla <= 9 ? tecla : ''}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className={cn('flex items-center gap-1.5 text-[0.8125rem]', ativo && 'font-semibold')}>
            {children}
            <span className="truncate">{nome}</span>
          </span>
          <span className={cn('truncate text-[0.7rem]', alerta ? 'font-semibold text-negativo' : 'text-muted-foreground')}>
            {detalhe}
          </span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span
            className={cn(
              'text-[0.8125rem] font-semibold tabular-nums',
              VALOR_SALDO,
              saldoCentavos !== null && saldoCentavos < 0 && 'text-negativo',
            )}
          >
            {saldoCentavos === null ? '—' : formatarBRL(saldoCentavos)}
          </span>
          {nivel && <SeloRisco nivel={nivel} curto />}
        </span>
      </button>
    </li>
  )
}
