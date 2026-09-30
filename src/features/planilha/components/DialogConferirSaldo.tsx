import { useState, type FormEvent } from 'react'
import { lancamentoDeAjuste } from '@/features/lancamentos/ajuste'
import { useProjecoes } from '@/features/projecao/useProjecao'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarData, paraDataISO, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMADA, RODAPE_DIALOG, TITULO_DIALOG, VALOR_SALDO } from '@/shared/lib/estilos'
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

interface DialogConferirSaldoProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

/** Compara o saldo do banco com o da planilha e lança a diferença como ajuste. */
export function DialogConferirSaldo({ aberto, onOpenChange }: DialogConferirSaldoProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(CAMADA, 'gap-5 sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>Conferir saldo</DialogTitle>
          <DialogDescription>
            Informe quanto o banco mostra. Se a planilha estiver diferente, a diferença vira um lançamento de ajuste.
          </DialogDescription>
        </DialogHeader>
        {/* Desmonta ao fechar: sempre abre vazio, com a data de hoje. */}
        <FormularioConferir onConcluir={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

const OPCOES_SINAL = [
  { valor: 'positivo' as const, rotulo: 'Positivo' },
  { valor: 'negativo' as const, rotulo: 'Negativo' },
]

function FormularioConferir({ onConcluir }: { onConcluir: () => void }) {
  const { dispatch } = useFinancas()
  const projecoes = useProjecoes()
  const [data, setData] = useState<DataISO>(() => paraDataISO(new Date()))
  const [centavos, setCentavos] = useState(0)
  const [sinal, setSinal] = useState<'positivo' | 'negativo'>('positivo')
  const [informado, setInformado] = useState(false)

  const projetado = projecoes.flatMap((p) => p.dias).find((d) => d.data === data)?.saldoCentavos ?? null
  const real = sinal === 'negativo' ? -centavos : centavos
  const diferenca = projetado === null ? 0 : real - projetado
  const pronto = informado && projetado !== null && diferenca !== 0

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (!pronto || projetado === null) return
    const ajuste = lancamentoDeAjuste(real, projetado, data, crypto.randomUUID())
    if (ajuste) dispatch({ tipo: 'lancamento/salvar', lancamento: ajuste })
    onConcluir()
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="conferir-valor">Saldo no banco</FieldLabel>
          <CampoDinheiro
            id="conferir-valor"
            autoFocus
            centavos={centavos}
            onChange={(c) => {
              setCentavos(c)
              setInformado(true)
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="conferir-data">No fim do dia</FieldLabel>
          <SeletorData id="conferir-data" valor={data} onChange={(d) => d && setData(d)} />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="conferir-sinal">Situação da conta</FieldLabel>
        <ControleSegmentado
          id="conferir-sinal"
          rotulo="Situação da conta"
          valor={sinal}
          opcoes={OPCOES_SINAL}
          onChange={setSinal}
        />
        <FieldDescription>
          A planilha considera os lançamentos do dia inteiro. Se o banco ainda não mostra os de hoje, escolha ontem.
        </FieldDescription>
      </Field>

      <Comparacao projetado={projetado} real={informado ? real : null} diferenca={diferenca} data={data} />

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={cn(BOTAO, 'bg-card')}>
            {informado && projetado !== null && diferenca === 0 ? 'Fechar' : 'Cancelar'}
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO} disabled={!pronto}>
          Lançar ajuste
        </Button>
      </DialogFooter>
    </form>
  )
}

interface ComparacaoProps {
  projetado: number | null
  /** null enquanto o saldo do banco não foi digitado. */
  real: number | null
  diferenca: number
  data: DataISO
}

function Comparacao({ projetado, real, diferenca, data }: ComparacaoProps) {
  if (projetado === null) {
    return <p className="text-sm text-muted-foreground">Esse dia está fora do cálculo da planilha. Escolha outra data.</p>
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl p-4 text-sm ring-1 ring-border">
      <Linha rotulo="Na planilha" valor={projetado} />
      {real !== null && (
        <>
          <Linha rotulo="No banco" valor={real} />
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Diferença</span>
            <span className={cn('tabular-nums', VALOR_SALDO, diferenca > 0 && 'text-entrada', diferenca < 0 && 'text-saida')}>
              {diferenca === 0 ? formatarBRL(0) : `${diferenca > 0 ? '+' : '−'} ${formatarBRL(Math.abs(diferenca))}`}
            </span>
          </div>
          <p className="text-muted-foreground">
            {diferenca === 0
              ? 'Tudo certo: a planilha bate com o banco.'
              : `Vira ${diferenca > 0 ? 'uma entrada' : 'uma saída'} "Ajuste de saldo" em ${formatarData(data)}, sem categoria.`}
          </p>
        </>
      )}
    </div>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className={cn('tabular-nums', VALOR_SALDO, valor < 0 && 'text-negativo')}>{formatarBRL(valor)}</span>
    </div>
  )
}
