import { caixasAtivos, caixasNoTotal, lancamentosDoCaixa, type Caixa } from '@/features/caixas/caixa'
import { idsDeRecarga, resumirBeneficio } from '@/features/caixas/beneficio'
import type { Categoria } from '@/features/categorias/categoria'
import { resumirMeta } from '@/features/economias/aportes'
import { capacidadeDePoupanca, periodoDaCapacidade } from '@/features/economias/capacidade'
import { gastosGrandes } from '@/features/economias/gastos-grandes'
import { metaPrincipal } from '@/features/economias/marcos'
import type { MetaEconomia } from '@/features/economias/meta'
import { alvoDaReserva, gastoEssencial, metaDeReserva } from '@/features/economias/reserva'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import { descreverRecorrencia } from '@/features/lancamentos/textos'
import {
  gastosPorCategoria,
  gastosPorTag,
  ocorrenciasPorLancamento,
  totalEvitavel,
  type DiaProjetado,
  type Projecao,
} from '@/features/projecao/projecao'
import { analisarRisco, capacidadePorNivel, NIVEL, percentualDoMes } from '@/features/risco/risco'
import type { Tag } from '@/features/tags/tag'
import { deDataISO, formatarData, formatarMesAno, nomeDoDiaDaSemana, somarDias, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { idsDeAjuste, somar, type Somas } from './somas'

/** O que o retrato precisa: o estado salvo e as projeções que as telas já calculam. */
export interface EntradaRetrato {
  hoje: DataISO
  caixas: Caixa[]
  lancamentos: Lancamento[]
  metas: MetaEconomia[]
  categorias: Categoria[]
  tags: Tag[]
  /** Projeção de cada caixa (todos os anos navegáveis), pelo id. */
  porCaixa: Map<string, Projecao[]>
  /** Soma dos caixas que entram no total. */
  todos: Projecao[]
}

/** Janela dos gastos por categoria: os últimos 90 dias, até hoje. */
const DIAS_DOS_GASTOS = 90
/** Contas que se repetem, olhando o próximo mês. */
const DIAS_DAS_FIXAS = 30
const MAX_CATEGORIAS = 8
const MAX_FIXAS = 10
const MAX_GRANDES = 5
const MAX_ENTRADAS = 6
const MAX_VARIAVEIS = 6

const brl = formatarBRL
const data = formatarData
const percentual = (parte: number, todo: number) => (todo > 0 ? `${Math.round((parte / todo) * 100)}%` : '')

function linhaDoPeriodo(rotulo: string, s: Somas): string {
  const saidas = s.fixas + s.variaveis
  const sobra = s.entradas - saidas - s.economia
  return `- ${rotulo}: entrou ${brl(s.entradas)}; saiu ${brl(saidas)} (fixas ${brl(s.fixas)}, variáveis ${brl(s.variaveis)}); metas ${brl(s.economia)}; sobra ${brl(sobra)}.`
}

const saldoEm = (dias: DiaProjetado[], dia: DataISO) => dias.find((d) => d.data === dia)?.saldoCentavos ?? null

/**
 * Retrato financeiro da pessoa em texto, para o prompt do assistente. Os números saem das mesmas funções das telas
 * (risco, capacidade, metas, benefícios), já formatados: o modelo só lê, não faz contas.
 */
export function montarRetrato(e: EntradaRetrato): string {
  const { hoje } = e
  const ativos = caixasAtivos(e.caixas)
  const contasNoTotal = caixasNoTotal(e.caixas)
  const idsNoTotal = new Set(contasNoTotal.map((c) => c.id))
  const lancamentosNoTotal = e.lancamentos.filter((l) => idsNoTotal.has(l.caixaId))
  const metasNoTotal = e.metas.filter((m) => idsNoTotal.has(m.caixaId))
  const ajustes = idsDeAjuste(e.lancamentos)
  const dias = e.todos.flatMap((p) => p.dias)
  const variosCaixas = ativos.length > 1
  const nomeDaConta = (id: string) => e.caixas.find((c) => c.id === id)?.nome ?? ''

  const partes: string[] = [
    `# Retrato financeiro da pessoa`,
    `Hoje é ${nomeDoDiaDaSemana(deDataISO(hoje).getDay(), 'longo')}, ${data(hoje)}. Números calculados pelo app agora, com o que está lançado (o futuro é projeção). ${
      variosCaixas
        ? `"Total" é a soma das contas que entram no total (${contasNoTotal.map((c) => c.nome).join(', ')}); benefícios ficam fora.`
        : ''
    }`.trim(),
  ]

  if (e.lancamentos.length === 0) {
    partes.push('A pessoa ainda não cadastrou nenhum lançamento: não há números para analisar.')
    return partes.join('\n')
  }

  // Saldos
  const saldos: string[] = ['## Saldos']
  const fimDoAno = `${hoje.slice(0, 4)}-12-31`
  if (variosCaixas) {
    const hojeTotal = saldoEm(dias, hoje)
    const fimTotal = saldoEm(dias, fimDoAno)
    if (hojeTotal !== null) {
      saldos.push(`- Total: ${brl(hojeTotal)} hoje${fimTotal !== null ? `; ${brl(fimTotal)} previsto em ${data(fimDoAno)}` : ''}.`)
    }
  }
  for (const c of ativos) {
    const diasDoCaixa = (e.porCaixa.get(c.id) ?? []).flatMap((p) => p.dias)
    const hojeCaixa = saldoEm(diasDoCaixa, hoje)
    const fim = saldoEm(diasDoCaixa, fimDoAno)
    const tipo = c.tipo === 'beneficio' ? 'benefício' : idsNoTotal.has(c.id) ? 'conta' : 'conta fora do total'
    const valores =
      hojeCaixa === null
        ? `começa em ${data(c.dataSaldoInicial)}`
        : `${brl(hojeCaixa)} hoje${fim !== null && c.tipo === 'conta' ? `; ${brl(fim)} previsto em ${data(fimDoAno)}` : ''}`
    saldos.push(`- ${c.nome} (${tipo}): ${valores}.${c.saldoDefinido ? '' : ' Saldo inicial ainda não informado: os saldos podem estar errados.'}`)
  }
  partes.push(saldos.join('\n'))

  // Mês passado, este mês e a média dos próximos 12 meses
  const mesAtual = hoje.slice(0, 7)
  const inicioDoMes = `${mesAtual}-01`
  const mesPassado = somarDias(inicioDoMes, -1).slice(0, 7)
  const doMes = (mes: string) => dias.filter((d) => d.data.startsWith(mes))
  const meses: string[] = ['## Entradas e saídas' + (variosCaixas ? ' (Total)' : '')]
  const passado = doMes(mesPassado)
  if (passado.some((d) => d.noCalculo)) meses.push(linhaDoPeriodo(`${formatarMesAno(`${mesPassado}-01`)} (fechado)`, somar(passado, ajustes)))
  const atual = doMes(mesAtual)
  meses.push(linhaDoPeriodo(`${formatarMesAno(inicioDoMes)} até hoje`, somar(atual.filter((d) => d.data <= hoje), ajustes)))
  meses.push(linhaDoPeriodo(`${formatarMesAno(inicioDoMes)} inteiro (previsto)`, somar(atual, ajustes)))
  const capacidade = capacidadeDePoupanca(dias, hoje)
  const essencial = gastoEssencial(dias, e.tags, hoje)
  if (capacidade) {
    meses.push(
      `- Média por mês nos próximos 12 meses: saídas ${brl(essencial.saidasMensaisCentavos)}; metas ${brl(capacidade.economiaMediaCentavos)}; sobra ${brl(capacidade.sobraMediaCentavos)}.`,
    )
  }
  partes.push(meses.join('\n'))

  // Para onde vão as saídas
  const inicioGastos = somarDias(hoje, -(DIAS_DOS_GASTOS - 1))
  const diasDosGastos = dias.filter((d) => d.data >= inicioGastos && d.data <= hoje && d.noCalculo)
  const semAjustes = diasDosGastos.map((d) => ({ ...d, ocorrencias: d.ocorrencias.filter((o) => !ajustes.has(o.lancamentoId)) }))
  const categorias = gastosPorCategoria(semAjustes, e.categorias)
  const totalGasto = categorias.reduce((t, c) => t + c.totalCentavos, 0)
  if (totalGasto > 0) {
    const linhas = [`## Gastos por categoria, de ${data(inicioGastos)} a hoje (total ${brl(totalGasto)})`]
    for (const c of categorias.slice(0, MAX_CATEGORIAS)) {
      linhas.push(`- ${c.nome}: ${brl(c.totalCentavos)} (${percentual(c.totalCentavos, totalGasto)})`)
    }
    const resto = categorias.slice(MAX_CATEGORIAS).reduce((t, c) => t + c.totalCentavos, 0)
    if (resto > 0) linhas.push(`- Outras categorias: ${brl(resto)}`)
    // O que dá para cortar: os gastos variáveis que mais pesaram, agrupados pela descrição.
    const variaveis = new Map<string, { total: number; vezes: number }>()
    for (const d of semAjustes) {
      for (const o of d.ocorrencias) {
        if (o.tipo !== 'saida' || o.natureza !== 'variavel') continue
        const atual = variaveis.get(o.descricao) ?? { total: 0, vezes: 0 }
        variaveis.set(o.descricao, { total: atual.total + o.valorCentavos, vezes: atual.vezes + 1 })
      }
    }
    const maiores = [...variaveis].sort((a, b) => b[1].total - a[1].total).slice(0, MAX_VARIAVEIS)
    if (maiores.length) {
      linhas.push(`Maiores gastos variáveis no mesmo período (o que mais dá para cortar):`)
      for (const [descricao, { total, vezes }] of maiores) {
        linhas.push(`- ${descricao}: ${brl(total)}${vezes > 1 ? ` em ${vezes} vezes` : ''}`)
      }
    }
    const evitavel = totalEvitavel(gastosPorTag(semAjustes, e.tags))
    const temTagEvitavel = e.tags.some((t) => t.evitavel)
    linhas.push(
      temTagEvitavel
        ? `- Gastos com tag evitável no período: ${brl(evitavel)} (${percentual(evitavel, totalGasto) || '0%'} das saídas).`
        : '- Nenhuma tag marcada como evitável: o app não sabe quais gastos eram evitáveis.',
    )
    partes.push(linhas.join('\n'))
  }

  // Próximas entradas: explicam um mês que parece negativo até o salário cair.
  const proximos = dias.filter((d) => d.data > hoje && d.data <= somarDias(hoje, DIAS_DAS_FIXAS))
  const entradas = proximos.flatMap((d) =>
    d.ocorrencias
      .filter((o) => o.tipo === 'entrada' && !ajustes.has(o.lancamentoId))
      .map((o) => `- ${data(d.data)}: ${o.descricao}, ${brl(o.valorCentavos)}.`),
  )
  const totalEntradas = proximos.reduce(
    (t, d) => t + d.ocorrencias.filter((o) => o.tipo === 'entrada' && !ajustes.has(o.lancamentoId)).reduce((s, o) => s + o.valorCentavos, 0),
    0,
  )
  partes.push(
    [
      `## Próximas entradas, nos próximos ${DIAS_DAS_FIXAS} dias (total ${brl(totalEntradas)})`,
      ...(entradas.length ? entradas.slice(0, MAX_ENTRADAS) : ['- Nenhuma entrada lançada.']),
    ].join('\n'),
  )

  // Contas que se repetem
  const vezes = ocorrenciasPorLancamento(proximos)
  const fixas = lancamentosNoTotal
    .filter((l) => l.tipo === 'saida' && l.recorrencia.tipo !== 'unica' && !ajustes.has(l.id) && vezes.has(l.id))
    .map((l) => ({ l, total: vezes.get(l.id)!.totalCentavos }))
    .sort((a, b) => b.total - a.total)
  if (fixas.length) {
    const totalFixas = fixas.reduce((t, f) => t + f.total, 0)
    const linhas = [`## Saídas que se repetem, nos próximos ${DIAS_DAS_FIXAS} dias (total ${brl(totalFixas)})`]
    for (const { l, total } of fixas.slice(0, MAX_FIXAS)) {
      const categoria = e.categorias.find((c) => c.id === l.categoriaId)?.nome
      const vezesNoMes = vezes.get(l.id)!.vezes
      const frequencia = l.recorrencia.tipo === 'mensal' ? 'por mês' : `${vezesNoMes}× em ${DIAS_DAS_FIXAS} dias`
      linhas.push(
        `- ${l.descricao}${categoria ? ` (categoria ${categoria})` : ''}: ${brl(total)} ${frequencia}; ${descreverRecorrencia(l).toLowerCase()}.`,
      )
    }
    if (fixas.length > MAX_FIXAS) linhas.push(`- E mais ${fixas.length - MAX_FIXAS} saídas que se repetem.`)
    partes.push(linhas.join('\n'))
  }

  // Risco de cada conta
  const contas = ativos.filter((c) => c.tipo === 'conta')
  const riscos: string[] = []
  for (const c of contas) {
    const diasDaConta = (e.porCaixa.get(c.id) ?? []).flatMap((p) => p.dias)
    const analise = analisarRisco(diasDaConta, hoje)
    if (!analise) continue
    const { nivel, menorSaldo, referenciaCentavos: ref } = analise
    const pct = percentualDoMes(menorSaldo.valorCentavos, ref)
    const porNivel = capacidadePorNivel(diasDaConta, hoje, ref)
    riscos.push(
      [
        `- ${c.nome}: **${NIVEL[nivel].nome}** (${NIVEL[nivel].significado}).`,
        `Dia mais apertado: ${data(menorSaldo.data)}, com ${brl(menorSaldo.valorCentavos)}${pct !== null ? ` (${pct}% de um mês de gastos: ${pct >= 100 ? 'cobre um mês inteiro' : 'não cobre um mês inteiro'})` : ''}.`,
        `Gasto de um mês: ${brl(ref)}.`,
        analise.primeiroNegativo ? `Falta dinheiro a partir de ${data(analise.primeiroNegativo)}.` : '',
        `Dá para guardar mais ${brl(porNivel[nivel])} por mês sem piorar o nível (no máximo ${brl(porNivel[5])} sem ficar negativo).`,
      ]
        .filter(Boolean)
        .join(' '),
    )
  }
  if (riscos.length) partes.push([`## Risco do caixa (de hoje a ${data(periodoDaCapacidade(hoje).fim)})`, ...riscos].join('\n'))

  // Benefícios
  const beneficios: string[] = []
  for (const c of ativos.filter((x) => x.tipo === 'beneficio')) {
    const r = resumirBeneficio(
      (e.porCaixa.get(c.id) ?? []).flatMap((p) => p.dias),
      idsDeRecarga(lancamentosDoCaixa(e.lancamentos, c.id)),
      hoje,
    )
    if (!r) continue
    const recarga = r.recarga
      ? `próxima recarga em ${data(r.recarga.data)} (${brl(r.recarga.valorCentavos)}); sobram ${brl(r.sobraCentavos)} até a véspera${r.porDiaCentavos !== null ? `, ${brl(r.porDiaCentavos)} por dia` : ''}`
      : 'sem recarga lançada'
    beneficios.push(
      `- ${c.nome}: ${brl(r.saldoHojeCentavos)} hoje; ${recarga}.${r.primeiroNegativo ? ` O saldo acaba antes: fica negativo em ${data(r.primeiroNegativo)}.` : ''}`,
    )
  }
  if (beneficios.length) partes.push(['## Benefícios (vale)', ...beneficios].join('\n'))

  // Metas
  const resumos = new Map(e.metas.map((m) => [m.id, resumirMeta(m, hoje)]))
  if (e.metas.length) {
    const principal = metaPrincipal(e.metas, resumos)
    const linhas = ['## Metas de economia']
    const usado = (m: (typeof e.metas)[number]) =>
      (m.resgates ?? []).filter((x) => x.data <= hoje).reduce((t, x) => t + x.valorCentavos, 0)
    for (const m of e.metas) {
      const r = resumos.get(m.id)!
      const detalhes = [
        m.valorAlvoCentavos === undefined
          ? `${brl(r.guardadoCentavos)} guardados, sem valor alvo (cofrinho: guarda todo mês, sem fim; em 12 meses terá ${brl(r.emUmAnoCentavos)})`
          : `${brl(r.guardadoCentavos)} de ${brl(m.valorAlvoCentavos)} (${Math.round(r.percentual * 100)}%)`,
        r.concluida ? 'concluída' : `guarda ${brl(m.aporteMensalCentavos)} todo dia ${m.diaDoMes}`,
        !r.concluida && r.conclusaoNoPlano ? `termina em ${data(r.conclusaoNoPlano)} pelo plano` : '',
        m.valorAlvoCentavos !== undefined && !r.concluida && !r.conclusaoNoPlano ? 'com o aporte atual não termina' : '',
        m.prazo && !r.concluida
          ? `prazo ${data(m.prazo)}: ${r.noPrazo ? 'no prazo' : `atrasada; precisaria de ${brl(r.aporteParaOPrazoCentavos ?? 0)} por mês`}`
          : '',
        variosCaixas ? `conta ${nomeDaConta(m.caixaId)}` : '',
        m.destinoId ? `o dinheiro vai para a conta ${nomeDaConta(m.destinoId)}` : 'o dinheiro fica separado na conta (fora do saldo disponível)',
        usado(m) ? `já usou ${brl(usado(m))}` : '',
        r.encerrada ? 'encerrada (não guarda mais)' : '',
      ].filter(Boolean)
      linhas.push(`- ${m.nome}${m.id === principal?.id ? ' (principal)' : ''}: ${detalhes.join('; ')}.`)
    }
    partes.push(linhas.join('\n'))
  } else {
    partes.push('## Metas de economia\n- Nenhuma meta cadastrada.')
  }

  // Reserva de emergência
  const reserva = metaDeReserva(metasNoTotal)
  partes.push(
    [
      '## Reserva de emergência',
      `- Gasto essencial por mês: ${brl(essencial.essencialMensalCentavos)} (saídas ${brl(essencial.saidasMensaisCentavos)} menos ${brl(essencial.evitaveisMensaisCentavos)} evitáveis).`,
      `- Reserva recomendada: ${brl(alvoDaReserva(essencial.essencialMensalCentavos, 3))} (3 meses), ${brl(alvoDaReserva(essencial.essencialMensalCentavos, 6))} (6 meses) ou ${brl(alvoDaReserva(essencial.essencialMensalCentavos, 12))} (12 meses).`,
      reserva
        ? `- Meta de reserva: "${reserva.nome}", ${brl(resumos.get(reserva.id)!.guardadoCentavos)} guardados.`
        : '- Ainda não há meta de reserva (meta com "reserva" no nome).',
    ].join('\n'),
  )

  // Gastos grandes
  const grandes = gastosGrandes(dias, lancamentosNoTotal, hoje)
  if (grandes.itens.length) {
    const linhas = ['## Gastos grandes à frente (únicos, próximos 12 meses)']
    for (const g of grandes.itens.slice(0, MAX_GRANDES)) {
      linhas.push(`- ${data(g.data)}: ${g.descricao}, ${brl(g.valorCentavos)} (saldo no dia: ${brl(g.saldoNoDiaCentavos)}).`)
    }
    if (grandes.itens.length > MAX_GRANDES) linhas.push(`- E mais ${grandes.itens.length - MAX_GRANDES}.`)
    partes.push(linhas.join('\n'))
  }

  return partes.join('\n\n')
}
