import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { caixasAtivos } from '@/features/caixas/caixa'
import { agruparPorPasta } from '@/features/pastas/grupos'
import { ocorrenciasPorLancamento, totalPorLancamento } from '@/features/projecao/projecao'
import { useVisao } from '@/features/caixas/useVisao'
import { useDiasDosCaixas, useDiasDosCaixasNoPeriodo } from '@/features/projecao/projecoes-por-caixa'
import { useAno } from '@/features/projecao/useAno'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { anoDe, formatarData, paraDataISO, somarDias } from '@/shared/lib/datas'
import { BOTAO, CARD } from '@/shared/lib/estilos'
import { rotuloDoPeriodo, tipoDoPeriodo, type Periodo } from '@/shared/lib/periodo'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { useFinancas } from '@/store/financas-context'
import { BarraSelecao, type AvisoLote } from './components/BarraSelecao'
import { DialogLancamento } from './components/DialogLancamento'
import { FiltrosLancamentos } from './components/FiltrosLancamentos'
import { TabelaLancamentos, type SelecaoTabela } from './components/TabelaLancamentos'
import { filtrarLancamentos, periodoDoFiltro, temFiltro, type FiltrosLancamento } from './filtros'
import type { Lancamento } from './lancamento'
import { aplicarEmLote, type AlteracaoLote } from './lote'
import { encerrar, recorrenteEmAndamento } from './vigencia'

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

export function LancamentosPage() {
  const { estado, dispatch } = useFinancas()
  const { fechadas, ...filtros } = useSearch({ from: '/lancamentos' })
  const navigate = useNavigate({ from: '/lancamentos' })
  // A lista é do caixa escolhido ou, no Total, de todos os caixas (inclusive os que não entram no total).
  const { caixa, lancamentosDaLista } = useVisao()
  const { ano, anoAtual } = useAno()
  const periodo = periodoDoFiltro(filtros)
  const dias = useDiasDosCaixas(ano, caixa?.id)
  const diasNoPeriodo = useDiasDosCaixasNoPeriodo(periodo, caixa?.id)
  const [edicao, setEdicao] = useState<Selecao>({ aberto: false })
  const [exclusao, setExclusao] = useState<Selecao>({ aberto: false })
  // Quantos vão ser excluídos fica guardado, para o título não mudar durante a animação de saída.
  const [exclusaoLote, setExclusaoLote] = useState({ aberto: false, quantos: 0 })
  const [hoje] = useState(() => paraDataISO(new Date()))

  const categorias = useMemo(() => new Map(estado.categorias.map((c) => [c.id, c])), [estado.categorias])
  const tags = useMemo(() => new Map(estado.tags.map((t) => [t.id, t])), [estado.tags])
  // Com mais de um caixa (inclusive arquivados, que têm histórico), cada lançamento mostra a cor do seu.
  const caixas = useMemo(
    () => (estado.caixas.length > 1 ? new Map(estado.caixas.map((c) => [c.id, c])) : undefined),
    [estado.caixas],
  )
  // Com filtro de data, os totais (e a própria lista) são do período; sem ele, do ano exibido.
  const noPeriodo = useMemo(() => diasNoPeriodo && ocorrenciasPorLancamento(diasNoPeriodo), [diasNoPeriodo])
  const totais = useMemo(
    () =>
      noPeriodo ? new Map([...noPeriodo].map(([id, { totalCentavos }]) => [id, totalCentavos])) : totalPorLancamento(dias),
    [noPeriodo, dias],
  )
  const visiveis = filtrarLancamentos(lancamentosDaLista, filtros, new Set(tags.keys()), noPeriodo ?? undefined)
  const grupos = agruparPorPasta(visiveis, estado.pastas, totais)
  const total = lancamentosDaLista.length
  const filtrando = temFiltro(filtros)
  const quando = periodo ? quandoDoPeriodo(periodo) : `em ${ano}`

  // Seleção em lote: só em telas largas, onde a tabela mostra categoria, tag e pasta.
  const selecionavel = useMediaQuery('(min-width: 64rem)')
  const [marcados, setMarcados] = useState<Set<string>>(() => new Set())
  const [aviso, setAviso] = useState<AvisoLote | null>(null)
  const [avisoPausado, setAvisoPausado] = useState(false)
  const ultimoClicado = useRef<string | null>(null)
  const selecionados = selecionavel ? visiveis.filter((l) => marcados.has(l.id)) : []
  // Trocar filtro ou caixa desmarca tudo, para nenhuma ação valer para o que saiu da tela.
  const chaveDaLista = JSON.stringify([filtros, caixa?.id])
  const [chaveAnterior, setChaveAnterior] = useState(chaveDaLista)
  if (chaveDaLista !== chaveAnterior) {
    setChaveAnterior(chaveDaLista)
    setMarcados(new Set())
  }

  // O aviso com "Desfazer" some sozinho depois de alguns segundos.
  useEffect(() => {
    if (!aviso || avisoPausado) return
    const id = window.setTimeout(() => setAviso(null), DURACAO_AVISO)
    return () => window.clearTimeout(id)
  }, [aviso, avisoPausado])

  // Esc desmarca tudo (fora de campos e com nenhuma janela aberta).
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

  // Ordem das linhas na tela (grupos fechados ficam de fora), para o Shift+clique marcar o intervalo.
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

  // Os grupos fechados continuam fechados ao trocar ou limpar os filtros.
  // O ano das outras telas acompanha o início do período, como no Dashboard.
  const alterarFiltros = (novos: FiltrosLancamento) =>
    navigate({
      search: (s) => {
        const mudouPeriodo = novos.de && novos.de !== s.de
        return {
          ...novos,
          fechadas,
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
  const mover = (l: Lancamento, pastaId: string | undefined) => {
    const { pastaId: _, ...semPasta } = l
    dispatch({ tipo: 'lancamento/salvar', lancamento: pastaId ? { ...semPasta, pastaId } : semPasta })
  }
  const novo = () => setEdicao({ aberto: true })
  // Recorrente que já aconteceu: encerrar mantém os meses que passaram, excluir apaga tudo.
  const encerravel = exclusao.lancamento && recorrenteEmAndamento(exclusao.lancamento, hoje) ? exclusao.lancamento : undefined
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
              <strong className="font-semibold">Data:</strong> mostra só o que acontece no período escolhido, com quantas
              vezes e quanto soma cada lançamento que se repete.
            </p>
            {selecionavel && (
              <p>
                <strong className="font-semibold">Vários de uma vez:</strong> marque os quadradinhos (Shift+clique marca
                um intervalo) e escolha categoria, tag, pasta ou caixa na barra de baixo. Dá para desfazer logo depois.
              </p>
            )}
            <p className="text-muted-foreground">
              No teclado, <kbd className="font-semibold">N</kbd> abre um lançamento novo,{' '}
              <kbd className="font-semibold">/</kbd> vai para a busca e <kbd className="font-semibold">Esc</kbd> desmarca
              tudo.
            </p>
          </Ajuda>
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
            caixas={caixas}
            pastas={estado.pastas}
            fechadas={new Set(fechadas)}
            quando={quando}
            noPeriodo={noPeriodo ?? undefined}
            selecao={selecao}
            onAlternarGrupo={alternarGrupo}
            onMover={mover}
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
