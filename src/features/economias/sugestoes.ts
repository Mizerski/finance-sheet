import { lancamentosDoCaixa, type Caixa } from '@/features/caixas/caixa'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { Projecao } from '@/features/projecao/projecao'
import { nivelDoSaldo, referenciaDoRisco, type NivelRisco } from '@/features/risco/risco'
import type { DataISO } from '@/shared/lib/datas'
import { resumirMeta, type ResumoMeta } from './aportes'
import { menorSaldo, type Saldo } from './avaliacao'
import {
  aplicarAumento,
  aplicarExtra,
  aumentoAplicado,
  aumentosDeEntrada,
  entradasExtras,
  extraAplicado,
  metadeParaGuardar,
  type AumentoDeEntrada,
  type EntradaExtra,
} from './eventos'
import { metaPrincipal } from './marcos'
import type { MetaEconomia } from './meta'
import { resumoNovoMes, type ResumoNovoMes } from './novo-mes'

/** Como a meta principal fica se o usuário aceitar a sugestão. */
export interface EfeitoNaMeta {
  meta: MetaEconomia
  nova: MetaEconomia
  conclusaoAntes: DataISO | null
  conclusaoDepois: DataISO | null
  /** Dia mais apertado nos próximos 12 meses com a sugestão aplicada. */
  menorSaldo: Saldo | null
  /** Risco do caixa com a sugestão aplicada. */
  nivel: NivelRisco | null
}

/** Sem efeito: não há meta principal, ou ela termina antes do evento (o nome dela vem em `terminaAntes`). */
interface SemEfeito {
  efeito: EfeitoNaMeta | null
  terminaAntes?: string
}

export type Sugestao =
  | { tipo: 'novo-mes'; resumo: ResumoNovoMes }
  | ({ tipo: 'aumento'; aumento: AumentoDeEntrada; guardarCentavos: number } & SemEfeito)
  | ({ tipo: 'extra'; entrada: EntradaExtra; guardarCentavos: number } & SemEfeito)

export interface ContextoSugestoes {
  /** Todos os caixas: o efeito na meta é simulado na conta dela. */
  caixas: Caixa[]
  /** Lançamentos, metas e projeção do que a tela mostra (um caixa ou o Total). */
  lancamentos: Lancamento[]
  metas: MetaEconomia[]
  projecoes: Projecao[]
  /** O gasto de um mês de cada conta (régua do risco); sem ela, vale o da projeção da tela. */
  referencias: Map<string, number>
  resumos: Map<string, ResumoMeta>
  hoje: DataISO
}

/**
 * Sugestões ligadas a eventos, para a meta principal: o resumo do mês que fechou (na primeira semana),
 * guardar metade de um aumento de entrada a partir do mês dele e metade de uma entrada extra (13º, bônus).
 * As já aplicadas não voltam; sem meta principal, a sugestão vem sem efeito (o card oferece criar uma).
 */
export function montarSugestoes(ctx: ContextoSugestoes): Sugestao[] {
  const { caixas, lancamentos, metas, projecoes, referencias, resumos, hoje } = ctx
  const dias = projecoes.flatMap((p) => p.dias)
  const principal = metaPrincipal(metas, resumos)
  const conta = principal && caixas.find((c) => c.id === principal.caixaId)
  const referencia = (conta && referencias.get(conta.id)) ?? referenciaDoRisco(dias, hoje)
  const sugestoes: Sugestao[] = []

  const resumo = resumoNovoMes(projecoes, hoje)
  if (resumo) sugestoes.push({ tipo: 'novo-mes', resumo })

  function efeito(nova: MetaEconomia | null | undefined): SemEfeito {
    if (!principal || !conta) return { efeito: null }
    if (!nova) return { efeito: null, terminaAntes: principal.nome }
    // A meta tira o dinheiro da conta dela: a simulação usa só os lançamentos e as metas dessa conta.
    const outras = metas.filter((m) => m.id !== principal.id && m.caixaId === conta.id)
    const doCaixa = lancamentosDoCaixa(lancamentos, conta.id)
    const saldo = menorSaldo({ config: conta, lancamentos: doCaixa, outrasMetas: outras, hoje }, [...outras, nova])
    return {
      efeito: {
        meta: principal,
        nova,
        conclusaoAntes: resumos.get(principal.id)?.conclusaoNoPlano ?? null,
        conclusaoDepois: resumirMeta(nova, hoje).conclusaoNoPlano,
        menorSaldo: saldo,
        nivel: saldo && nivelDoSaldo(saldo.valorCentavos, referencia),
      },
    }
  }

  for (const aumento of aumentosDeEntrada(dias, lancamentos, hoje).slice(0, 2)) {
    if (principal && aumentoAplicado(principal, aumento.mes)) continue
    const guardar = metadeParaGuardar(aumento.depoisCentavos - aumento.antesCentavos)
    const nova = principal && aplicarAumento(principal, aumento.mes, guardar)
    sugestoes.push({ tipo: 'aumento', aumento, guardarCentavos: guardar, ...efeito(nova) })
  }

  for (const entrada of entradasExtras(dias, lancamentos, hoje).slice(0, 3)) {
    if (principal && extraAplicado(principal, entrada.data)) continue
    const guardar = metadeParaGuardar(entrada.valorCentavos)
    const nova = principal && aplicarExtra(principal, entrada.data, guardar)
    sugestoes.push({ tipo: 'extra', entrada, guardarCentavos: guardar, ...efeito(nova) })
  }

  return sugestoes
}
