import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { TipoMovimento } from '@/features/lancamentos/lancamento'
import { totalPorCategoria } from '@/features/projecao/projecao'
import { useProjecao } from '@/features/projecao/useProjecao'
import { CabecalhoOrganizacao } from '@/features/organizacao/components/CabecalhoOrganizacao'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { BOTAO } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { useFinancas } from '@/store/financas-context'
import type { Categoria } from './categoria'
import { CardCategorias } from './components/CardCategorias'
import { DialogCategoria } from './components/DialogCategoria'

/** O item continua guardado ao fechar, para o conteúdo não mudar durante a animação de saída. */
interface Selecao {
  aberto: boolean
  categoria?: Categoria
  tipoInicial?: TipoMovimento
}

/** Aba Categorias da tela Organização. */
export function SecaoCategorias() {
  const { estado, dispatch } = useFinancas()
  const { ano, dias } = useProjecao()
  const [edicao, setEdicao] = useState<Selecao>({ aberto: false })
  const [exclusao, setExclusao] = useState<Selecao>({ aberto: false })

  const totais = useMemo(() => totalPorCategoria(dias), [dias])
  const usos = useMemo(() => {
    const contagem = new Map<string, number>()
    for (const l of estado.lancamentos) contagem.set(l.categoriaId, (contagem.get(l.categoriaId) ?? 0) + 1)
    return contagem
  }, [estado.lancamentos])

  const doTipo = (tipo: TipoMovimento) => estado.categorias.filter((c) => c.tipo === tipo)
  const usosExcluindo = exclusao.categoria ? (usos.get(exclusao.categoria.id) ?? 0) : 0

  const cardProps = (tipo: TipoMovimento) => ({
    tipo,
    categorias: doTipo(tipo),
    usos,
    totais,
    onNova: () => setEdicao({ aberto: true, tipoInicial: tipo }),
    onEditar: (categoria: Categoria) => setEdicao({ aberto: true, categoria }),
    onExcluir: (categoria: Categoria) => setExclusao({ aberto: true, categoria }),
  })

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoOrganizacao
        descricao={`Categorias agrupam os lançamentos na planilha e nos gráficos · totais projetados para ${ano}`}
        acao={
          <Button className={BOTAO} onClick={() => setEdicao({ aberto: true })}>
            <Plus />
            Nova categoria
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <CardCategorias {...cardProps('saida')} />
        <CardCategorias {...cardProps('entrada')} />
      </div>

      <DialogCategoria
        aberto={edicao.aberto}
        categoria={edicao.categoria}
        tipoInicial={edicao.tipoInicial}
        onOpenChange={(aberto) => setEdicao((e) => ({ ...e, aberto }))}
      />

      <ConfirmarExclusao
        aberto={exclusao.aberto}
        onOpenChange={(aberto) => setExclusao((e) => ({ ...e, aberto }))}
        titulo="Excluir categoria?"
        descricao={
          <>
            <span className="font-medium text-foreground">{exclusao.categoria?.nome}</span>{' '}
            {usosExcluindo > 0
              ? `é usada por ${usosExcluindo} ${usosExcluindo === 1 ? 'lançamento, que vai' : 'lançamentos, que vão'} aparecer como "Sem categoria". Eles continuam na projeção.`
              : 'não é usada por nenhum lançamento.'}
          </>
        }
        onConfirmar={() => exclusao.categoria && dispatch({ tipo: 'categoria/excluir', id: exclusao.categoria.id })}
      />
    </div>
  )
}
