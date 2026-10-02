import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useProjecoesDosCaixas } from '@/features/projecao/projecoes-por-caixa'
import { SeloRisco } from '@/features/risco/components/SeloRisco'
import { useRisco, useRiscosDasContas } from '@/features/risco/useRisco'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { PontoCor } from '@/shared/components/PontoCor'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CAMADA, CAMPO_SELECT, ROTULO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/shared/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { ROTULO_TIPO_CAIXA, type Caixa } from '../caixa'
import { useEscolherCaixa, useVisao } from '../useVisao'

/** Valor de "Todos" no seletor (os outros são os ids dos caixas). */
const TODOS = 'todos'
/** A partir de quantos caixas ativos os chips viram uma lista. */
const CAIXAS_PARA_LISTA = 4

/**
 * Faixa do cabeçalho com a escolha do caixa (chips, ou lista com 4 ou mais) e, em "Todos", o saldo de cada benefício
 * e o risco da conta mais apertada; clicar nesse resumo abre o saldo de cada caixa.
 * Só aparece com 2 ou mais caixas ativos: quem tem um caixa não vê nada novo.
 */
export function BarraCaixas() {
  const { caixas, caixa } = useVisao()
  const escolher = useEscolherCaixa()
  useAtalhosDeCaixa(caixas, escolher)
  if (caixas.length < 2) return null

  const valor = caixa?.id ?? TODOS
  const trocar = (v: string) => escolher(v === TODOS ? null : v)

  return (
    // No celular, os chips rolam na própria linha e o resumo desce para a de baixo (nunca fica escondido).
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t-2 border-foreground px-4 py-2">
      <div className="flex max-w-full min-w-0 items-center gap-3 overflow-x-auto pr-[3px] [scrollbar-width:none]">
        <span className={cn(ROTULO, 'shrink-0 text-muted-foreground')}>Caixa</span>
        {caixas.length >= CAIXAS_PARA_LISTA ? (
          <Select value={valor} onValueChange={(v) => v && trocar(v)}>
            <SelectTrigger aria-label="Caixa exibido" className={cn(CAMPO_SELECT, 'h-9 w-auto min-w-44 shrink-0')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={TODOS}>Todos</SelectItem>
              {caixas.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <PontoCor cor={c.cor} className="rounded-full" />
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <ControleSegmentado
            rotulo="Caixa exibido"
            valor={valor}
            className="shrink-0"
            opcoes={[
              { valor: TODOS, rotulo: 'Todos' },
              ...caixas.map((c) => ({
                valor: c.id,
                rotulo: (
                  <>
                    <PontoCor cor={c.cor} className="rounded-full" />
                    {c.nome}
                  </>
                ),
              })),
            ]}
            onChange={trocar}
          />
        )}
      </div>
      {!caixa && <ResumoDosCaixas />}
    </div>
  )
}

/** Alt+0 volta para "Todos"; Alt+1…9 escolhe o caixa nessa posição do seletor. */
function useAtalhosDeCaixa(caixas: Caixa[], escolher: (id: string | null) => void) {
  const atual = useRef({ caixas, escolher })
  useEffect(() => {
    atual.current = { caixas, escolher }
  })

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !/^Digit\d$/.test(e.code)) return
      const { caixas, escolher } = atual.current
      if (caixas.length < 2) return
      // Não muda a tela por trás de um dialog aberto nem de quem está digitando.
      const alvo = e.target instanceof HTMLElement ? e.target : null
      if (alvo?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('[role=dialog]')) return
      const n = Number(e.code.slice(5))
      if (n > caixas.length) return
      e.preventDefault()
      escolher(n === 0 ? null : caixas[n - 1].id)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])
}

/** Saldo no fim de hoje de cada caixa (null fora do cálculo). */
function useSaldosDeHoje(hoje: DataISO): Map<string, number | null> {
  const { porCaixa } = useProjecoesDosCaixas()
  return useMemo(() => {
    const ano = Number(hoje.slice(0, 4))
    return new Map(
      [...porCaixa].map(([id, projecoes]) => [
        id,
        projecoes.find((p) => p.ano === ano)?.dias.find((d) => d.data === hoje)?.saldoCentavos ?? null,
      ]),
    )
  }, [porCaixa, hoje])
}

/**
 * Em "Todos": a conta mais apertada com o nível ("Conta B: Atenção") e o saldo de hoje de cada benefício fora do total,
 * menores, ao lado da escolha. Clicar abre o saldo e o risco de cada caixa.
 */
function ResumoDosCaixas() {
  const { caixas } = useVisao()
  const risco = useRisco()
  const riscos = useRiscosDasContas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const saldos = useSaldosDeHoje(hoje)
  const beneficios = caixas.filter((c) => c.tipo === 'beneficio' && !c.entraNoTotal)
  const contaDoRisco = risco && (risco.caixa ?? risco.contas[0]?.caixa)
  const nivelPorConta = new Map(riscos.map((r) => [r.caixa.id, r.analise.nivel]))

  return (
    <Popover>
      <PopoverTrigger
        className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-1 py-1 text-xs outline-none hover:bg-amarelo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="Saldo de cada caixa"
      >
        {risco && contaDoRisco && (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            {contaDoRisco.nome}:
            <SeloRisco nivel={risco.nivel} curto />
          </span>
        )}
        {beneficios.map((b) => (
          <span key={b.id} className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
            <PontoCor cor={b.cor} className="rounded-full" />
            {b.nome}
            <Saldo centavos={saldos.get(b.id) ?? null} className="font-semibold text-foreground" />
          </span>
        ))}
        <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={16} className={cn(CAMADA, 'w-80 max-w-[calc(100vw-2rem)] gap-3')}>
        <PopoverHeader>
          <PopoverTitle>Saldo de cada caixa hoje</PopoverTitle>
        </PopoverHeader>
        <ul className="flex flex-col text-sm">
          {caixas.map((c) => {
            const nivel = nivelPorConta.get(c.id)
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-1.5">
                    <PontoCor cor={c.cor} className="rounded-full" />
                    {c.nome}
                  </span>
                  <span className="text-[0.7rem] text-muted-foreground">
                    {ROTULO_TIPO_CAIXA[c.tipo]}
                    {!c.entraNoTotal && ' · fora do total'}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Saldo centavos={saldos.get(c.id) ?? null} className="font-semibold" />
                  {nivel && <SeloRisco nivel={nivel} curto />}
                </span>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function Saldo({ centavos, className }: { centavos: number | null; className?: string }) {
  return (
    <span className={cn('tabular-nums', VALOR_SALDO, centavos !== null && centavos < 0 && 'text-negativo', className)}>
      {centavos === null ? '—' : formatarBRL(centavos)}
    </span>
  )
}
