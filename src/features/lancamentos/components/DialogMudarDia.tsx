import { useState } from 'react'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { formatarData, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useFinancas } from '@/store/context/financas-context'
import { FormularioMudarDia } from './FormularioMudarDia'
import { FormularioValorDoDia } from './FormularioValorDoDia'

/** O que o dialog muda: o dia de um ou mais lançamentos, ou o valor de um recorrente só nesse dia. */
type Modo = 'dia' | 'valor'

export interface MudancaNoDia {
  aberto: boolean
  /** O dia da planilha. */
  data?: DataISO
  /** O item clicado (o calendário dele); sem ele, abre só a mudança de dia, nada marcado. */
  lancamentoId?: string
  /** Data original do item clicado, se ele veio de outro dia. */
  de?: DataISO
}

interface DialogMudarDiaProps {
  mudanca: MudancaNoDia
  hoje: DataISO
  onOpenChange: (aberto: boolean) => void
}

/**
 * O calendário do dia na planilha: levar para outro dia o que aconteceu antes (ou depois) do previsto, com checkbox
 * para escolher quais, ou mudar o valor de um recorrente só nesse dia.
 */
export function DialogMudarDia({ mudanca, hoje, onOpenChange }: DialogMudarDiaProps) {
  return (
    <Dialog open={mudanca.aberto} onOpenChange={onOpenChange}>
      <DialogContent className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-md')}>
        {mudanca.data && <ConteudoMudarDia mudanca={mudanca} data={mudanca.data} hoje={hoje} onConcluir={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

/** Fica montado só com o dialog aberto, então cada abertura começa em "Outro dia". */
function ConteudoMudarDia({
  mudanca,
  data,
  hoje,
  onConcluir,
}: {
  mudanca: MudancaNoDia
  data: DataISO
  hoje: DataISO
  onConcluir: () => void
}) {
  const { estado } = useFinancas()
  const [modo, setModo] = useState<Modo>('dia')
  const { lancamentoId } = mudanca
  const lancamento = lancamentoId ? estado.lancamentos.find((l) => l.id === lancamentoId) : undefined
  const recorrente = !!lancamento && lancamento.recorrencia.tipo !== 'unica'
  const original = mudanca.de ?? data
  const valor = recorrente && modo === 'valor'

  return (
    <>
      <DialogHeader>
        <DialogTitle className={TITULO_DIALOG}>{valor ? `Só em ${formatarData(original)}` : 'Mudar de dia'}</DialogTitle>
        <DialogDescription>
          {valor && lancamento
            ? `${lancamento.descricao} · nos outros dias continua ${formatarBRL(lancamento.valorCentavos)}.`
            : `Pagou ou recebeu em outro dia o que estava para ${formatarData(data)}? Marque e escolha o dia.`}
        </DialogDescription>
      </DialogHeader>

      {recorrente && (
        <ControleSegmentado<Modo>
          rotulo="O que mudar"
          valor={modo}
          onChange={setModo}
          opcoes={[
            { valor: 'dia', rotulo: 'Outro dia' },
            { valor: 'valor', rotulo: 'Outro valor' },
          ]}
        />
      )}

      {valor && lancamento ? (
        <FormularioValorDoDia lancamento={lancamento} data={original} onConcluir={onConcluir} />
      ) : (
        <FormularioMudarDia
          data={data}
          hoje={hoje}
          marcado={lancamentoId ? { lancamentoId, de: original } : undefined}
          onConcluir={onConcluir}
        />
      )}
    </>
  )
}
