import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { BOTAO, CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { useFinancas } from '@/store/financas-context'
import { DialogLancamento } from './components/DialogLancamento'
import { FiltrosLancamentos } from './components/FiltrosLancamentos'
import { TabelaLancamentos } from './components/TabelaLancamentos'
import { filtrarLancamentos, temFiltro, type FiltrosLancamento } from './filtros'
import type { Lancamento } from './lancamento'

/** O item continua guardado ao fechar, para o conteúdo não mudar durante a animação de saída. */
interface Selecao {
  aberto: boolean
  lancamento?: Lancamento
}

function contar(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`
}

export function LancamentosPage() {
  const { estado, dispatch } = useFinancas()
  const filtros = useSearch({ from: '/lancamentos' })
  const navigate = useNavigate({ from: '/lancamentos' })
  const [edicao, setEdicao] = useState<Selecao>({ aberto: false })
  const [exclusao, setExclusao] = useState<Selecao>({ aberto: false })

  const categorias = useMemo(() => new Map(estado.categorias.map((c) => [c.id, c])), [estado.categorias])
  const visiveis = filtrarLancamentos(estado.lancamentos, filtros)
  const total = estado.lancamentos.length
  const filtrando = temFiltro(filtros)

  const alterarFiltros = (novos: FiltrosLancamento) => navigate({ search: novos, replace: true })
  const novo = () => setEdicao({ aberto: true })

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina
        titulo="Lançamentos"
        descricao={
          filtrando
            ? `Mostrando ${visiveis.length} de ${contar(total, 'lançamento', 'lançamentos')}`
            : `${contar(total, 'lançamento cadastrado', 'lançamentos cadastrados')} · entradas e saídas que alimentam a projeção`
        }
        acoes={
          <Button className={BOTAO} onClick={novo}>
            <Plus />
            Novo lançamento
          </Button>
        }
      />

      <FiltrosLancamentos filtros={filtros} categorias={estado.categorias} onChange={alterarFiltros} />

      <Card className={cn(CARD, 'overflow-hidden')}>
        {visiveis.length > 0 ? (
          <TabelaLancamentos
            lancamentos={visiveis}
            categorias={categorias}
            onEditar={(lancamento) => setEdicao({ aberto: true, lancamento })}
            onExcluir={(lancamento) => setExclusao({ aberto: true, lancamento })}
          />
        ) : filtrando ? (
          <EstadoVazio
            titulo="Nenhum lançamento com esses filtros"
            descricao="Tente outra combinação ou limpe os filtros."
            acao={
              <Button variant="outline" className={cn(BOTAO, 'bg-card')} onClick={() => alterarFiltros({})}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EstadoVazio
            titulo="Nenhum lançamento ainda"
            descricao="Cadastre salário, contas fixas e gastos do dia a dia para projetar o ano."
            acao={
              <Button className={BOTAO} onClick={novo}>
                <Plus />
                Novo lançamento
              </Button>
            }
          />
        )}
      </Card>

      <DialogLancamento
        aberto={edicao.aberto}
        lancamento={edicao.lancamento}
        onOpenChange={(aberto) => setEdicao((e) => ({ ...e, aberto }))}
      />

      <ConfirmarExclusao
        aberto={exclusao.aberto}
        onOpenChange={(aberto) => setExclusao((e) => ({ ...e, aberto }))}
        titulo="Excluir lançamento?"
        descricao={
          <>
            <span className="font-medium text-foreground">{exclusao.lancamento?.descricao}</span> sai da planilha e da
            projeção. Não dá para desfazer.
          </>
        }
        onConfirmar={() =>
          exclusao.lancamento && dispatch({ tipo: 'lancamento/excluir', id: exclusao.lancamento.id })
        }
      />
    </div>
  )
}
