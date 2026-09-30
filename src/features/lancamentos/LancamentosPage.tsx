import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { agruparPorPasta } from '@/features/pastas/grupos'
import { totalPorLancamento } from '@/features/projecao/projecao'
import { useProjecao } from '@/features/projecao/useProjecao'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { formatarData, paraDataISO, somarDias } from '@/shared/lib/datas'
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
import { encerrar, recorrenteEmAndamento } from './vigencia'

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
  const { fechadas, ...filtros } = useSearch({ from: '/lancamentos' })
  const navigate = useNavigate({ from: '/lancamentos' })
  const { ano, dias } = useProjecao()
  const [edicao, setEdicao] = useState<Selecao>({ aberto: false })
  const [exclusao, setExclusao] = useState<Selecao>({ aberto: false })
  const [hoje] = useState(() => paraDataISO(new Date()))

  const categorias = useMemo(() => new Map(estado.categorias.map((c) => [c.id, c])), [estado.categorias])
  const tags = useMemo(() => new Map(estado.tags.map((t) => [t.id, t])), [estado.tags])
  const totalNoAno = useMemo(() => totalPorLancamento(dias), [dias])
  const visiveis = filtrarLancamentos(estado.lancamentos, filtros, new Set(tags.keys()))
  const grupos = agruparPorPasta(visiveis, estado.pastas, totalNoAno)
  const total = estado.lancamentos.length
  const filtrando = temFiltro(filtros)

  // Os grupos fechados continuam fechados ao trocar ou limpar os filtros.
  const alterarFiltros = (novos: FiltrosLancamento) => navigate({ search: { ...novos, fechadas }, replace: true })
  const alternarGrupo = (chave: string) =>
    navigate({
      search: (s) => {
        const atuais = s.fechadas ?? []
        const novas = atuais.includes(chave) ? atuais.filter((c) => c !== chave) : [...atuais, chave]
        return { ...s, fechadas: novas.length > 0 ? novas : undefined }
      },
      replace: true,
      resetScroll: false,
    })
  const mover = (l: Lancamento, pastaId: string | undefined) => {
    const { pastaId: _, ...semPasta } = l
    dispatch({ tipo: 'lancamento/salvar', lancamento: pastaId ? { ...semPasta, pastaId } : semPasta })
  }
  const novo = () => setEdicao({ aberto: true })
  // Recorrente que já aconteceu: encerrar mantém os meses que passaram, excluir apaga tudo.
  const encerravel = exclusao.lancamento && recorrenteEmAndamento(exclusao.lancamento, hoje) ? exclusao.lancamento : undefined

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina
        forma={FORMA_PAGINA.lancamentos}
        titulo="Lançamentos"
        descricao={
          filtrando
            ? `Mostrando ${visiveis.length} de ${contar(total, 'lançamento', 'lançamentos')}`
            : `${contar(total, 'lançamento cadastrado', 'lançamentos cadastrados')} · entradas e saídas que alimentam a projeção`
        }
        acoes={
          <Button className={BOTAO} onClick={novo} title="Novo lançamento (atalho N)">
            <Plus />
            Novo lançamento
          </Button>
        }
      />

      <FiltrosLancamentos
        filtros={filtros}
        categorias={estado.categorias}
        tags={estado.tags}
        onChange={alterarFiltros}
      />

      <Card className={cn(CARD, 'overflow-hidden')}>
        {visiveis.length > 0 ? (
          <TabelaLancamentos
            grupos={grupos}
            categorias={categorias}
            tags={tags}
            pastas={estado.pastas}
            fechadas={new Set(fechadas)}
            ano={ano}
            onAlternarGrupo={alternarGrupo}
            onMover={mover}
            onEditar={(lancamento) => setEdicao({ aberto: true, lancamento })}
            onExcluir={(lancamento) => setExclusao({ aberto: true, lancamento })}
          />
        ) : filtrando ? (
          <EstadoVazio
            titulo={filtros.q?.trim() ? `Nada encontrado para "${filtros.q.trim()}"` : 'Nenhum lançamento com esses filtros'}
            descricao="Tente outra busca ou combinação, ou limpe os filtros."
            acao={
              <Button variant="outline" className={BOTAO} onClick={() => alterarFiltros({})}>
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
          encerravel ? (
            <>
              <span className="font-medium text-foreground">{encerravel.descricao}</span> já aconteceu antes de hoje.
              Encerrar mantém o histórico até {formatarData(somarDias(hoje, -1))} e para a partir de hoje. Excluir de
              vez apaga também os meses que passaram, sem desfazer.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{exclusao.lancamento?.descricao}</span> sai da planilha e
              da projeção. Não dá para desfazer.
            </>
          )
        }
        alternativa={
          encerravel && {
            rotulo: 'Encerrar',
            onClick: () => dispatch({ tipo: 'lancamento/salvar', lancamento: encerrar(encerravel, hoje) }),
          }
        }
        onConfirmar={() =>
          exclusao.lancamento && dispatch({ tipo: 'lancamento/excluir', id: exclusao.lancamento.id })
        }
      />
    </div>
  )
}
