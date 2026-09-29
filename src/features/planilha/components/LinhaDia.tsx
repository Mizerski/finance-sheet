import { useRef, useState } from 'react'
import type { Categoria } from '@/features/categorias/categoria'
import type { DiaProjetado } from '@/features/projecao/projecao'
import { formatarData, nomeDoDiaDaSemana } from '@/shared/lib/datas'
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
}

/** Véu sobre o fundo de cada célula, para destacar a linha sem perder a cor da coluna. */
const VEU = {
  hover: '[&>td]:group-hover:shadow-[inset_0_0_0_999px_oklch(0.28_0.015_60/4%)]',
  aberto: '[&>td]:shadow-[inset_0_0_0_999px_oklch(0.28_0.015_60/6%)]',
  hoje: 'font-medium [&>td]:shadow-[inset_0_0_0_999px_color-mix(in_oklch,var(--color-primary)_12%,transparent)]',
}

export function LinhaDia({ dia, ehHoje, categorias, onEditar }: LinhaDiaProps) {
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
            'group cursor-pointer border-b-border/50 hover:bg-transparent has-aria-expanded:bg-transparent',
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
              className="-mx-1 flex items-center gap-1 rounded-full px-1 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  'inline-flex h-6 min-w-5 items-center justify-center rounded-full',
                  ehHoje && 'bg-primary px-1 text-primary-foreground',
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
          <CelulaValor centavos={dia.entradasCentavos} className={COR_COLUNA.entrada} />
          <CelulaValor centavos={dia.saidasFixasCentavos} className={COR_COLUNA.saida} />
          <CelulaValor centavos={dia.saidasVariaveisCentavos} className={COR_COLUNA.saida} />
          <CelulaSaldo centavos={dia.saldoCentavos} />
        </TableRow>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className="w-80 rounded-2xl p-4 shadow-lg ring-border"
        // Clicar na própria linha alterna o popover em vez de fechar e reabrir.
        onInteractOutside={(e) => {
          if (linhaRef.current?.contains(e.target as Node)) e.preventDefault()
        }}
      >
        <DetalheDia
          dia={dia}
          categorias={categorias}
          onEditar={(id) => {
            setAberto(false)
            onEditar(id)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
