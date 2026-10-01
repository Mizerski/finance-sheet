import { useRef, useState } from 'react'
import type { Categoria } from '@/features/categorias/categoria'
import type { DiaProjetado } from '@/features/projecao/projecao'
import { formatarData, nomeDoDiaDaSemana, type DataISO } from '@/shared/lib/datas'
import { cn } from '@/shared/lib/utils'
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/ui/popover'
import { TableCell, TableRow } from '@/shared/ui/table'
import { CELULA_DIA, COR_COLUNA } from '../cores'
import { CelulaSaldo, CelulaValor } from './CelulaValor'
import { DetalheDia } from './DetalheDia'

interface LinhaDiaProps {
  dia: DiaProjetado
  ehHoje: boolean
  categorias: Map<string, Categoria>
  onEditar: (lancamentoId: string) => void
  onAdicionar: (data: DataISO) => void
  comEconomia: boolean
  /** O gasto de um mês, para pintar o saldo com a cor do risco; null sem projeção à frente. */
  referenciaCentavos: number | null
}

/**
 * Véu sobre o fundo de cada célula, para destacar a linha sem perder a cor da coluna.
 * Hoje ganha uma moldura preta em cima e embaixo, que atravessa as cores das colunas.
 */
const VEU = {
  hover: '[&>td]:group-hover:shadow-[inset_0_0_0_999px_color-mix(in_oklch,var(--color-foreground)_6%,transparent)]',
  aberto: '[&>td]:shadow-[inset_0_0_0_999px_color-mix(in_oklch,var(--color-foreground)_9%,transparent)]',
  hoje: 'font-semibold [&>td]:shadow-[inset_0_2px_0_0_var(--color-foreground),inset_0_-2px_0_0_var(--color-foreground)]',
}

export function LinhaDia({ dia, ehHoje, categorias, onEditar, onAdicionar, comEconomia, referenciaCentavos }: LinhaDiaProps) {
  const [aberto, setAberto] = useState(false)
  const linhaRef = useRef<HTMLTableRowElement>(null)
  const fimDeSemana = dia.diaDaSemana === 0 || dia.diaDaSemana === 6

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverAnchor asChild>
        <TableRow
          ref={linhaRef}
          onClick={() => setAberto((a) => !a)}
          className={cn(
            'group cursor-pointer border-b-border/70 hover:bg-transparent has-aria-expanded:bg-transparent',
            VEU.hover,
            aberto && VEU.aberto,
            !dia.noCalculo && 'text-muted-foreground',
            ehHoje && VEU.hoje,
          )}
        >
          <TableCell className={cn(CELULA_DIA, 'bg-card')}>
            {/* Botão só para acesso por teclado; o clique é tratado na linha. */}
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={aberto}
              aria-label={`Lançamentos de ${formatarData(dia.data)}`}
              className="-mx-1 flex items-center gap-1 px-1 tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-ring"
            >
              {/* Hoje: o número vira um bloco vermelho. */}
              <span
                className={cn(
                  'inline-flex h-6 min-w-5 items-center justify-center',
                  ehHoje && 'bg-vermelho px-1 text-papel',
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
          <CelulaValor centavos={dia.entradasCentavos} className={COR_COLUNA.entrada} compacta={comEconomia} />
          <CelulaValor centavos={dia.saidasFixasCentavos} className={COR_COLUNA.saida} compacta={comEconomia} />
          <CelulaValor centavos={dia.saidasVariaveisCentavos} className={COR_COLUNA.saida} compacta={comEconomia} />
          {comEconomia && <CelulaValor centavos={dia.economiaCentavos} className={COR_COLUNA.economia} compacta />}
          <CelulaSaldo centavos={dia.saldoCentavos} compacta={comEconomia} referenciaCentavos={referenciaCentavos} />
        </TableRow>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className="w-80 rounded-none border-2 border-foreground p-4 shadow-bloco-lg ring-0"
        // Clicar na própria linha alterna o popover em vez de fechar e reabrir.
        onInteractOutside={(e) => {
          if (linhaRef.current?.contains(e.target as Node)) e.preventDefault()
        }}
      >
        <DetalheDia
          dia={dia}
          referenciaCentavos={referenciaCentavos}
          categorias={categorias}
          onEditar={(id) => {
            setAberto(false)
            onEditar(id)
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
