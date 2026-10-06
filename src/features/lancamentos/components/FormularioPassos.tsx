import { useState, type FormEvent } from 'react'
import { caixasAtivos } from '@/features/caixas/model/caixa'
import { useVisao } from '@/features/caixas/hooks/useVisao'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { CabecalhoPassos, RodapePassos } from '@/shared/components/Passos'
import { usePassos } from '@/shared/hooks/usePassos'
import { useConhecidos } from '../hooks/useConhecidos'
import type { Conhecido } from '../utils/conhecidos'
import { FieldError } from '@/shared/ui/field'
import { useFinancas } from '@/store/context/financas-context'
import type { Lancamento, Natureza, TipoLancamento } from '../model/lancamento'
import { useVigencia } from '../hooks/useVigencia'
import { CampoVigencia } from './CampoVigencia'
import {
  naturezaDaTransferencia,
  paraLancamento,
  comInicio,
  rascunhoDe,
  rascunhoVazio,
  trocarRecorrencia,
  trocarTipo,
  validarLancamento,
  type RascunhoLancamento,
} from '../utils/formulario'
import { errosDoPasso, passosDo, primeiroPassoComErro, type Passo } from '../utils/passos'
import { PassoCategoria } from './PassoCategoria'
import { PassoConferir } from './PassoConferir'
import { PassoContas } from './PassoContas'
import { PassoQuando } from './PassoQuando'
import { PassoTag } from './PassoTag'
import { PassoTipo } from './PassoTipo'
import { PassoValor } from './PassoValor'

interface FormularioPassosProps {
  /** Editando: abre na conferência, com "Mudar" em cada resposta. Ausente = novo lançamento. */
  lancamento?: Lancamento
  /** Data sugerida (ex.: o dia clicado na planilha). Sem ela, vale hoje. */
  dataInicial?: DataISO
  onConcluir: () => void
  /** Abre o formulário completo com o que já foi respondido. */
  onVerTudo: (rascunho: RascunhoLancamento) => void
}

const ID_PERGUNTA = 'passo-pergunta'

function pergunta(passo: Passo, r: RascunhoLancamento): string {
  switch (passo) {
    case 'tipo':
      return 'O dinheiro entrou ou saiu?'
    case 'valor':
      return r.tipo === 'saida' ? 'Quanto saiu, e com o quê?' : r.tipo === 'entrada' ? 'Quanto entrou, e de quê?' : 'Quanto mudou de conta?'
    case 'categoria':
      return r.tipo === 'saida' ? 'Que tipo de gasto foi?' : 'Que tipo de entrada foi?'
    case 'contas':
      return 'De qual conta para qual?'
    case 'tag':
      return 'Esse gasto era necessário?'
    case 'quando':
      return r.recorrencia === 'unica' ? 'Quando foi?' : 'Quando acontece?'
    case 'conferir':
      return 'Confira antes de salvar'
  }
}

/**
 * Lançamento novo no modo simples: uma pergunta por tela, com o progresso em cima e Voltar/Continuar embaixo.
 * Respostas de escolha única já avançam. Salva exatamente o que o formulário completo salvaria (mesmo rascunho,
 * mesma validação); "Ver todos os campos" troca para ele sem perder o que foi respondido.
 */
export function FormularioPassos({ lancamento, dataInicial, onConcluir, onVerTudo }: FormularioPassosProps) {
  const { estado, dispatch } = useFinancas()
  const { caixaPadrao } = useVisao()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const editando = !!lancamento
  const [rascunho, setRascunho] = useState(() =>
    lancamento ? rascunhoDe(lancamento, hoje) : rascunhoVazio(dataInicial ?? hoje, caixaPadrao?.id ?? ''),
  )
  /** Enquanto a pessoa não escolhe, recorrente vira fixo e único vira variável. */
  const [naturezaEscolhida, setNaturezaEscolhida] = useState(editando)

  const contas = caixasAtivos(estado.caixas).filter((c) => c.tipo === 'conta')
  const { conhecidos, aplicar } = useConhecidos()
  /** Até 4 lançamentos que se repetem (2 vezes ou mais), para lançar de novo. */
  const frequentes = editando ? [] : conhecidos.filter((c) => c.usos >= 2).slice(0, 4)
  const lista = passosDo(rascunho)
  const passos = usePassos(lista, 'conferir', { editando })
  const vigencia = useVigencia(lancamento, rascunho, hoje)
  const { passo, tentou, respondidos } = passos
  const idsValidos = new Set(estado.categorias.filter((c) => c.tipo === rascunho.tipo).map((c) => c.id))
  const erros = validarLancamento(rascunho, idsValidos)
  const errosVisiveis = tentou ? errosDoPasso(passo, erros) : {}

  function alterar<K extends keyof RascunhoLancamento>(campo: K, valor: RascunhoLancamento[K]) {
    setRascunho((r) => ({ ...r, [campo]: valor }))
  }

  function continuar(e: FormEvent) {
    e.preventDefault()
    if (passos.noFim) return salvar()
    if (passo === 'tipo' && !respondidos.has('tipo')) return passos.mostrarErros()
    if (Object.keys(errosDoPasso(passo, erros)).length > 0) return passos.mostrarErros()
    passos.seguir()
  }

  /** Escolha única: guarda e já avança. */
  function escolher(novo: RascunhoLancamento) {
    setRascunho(novo)
    passos.seguir(passosDo(novo))
  }

  /** O tipo muda as perguntas seguintes, então segue em frente mesmo vindo da conferência. */
  function escolherTipo(tipo: TipoLancamento) {
    const categoria = estado.categorias.find((c) => c.id === rascunho.categoriaId)
    const novo = trocarTipo(rascunho, tipo, categoria?.tipo, contas.map((c) => c.id))
    setRascunho(novo)
    passos.seguir(passosDo(novo), true)
  }

  /** Um lançamento que se repete: preenche tudo como da última vez e abre o valor; depois, direto para conferir. */
  function repetir(c: Conhecido) {
    setRascunho(aplicar(rascunho, c))
    passos.marcar('tipo', 'valor', 'categoria', 'contas', 'tag', 'quando')
    passos.mudar('valor')
  }

  function escolherRecorrencia(recorrencia: RascunhoLancamento['recorrencia']) {
    setRascunho((r) => {
      const novo = trocarRecorrencia(r, recorrencia, !editando, hoje)
      return naturezaEscolhida ? novo : { ...novo, natureza: naturezaDaTransferencia(recorrencia) }
    })
  }

  function escolherNatureza(natureza: Natureza) {
    setNaturezaEscolhida(true)
    alterar('natureza', natureza)
  }

  function salvar() {
    const comErro = primeiroPassoComErro(lista, erros)
    if (comErro) return passos.mostrarErros(comErro)
    const salvos = vigencia.salvos(crypto.randomUUID())
    if (!salvos) return passos.mostrarErros()
    for (const l of salvos) dispatch({ tipo: 'lancamento/salvar', lancamento: l })
    onConcluir()
  }

  return (
    <form noValidate onSubmit={continuar} className="flex flex-col gap-4">
      <CabecalhoPassos indice={passos.indice} total={passos.total} id={ID_PERGUNTA} titulo={passos.titulo}>
        {pergunta(passo, rascunho)}
      </CabecalhoPassos>

      {passo === 'tipo' && (
        <>
          <PassoTipo
            rotuloId={ID_PERGUNTA}
            valor={respondidos.has('tipo') ? rascunho.tipo : ''}
            comTransferencia={contas.length >= 2}
            onEscolher={escolherTipo}
            frequentes={frequentes}
            onRepetir={repetir}
          />
          {tentou && <FieldError>Escolha uma das opções.</FieldError>}
        </>
      )}
      {passo === 'valor' && (
        <PassoValor rascunho={rascunho} erros={errosVisiveis} alterar={alterar} onUsarConhecido={setRascunho} />
      )}
      {passo === 'categoria' && rascunho.tipo !== 'transferencia' && (
        <PassoCategoria
          rotuloId={ID_PERGUNTA}
          tipo={rascunho.tipo}
          valor={rascunho.categoriaId}
          erro={errosVisiveis.categoriaId}
          onEscolher={(categoriaId) => escolher({ ...rascunho, categoriaId })}
        />
      )}
      {passo === 'contas' && (
        <PassoContas
          rascunho={rascunho}
          erros={errosVisiveis}
          onOrigem={(caixaId) =>
            setRascunho((r) => ({ ...r, caixaId, caixaDestinoId: r.caixaDestinoId === caixaId ? r.caixaId : r.caixaDestinoId }))
          }
          onDestino={(id) => alterar('caixaDestinoId', id)}
        />
      )}
      {passo === 'tag' && (
        <PassoTag
          rotuloId={ID_PERGUNTA}
          valor={rascunho.tagId}
          respondida={respondidos.has('tag')}
          onEscolher={(tagId) => escolher({ ...rascunho, tagId })}
        />
      )}
      {passo === 'quando' && (
        <PassoQuando
          rotuloId={ID_PERGUNTA}
          rascunho={rascunho}
          erros={errosVisiveis}
          hoje={hoje}
          alterar={alterar}
          onRecorrencia={escolherRecorrencia}
          onNatureza={escolherNatureza}
          onInicio={(inicio) => setRascunho((r) => comInicio(r, inicio))}
        />
      )}
      {passo === 'conferir' && (
        <>
          <PassoConferir
            lancamento={paraLancamento(rascunho, lancamento?.id ?? 'simulado')}
            simulados={vigencia.salvos('simulado')}
            substitui={lancamento?.id}
            onMudar={passos.mudar}
          />
          <CampoVigencia id="passo-vigencia" v={vigencia} mostrarErro={passos.tentou} />
        </>
      )}

      <RodapePassos
        primeiro={passos.indice === 0 || (editando && passos.noFim)}
        onVoltar={passos.voltar}
        rotuloAvancar={passos.noFim ? (editando ? 'Salvar alterações' : 'Salvar lançamento') : passo === 'tag' && !rascunho.tagId ? 'Pular' : 'Continuar'}
        onVerTudo={() => onVerTudo(rascunho)}
      />
    </form>
  )
}
