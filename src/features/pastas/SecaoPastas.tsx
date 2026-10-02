import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { CabecalhoOrganizacao } from '@/features/organizacao/components/CabecalhoOrganizacao'
import { totalPorLancamento } from '@/features/projecao/projecao'
import { useDiasDosCaixas } from '@/features/projecao/projecoes-por-caixa'
import { useAno } from '@/features/projecao/useAno'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { BOTAO } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { useFinancas } from '@/store/financas-context'
import { CardPastas } from './components/CardPastas'
import { DialogPasta } from './components/DialogPasta'
import { agruparPorPasta } from './grupos'
import type { Pasta } from './pasta'

/** O item continua guardado ao fechar, para o conteúdo não mudar durante a animação de saída. */
interface Selecao {
  aberto: boolean
  pasta?: Pasta
}

/** Aba Pastas da tela Organização. */
export function SecaoPastas() {
  const { estado, dispatch } = useFinancas()
  // Categorias, tags e pastas valem para todos os caixas: os totais também.
  const { ano } = useAno()
  const dias = useDiasDosCaixas(ano)
  const [edicao, setEdicao] = useState<Selecao>({ aberto: false })
  const [exclusao, setExclusao] = useState<Selecao>({ aberto: false })

  const grupos = useMemo(
    () => agruparPorPasta(estado.lancamentos, estado.pastas, totalPorLancamento(dias)),
    [estado.lancamentos, estado.pastas, dias],
  )
  const usosExcluindo = exclusao.pasta
    ? (grupos.find((g) => g.chave === exclusao.pasta?.id)?.lancamentos.length ?? 0)
    : 0
  const nova = () => setEdicao({ aberto: true })

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoOrganizacao
        descricao={`Pastas organizam a lista de lançamentos, sem mudar a projeção · totais projetados para ${ano}`}
        acao={
          <Button className={BOTAO} onClick={nova}>
            <Plus />
            Nova pasta
          </Button>
        }
      />

      <CardPastas
        pastas={estado.pastas}
        grupos={grupos}
        onNova={nova}
        onEditar={(pasta) => setEdicao({ aberto: true, pasta })}
        onExcluir={(pasta) => setExclusao({ aberto: true, pasta })}
      />

      <DialogPasta
        aberto={edicao.aberto}
        pasta={edicao.pasta}
        onOpenChange={(aberto) => setEdicao((e) => ({ ...e, aberto }))}
      />

      <ConfirmarExclusao
        aberto={exclusao.aberto}
        onOpenChange={(aberto) => setExclusao((e) => ({ ...e, aberto }))}
        titulo="Excluir pasta?"
        descricao={
          <>
            <span className="font-medium text-foreground">{exclusao.pasta?.nome}</span>{' '}
            {usosExcluindo > 0
              ? `tem ${usosExcluindo} ${usosExcluindo === 1 ? 'lançamento, que vai' : 'lançamentos, que vão'} para "Sem pasta". Nada sai da projeção.`
              : 'está vazia.'}
          </>
        }
        onConfirmar={() => exclusao.pasta && dispatch({ tipo: 'pasta/excluir', id: exclusao.pasta.id })}
      />
    </div>
  )
}
