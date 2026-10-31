import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Categoria } from '@/features/categorias/model/categoria'
import type { DiaProjetado } from '@/features/projecao/utils/projecao'
import type { NivelRisco } from '@/features/risco/utils/risco'
import { formatarData, nomeDoDiaDaSemana, type DataISO } from '@/shared/lib/datas'
import { cn } from '@/shared/lib/utils'
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/ui/popover'
import { TableCell, TableRow } from '@/shared/ui/table'
import { TEMPO_SEGURAR, type PapelNoArraste } from '../hooks/useArrastarDia'
import { colunasDoDia } from '../utils/colunas'
import { CELULA_DIA, COR_COLUNA } from '../constants/cores'
import { CelulaSaldo, CelulaValor } from './CelulaValor'
import { DetalheDia, type ItemDoDia } from './DetalheDia'

interface LinhaDiaProps {
  dia: DiaProjetado
  ehHoje: boolean
  categorias: Map<string, Categoria>
  onEditar: (lancamentoId: string) => void
  onExcluir: (lancamentoId: string) => void
  onMudarDia: (data: DataISO, item?: ItemDoDia) => void
  onAdicionar: (data: DataISO) => void
  comEconomia: boolean
  /** Cartão de crédito: saldo negativo é dívida, sem a cor de alerta. */
  divida?: boolean
  /** Nível de risco do dia, para pintar o saldo; null sem risco. */
  nivel: NivelRisco | null
  /** Papel da linha enquanto um dia é segurado ou arrastado. */
  arraste?: PapelNoArraste
  /** Pressionar a linha: segurando por `TEMPO_SEGURAR`, pega o dia para arrastar. */
  onSegurar: (e: PointerEvent, dia: DiaProjetado) => void
}

/**
 * Véu sobre o fundo de cada célula, para destacar a linha sem perder a cor da coluna.
 * Hoje ganha uma moldura preta em cima e embaixo, que atravessa as cores das colunas.
 */
const VEU = {
  hover: '[&>td]:group-hover:shadow-[inset_0_0_0_999px_color-mix(in_oklch,var(--color-foreground)_6%,transparent)]',
  aberto: '[&>td]:shadow-[inset_0_0_0_999px_color-mix(in_oklch,var(--color-foreground)_9%,transparent)]',
  hoje: 'font-semibold [&>td]:shadow-[inset_0_2px_0_0_var(--color-contorno),inset_0_-2px_0_0_var(--color-contorno)]',
  origem: '[&>td]:shadow-[inset_0_0_0_999px_var(--color-selecao)] text-muted-foreground',
  destino:
    '[&>td]:shadow-[inset_0_2px_0_0_var(--color-contorno),inset_0_-2px_0_0_var(--color-contorno),inset_0_0_0_999px_var(--color-selecao-forte)]',
}

/** Até aqui, segurar parece um clique comum: a linha só começa a encher depois. */
const ATRASO_ENCHER = 150

/** Espaço que um dia cheio pede abaixo da linha; com menos que isso, o popover abre para cima se lá couber mais. */
const ALTURA_CONFORTAVEL = 420

/** Clicar na própria linha alterna o popover em vez de fechar e reabrir. */
export function LinhaDia({
  dia,
  ehHoje,
  categorias,
  onEditar,
  onExcluir,
  onMudarDia,
  onAdicionar,
  comEconomia,
  nivel,
  divida,
  arraste,
  onSegurar,
}: LinhaDiaProps) {
  const [aberto, setAberto] = useState(false)
  const [lado, setLado] = useState<'top' | 'bottom'>('bottom')
  const linhaRef = useRef<HTMLTableRowElement>(null)
  const fimDeSemana = dia.diaDaSemana === 0 || dia.diaDaSemana === 6
  const colunas = colunasDoDia(dia)

  const alternar = () => {
    const linha = linhaRef.current?.getBoundingClientRect()
    if (linha && !aberto) {
      const abaixo = window.innerHeight - linha.bottom
      setLado(abaixo < ALTURA_CONFORTAVEL && linha.top > abaixo ? 'top' : 'bottom')
    }
    setAberto((a) => !a)
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverAnchor asChild>
        <TableRow
          ref={linhaRef}
          data-dia={dia.data}
          data-no-calculo={dia.noCalculo || undefined}
          onClick={alternar}
          onPointerDown={(e) => onSegurar(e, dia)}
          className={cn(
            'group relative cursor-pointer border-b-border/70 select-none hover:bg-transparent has-aria-expanded:bg-transparent [-webkit-touch-callout:none]',
            VEU.hover,
            aberto && VEU.aberto,
            !dia.noCalculo && 'text-muted-foreground',
            ehHoje && VEU.hoje,
            arraste === 'origem' && VEU.origem,
            arraste === 'destino' && VEU.destino,
          )}
        >
          <TableCell className={cn(CELULA_DIA, 'bg-card')}>
            {arraste === 'segurando' && <Enchendo />}
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={aberto}
              aria-label={`Lançamentos de ${formatarData(dia.data)}`}
              className="-mx-1 flex items-center gap-1 px-1 tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span
                className={cn(
                  'inline-flex h-6 min-w-5 items-center justify-center',
                  ehHoje && 'bg-vermelho px-1 text-sobre-bloco',
                )}
              >
                {String(dia.dia).padStart(2, '0')}
              </span>
              <span
                className={cn(
                  'text-[0.7rem] font-normal text-muted-foreground',
                  fimDeSemana && 'text-muted-foreground/60',
                )}
              >
                {nomeDoDiaDaSemana(dia.diaDaSemana)}
              </span>
            </button>
          </TableCell>
          <CelulaValor centavos={colunas.entradasCentavos} className={COR_COLUNA.entrada} compacta={comEconomia} />
          <CelulaValor centavos={colunas.saidasFixasCentavos} className={COR_COLUNA.saida} compacta={comEconomia} />
          <CelulaValor centavos={colunas.saidasVariaveisCentavos} className={COR_COLUNA.saida} compacta={comEconomia} />
          {comEconomia && <CelulaValor centavos={dia.economiaCentavos} className={COR_COLUNA.economia} compacta />}
          <CelulaSaldo centavos={dia.saldoCentavos} compacta={comEconomia} nivel={nivel} divida={divida} />
        </TableRow>
      </PopoverAnchor>

      <PopoverContent
        side={lado}
        align="start"
        className="w-80 rounded-none border-2 border-contorno p-4 shadow-bloco-lg ring-0"
        onInteractOutside={(e) => {
          if (linhaRef.current?.contains(e.target as Node)) e.preventDefault()
        }}
      >
        <DetalheDia
          dia={dia}
          nivel={nivel}
          categorias={categorias}
          onEditar={(id) => {
            setAberto(false)
            onEditar(id)
          }}
          onExcluir={(id) => {
            setAberto(false)
            onExcluir(id)
          }}
          onMudarDia={(item) => {
            setAberto(false)
            onMudarDia(dia.data, item)
          }}
          onAdicionar={() => {
            setAberto(false)
            onAdicionar(dia.data)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/** A linha enche de amarelo da esquerda para a direita enquanto é segurada; sem movimento, só aparece aos poucos. */
function Enchendo() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animacao = el.animate(
      semMovimento ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: TEMPO_SEGURAR - ATRASO_ENCHER, delay: ATRASO_ENCHER, easing: 'linear', fill: 'both' },
    )
    return () => animacao.cancel()
  }, [])

  return <span ref={ref} aria-hidden className="pointer-events-none absolute inset-0 origin-left bg-selecao-forte" />
}
