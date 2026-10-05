import { useState, type FormEvent } from 'react'
import { lancamentoDeAjuste } from '@/features/lancamentos/utils/ajuste'
import { useProjecoesDosCaixas } from '@/features/projecao/hooks/useProjecoesDosCaixas'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { formatarData, paraDataISO, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMADA, CAMPO_SELECT, RODAPE_DIALOG, TITULO_DIALOG } from '@/shared/lib/estilos'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useFinancas } from '@/store/context/financas-context'
import { ehCartao, type Caixa, type CicloCartao } from '../model/caixa'
import { fechamentosRecentes, valorDaFatura, vencimentoDaFatura } from '../utils/cartao'

interface DialogConferirFaturaProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  cartao: Caixa
}

/** Compara a fatura que o banco fechou com a do app e lança a diferença como ajuste no cartão. */
export function DialogConferirFatura({ aberto, onOpenChange, cartao }: DialogConferirFaturaProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(CAMADA, 'gap-5 sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>Conferir fatura</DialogTitle>
          <DialogDescription>
            Informe quanto o banco fechou. Se o app estiver diferente, a diferença vira um ajuste no cartão.
          </DialogDescription>
        </DialogHeader>
        {ehCartao(cartao) && <FormularioConferir cartao={cartao} ciclo={cartao.cartao} onConcluir={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

/** Só as faturas que vencem a partir do começo do cartão; a que fechou antes dele muda o "Quanto deve hoje". */
function FormularioConferir({ cartao, ciclo, onConcluir }: { cartao: Caixa; ciclo: CicloCartao; onConcluir: () => void }) {
  const { dispatch } = useFinancas()
  const { porCaixa } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const fechamentos = fechamentosRecentes(hoje, ciclo).filter(
    (f) => vencimentoDaFatura(f, ciclo) >= cartao.dataSaldoInicial,
  )
  const [fechamento, setFechamento] = useState<DataISO | undefined>(fechamentos[0])
  const [centavos, setCentavos] = useState(0)
  const [informado, setInformado] = useState(false)

  const dias = (porCaixa.get(cartao.id) ?? []).flatMap((p) => p.dias)
  const noApp = fechamento ? valorDaFatura(dias, fechamento) : 0
  const diferenca = centavos - noApp
  const pronto = !!fechamento && informado && diferenca !== 0
  const antesDoComeco = !!fechamento && fechamento < cartao.dataSaldoInicial

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (!pronto || !fechamento) return
    if (antesDoComeco) {
      dispatch({ tipo: 'caixa/salvar', caixa: { ...cartao, saldoInicialCentavos: cartao.saldoInicialCentavos - diferenca } })
    } else {
      const ajuste = lancamentoDeAjuste(-centavos, -noApp, fechamento, crypto.randomUUID(), cartao.id)
      if (ajuste) dispatch({ tipo: 'lancamento/salvar', lancamento: ajuste })
    }
    onConcluir()
  }

  if (!fechamento) {
    return (
      <>
        <p className="text-sm text-muted-foreground">
          Nenhuma fatura fechou desde o começo do cartão ({formatarData(cartao.dataSaldoInicial)}).
        </p>
        <DialogFooter className={RODAPE_DIALOG}>
          <DialogClose asChild>
            <Button type="button" variant="outline" className={BOTAO}>
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </>
    )
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="fatura-fechamento">Fatura que fechou em</FieldLabel>
          <Select value={fechamento} onValueChange={(v) => v && setFechamento(v)}>
            <SelectTrigger id="fatura-fechamento" className={CAMPO_SELECT}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {fechamentos.map((f) => (
                <SelectItem key={f} value={f}>
                  {formatarData(f)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>Vence em {formatarData(vencimentoDaFatura(fechamento, ciclo))}.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="fatura-valor">Valor no banco</FieldLabel>
          <CampoDinheiro
            id="fatura-valor"
            autoFocus
            centavos={centavos}
            onChange={(c) => {
              setCentavos(c)
              setInformado(true)
            }}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2 border-2 border-contorno p-4 text-sm">
        <Linha rotulo="No app" valor={noApp} />
        {informado && (
          <>
            <Linha rotulo="No banco" valor={centavos} />
            <div className="flex justify-between border-t-2 border-contorno pt-2 font-semibold">
              <span>Diferença</span>
              <span className={cn('tabular-nums', diferenca > 0 && 'text-saida', diferenca < 0 && 'text-entrada')}>
                {diferenca === 0 ? formatarBRL(0) : `${diferenca > 0 ? '+' : '−'} ${formatarBRL(Math.abs(diferenca))}`}
              </span>
            </div>
            <p className="text-muted-foreground">
              {diferenca === 0
                ? 'Tudo certo: a fatura bate com o banco.'
                : antesDoComeco
                  ? `Muda o "Quanto deve hoje" do cartão para ${formatarBRL(-(cartao.saldoInicialCentavos - diferenca))}.`
                  : `Vira um "Ajuste de saldo" no cartão em ${formatarData(fechamento)}, fora dos gastos. A fatura passa a sair com o valor do banco.`}
            </p>
          </>
        )}
      </div>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            {informado && diferenca === 0 ? 'Fechar' : 'Cancelar'}
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO} disabled={!pronto}>
          Ajustar fatura
        </Button>
      </DialogFooter>
    </form>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="tabular-nums">{formatarBRL(valor)}</span>
    </div>
  )
}
