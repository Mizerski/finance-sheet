import { ChevronRight } from 'lucide-react'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { cn } from '@/shared/lib/utils'
import { TableCell, TableRow } from '@/shared/ui/table'
import type { GrupoPasta } from '../grupos'

interface CabecalhoGrupoProps {
  grupo: GrupoPasta
  aberto: boolean
  ano: number
  /** Quantas colunas a tabela tem na maior largura. */
  colunas: number
  onAlternar: () => void
}

/** Linha que abre e fecha uma pasta na tabela de lançamentos, com a quantidade e o projetado no ano. */
export function CabecalhoGrupo({ grupo, aberto, ano, colunas, onAlternar }: CabecalhoGrupoProps) {
  const { nome, cor, lancamentos, entradasCentavos, saidasCentavos } = grupo
  const quantidade = lancamentos.length

  return (
    <TableRow className="border-b-border/50 bg-muted/40 hover:bg-muted/60">
      <TableCell colSpan={colunas} className="p-0">
        <button
          type="button"
          aria-expanded={aberto}
          onClick={onAlternar}
          className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 py-2.5 pr-3 pl-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:pr-5 sm:pl-4"
        >
          <ChevronRight className={cn('size-4 text-muted-foreground', aberto && 'rotate-90')} />
          <PontoCor cor={cor} className="size-2.5" />
          <span className="font-medium">{nome}</span>
          <span className="text-muted-foreground tabular-nums">
            {quantidade} {quantidade === 1 ? 'lançamento' : 'lançamentos'}
          </span>
          <span className="ml-auto flex flex-wrap items-center gap-x-3 text-[0.75rem] tabular-nums">
            {entradasCentavos > 0 && <span className="text-entrada">+ {formatarBRL(entradasCentavos)}</span>}
            {saidasCentavos > 0 && <span className="text-saida">− {formatarBRL(saidasCentavos)}</span>}
            <span className="text-muted-foreground">
              {entradasCentavos > 0 || saidasCentavos > 0 ? `em ${ano}` : `nada em ${ano}`}
            </span>
          </span>
        </button>
      </TableCell>
    </TableRow>
  )
}
