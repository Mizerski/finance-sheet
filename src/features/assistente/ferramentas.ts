import { caixasAtivos, caixasNoTotal, lancamentosDoCaixa, metasDoCaixa, type Caixa } from '@/features/caixas/caixa'
import type { Pasta } from '@/features/pastas/pasta'
import { diasNoPeriodo, saldoAntesDoDia, type Projecao } from '@/features/projecao/projecao'
import { analisarRisco, NIVEL, type AnaliseRisco } from '@/features/risco/risco'
import { contaSimulada, maiorContaSemPiorar, riscoCom, type FrequenciaConta } from '@/features/risco/simulacao'
import { diasNoMes, formatarData, formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import type { EntradaRetrato } from './retrato'
import { idsDeAjuste, somar } from './somas'

/** Os mesmos dados do retrato, mais as pastas (filtro de texto). */
export interface DadosFerramentas extends EntradaRetrato {
  pastas: Pasta[]
}

/** O que a ferramenta devolve: uma linha para a pessoa ver o que foi consultado e o texto para o modelo. */
export interface ResultadoFerramenta {
  resumo: string
  resultado: string
}

const MAX_ITENS = 6

/**
 * Ferramentas que o modelo pode chamar (formato da API). Os nomes e as descrições são o que ele lê para decidir;
 * os resultados já vêm somados e formatados, para ele só repetir os números.
 */
export const DEFINICOES_FERRAMENTAS = [
  {
    type: 'function',
    function: {
      name: 'consultar_lancamentos',
      description:
        'Soma as saídas (gastos) ou as entradas de um período, com filtro opcional por texto (nome da categoria, tag, pasta ou descrição do lançamento). Use para "quanto gastei com X", "quanto recebi em Y", "quais foram meus gastos em Z".',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['saida', 'entrada'], description: 'saida = gastos; entrada = dinheiro recebido.' },
          mes: { type: 'string', description: 'Mês no formato AAAA-MM. Use este ou de/ate.' },
          de: { type: 'string', description: 'Primeiro dia, AAAA-MM-DD.' },
          ate: { type: 'string', description: 'Último dia, AAAA-MM-DD.' },
          texto: { type: 'string', description: 'Parte do nome de uma categoria, tag, pasta ou da descrição (ex.: "ifood", "mercado").' },
          caixa: { type: 'string', description: 'Nome de uma conta ou benefício; sem ele, todos.' },
        },
        required: ['tipo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resumo_do_mes',
      description:
        'Resumo de um mês (passado, atual ou futuro) somando as contas do Total: entradas, saídas fixas e variáveis, metas, sobra, saldo no começo e no fim, menor saldo e as maiores categorias de gasto.',
      parameters: {
        type: 'object',
        properties: { mes: { type: 'string', description: 'Mês no formato AAAA-MM.' } },
        required: ['mes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'saldo_no_dia',
      description: 'Saldo no fim de um dia (passado ou projetado), do Total ou de uma conta ou benefício.',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'string', description: 'Dia no formato AAAA-MM-DD.' },
          caixa: { type: 'string', description: 'Nome de uma conta ou benefício; sem ele, o Total.' },
        },
        required: ['data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'simular_gasto',
      description:
        'Simula um gasto novo numa conta e diz se ele cabe: o risco do caixa antes e depois, se falta dinheiro e o maior valor que cabe sem piorar. Use para "posso comprar X?", "cabe uma parcela de Y?".',
      parameters: {
        type: 'object',
        properties: {
          valor: { type: 'number', description: 'Valor em reais (ex.: 3000 ou 149.90).' },
          data: { type: 'string', description: 'Dia do gasto, AAAA-MM-DD; sem ela, hoje. Mensal: o dia da primeira parcela.' },
          frequencia: { type: 'string', enum: ['unica', 'mensal'], description: 'unica = uma vez; mensal = todo mês.' },
          conta: { type: 'string', description: 'Nome da conta; sem ele, a primeira conta.' },
        },
        required: ['valor'],
      },
    },
  },
]

const brl = formatarBRL
const data = formatarData

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

const ehMes = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v)
const ehDia = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

function fimDoMes(mes: string): DataISO {
  const [ano, m] = [Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1]
  return `${mes}-${String(diasNoMes(ano, m)).padStart(2, '0')}`
}

interface Periodo {
  de: DataISO
  ate: DataISO
  rotulo: string
}

/** O período pedido (mês, ou de/até; sem nada, o mês de hoje). Texto de erro se vier num formato inválido. */
function lerPeriodo(args: Record<string, unknown>, hoje: DataISO): Periodo | string {
  if (args.mes !== undefined && args.mes !== '') {
    if (!ehMes(args.mes)) return 'Formato de mês inválido: use AAAA-MM.'
    return { de: `${args.mes}-01`, ate: fimDoMes(args.mes), rotulo: `em ${formatarMesAno(`${args.mes}-01`)}` }
  }
  if (args.de !== undefined || args.ate !== undefined) {
    const de = args.de ?? args.ate
    const ate = args.ate ?? args.de
    if (!ehDia(de) || !ehDia(ate)) return 'Formato de data inválido: use AAAA-MM-DD.'
    if (de > ate) return 'A data inicial vem depois da final.'
    return { de, ate, rotulo: de === ate ? `em ${data(de)}` : `de ${data(de)} a ${data(ate)}` }
  }
  const mes = hoje.slice(0, 7)
  return { de: `${mes}-01`, ate: fimDoMes(mes), rotulo: `em ${formatarMesAno(`${mes}-01`)}` }
}

/** Caixa pelo nome (ignora maiúsculas e acentos). Sem nome, `undefined`; nome sem caixa, texto de erro. */
function lerCaixa(nome: unknown, caixas: Caixa[]): Caixa | undefined | string {
  if (typeof nome !== 'string' || !nome.trim()) return undefined
  const alvo = normalizar(nome)
  const achado = caixas.find((c) => normalizar(c.nome) === alvo) ?? caixas.find((c) => normalizar(c.nome).includes(alvo))
  return achado ?? `Não existe caixa com o nome "${nome}". Caixas: ${caixas.map((c) => c.nome).join(', ')}.`
}

/** Fora dos anos que o app projeta não há dados. */
function foraDoIntervalo(p: Periodo, todos: Projecao[]): string | null {
  const primeiro = todos[0]?.ano
  const ultimo = todos.at(-1)?.ano
  if (primeiro === undefined || ultimo === undefined) return 'Ainda não há dados.'
  if (p.ate < `${primeiro}-01-01` || p.de > `${ultimo}-12-31`) {
    return `Sem dados nesse período: o app calcula de 01/01/${primeiro} a 31/12/${ultimo}.`
  }
  return null
}

function argumentos(texto: string): Record<string, unknown> {
  try {
    const valor: unknown = JSON.parse(texto || '{}')
    return valor && typeof valor === 'object' ? (valor as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** Executa a ferramenta pedida pelo modelo. Nunca lança: um problema vira texto, para o modelo explicar ou tentar de novo. */
export function executarFerramenta(nome: string, textoArgs: string, dados: DadosFerramentas): ResultadoFerramenta {
  const args = argumentos(textoArgs)
  try {
    switch (nome) {
      case 'consultar_lancamentos':
        return consultarLancamentos(args, dados)
      case 'resumo_do_mes':
        return resumoDoMes(args, dados)
      case 'saldo_no_dia':
        return saldoNoDia(args, dados)
      case 'simular_gasto':
        return simularGasto(args, dados)
      default:
        return { resumo: `Ferramenta desconhecida: ${nome}`, resultado: `A ferramenta "${nome}" não existe.` }
    }
  } catch (e) {
    return { resumo: 'Não deu para consultar', resultado: `Erro ao consultar: ${e instanceof Error ? e.message : String(e)}` }
  }
}

interface Item {
  data: DataISO
  descricao: string
  valor: number
  categoria: string
  caixa: string
}

function consultarLancamentos(args: Record<string, unknown>, d: DadosFerramentas): ResultadoFerramenta {
  const tipo = args.tipo === 'entrada' ? 'entrada' : 'saida'
  const nomeTipo = tipo === 'entrada' ? 'Entradas' : 'Saídas'
  const periodo = lerPeriodo(args, d.hoje)
  if (typeof periodo === 'string') return { resumo: `${nomeTipo}: período inválido`, resultado: periodo }
  const caixa = lerCaixa(args.caixa, caixasAtivos(d.caixas))
  if (typeof caixa === 'string') return { resumo: `${nomeTipo}: caixa não encontrado`, resultado: caixa }
  const fora = foraDoIntervalo(periodo, d.todos)
  if (fora) return { resumo: `${nomeTipo} ${periodo.rotulo}`, resultado: fora }

  const texto = typeof args.texto === 'string' ? normalizar(args.texto) : ''
  const ajustes = idsDeAjuste(d.lancamentos)
  const nomeCategoria = new Map(d.categorias.map((c) => [c.id, c.nome]))
  const nomeTag = new Map(d.tags.map((t) => [t.id, t.nome]))
  const nomePasta = new Map(d.pastas.map((p) => [p.id, p.nome]))
  const encontrados = new Set<string>()

  const itens: Item[] = []
  const caixas = caixa ? [caixa] : d.caixas
  for (const c of caixas) {
    const dias = diasNoPeriodo(d.porCaixa.get(c.id) ?? [], periodo).filter((dia) => dia.noCalculo)
    for (const dia of dias) {
      for (const o of dia.ocorrencias) {
        if (o.tipo !== tipo || ajustes.has(o.lancamentoId)) continue
        const categoria = nomeCategoria.get(o.categoriaId) ?? 'Sem categoria'
        if (texto) {
          const campos: [string, string | undefined][] = [
            [`categoria ${categoria}`, categoria],
            [`tag ${nomeTag.get(o.tagId ?? '')}`, nomeTag.get(o.tagId ?? '')],
            [`pasta ${nomePasta.get(o.pastaId ?? '')}`, nomePasta.get(o.pastaId ?? '')],
            ['descrição', o.descricao],
          ]
          const campo = campos.find(([, valor]) => valor && normalizar(valor).includes(texto))
          if (!campo) continue
          encontrados.add(campo[0])
        }
        itens.push({ data: dia.data, descricao: o.descricao, valor: o.valorCentavos, categoria, caixa: c.nome })
      }
    }
  }

  const filtro = texto ? ` com “${args.texto}”` : ''
  const resumo = `${nomeTipo} ${periodo.rotulo}${filtro}${caixa ? ` (${caixa.nome})` : ''}`
  if (!itens.length) {
    const nomeDoTipo = tipo === 'entrada' ? 'entrada' : 'saída'
    if (!texto) return { resumo, resultado: `Nenhuma ${nomeDoTipo} ${periodo.rotulo}.` }
    // Diz se o texto existe em algum lugar, para o modelo não supor que existe uma categoria com esse nome.
    const existe = [...d.categorias.map((c) => c.nome), ...d.tags.map((t) => t.nome), ...d.pastas.map((p) => p.nome)].find(
      (n) => normalizar(n).includes(texto),
    )
    const categorias = d.categorias.filter((c) => c.tipo === tipo).map((c) => c.nome)
    return {
      resumo,
      resultado: [
        `Nenhuma ${nomeDoTipo} ${periodo.rotulo}${filtro}.`,
        existe
          ? `Existe "${existe}" no cadastro, mas sem ${nomeDoTipo} nesse período.`
          : `Não existe categoria, tag ou pasta com “${args.texto}”, e nenhuma descrição tem esse texto nesse período.`,
        `Categorias de ${nomeDoTipo} cadastradas: ${categorias.join(', ') || 'nenhuma'}.`,
      ].join('\n'),
    }
  }

  const total = itens.reduce((t, i) => t + i.valor, 0)
  const linhas = [`${resumo}: total ${brl(total)} em ${itens.length} ${itens.length === 1 ? 'lançamento' : 'lançamentos'}.`]
  if (texto) linhas.push(`Encontrado em: ${[...encontrados].join(', ')}.`)
  // Período que atravessa hoje: o que já aconteceu e o que ainda está previsto.
  if (periodo.de <= d.hoje && periodo.ate > d.hoje) {
    const ateHoje = itens.filter((i) => i.data <= d.hoje).reduce((t, i) => t + i.valor, 0)
    linhas.push(`Até hoje: ${brl(ateHoje)}. Previsto depois de hoje: ${brl(total - ateHoje)}.`)
  } else if (periodo.de > d.hoje) {
    linhas.push('Tudo isso é previsto (ainda não aconteceu).')
  }
  const porCategoria = somarPor(itens, (i) => i.categoria)
  if (porCategoria.length > 1) {
    linhas.push(`Por categoria: ${porCategoria.slice(0, MAX_ITENS).map(([n, v]) => `${n} ${brl(v)}`).join('; ')}.`)
  }
  const porCaixa = somarPor(itens, (i) => i.caixa)
  if (porCaixa.length > 1) linhas.push(`Por caixa: ${porCaixa.map(([n, v]) => `${n} ${brl(v)}`).join('; ')}.`)
  const maiores = [...itens].sort((a, b) => b.valor - a.valor).slice(0, MAX_ITENS)
  linhas.push(`Maiores: ${maiores.map((i) => `${data(i.data)} ${i.descricao} ${brl(i.valor)}`).join('; ')}.`)
  return { resumo, resultado: linhas.join('\n') }
}

/** Soma por chave, do maior para o menor. */
function somarPor(itens: Item[], chave: (i: Item) => string): [string, number][] {
  const totais = new Map<string, number>()
  for (const i of itens) totais.set(chave(i), (totais.get(chave(i)) ?? 0) + i.valor)
  return [...totais].sort((a, b) => b[1] - a[1])
}

function resumoDoMes(args: Record<string, unknown>, d: DadosFerramentas): ResultadoFerramenta {
  if (!ehMes(args.mes)) return { resumo: 'Resumo do mês: mês inválido', resultado: 'Formato de mês inválido: use AAAA-MM.' }
  const periodo: Periodo = { de: `${args.mes}-01`, ate: fimDoMes(args.mes), rotulo: formatarMesAno(`${args.mes}-01`) }
  // "Resumo de novembro de 2026"; nas mensagens abaixo, "em novembro de 2026".
  const resumo = `Resumo de ${periodo.rotulo}`
  const fora = foraDoIntervalo(periodo, d.todos)
  if (fora) return { resumo, resultado: fora }

  const dias = diasNoPeriodo(d.todos, periodo).filter((dia) => dia.noCalculo)
  if (!dias.length) return { resumo, resultado: `Sem dados em ${periodo.rotulo}: é antes do saldo inicial.` }
  const ajustes = idsDeAjuste(d.lancamentos)
  const s = somar(dias, ajustes)
  const saidas = s.fixas + s.variaveis
  const situacao =
    periodo.ate < d.hoje ? 'Mês que já passou.' : periodo.de > d.hoje ? 'Mês futuro: tudo é previsto.' : 'Mês atual: inclui o que ainda está previsto até o fim do mês.'
  const inicio = saldoAntesDoDia(dias[0])
  const fim = dias.at(-1)!.saldoCentavos
  const menor = dias.reduce((m, dia) => ((dia.saldoCentavos ?? 0) < (m.saldoCentavos ?? 0) ? dia : m))

  const categorias = new Map<string, number>()
  for (const dia of dias) {
    for (const o of dia.ocorrencias) {
      if (o.tipo !== 'saida' || ajustes.has(o.lancamentoId)) continue
      categorias.set(o.categoriaId, (categorias.get(o.categoriaId) ?? 0) + o.valorCentavos)
    }
  }
  const maiores = [...categorias]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_ITENS)
    .map(([id, v]) => `${d.categorias.find((c) => c.id === id)?.nome ?? 'Sem categoria'} ${brl(v)}`)

  const linhas = [
    `${resumo} (Total). ${situacao}`,
    `Entrou ${brl(s.entradas)}; saiu ${brl(saidas)} (fixas ${brl(s.fixas)}, variáveis ${brl(s.variaveis)}); metas ${brl(s.economia)}; sobra ${brl(s.entradas - saidas - s.economia)}.`,
    `Saldo no começo do mês: ${inicio !== null ? brl(inicio) : 'sem dado'}; no fim: ${fim !== null ? brl(fim) : 'sem dado'}.`,
    `Menor saldo do mês: ${brl(menor.saldoCentavos ?? 0)} em ${data(menor.data)}.`,
  ]
  if (maiores.length) linhas.push(`Maiores categorias de gasto: ${maiores.join('; ')}.`)
  return { resumo, resultado: linhas.join('\n') }
}

function saldoNoDia(args: Record<string, unknown>, d: DadosFerramentas): ResultadoFerramenta {
  if (!ehDia(args.data)) return { resumo: 'Saldo: data inválida', resultado: 'Formato de data inválido: use AAAA-MM-DD.' }
  const dia = args.data
  const caixa = lerCaixa(args.caixa, caixasAtivos(d.caixas))
  if (typeof caixa === 'string') return { resumo: 'Saldo: caixa não encontrado', resultado: caixa }
  const nome = caixa?.nome ?? 'Total'
  const resumo = `Saldo de ${nome} em ${data(dia)}`
  const projecoes = caixa ? (d.porCaixa.get(caixa.id) ?? []) : d.todos
  const fora = foraDoIntervalo({ de: dia, ate: dia, rotulo: '' }, projecoes)
  if (fora) return { resumo, resultado: fora }
  const saldo = diasNoPeriodo(projecoes, { de: dia, ate: dia })[0]?.saldoCentavos ?? null
  if (saldo === null) return { resumo, resultado: `Sem saldo em ${data(dia)}: é antes do saldo inicial de ${nome}.` }
  const quando = dia < d.hoje ? 'foi' : dia === d.hoje ? 'é' : 'está previsto em'
  return {
    resumo,
    resultado: `O saldo de ${nome} no fim de ${data(dia)} ${quando} ${brl(saldo)}.${saldo < 0 ? ' Saldo negativo: falta dinheiro nesse dia.' : ''}${
      !caixa && caixasNoTotal(d.caixas).length > 1 ? ` O Total soma: ${caixasNoTotal(d.caixas).map((c) => c.nome).join(', ')}.` : ''
    }`,
  }
}

function descreverRisco(risco: AnaliseRisco): string {
  return `${NIVEL[risco.nivel].nome} (dia mais apertado ${data(risco.menorSaldo.data)}, com ${brl(risco.menorSaldo.valorCentavos)})`
}

function simularGasto(args: Record<string, unknown>, d: DadosFerramentas): ResultadoFerramenta {
  const valor = typeof args.valor === 'number' ? args.valor : Number(String(args.valor ?? '').replace(/\./g, '').replace(',', '.'))
  if (!Number.isFinite(valor) || valor <= 0) return { resumo: 'Simulação: valor inválido', resultado: 'Informe um valor em reais maior que zero.' }
  const centavos = Math.round(valor * 100)
  const frequencia: FrequenciaConta = args.frequencia === 'mensal' ? 'mensal' : 'unica'
  const dia = ehDia(args.data) ? args.data : d.hoje
  if (dia < d.hoje) return { resumo: 'Simulação: data no passado', resultado: 'A data do gasto precisa ser hoje ou depois.' }

  const contas = caixasNoTotal(d.caixas).filter((c) => c.tipo === 'conta' && !c.arquivado)
  const escolhida = lerCaixa(args.conta, contas)
  if (typeof escolhida === 'string') return { resumo: 'Simulação: conta não encontrada', resultado: escolhida }
  const conta = escolhida ?? contas[0]
  if (!conta) return { resumo: 'Simulação', resultado: 'Não há conta para simular.' }

  const resumo = `Simulação: ${brl(centavos)} ${frequencia === 'mensal' ? `por mês a partir de ${data(dia)}` : `em ${data(dia)}`} (${conta.nome})`
  const atual = analisarRisco((d.porCaixa.get(conta.id) ?? []).flatMap((p) => p.dias), d.hoje)
  if (!atual) return { resumo, resultado: 'Sem dias calculados para simular nessa conta.' }
  const ctx = { caixa: conta, lancamentos: lancamentosDoCaixa(d.lancamentos, conta.id), metas: metasDoCaixa(d.metas, conta.id), hoje: d.hoje }
  const com = riscoCom(ctx, [...ctx.lancamentos, contaSimulada(centavos, frequencia, dia, conta.id)])
  const maior = maiorContaSemPiorar(ctx, frequencia, dia, atual)
  if (!com) return { resumo, resultado: 'Sem dias calculados para simular nessa conta.' }

  const conclusao = com.primeiroNegativo
    ? `Não cabe: falta dinheiro a partir de ${data(com.primeiroNegativo)}.`
    : com.nivel > atual.nivel
      ? `Cabe sem faltar dinheiro, mas piora o risco de ${NIVEL[atual.nivel].nome} para ${NIVEL[com.nivel].nome}.`
      : 'Cabe sem piorar o risco do caixa.'
  return {
    resumo,
    resultado: [
      `${resumo}.`,
      `Conclusão: ${conclusao}`,
      `Risco hoje: ${descreverRisco(atual)}. Com o gasto: ${descreverRisco(com)}.`,
      `Maior valor ${frequencia === 'mensal' ? 'por mês ' : ''}que cabe sem piorar o risco: ${brl(maior)}.`,
    ].join('\n'),
  }
}
