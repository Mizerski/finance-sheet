import { Pencil, Plus } from 'lucide-react'
import { CATEGORIA_DESCONHECIDA, type Categoria } from '@/features/categorias/categoria'
import type { DiaProjetado, Ocorrencia } from '@/features/projecao/projecao'
import { formatarData, nomeDoDiaDaSemana } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { PopoverHeader, PopoverTitle } from '@/shared/ui/popover'

interface DetalheDiaProps {
  dia: DiaProjetado
  categorias: Map<string, Categoria>
  /** Abre a edição do lançamento que gerou a ocorrência. */
  onEditar: (lancamentoId: string) => void
  /** Abre um lançamento novo já com a data deste dia. */
  onAdicionar: () => void
}

/** Conteúdo do popover: lançamentos de um dia da planilha. */
export function DetalheDia({ dia, categorias, onEditar, onAdicionar }: DetalheDiaProps) {
  return (
    <>
      <PopoverHeader>
        <PopoverTitle className="first-letter:uppercase">
          {nomeDoDiaDaSemana(dia.diaDaSemana, 'longo')}, {formatarData(dia.data)}
        </PopoverTitle>
      </PopoverHeader>

      {!dia.noCalculo ? (
        <p className="text-muted-foreground">Antes da data do saldo inicial, fora do cálculo.</p>
      ) : dia.ocorrencias.length === 0 ? (
        <p className="text-muted-foreground">Nenhum lançamento neste dia.</p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {dia.ocorrencias.map((o) => (
            <ItemOcorrencia
              key={o.lancamentoId}
              ocorrencia={o}
              categoria={categorias.get(o.categoriaId) ?? CATEGORIA_DESCONHECIDA}
              onEditar={() => onEditar(o.lancamentoId)}
            />
          ))}
        </ul>
      )}

      {dia.saldoCentavos !== null && (
        <div className="flex justify-between border-t pt-3 font-medium">
          <span>Saldo do dia</span>
          <span className={cn('tabular-nums', VALOR_SALDO, dia.saldoCentavos < 0 && 'text-negativo')}>
            {formatarBRL(dia.saldoCentavos)}
          </span>
        </div>
      )}

      {dia.noCalculo && (
        <Button variant="outline" className={cn(BOTAO, 'mt-1 w-full bg-card')} onClick={onAdicionar}>
          <Plus aria-hidden className="size-4" />
          Adicionar lançamento
        </Button>
      )}
    </>
  )
}

function ItemOcorrencia({
  ocorrencia,
  categoria,
  onEditar,
}: {
  ocorrencia: Ocorrencia
  categoria: Pick<Categoria, 'nome' | 'cor'>
  onEditar: () => void
}) {
  const entrada = ocorrencia.tipo === 'entrada'

  return (
    <li>
      <button
        type="button"
        onClick={onEditar}
        className="group/item flex w-full items-start justify-between gap-3 rounded-xl px-2 py-1.5 text-left transition-colors outline-none hover:bg-foreground/4 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-medium">
            <span className="sr-only">Editar </span>
            {ocorrencia.descricao}
          </span>
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: categoria.cor }} />
            {categoria.nome}
            {!entrada && (
              <Badge variant="outline" className="h-4 rounded-full px-1.5 text-[0.65rem] font-normal">
                {ocorrencia.natureza === 'fixa' ? 'fixa' : 'variável'}
              </Badge>
            )}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {/* Lápis só no hover/foco: indica que o item abre a edição. */}
          <Pencil
            aria-hidden
            className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
          />
          <span className={cn('tabular-nums', entrada ? 'text-entrada' : 'text-saida')}>
            {entrada ? '+' : '−'} {formatarBRL(ocorrencia.valorCentavos)}
          </span>
        </span>
      </button>
    </li>
  )
}
