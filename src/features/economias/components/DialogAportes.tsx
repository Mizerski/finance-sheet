import { useState } from 'react'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { formatarData, formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMADA, RODAPE_DIALOG } from '@/shared/lib/estilos'
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
import { useFinancas } from '@/store/financas-context'
import { aportesDaMeta } from '../aportes'
import type { MetaEconomia } from '../meta'

interface DialogAportesProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  meta?: MetaEconomia
  hoje: DataISO
}

/** Valor real guardado em cada mês que já passou; o que difere do aporte mensal vira ajuste. */
export function DialogAportes({ aberto, onOpenChange, meta, hoje }: DialogAportesProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-md')}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-medium tracking-tight">Quanto guardei em cada mês</DialogTitle>
          <DialogDescription>
            Corrija o mês em que guardou mais ou menos do que o planejado. A média real desses meses é o que define a
            previsão da meta.
          </DialogDescription>
        </DialogHeader>
        {meta && (
          <FormularioAportes key={meta.id} meta={meta} hoje={hoje} onConcluir={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function FormularioAportes({ meta, hoje, onConcluir }: { meta: MetaEconomia; hoje: DataISO; onConcluir: () => void }) {
  const { dispatch } = useFinancas()
  const [ajustes, setAjustes] = useState(meta.ajustes)

  // Meses recalculados com os valores em edição: guardar menos pode trazer mais um mês para a lista.
  const rascunho = { ...meta, ajustes }
  const aportes = aportesDaMeta(rascunho, hoje)
  const guardado = aportes.reduce((t, a) => t + a.valorCentavos, 0)

  function alterar(mes: string, centavos: number) {
    setAjustes((atual) => {
      const { [mes]: _anterior, ...resto } = atual
      // Igual ao plano não precisa de ajuste.
      return centavos === meta.aporteMensalCentavos ? resto : { ...resto, [mes]: centavos }
    })
  }

  function salvar() {
    dispatch({ tipo: 'meta/salvar', meta: rascunho })
    onConcluir()
  }

  return (
    <div className="flex flex-col gap-4">
      {aportes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ainda não passou nenhum dia de aporte. O primeiro é em{' '}
          {formatarData(aportesDaMeta(meta, '9999-12-31')[0]?.data ?? meta.inicio)}.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {aportes.map((a) => (
            <li key={a.mes} className="flex items-center justify-between gap-3">
              <label htmlFor={`aporte-${a.mes}`} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm first-letter:uppercase">{formatarMesAno(a.data)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  dia {formatarData(a.data)} · plano {formatarBRL(meta.aporteMensalCentavos)}
                </span>
              </label>
              <CampoDinheiro
                id={`aporte-${a.mes}`}
                centavos={ajustes[a.mes] ?? meta.aporteMensalCentavos}
                onChange={(c) => alterar(a.mes, c)}
                className="w-36 shrink-0 text-right"
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">Guardado até hoje</span>
        <span className="font-medium tabular-nums">
          {formatarBRL(guardado)} <span className="font-normal text-muted-foreground">de {formatarBRL(meta.valorAlvoCentavos)}</span>
        </span>
      </div>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={cn(BOTAO, 'bg-card')}>
            Cancelar
          </Button>
        </DialogClose>
        <Button className={BOTAO} onClick={salvar} disabled={aportes.length === 0}>
          Salvar
        </Button>
      </DialogFooter>
    </div>
  )
}
