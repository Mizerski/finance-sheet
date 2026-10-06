import { useState } from 'react'
import { DialogPasta } from '@/features/pastas/components/DialogPasta'
import { PontoCor } from '@/shared/components/PontoCor'
import { CAMPO_SELECT } from '@/shared/lib/estilos'
import { Plus } from '@/shared/ui/icones'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useFinancas } from '@/store/context/financas-context'
import { NENHUMA, NOVA } from '../constants/selecao'

interface CampoPastaProps {
  id: string
  /** '' = sem pasta. */
  valor: string
  onChange: (pastaId: string) => void
}

/** Pasta opcional do lançamento; "Nova pasta" abre o cadastro e a criada já fica escolhida. */
export function CampoPasta({ id, valor, onChange }: CampoPastaProps) {
  const { estado } = useFinancas()
  const [criando, setCriando] = useState(false)

  /** Ignora o valor vazio que o select do Radix avisa logo depois de criar a pasta. */
  function escolher(v: string) {
    if (!v) return
    if (v === NOVA) setCriando(true)
    else onChange(v === NENHUMA ? '' : v)
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        Pasta <span className="font-normal text-muted-foreground">(opcional)</span>
      </FieldLabel>
      <Select value={valor || NENHUMA} onValueChange={escolher}>
        <SelectTrigger id={id} className={CAMPO_SELECT}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={NENHUMA}>Sem pasta</SelectItem>
          {estado.pastas.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <PontoCor cor={p.cor} />
              {p.nome}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={NOVA} className="font-semibold">
            <Plus />
            Nova pasta
          </SelectItem>
        </SelectContent>
      </Select>
      {estado.pastas.length === 0 && (
        <FieldDescription>
          Pastas agrupam a lista de lançamentos.{' '}
          <button type="button" onClick={() => setCriando(true)} className="underline underline-offset-4 hover:text-primary">
            Criar pasta
          </button>
        </FieldDescription>
      )}
      <DialogPasta aberto={criando} onOpenChange={setCriando} onSalvar={(p) => onChange(p.id)} />
    </Field>
  )
}
