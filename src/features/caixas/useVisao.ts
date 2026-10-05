import { useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import { useProjecoesDosCaixas } from '@/features/projecao/projecoes-por-caixa'
import type { Projecao } from '@/features/projecao/projecao'
import type { DataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/financas-context'
import { caixasAtivos, caixasNoTotal, configPadrao, ehContaCorrente, primeiraConta, primeiraData, type Caixa } from './caixa'

/** O que as telas mostram: um caixa escolhido em `?caixa=` ou o Total. */
export interface Visao {
  /** Caixas ativos, na ordem do seletor. */
  caixas: Caixa[]
  /** Caixa escolhido; null = Total. */
  caixa: Caixa | null
  /** Caixas cujos números aparecem: o escolhido ou, no Total, os que entram no total. */
  caixasDaVisao: Caixa[]
  /** Lançamentos dos caixas da visão (os que entram nos saldos). */
  lancamentos: Lancamento[]
  /** Lista da tela de Lançamentos: do caixa escolhido ou, no Total, de todos os caixas. */
  lancamentosDaLista: Lancamento[]
  /** Metas dos caixas da visão. */
  metas: MetaEconomia[]
  /** Projeção de todos os anos navegáveis: do caixa escolhido ou a soma do Total. */
  projecoes: Projecao[]
  /** Projeção dos gastos por categoria, tag e pasta (ver `projecoesDoRelatorio`). */
  projecoesDoRelatorio: Projecao[]
  /** Saldo inicial mais antigo da visão: antes dele não há dados. */
  dataInicial: DataISO
  /** false enquanto algum caixa da visão está com o saldo inicial padrão (não salvo). */
  saldoDefinido: boolean
  /** Benefício (vale): sem risco, metas, reserva e capacidade. */
  ehBeneficio: boolean
  /** Cartão de crédito: também sem risco, metas, reserva e capacidade (o risco é da conta que paga a fatura). */
  ehCartao: boolean
  /** Caixa de um lançamento novo: o escolhido ou, no Total, a primeira conta. */
  caixaPadrao: Caixa | undefined
  /** Caixa de uma meta nova (sempre conta): o escolhido, se for conta, ou a primeira conta. */
  contaPadrao: Caixa | undefined
}

/**
 * [Decisão provisória] No Total, os gastos por categoria, tag e pasta do Dashboard seguem a regra dos saldos:
 * só os caixas que entram no total. Para incluir os benefícios, troque só aqui.
 */
function projecoesDoRelatorio(projecoes: Projecao[]): Projecao[] {
  return projecoes
}

/** Ids dos itens em texto, para memorizar filtros pelo conteúdo e não pela lista recriada a cada render. */
const chave = (caixas: Caixa[]) => caixas.map((c) => c.id).join(',')

/** O caixa escolhido na URL, se existir e estiver ativo. */
export function useCaixaEscolhido(): Caixa | null {
  const { estado } = useFinancas()
  const { caixa: id } = useSearch({ from: '__root__' })
  return estado.caixas.find((c) => c.id === id && !c.arquivado) ?? null
}

/** Caixa, lançamentos, metas e projeção do que as telas mostram (um caixa ou o Total). */
export function useVisao(): Visao {
  const { estado } = useFinancas()
  const { porCaixa, todos } = useProjecoesDosCaixas()
  const caixa = useCaixaEscolhido()
  const { caixas: todosOsCaixas, lancamentos, metas } = estado

  const caixas = useMemo(() => caixasAtivos(todosOsCaixas), [todosOsCaixas])
  const noTotal = useMemo(() => caixasNoTotal(todosOsCaixas), [todosOsCaixas])
  const caixasDaVisao = useMemo(() => (caixa ? [caixa] : noTotal), [caixa, noTotal])
  const ids = chave(caixasDaVisao)

  const daVisao = useMemo(() => {
    const doCaixa = new Set(ids.split(','))
    // Um caixa só, com tudo nele: a mesma lista do estado (nada muda para quem tem um caixa).
    const tudo = todosOsCaixas.length === 1 && doCaixa.has(todosOsCaixas[0].id)
    return {
      lancamentos: tudo ? lancamentos : lancamentos.filter((l) => doCaixa.has(l.caixaId)),
      metas: tudo ? metas : metas.filter((m) => doCaixa.has(m.caixaId)),
    }
  }, [ids, todosOsCaixas, lancamentos, metas])

  const lancamentosDaLista = useMemo(
    () => (caixa ? lancamentos.filter((l) => l.caixaId === caixa.id || l.caixaDestinoId === caixa.id) : lancamentos),
    [caixa, lancamentos],
  )

  const projecoes = caixa ? porCaixa.get(caixa.id)! : todos

  return {
    caixas,
    caixa,
    caixasDaVisao,
    lancamentos: daVisao.lancamentos,
    lancamentosDaLista,
    metas: daVisao.metas,
    projecoes,
    projecoesDoRelatorio: projecoesDoRelatorio(projecoes),
    dataInicial: primeiraData(caixasDaVisao) ?? primeiraData(todosOsCaixas) ?? configPadrao().dataSaldoInicial,
    saldoDefinido: caixasDaVisao.every((c) => c.saldoDefinido),
    ehBeneficio: caixa?.tipo === 'beneficio',
    ehCartao: caixa?.tipo === 'cartao',
    caixaPadrao: caixa ?? primeiraConta(todosOsCaixas),
    contaPadrao: caixa && ehContaCorrente(caixa) ? caixa : primeiraConta(todosOsCaixas),
  }
}

/** Troca o caixa na URL (null = Total), mantendo os outros parâmetros da tela. */
export function useEscolherCaixa(): (caixaId: string | null) => void {
  const navigate = useNavigate()
  return (caixaId) =>
    navigate({
      to: '.',
      search: (anterior) => ({ ...anterior, caixa: caixaId ?? undefined }),
      replace: true,
      resetScroll: false,
    })
}
