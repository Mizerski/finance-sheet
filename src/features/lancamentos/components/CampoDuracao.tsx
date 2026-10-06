import { DataForte, DinheiroForte, Forte } from '@/features/risco/components/Destaques'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import type { DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import {
  lerVezes,
  paraLancamento,
  type AlterarRascunho,
  type Duracao,
  type ErrosLancamento,
  type RascunhoLancamento,
} from '../utils/formulario'
import { MAX_VEZES, parcelasDe } from '../utils/parcelas'

interface CampoDuracaoProps {
  /** Prefixo dos ids, para o campo aparecer em mais de um formulário. */
  id: string
  rascunho: RascunhoLancamento
  erros: ErrosLancamento
  hoje: DataISO
  alterar: AlterarRascunho
  /** Muda o começo (no mensal, o dia do mês vai junto: `comInicio`). */
  onInicio: (inicio: DataISO | undefined) => void
}

const OPCOES_DURACAO: { valor: Duracao; rotulo: string }[] = [
  { valor: 'sem', rotulo: 'Sem fim' },
  { valor: 'vezes', rotulo: 'Algumas vezes' },
  { valor: 'data', rotulo: 'Até uma data' },
]
const OPCOES_VALOR = [
  { valor: 'cada' as const, rotulo: 'De cada vez' },
  { valor: 'total' as const, rotulo: 'O total' },
]

/**
 * Começo e "até quando" de um recorrente, numa pergunta só (no lugar de Início, Fim e Quantas vezes soltos).
 * No mensal, o dia do começo é o dia de todo mês: sem começo ("Desde sempre"), o dia vem de `CampoDiaDoMes`.
 * Em "Algumas vezes", o valor digitado pode ser o de cada vez ou o total, que o app divide pelas vezes.
 */
export function CampoDuracao({ id, rascunho: r, erros, hoje, alterar, onInicio }: CampoDuracaoProps) {
  const vezes = r.duracao === 'vezes' ? lerVezes(r) : null
  const parcelas = vezes && r.inicio && !erros.diasDaSemana && !erros.diaDoMes ? parcelasDe(paraLancamento(r, 'simulado'), hoje) : null
  const cada = vezes && r.valorEhTotal ? Math.round(r.valorCentavos / vezes) : r.valorCentavos

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <Field data-invalid={!!erros.inicio || undefined} className="sm:max-w-60">
          <FieldLabel htmlFor={`${id}-inicio`}>Começa em</FieldLabel>
          <SeletorData
            id={`${id}-inicio`}
            valor={r.inicio}
            onChange={onInicio}
            placeholder="Desde sempre"
            opcional
            invalido={!!erros.inicio}
          />
          {erros.inicio ? (
            <FieldError>{erros.inicio}</FieldError>
          ) : (
            r.recorrencia === 'mensal' &&
            r.inicio && (
              <FieldDescription>
                Repete todo dia <Forte className="tabular-nums">{r.diaDoMes}</Forte>
                {Number(r.diaDoMes) > 28 && ' (ou no último dia, nos meses mais curtos)'}.
              </FieldDescription>
            )
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-duracao`}>Até quando?</FieldLabel>
          <ControleSegmentado
            id={`${id}-duracao`}
            rotulo="Até quando"
            valor={r.duracao}
            opcoes={OPCOES_DURACAO}
            onChange={(d) => alterar('duracao', d)}
          />
        </Field>
      </div>

      {r.duracao === 'vezes' && (
        <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <Field data-invalid={!!erros.vezes || undefined}>
            <FieldLabel htmlFor={`${id}-vezes`}>Quantas vezes?</FieldLabel>
            <Input
              id={`${id}-vezes`}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_VEZES}
              placeholder="Ex.: 12"
              value={r.vezes}
              onChange={(e) => alterar('vezes', e.target.value)}
              aria-invalid={!!erros.vezes || undefined}
              className={cn(CAMPO, 'tabular-nums')}
            />
            <FieldError>{erros.vezes}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-valor-total`}>O valor digitado é</FieldLabel>
            <ControleSegmentado
              id={`${id}-valor-total`}
              rotulo="O valor digitado é"
              valor={r.valorEhTotal ? 'total' : 'cada'}
              opcoes={OPCOES_VALOR}
              onChange={(v) => alterar('valorEhTotal', v === 'total')}
            />
          </Field>
        </div>
      )}

      {r.duracao === 'vezes' && parcelas && (
        <FieldDescription className="-mt-2">
          <Forte className="tabular-nums">
            {parcelas.total} × {formatarBRL(cada)}
          </Forte>{' '}
          = <DinheiroForte centavos={parcelas.totalCentavos} /> · a última em <DataForte data={parcelas.ultima} />
          {parcelas.pagas > 0 && parcelas.restantes > 0 && <> · faltam {parcelas.restantes}</>}
        </FieldDescription>
      )}

      {r.duracao === 'data' && (
        <Field data-invalid={!!erros.fim || undefined}>
          <FieldLabel htmlFor={`${id}-fim`}>Até</FieldLabel>
          <SeletorData
            id={`${id}-fim`}
            valor={r.fim}
            onChange={(v) => alterar('fim', v)}
            placeholder="Escolher"
            mesInicial={r.inicio}
            invalido={!!erros.fim}
          />
          <FieldError>{erros.fim}</FieldError>
        </Field>
      )}
    </div>
  )
}
