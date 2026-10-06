import { CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

interface CampoDiaProps {
  id: string
  rotulo: string
  valor: string
  onChange: (valor: string) => void
  erro?: string
}

/** Dia do mês (1 a 31), como o fechamento e o vencimento do cartão. */
export function CampoDia({ id, rotulo, valor, onChange, erro }: CampoDiaProps) {
  return (
    <Field data-invalid={!!erro || undefined}>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={31}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!erro || undefined}
        className={cn(CAMPO, 'tabular-nums')}
      />
      <FieldError>{erro}</FieldError>
    </Field>
  )
}
