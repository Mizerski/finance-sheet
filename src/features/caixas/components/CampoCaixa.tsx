import { PontoCor } from '@/shared/components/PontoCor'
import { CAMPO_SELECT } from '@/shared/lib/estilos'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useFinancas } from '@/store/financas-context'
import { caixasAtivos, NOME_TOTAL, type Caixa } from '../caixa'

interface CampoCaixaProps {
  id: string
  valor: string
  onChange: (caixaId: string) => void
  /** Só caixas que passam no filtro (ex.: metas só em contas). */
  filtro?: (caixa: Caixa) => boolean
  descricao?: string
  /** Padrão: "Caixa". */
  rotulo?: string
  /** Aparece mesmo com uma opção só (ex.: a conta de destino de uma transferência). */
  sempre?: boolean
  /** Texto do campo sem escolha. */
  placeholder?: string
  erro?: string
}

/**
 * Campo "Caixa" dos formulários. Só aparece com 2 ou mais opções: quem tem um caixa não vê nada novo.
 * Um caixa arquivado já escolhido (ao editar) continua na lista.
 */
export function CampoCaixa({
  id,
  valor,
  onChange,
  filtro = () => true,
  descricao,
  rotulo = 'Caixa',
  sempre = false,
  placeholder,
  erro,
}: CampoCaixaProps) {
  const { estado } = useFinancas()
  const ativos = caixasAtivos(estado.caixas).filter(filtro)
  const atual = estado.caixas.find((c) => c.id === valor)
  const opcoes = atual && !ativos.includes(atual) ? [...ativos, atual] : ativos
  // Sem escolha a fazer (um caixa só, ou uma conta só para a meta), o campo não aparece.
  if (opcoes.length < (sempre ? 1 : 2)) return null

  return (
    <Field data-invalid={!!erro || undefined}>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      <Select value={valor} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger id={id} aria-invalid={!!erro || undefined} className={CAMPO_SELECT}>
          <SelectValue placeholder={placeholder} />
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
      {erro ? (
        <FieldError>{erro}</FieldError>
      ) : descricao ? (
        <FieldDescription>{descricao}</FieldDescription>
      ) : (
        atual?.cartao ? (
          <FieldDescription>
            Cartão: entra na fatura que fecha no dia {atual.cartao.diaFechamento} e sai de{' '}
            {estado.caixas.find((c) => c.id === atual.cartao!.contaPagadoraId)?.nome ?? 'a conta'} no dia{' '}
            {atual.cartao.diaVencimento}.
          </FieldDescription>
        ) : atual?.tipo === 'beneficio' && (
          <FieldDescription>Benefício: o saldo dele fica à parte, fora do {NOME_TOTAL}.</FieldDescription>
        )
      )}
    </Field>
  )
}
