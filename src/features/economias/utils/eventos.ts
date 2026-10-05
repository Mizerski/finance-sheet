import { ehAjusteDeSaldo } from '@/features/lancamentos/utils/ajuste'
import type { Lancamento } from '@/features/lancamentos/model/lancamento'
import type { DiaProjetado } from '@/features/projecao/utils/projecao'
import { somarDias, type DataISO } from '@/shared/lib/datas'
import { aportesDaMeta, jaGuardado } from './aportes'
import { arredondar, periodoDaCapacidade } from './capacidade'
import type { MetaEconomia } from '../model/meta'

/** Abaixo disso a diferença entre dois meses é ruído, não aumento. */
const AUMENTO_MINIMO_CENTAVOS = 5000

/** Uma entrada mensal que sobe: novo salário, reajuste, cliente novo. */
export interface AumentoDeEntrada {
  /** "yyyy-MM" do primeiro mês com o valor novo. */
  mes: string
  antesCentavos: number
  depoisCentavos: number
}

/** Uma entrada única grande: 13º, bônus, restituição do IR. */
export interface EntradaExtra {
  lancamentoId: string
  descricao: string
  data: DataISO
  valorCentavos: number
}

/** "2026-09" → "2026-08" (n = -1). */
export function somarMeses(mes: string, n: number): string {
  const indice = Number(mes.slice(0, 4)) * 12 + Number(mes.slice(5, 7)) - 1 + n
  return `${Math.floor(indice / 12)}-${String((indice % 12) + 1).padStart(2, '0')}`
}

/**
 * Meses em que as entradas mensais recorrentes sobem, do mês de `hoje` até o fim do período da capacidade.
 * Compara cada mês com o anterior; meses com dias fora do cálculo (antes do saldo inicial) não entram.
 */
export function aumentosDeEntrada(dias: DiaProjetado[], lancamentos: Lancamento[], hoje: DataISO): AumentoDeEntrada[] {
  const mensais = new Set(
    lancamentos.filter((l) => l.tipo === 'entrada' && l.recorrencia.tipo === 'mensal').map((l) => l.id),
  )
  const primeiro = somarMeses(hoje.slice(0, 7), -1)
  const ultimo = periodoDaCapacidade(hoje).fim.slice(0, 7)
  const totais = new Map<string, number>()
  const incompletos = new Set<string>()

  for (const d of dias) {
    const mes = d.data.slice(0, 7)
    if (mes < primeiro || mes > ultimo) continue
    if (!d.noCalculo) incompletos.add(mes)
    for (const o of d.ocorrencias) {
      if (mensais.has(o.lancamentoId)) totais.set(mes, (totais.get(mes) ?? 0) + o.valorCentavos)
    }
  }

  const aumentos: AumentoDeEntrada[] = []
  for (let mes = hoje.slice(0, 7); mes <= ultimo; mes = somarMeses(mes, 1)) {
    const anterior = somarMeses(mes, -1)
    if (incompletos.has(anterior) || incompletos.has(mes)) continue
    const antes = totais.get(anterior) ?? 0
    const depois = totais.get(mes) ?? 0
    if (depois - antes >= AUMENTO_MINIMO_CENTAVOS) aumentos.push({ mes, antesCentavos: antes, depoisCentavos: depois })
  }
  return aumentos
}

/**
 * Entradas únicas de hoje até o fim do período que valem pelo menos metade da entrada média do mês.
 * Ajustes de saldo ficam de fora: corrigem a projeção, não são dinheiro novo.
 */
export function entradasExtras(dias: DiaProjetado[], lancamentos: Lancamento[], hoje: DataISO): EntradaExtra[] {
  const { primeiroAporte, fim } = periodoDaCapacidade(hoje)
  const unicas = new Set(
    lancamentos
      .filter((l) => l.tipo === 'entrada' && l.recorrencia.tipo === 'unica' && !ehAjusteDeSaldo(l))
      .map((l) => l.id),
  )
  const entradas12 = dias
    .filter((d) => d.data >= primeiroAporte && d.data <= fim)
    .reduce((t, d) => t + d.entradasCentavos, 0)
  const minimo = Math.max(Math.round(entradas12 / 12 / 2), 1)

  const extras: EntradaExtra[] = []
  for (const d of dias) {
    if (d.data < hoje || d.data > fim) continue
    for (const o of d.ocorrencias) {
      if (!unicas.has(o.lancamentoId) || o.valorCentavos < minimo) continue
      extras.push({ lancamentoId: o.lancamentoId, descricao: o.descricao, data: d.data, valorCentavos: o.valorCentavos })
    }
  }
  return extras
}

/** Metade do aumento ou da entrada extra, para baixo em R$ 10: guardar sem sentir falta. */
export function metadeParaGuardar(centavos: number): number {
  return arredondar(centavos / 2)
}

/** Quanto o plano da meta guarda no mês: o ajuste, se houver, ou o aporte mensal. */
function planejadoNoMes(meta: MetaEconomia, mes: string): number {
  return mes in meta.ajustes ? meta.ajustes[mes] : meta.aporteMensalCentavos
}

/**
 * A meta guardando `extraCentavos` a mais a partir de `mes`; os meses anteriores viram ajustes.
 * null se a meta termina antes.
 */
export function aplicarAumento(meta: MetaEconomia, mes: string, extraCentavos: number): MetaEconomia | null {
  const antes = aportesDaMeta(meta, somarDias(`${mes}-01`, -1))
  const guardado = jaGuardado(meta) + antes.reduce((t, a) => t + a.valorCentavos, 0)
  if (guardado >= (meta.valorAlvoCentavos ?? Infinity)) return null

  const ajustes = { ...meta.ajustes }
  for (const a of antes) if (!(a.mes in ajustes)) ajustes[a.mes] = meta.aporteMensalCentavos
  return { ...meta, aporteMensalCentavos: meta.aporteMensalCentavos + extraCentavos, ajustes }
}

/** O aumento já foi aplicado: o plano guarda mais no mês do aumento do que no anterior. */
export function aumentoAplicado(meta: MetaEconomia, mes: string): boolean {
  return planejadoNoMes(meta, mes) > planejadoNoMes(meta, somarMeses(mes, -1))
}

/** O primeiro aporte da meta a partir de `data` (quando o dinheiro extra já entrou). */
function aporteDepoisDe(meta: MetaEconomia, data: DataISO) {
  return aportesDaMeta(meta, '9999-12-31').find((a) => a.data >= data)
}

/**
 * A meta guardando `extraCentavos` a mais no primeiro aporte depois de `data`, sem passar do alvo.
 * null se a meta termina antes.
 */
export function aplicarExtra(meta: MetaEconomia, data: DataISO, extraCentavos: number): MetaEconomia | null {
  const aporte = aporteDepoisDe(meta, data)
  if (!aporte) return null
  const antes = jaGuardado(meta) + aportesDaMeta(meta, somarDias(aporte.data, -1)).reduce((t, a) => t + a.valorCentavos, 0)
  const valor = Math.min(planejadoNoMes(meta, aporte.mes) + extraCentavos, (meta.valorAlvoCentavos ?? Infinity) - antes)
  return { ...meta, ajustes: { ...meta.ajustes, [aporte.mes]: valor } }
}

/** A entrada extra já foi aplicada: o aporte do mês dela está acima do aporte mensal. */
export function extraAplicado(meta: MetaEconomia, data: DataISO): boolean {
  const aporte = aporteDepoisDe(meta, data)
  return !!aporte && planejadoNoMes(meta, aporte.mes) > meta.aporteMensalCentavos
}

/** Mês do aporte que recebe a entrada extra ("yyyy-MM"). */
export function mesDoExtra(meta: MetaEconomia, data: DataISO): string | null {
  return aporteDepoisDe(meta, data)?.mes ?? null
}
