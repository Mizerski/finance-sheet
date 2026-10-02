import { PontoCor } from '@/shared/components/PontoCor'
import { CAMPO_SELECT } from '@/shared/lib/estilos'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useFinancas } from '@/store/financas-context'
import { caixasAtivos, type Caixa } from '../caixa'

interface CampoCaixaProps {
  id: string
  valor: string
  onChange: (caixaId: string) => void
  /** Só caixas que passam no filtro (ex.: metas só em contas). */
  filtro?: (caixa: Caixa) => boolean
  descricao?: string
}

/**
 * Campo "Caixa" dos formulários. Só aparece com 2 ou mais opções: quem tem um caixa não vê nada novo.
 * Um caixa arquivado já escolhido (ao editar) continua na lista.
 */
export function CampoCaixa({ id, valor, onChange, filtro = () => true, descricao }: CampoCaixaProps) {
  const { estado } = useFinancas()
  const ativos = caixasAtivos(estado.caixas).filter(filtro)
  const atual = estado.caixas.find((c) => c.id === valor)
  const opcoes = atual && !ativos.includes(atual) ? [...ativos, atual] : ativos
  // Sem escolha a fazer (um caixa só, ou uma conta só para a meta), o campo não aparece.
  if (opcoes.length < 2) return null

  return (
    <Field>
      <FieldLabel htmlFor={id}>Caixa</FieldLabel>
      <Select value={valor} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger id={id} className={CAMPO_SELECT}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {opcoes.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <PontoCor cor={c.cor} />
              {c.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {descricao && <FieldDescription>{descricao}</FieldDescription>}
    </Field>
  )
}
