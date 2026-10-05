import { useState } from 'react'
import { DataForte, DinheiroForte, Forte } from '@/features/risco/components/Destaques'
import type { DataISO } from '@/shared/lib/datas'
import { CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import type { Lancamento } from '../model/lancamento'
import { fimDepoisDe, MAX_VEZES, parcelasDe } from '../utils/parcelas'

interface CampoVezesProps {
  /** O recorrente como ficaria salvo; null enquanto a recorrência tem erro. */
  lancamento: Lancamento | null
  hoje: DataISO
  /** O fim que dá o número de vezes escolhido (undefined = sem fim). */
  onAlterar: (fim: DataISO | undefined) => void
}

/**
 * "Quantas vezes": para parcelas, calcula o fim a partir do início e mostra quanto falta.
 * Sem início não há de onde contar: pôr o início em hoje apagaria os meses que passaram.
 */
export function CampoVezes({ lancamento, hoje, onAlterar }: CampoVezesProps) {
  const [texto, setTexto] = useState<string | null>(null)
  const parcelas = lancamento && parcelasDe(lancamento, hoje)
  const semInicio = !!lancamento && !lancamento.inicio

  function alterar(valor: string) {
    setTexto(valor)
    if (!lancamento?.inicio) return
    if (valor === '') return onAlterar(undefined)
    const vezes = Number(valor)
    if (!Number.isInteger(vezes) || vezes < 1 || vezes > MAX_VEZES) return
    onAlterar(fimDepoisDe(lancamento, vezes))
  }

  return (
    <Field>
      <FieldLabel htmlFor="lanc-vezes">
        Quantas vezes <span className="font-normal text-muted-foreground">(opcional)</span>
      </FieldLabel>
      <Input
        id="lanc-vezes"
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_VEZES}
        placeholder="Sem fim"
        value={texto ?? (parcelas ? String(parcelas.total) : '')}
        onChange={(e) => alterar(e.target.value)}
        onBlur={() => setTexto(null)}
        disabled={!lancamento || semInicio}
        className={cn(CAMPO, 'tabular-nums sm:w-32')}
      />
      <FieldDescription>
        {parcelas ? (
          <>
            <Forte className="tabular-nums">{parcelas.total}×</Forte> · última em <DataForte data={parcelas.ultima} /> ·
            total <DinheiroForte centavos={parcelas.totalCentavos} />
            {parcelas.pagas > 0 && parcelas.restantes > 0 && (
              <>
                {' '}
                · faltam {parcelas.restantes}: <DinheiroForte centavos={parcelas.restanteCentavos} />
              </>
            )}
          </>
        ) : semInicio ? (
          'Escolha o início para contar as vezes.'
        ) : (
          'Para compras parceladas: o fim é calculado a partir do início.'
        )}
      </FieldDescription>
    </Field>
  )
}
