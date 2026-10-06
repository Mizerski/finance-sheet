import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Plus } from '@/shared/ui/icones'
import { caixasAtivos } from '@/features/caixas/model/caixa'
import { agruparPorPasta } from '@/features/pastas/utils/grupos'
import { ocorrenciasPorLancamento, totalPorLancamento } from '@/features/projecao/utils/projecao'
import { useVisao } from '@/features/caixas/hooks/useVisao'
import { useDiasDosCaixas, useDiasDosCaixasNoPeriodo } from '@/features/projecao/hooks/useProjecoesDosCaixas'
import { useAno } from '@/features/projecao/hooks/useAno'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { anoDe } from '@/shared/lib/datas'
import { BOTAO, CARD } from '@/shared/lib/estilos'
import { rotuloDoPeriodo, tipoDoPeriodo, type Periodo } from '@/shared/lib/periodo'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { useFinancas } from '@/store/context/financas-context'
import { BarraSelecao, type AvisoLote } from './components/BarraSelecao'
import { DialogExtratoLancamento } from './components/DialogExtratoLancamento'
import { DialogLancamento } from './components/DialogLancamento'
import { ExcluirLancamento } from './components/ExcluirLancamento'
import { FiltrosLancamentos } from './components/FiltrosLancamentos'
import { TabelaLancamentos, type SelecaoTabela } from './components/TabelaLancamentos'
import { filtrarLancamentos, periodoDoFiltro, temFiltro, type FiltrosLancamento } from './utils/filtros'
import { ehTransferencia, type Lancamento } from './model/lancamento'
import { aplicarEmLote, type AlteracaoLote } from './utils/lote'
import { lerOrdem, ordenarLancamentos, proximaOrdem, type CampoOrdem } from './utils/ordenacao'

/** O item continua guardado ao fechar, para o conteúdo não mudar durante a animação de saída. */
interface Selecao {
  aberto: boolean
  lancamento?: Lancamento
}

/** Quanto tempo o aviso de uma ação em lote (com o "Desfazer") fica na tela; com o mouse ou o foco na barra, espera. */
const DURACAO_AVISO = 10_000

function contar(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`
}

/** "em 2026", "em março de 2026", "em 12/03/2026", "em 08/03 – 14/03/2026". */
function quandoDoPeriodo(periodo: Periodo): string {
  const rotulo = rotuloDoPeriodo(periodo)
  return `em ${tipoDoPeriodo(periodo) === 'mes' ? rotulo.toLowerCase() : rotulo}`
}

/**
 * A lista é do caixa escolhido ou, no Total, de todos. Seleção em lote só a partir de 64rem; trocar filtro ou caixa e
 * o Esc desmarcam tudo.
 */
export function LancamentosPage() {
  const { estado, dispatch } = useFinancas()
  const { fechadas, ordem: textoOrdem, ...filtros } = useSearch({ from: '/lancamentos' })
  const navigate = useNavigate({ from: '/lancamentos' })
  const { caixa, lancamentosDaLista } = useVisao()
  const { ano, anoAtual } = useAno()
  const periodo = periodoDoFiltro(filtros)
  const dias = useDiasDosCaixas(ano, caixa?.id)
  const diasNoPeriodo = useDiasDosCaixasNoPeriodo(periodo, caixa?.id)
  const [edicao, setEdicao] = useState<Selecao>({ aberto: false })
  const [exclusao, setExclusao] = useState<Selecao>({ aberto: false })
  const [extrato, setExtrato] = useState<Selecao>({ aberto: false })
  const [exclusaoLote, setExclusaoLote] = useState({ aberto: false, quantos: 0 })

  const categorias = useMemo(() => new Map(estado.categorias.map((c) => [c.id, c])), [estado.categorias])
  const tags = useMemo(() => new Map(estado.tags.map((t) => [t.id, t])), [estado.tags])
  const caixas = useMemo(
    () => (estado.caixas.length > 1 ? new Map(estado.caixas.map((c) => [c.id, c])) : undefined),
    [estado.caixas],
  )
  const noPeriodo = useMemo(() => diasNoPeriodo && ocorrenciasPorLancamento(diasNoPeriodo), [diasNoPeriodo])
  const totais = useMemo(
    () =>
      noPeriodo ? new Map([...noPeriodo].map(([id, { totalCentavos }]) => [id, totalCentavos])) : totalPorLancamento(dias),
    [noPeriodo, dias],
  )
  const ordem = lerOrdem(textoOrdem)
  const visiveis = ordenarLancamentos(
    filtrarLancamentos(lancamentosDaLista, filtros, new Set(tags.keys()), noPeriodo ?? undefined),
    ordem,
    categorias,
    tags,
  )
  const grupos = agruparPorPasta(visiveis, estado.pastas, totais)
  const total = lancamentosDaLista.length
  const filtrando = temFiltro(filtros)
  const quando = periodo ? quandoDoPeriodo(periodo) : `em ${ano}`

  const selecionavel = useMediaQuery('(min-width: 64rem)')
  const [marcados, setMarcados] = useState<Set<string>>(() => new Set())
  const [aviso, setAviso] = useState<AvisoLote | null>(null)
  const [avisoPausado, setAvisoPausado] = useState(false)
  const ultimoClicado = useRef<string | null>(null)
  const selecionados = selecionavel ? visiveis.filter((l) => marcados.has(l.id)) : []
  const chaveDaLista = JSON.stringify([filtros, caixa?.id])
  const [chaveAnterior, setChaveAnterior] = useState(chaveDaLista)
  if (chaveDaLista !== chaveAnterior) {
    setChaveAnterior(chaveDaLista)
    setMarcados(new Set())
  }

  useEffect(() => {
    if (!aviso || avisoPausado) return
    const id = window.setTimeout(() => setAviso(null), DURACAO_AVISO)
    return () => window.clearTimeout(id)
  }, [aviso, avisoPausado])

  const temMarcados = selecionados.length > 0
  useEffect(() => {
    if (!temMarcados) return
    function aoTeclar(e: KeyboardEvent) {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const alvo = e.target instanceof HTMLElement ? e.target : null
      if (alvo?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('[role=dialog]')) return
      setMarcados(new Set())
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [temMarcados])

  const ordemNaTela = (estado.pastas.length > 0 ? grupos.filter((g) => !fechadas?.includes(g.chave)) : grupos).flatMap((g) =>
    g.lancamentos.map((l) => l.id),
  )
  const selecao: SelecaoTabela | undefined = selecionavel
    ? {
        ids: marcados,
        onAlternar: (id, intervalo) => {
          const marcar = !marcados.has(id)
          const de = ultimoClicado.current ? ordemNaTela.indexOf(ultimoClicado.current) : -1
          const ate = ordemNaTela.indexOf(id)
          const ids = intervalo && de >= 0 && ate >= 0 ? ordemNaTela.slice(Math.min(de, ate), Math.max(de, ate) + 1) : [id]
          ultimoClicado.current = id
          definir(ids, marcar)
        },
        onDefinir: (ids, marcar) => definir(ids, marcar),
      }
    : undefined

  function definir(ids: string[], marcar: boolean) {
    setMarcados((atuais) => {
      const novos = new Set(atuais)
      for (const id of ids) {
        if (marcar) novos.add(id)
        else novos.delete(id)
      }
      return novos
    })
  }

  function aplicar(alteracao: AlteracaoLote) {
    const resultado = aplicarEmLote(selecionados, alteracao, {
      categorias: estado.categorias,
      tags: estado.tags,
      pastas: estado.pastas,
      caixas: estado.caixas,
    })
    const { alterados, anteriores } = resultado
    if (alterados.length > 0) dispatch({ tipo: 'lancamento/salvarVarios', lancamentos: alterados })
    setAviso({
      id: Date.now(),
      mensagem: resultado.mensagem,
      onDesfazer:
        alterados.length > 0
          ? () => {
              dispatch({ tipo: 'lancamento/salvarVarios', lancamentos: anteriores })
              setAviso({ id: Date.now(), mensagem: 'Pronto, voltou como estava.' })
            }
          : undefined,
    })
  }

  function excluirMarcados() {
    const removidos = selecionados
    dispatch({ tipo: 'lancamento/excluirVarios', ids: removidos.map((l) => l.id) })
    setMarcados(new Set())
    setAviso({
      id: Date.now(),
      mensagem: `${contar(removidos.length, 'lançamento excluído', 'lançamentos excluídos')}.`,
      onDesfazer: () => {
        dispatch({ tipo: 'lancamento/salvarVarios', lancamentos: removidos })
        setAviso({ id: Date.now(), mensagem: `${contar(removidos.length, 'lançamento voltou', 'lançamentos voltaram')}.` })
      },
    })
  }

  const alterarFiltros = (novos: FiltrosLancamento) =>
    navigate({
      search: (s) => {
        const mudouPeriodo = novos.de && novos.de !== s.de
        return {
          ...novos,
          fechadas,
          ordem: s.ordem,
          ...(mudouPeriodo && { ano: anoDe(novos.de!) === anoAtual ? undefined : anoDe(novos.de!) }),
        }
      },
      replace: true,
    })
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
  const ordenar = (campo: CampoOrdem) =>
    navigate({ search: (s) => ({ ...s, ordem: proximaOrdem(ordem, campo) }), replace: true, resetScroll: false })
  const mover = (l: Lancamento, pastaId: string | undefined) => {
    const { pastaId: _, ...semPasta } = l
    dispatch({ tipo: 'lancamento/salvar', lancamento: pastaId ? { ...semPasta, pastaId } : semPasta })
  }
  const novo = () => setEdicao({ aberto: true })
  const barraVisivel = selecionados.length > 0 || !!aviso

  return (
    <div className={cn('flex flex-col gap-4', barraVisivel && 'pb-32')}>
      <CabecalhoPagina
        forma={FORMA_PAGINA.lancamentos}
        titulo="Lançamentos"
        descricao={
          filtrando
            ? `Mostrando ${visiveis.length} de ${contar(total, 'lançamento', 'lançamentos')}${periodo ? ` · ${quando}` : ''}`
            : `${contar(total, 'lançamento cadastrado', 'lançamentos cadastrados')} · entradas e saídas que alimentam a projeção`
        }
        ajuda={
          <Ajuda titulo="Dicas da lista">
            <p>
              <strong className="font-semibold">Ver um lançamento:</strong> clique nele para abrir o extrato, com tudo o
              que foi lançado, as parcelas e as próximas vezes. Dali dá para editar.
            </p>
            <p>
              <strong className="font-semibold">Data:</strong> mostra só o que acontece no período escolhido, com quantas
              vezes e quanto soma cada lançamento que se repete.
            </p>
            <p>
              <strong className="font-semibold">Ordenar:</strong> clique no nome de uma coluna (descrição, valor…).
              Clicar de novo inverte a ordem; na terceira vez, volta ao normal.
            </p>
            {selecionavel && (
              <p>
                <strong className="font-semibold">Vários de uma vez:</strong> marque os quadradinhos (Shift+clique marca
                um intervalo) e escolha categoria, tag, pasta ou caixa na barra de baixo. Dá para desfazer logo depois.
              </p>
            )}
            <p className="text-muted-foreground">
              Para criar, use <strong className="font-semibold">+ Novo lançamento</strong> no topo da tela. No teclado,{' '}
              <kbd className="font-semibold">N</kbd> abre um lançamento novo,{' '}
              <kbd className="font-semibold">/</kbd> vai para a busca e <kbd className="font-semibold">Esc</kbd> desmarca
              tudo.
            </p>
          </Ajuda>
        }
      />

      <FiltrosLancamentos
        filtros={filtros}
        categorias={estado.categorias}
        tags={estado.tags}
        comTransferencia={lancamentosDaLista.some(ehTransferencia)}
        onChange={alterarFiltros}
      />

      <Card className={cn(CARD, 'overflow-hidden')}>
        {visiveis.length > 0 ? (
          <TabelaLancamentos
            grupos={grupos}
            categorias={categorias}
            tags={tags}
            caixas={caixas}
            pastas={estado.pastas}
            fechadas={new Set(fechadas)}
            quando={quando}
            noPeriodo={noPeriodo ?? undefined}
            selecao={selecao}
            ordem={ordem}
            onOrdenar={ordenar}
            onAlternarGrupo={alternarGrupo}
            onMover={mover}
            onVer={(lancamento) => setExtrato({ aberto: true, lancamento })}
            onEditar={(lancamento) => setEdicao({ aberto: true, lancamento })}
            onExcluir={(lancamento) => setExclusao({ aberto: true, lancamento })}
          />
        ) : filtrando ? (
          <EstadoVazio
            titulo={
              filtros.q?.trim()
                ? `Nada encontrado para "${filtros.q.trim()}"`
                : periodo
                  ? `Nenhum lançamento ${quando}`
                  : 'Nenhum lançamento com esses filtros'
            }
            descricao="Tente outra busca, outra data ou combinação, ou limpe os filtros."
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

      {selecionavel && (
        <BarraSelecao
          selecionados={selecionados}
          categorias={estado.categorias}
          tags={estado.tags}
          pastas={estado.pastas}
          caixas={caixasAtivos(estado.caixas)}
          aviso={aviso}
          onAplicar={aplicar}
          onExcluir={() => setExclusaoLote({ aberto: true, quantos: selecionados.length })}
          onLimpar={() => setMarcados(new Set())}
          onFecharAviso={() => setAviso(null)}
          onPausarAviso={setAvisoPausado}
        />
      )}

      <DialogExtratoLancamento
        aberto={extrato.aberto}
        lancamento={extrato.lancamento}
        onOpenChange={(aberto) => setExtrato((e) => ({ ...e, aberto }))}
        onEditar={(lancamento) => {
          setExtrato((e) => ({ ...e, aberto: false }))
          setEdicao({ aberto: true, lancamento })
        }}
        onExcluir={(lancamento) => {
          setExtrato((e) => ({ ...e, aberto: false }))
          setExclusao({ aberto: true, lancamento })
        }}
      />

      <DialogLancamento
        aberto={edicao.aberto}
        lancamento={edicao.lancamento}
        onOpenChange={(aberto) => setEdicao((e) => ({ ...e, aberto }))}
      />

      <ExcluirLancamento
        aberto={exclusao.aberto}
        lancamento={exclusao.lancamento}
        onOpenChange={(aberto) => setExclusao((e) => ({ ...e, aberto }))}
      />

      <ConfirmarExclusao
        aberto={exclusaoLote.aberto}
        onOpenChange={(aberto) => setExclusaoLote((e) => ({ ...e, aberto }))}
        titulo={`Excluir ${contar(exclusaoLote.quantos, 'lançamento', 'lançamentos')}?`}
        descricao="Eles saem da planilha e da projeção, inclusive nos meses que já passaram. Logo depois, a barra de baixo oferece desfazer."
        onConfirmar={excluirMarcados}
      />
    </div>
  )
}
