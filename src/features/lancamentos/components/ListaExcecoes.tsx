import { X } from '@/shared/ui/icones'
import { formatarData, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'

interface ListaExcecoesProps {
  excecoes: Record<DataISO, number>
  onRemover: (data: DataISO) => void
}

/** Dias em que o recorrente tem outro valor ou foi pulado (mudados na planilha), com o × para voltar ao normal. */
export function ListaExcecoes({ excecoes, onRemover }: ListaExcecoesProps) {
  const dias = Object.entries(excecoes).sort(([a], [b]) => a.localeCompare(b))
  if (dias.length === 0) return null

  return (
    <Field>
      <FieldLabel id="lanc-excecoes">Mudado só em alguns dias</FieldLabel>
      <ul aria-labelledby="lanc-excecoes" className="flex flex-wrap gap-2">
        {dias.map(([data, valor]) => (
          <li key={data} className="flex items-center gap-1 border-2 border-contorno py-0.5 pl-2 text-xs tabular-nums">
            <span className="font-semibold">{formatarData(data)}</span>
            <span className="text-muted-foreground">{valor === 0 ? 'pulado' : formatarBRL(valor)}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-muted-foreground"
              onClick={() => onRemover(data)}
              aria-label={`Voltar ${formatarData(data)} ao valor normal`}
            >
              <X className="size-3" />
            </Button>
          </li>
        ))}
      </ul>
      <FieldDescription>Nos outros dias vale o valor acima. O × volta o dia ao normal.</FieldDescription>
    </Field>
  )
}
