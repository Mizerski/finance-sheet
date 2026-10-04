import { useMemo, useState } from 'react'
import { Plus } from '@/shared/ui/icones'
import { CabecalhoOrganizacao } from '@/features/organizacao/components/CabecalhoOrganizacao'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { BOTAO } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { useFinancas } from '@/store/financas-context'
import { ordenarCaixas, usosDoCaixa, type Caixa } from './caixa'
import { CardCaixas } from './components/CardCaixas'
import { DialogCaixa } from './components/DialogCaixa'

/** O item continua guardado ao fechar, para o conteúdo não mudar durante a animação de saída. */
interface Selecao {
  aberto: boolean
  caixa?: Caixa
}

/** Aba Caixas da tela Organização: contas e benefícios, cada um com o próprio saldo. */
export function SecaoCaixas() {
  const { estado, dispatch } = useFinancas()
  const [edicao, setEdicao] = useState<Selecao>({ aberto: false })
  const [exclusao, setExclusao] = useState<Selecao>({ aberto: false })

  const caixas = useMemo(() => ordenarCaixas(estado.caixas), [estado.caixas])
  const usos = useMemo(
    () => new Map(caixas.map((c) => [c.id, usosDoCaixa(c.id, estado.lancamentos, estado.metas)])),
    [caixas, estado.lancamentos, estado.metas],
  )
  const nova = () => setEdicao({ aberto: true })

  // Troca de lugar com o vizinho e renumera os ativos em sequência (a ordem antiga pode ter repetidos).
  const mover = (caixa: Caixa, passo: -1 | 1) => {
    const ativos = caixas.filter((c) => !c.arquivado)
    const i = ativos.indexOf(caixa)
    const j = i + passo
    if (i < 0 || j < 0 || j >= ativos.length) return
    const lista = [...ativos]
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    lista.forEach((c, ordem) => {
      if (c.ordem !== ordem) dispatch({ tipo: 'caixa/salvar', caixa: { ...c, ordem } })
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoOrganizacao
        descricao="Contas (dinheiro livre) e benefícios (vale-refeição, vale-alimentação), cada um com o próprio saldo"
        acao={
          <Button className={BOTAO} onClick={nova}>
            <Plus />
            Novo caixa
          </Button>
        }
      />

      <CardCaixas
        caixas={caixas}
        usos={usos}
        onEditar={(caixa) => setEdicao({ aberto: true, caixa })}
        onMover={mover}
        onArquivar={(caixa, arquivado) =>
          dispatch({
            tipo: 'caixa/salvar',
            caixa: arquivado ? { ...caixa, arquivado: true } : { ...caixa, arquivado: undefined },
          })
        }
        onExcluir={(caixa) => setExclusao({ aberto: true, caixa })}
      />

      <DialogCaixa
        aberto={edicao.aberto}
        caixa={edicao.caixa}
        onOpenChange={(aberto) => setEdicao((e) => ({ ...e, aberto }))}
      />

      <ConfirmarExclusao
        aberto={exclusao.aberto}
        onOpenChange={(aberto) => setExclusao((e) => ({ ...e, aberto }))}
        titulo="Excluir caixa?"
        descricao={
          <>
            <span className="font-medium text-foreground">{exclusao.caixa?.nome}</span> não tem lançamentos nem metas e
            sai do app. Não dá para desfazer.
          </>
        }
        onConfirmar={() => exclusao.caixa && dispatch({ tipo: 'caixa/excluir', id: exclusao.caixa.id })}
      />
    </div>
  )
}
