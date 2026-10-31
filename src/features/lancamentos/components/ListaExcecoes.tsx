import { X } from '@/shared/ui/icones'
import { formatarData, formatarDiaMes, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'

interface ListaExcecoesProps {
  excecoes: Record<DataISO, number>
  movidas: Record<DataISO, DataISO>
  onRemover: (data: DataISO) => void
  onRemoverMovida: (data: DataISO) => void
}

/**
 * Dias em que o recorrente tem outro valor, foi pulado ou aconteceu em outro dia (mudados na planilha), com o × para
 * voltar ao normal.
 */
export function ListaExcecoes({ excecoes, movidas, onRemover, onRemoverMovida }: ListaExcecoesProps) {
  const dias = [
    ...Object.entries(excecoes).map(([data, valor]) => ({ data, texto: valor === 0 ? 'pulado' : formatarBRL(valor), movida: false })),
    ...Object.entries(movidas).map(([data, para]) => ({ data, texto: `foi em ${formatarDiaMes(para)}`, movida: true })),
  ].sort((a, b) => a.data.localeCompare(b.data))
  if (dias.length === 0) return null

  return (
    <Field>
      <FieldLabel id="lanc-excecoes">Mudado só em alguns dias</FieldLabel>
      <ul aria-labelledby="lanc-excecoes" className="flex flex-wrap gap-2">
        {dias.map(({ data, texto, movida }) => (
          <li
            key={`${data}-${movida}`}
            className="flex items-center gap-1 border-2 border-contorno py-0.5 pl-2 text-xs tabular-nums"
          >
            <span className="font-semibold">{formatarData(data)}</span>
            <span className="text-muted-foreground">{texto}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-muted-foreground"
              onClick={() => (movida ? onRemoverMovida(data) : onRemover(data))}
              aria-label={movida ? `Voltar ${formatarData(data)} para o próprio dia` : `Voltar ${formatarData(data)} ao valor normal`}
            >
              <X className="size-3" />
            </Button>
          </li>
        ))}
      </ul>
      <FieldDescription>Nos outros dias vale o valor acima, no dia de sempre. O × volta o dia ao normal.</FieldDescription>
    </Field>
  )
}
