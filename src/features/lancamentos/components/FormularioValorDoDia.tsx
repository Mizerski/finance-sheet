import { useState, type FormEvent } from 'react'
import { EfeitoNoCaixa } from '@/features/risco/components/EfeitoNoCaixa'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import type { DataISO } from '@/shared/lib/datas'
import { BOTAO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'
import { useFinancas } from '@/store/context/financas-context'
import { comValorNoDia, semExcecaoNoDia } from '../utils/excecoes'
import { valorNoDia, type Lancamento } from '../model/lancamento'

/** Muda o valor de um recorrente só num dia, ou o pula nesse dia, sem mexer nas outras ocorrências. */
export function FormularioValorDoDia({ lancamento, data, onConcluir }: { lancamento: Lancamento; data: DataISO; onConcluir: () => void }) {
  const { dispatch } = useFinancas()
  const atual = valorNoDia(lancamento, data)
  const [centavos, setCentavos] = useState(atual)
  const mudado = lancamento.excecoes?.[data] !== undefined

  function gravar(l: Lancamento) {
    dispatch({ tipo: 'lancamento/salvar', lancamento: l })
    onConcluir()
  }

  function salvar(e: FormEvent) {
    e.preventDefault()
    gravar(comValorNoDia(lancamento, data, centavos))
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="dia-valor">Valor neste dia</FieldLabel>
        <CampoDinheiro id="dia-valor" autoFocus centavos={centavos} onChange={setCentavos} />
        <FieldDescription>
          {centavos === 0
            ? 'Com zero, não acontece neste dia.'
            : 'Ex.: o salário que veio diferente ou a conta que chegou com outro valor.'}
        </FieldDescription>
      </Field>

      <EfeitoNoCaixa
        simulados={[comValorNoDia(lancamento, data, centavos)]}
        substitui={lancamento.id}
        tipo={lancamento.tipo}
        caixaId={lancamento.caixaId}
      />

      <div className="flex flex-wrap gap-2">
        {atual > 0 && (
          <Button type="button" variant="outline" className={BOTAO} onClick={() => gravar(comValorNoDia(lancamento, data, 0))}>
            Pular este dia
          </Button>
        )}
        {mudado && (
          <Button type="button" variant="outline" className={BOTAO} onClick={() => gravar(semExcecaoNoDia(lancamento, data))}>
            Voltar ao normal
          </Button>
        )}
      </div>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO} disabled={centavos === atual}>
          Salvar só neste dia
        </Button>
      </DialogFooter>
    </form>
  )
}
