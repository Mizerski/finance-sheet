import { useState, type FormEvent } from 'react'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import { BOTAO, CAMADA, RODAPE_DIALOG, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'
import { useFinancas } from '@/store/financas-context'

interface DialogSaldoInicialProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

export function DialogSaldoInicial({ aberto, onOpenChange }: DialogSaldoInicialProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(CAMADA, 'gap-5 sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>Saldo inicial</DialogTitle>
          <DialogDescription>
            Quanto havia na conta no começo de um dia. A projeção parte daí; os dias anteriores ficam fora do cálculo.
          </DialogDescription>
        </DialogHeader>
        {/* Desmonta ao fechar: sempre abre com o valor salvo. */}
        <FormularioSaldoInicial onConcluir={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

const OPCOES_SINAL = [
  { valor: 'positivo' as const, rotulo: 'Positivo' },
  { valor: 'negativo' as const, rotulo: 'Negativo' },
]

function FormularioSaldoInicial({ onConcluir }: { onConcluir: () => void }) {
  const { estado, dispatch } = useFinancas()
  const { saldoInicialCentavos, dataSaldoInicial } = estado.config
  const [centavos, setCentavos] = useState(Math.abs(saldoInicialCentavos))
  const [sinal, setSinal] = useState<'positivo' | 'negativo'>(saldoInicialCentavos < 0 ? 'negativo' : 'positivo')
  const [data, setData] = useState(dataSaldoInicial)

  function salvar(e: FormEvent) {
    e.preventDefault()
    dispatch({
      tipo: 'config/atualizar',
      config: { saldoInicialCentavos: sinal === 'negativo' ? -centavos : centavos, dataSaldoInicial: data },
    })
    onConcluir()
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="saldo-valor">Valor</FieldLabel>
          <CampoDinheiro id="saldo-valor" autoFocus centavos={centavos} onChange={setCentavos} />
        </Field>
        <Field>
          <FieldLabel htmlFor="saldo-data">No começo do dia</FieldLabel>
          <SeletorData id="saldo-data" valor={data} onChange={(d) => d && setData(d)} />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="saldo-sinal">Situação da conta</FieldLabel>
        <ControleSegmentado id="saldo-sinal" rotulo="Situação da conta" valor={sinal} opcoes={OPCOES_SINAL} onChange={setSinal} />
        <FieldDescription>Negativo se a conta estava no cheque especial.</FieldDescription>
      </Field>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO}>
          Salvar saldo inicial
        </Button>
      </DialogFooter>
    </form>
  )
}
