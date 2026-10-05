import { useRef, useState } from 'react'
import type { Categoria } from '@/features/categorias/model/categoria'
import type { DiaProjetado } from '@/features/projecao/utils/projecao'
import type { NivelRisco } from '@/features/risco/utils/risco'
import { formatarData, nomeDoDiaDaSemana, type DataISO } from '@/shared/lib/datas'
import { cn } from '@/shared/lib/utils'
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/ui/popover'
import { TableCell, TableRow } from '@/shared/ui/table'
import { colunasDoDia } from '../utils/colunas'
import { CELULA_DIA, COR_COLUNA } from '../constants/cores'
import { CelulaSaldo, CelulaValor } from './CelulaValor'
import { DetalheDia } from './DetalheDia'

interface LinhaDiaProps {
  dia: DiaProjetado
  ehHoje: boolean
  categorias: Map<string, Categoria>
  onEditar: (lancamentoId: string) => void
  onExcluir: (lancamentoId: string) => void
  onMudarDia: (lancamentoId: string, data: DataISO) => void
  onAdicionar: (data: DataISO) => void
  comEconomia: boolean
  /** Cartão de crédito: saldo negativo é dívida, sem a cor de alerta. */
  divida?: boolean
  /** Nível de risco do dia, para pintar o saldo; null sem risco. */
  nivel: NivelRisco | null
}

/**
 * Véu sobre o fundo de cada célula, para destacar a linha sem perder a cor da coluna.
 * Hoje ganha uma moldura preta em cima e embaixo, que atravessa as cores das colunas.
 */
const VEU = {
  hover: '[&>td]:group-hover:shadow-[inset_0_0_0_999px_color-mix(in_oklch,var(--color-foreground)_6%,transparent)]',
  aberto: '[&>td]:shadow-[inset_0_0_0_999px_color-mix(in_oklch,var(--color-foreground)_9%,transparent)]',
  hoje: 'font-semibold [&>td]:shadow-[inset_0_2px_0_0_var(--color-contorno),inset_0_-2px_0_0_var(--color-contorno)]',
}

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
          onClick={alternar}
          className={cn(
            'group cursor-pointer border-b-border/70 hover:bg-transparent has-aria-expanded:bg-transparent',
            VEU.hover,
            aberto && VEU.aberto,
            !dia.noCalculo && 'text-muted-foreground',
            ehHoje && VEU.hoje,
          )}
        >
          <TableCell className={cn(CELULA_DIA, 'bg-card')}>
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
          onMudarDia={(id) => {
            setAberto(false)
            onMudarDia(id, dia.data)
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
