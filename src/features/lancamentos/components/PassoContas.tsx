import { CampoCaixa } from '@/features/caixas/components/CampoCaixa'
import type { Caixa } from '@/features/caixas/model/caixa'
import type { ErrosLancamento, RascunhoLancamento } from '../utils/formulario'

interface PassoContasProps {
  rascunho: RascunhoLancamento
  erros: ErrosLancamento
  onOrigem: (caixaId: string) => void
  onDestino: (caixaId: string) => void
}

/** Transferência é só entre contas: o benefício é carimbado e recebe só a recarga. */
const ehConta = (c: Caixa) => c.tipo === 'conta'

/** Transferência: de qual conta sai e em qual entra. */
export function PassoContas({ rascunho, erros, onOrigem, onDestino }: PassoContasProps) {
  return (
    <div className="flex flex-col gap-4">
      <CampoCaixa id="passo-origem" rotulo="Sai de" valor={rascunho.caixaId} onChange={onOrigem} filtro={ehConta} sempre />
      <CampoCaixa
        id="passo-destino"
        rotulo="Entra em"
        valor={rascunho.caixaDestinoId}
        onChange={onDestino}
        filtro={(c) => ehConta(c) && c.id !== rascunho.caixaId}
        placeholder="Escolher"
        descricao="Não conta como gasto nem como entrada."
        erro={erros.caixaDestinoId}
        sempre
      />
    </div>
  )
}
