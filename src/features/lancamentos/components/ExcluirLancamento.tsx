import { useState } from 'react'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { formatarData, paraDataISO, somarDias } from '@/shared/lib/datas'
import { useFinancas } from '@/store/context/financas-context'
import type { Lancamento } from '../model/lancamento'
import { encerrar, recorrenteEmAndamento } from '../utils/vigencia'

interface ExcluirLancamentoProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Continua preenchido ao fechar, para o texto não mudar durante a animação de saída. */
  lancamento?: Lancamento
}

/**
 * Confirmação de exclusão de um lançamento (Lançamentos e Planilha).
 * Num recorrente que já aconteceu, encerrar mantém os meses que passaram; excluir apaga tudo.
 */
export function ExcluirLancamento({ aberto, onOpenChange, lancamento }: ExcluirLancamentoProps) {
  const { dispatch } = useFinancas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const encerravel = lancamento && recorrenteEmAndamento(lancamento, hoje) ? lancamento : undefined

  return (
    <ConfirmarExclusao
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Excluir lançamento?"
      descricao={
        encerravel ? (
          <>
            <span className="font-medium text-foreground">{encerravel.descricao}</span> já aconteceu antes de hoje.
            Encerrar mantém o histórico até {formatarData(somarDias(hoje, -1))} e para a partir de hoje. Excluir de vez
            apaga também os meses que passaram, sem desfazer.
          </>
        ) : (
          <>
            <span className="font-medium text-foreground">{lancamento?.descricao}</span> sai da planilha e da projeção.
            Não dá para desfazer.
          </>
        )
      }
      alternativa={
        encerravel && {
          rotulo: 'Encerrar',
          onClick: () => dispatch({ tipo: 'lancamento/salvar', lancamento: encerrar(encerravel, hoje) }),
        }
      }
      onConfirmar={() => lancamento && dispatch({ tipo: 'lancamento/excluir', id: lancamento.id })}
    />
  )
}
