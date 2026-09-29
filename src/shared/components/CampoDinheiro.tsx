import type { ComponentProps } from 'react'
import { formatarBRL, centavosDeTexto } from '@/shared/lib/dinheiro'
import { CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'

/** Limite do campo: R$ 99.999.999,99. */
const MAXIMO_CENTAVOS = 9_999_999_999

interface CampoDinheiroProps extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  centavos: number
  onChange: (centavos: number) => void
}

/**
 * Campo com máscara de R$ no estilo caixa registradora: cada dígito digitado
 * entra pela direita ("1", "12", "123" → R$ 0,01, R$ 0,12, R$ 1,23).
 */
export function CampoDinheiro({ centavos, onChange, className, ...props }: CampoDinheiroProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatarBRL(centavos)}
      onChange={(e) => onChange(Math.min(centavosDeTexto(e.target.value), MAXIMO_CENTAVOS))}
      className={cn(CAMPO, 'tabular-nums', className)}
    />
  )
}
