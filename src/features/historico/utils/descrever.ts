import { ehCartao, ehInvestimento, type Caixa } from '@/features/caixas/model/caixa'
import type { MetaEconomia } from '@/features/economias/model/meta'
import { descreverRecorrencia } from '@/features/lancamentos/constants/textos'
import type { Lancamento, TipoLancamento } from '@/features/lancamentos/model/lancamento'
import { ehAjusteDeSaldo } from '@/features/lancamentos/utils/ajuste'
import { formatarDiaMes, formatarMesAno, somarDias, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import type { DadosFinancas } from '@/store/model/dados'
import type { AcaoFinancas } from '@/store/reducer/financas-reducer'
import type { DescricaoAtividade, TomAtividade } from '../model/atividade'

/** Até quantos nomes aparecem numa frase de lote ("Aluguel e Luz"); acima disso, só a quantidade. */
const MAX_NOMES = 2

const ARTIGO_TIPO: Record<TipoLancamento, string> = {
  entrada: 'a entrada',
  saida: 'a saída',
  transferencia: 'a transferência',
}

/** "A", "A e B", "A, B e C". */
export function listarNomes(nomes: string[]): string {
  if (nomes.length <= 1) return nomes[0] ?? ''
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

/** "1 lançamento", "4 lançamentos". */
function contarLancamentos(n: number): string {
  return `${n} ${n === 1 ? 'lançamento' : 'lançamentos'}`
}

/** Os nomes (até `MAX_NOMES`) ou "4 lançamentos". */
function quaisLancamentos(lista: Lancamento[]): string {
  const nomes = [...new Set(lista.map((l) => l.descricao))]
  return lista.length <= MAX_NOMES && nomes.length === lista.length ? listarNomes(nomes) : contarLancamentos(lista.length)
}

/** Igualdade de valores simples (objetos, listas, textos, números), sem depender da ordem das chaves. */
function iguais(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ra = a as Record<string, unknown>
  const rb = b as Record<string, unknown>
  const chaves = new Set([...Object.keys(ra), ...Object.keys(rb)])
  for (const k of chaves) if (!iguais(ra[k], rb[k])) return false
  return true
}

function tomDoTipo(tipo: TipoLancamento): TomAtividade | undefined {
  return tipo === 'transferencia' ? undefined : tipo
}

const nomeDe = <T extends { id: string; nome: string }>(lista: T[], id: string | undefined) =>
  id ? lista.find((x) => x.id === id)?.nome : undefined

/** "a conta Nubank", "o cartão Nubank", "o benefício VR", "a conta de investimento Poupança". */
function oCaixa(caixa: Caixa): string {
  if (ehInvestimento(caixa)) return `a conta de investimento ${caixa.nome}`
  if (caixa.tipo === 'cartao') return `o cartão ${caixa.nome}`
  if (caixa.tipo === 'beneficio') return `o benefício ${caixa.nome}`
  return `a conta ${caixa.nome}`
}

/** "todo dia 5", "em 31/10", "toda terça"… */
function quando(l: Lancamento): string {
  if (l.recorrencia.tipo === 'unica') return `em ${formatarDiaMes(l.recorrencia.data)}`
  const texto = descreverRecorrencia(l)
  return texto.charAt(0).toLowerCase() + texto.slice(1)
}

/** Uma mudança num lançamento: a frase sozinha e o nome curto, para quando muda mais de uma coisa. */
interface Mudanca {
  frase: string
  curto: string
}

/** O que mudou de dia: data original → data nova (o único, pela data; o recorrente, por `movidas`). */
function mudancasDeDia(antes: Lancamento, depois: Lancamento): { de: DataISO; para: DataISO | null }[] {
  if (antes.recorrencia.tipo === 'unica' && depois.recorrencia.tipo === 'unica') {
    return antes.recorrencia.data === depois.recorrencia.data ? [] : [{ de: antes.recorrencia.data, para: depois.recorrencia.data }]
  }
  const a = antes.movidas ?? {}
  const d = depois.movidas ?? {}
  const datas = [...new Set([...Object.keys(a), ...Object.keys(d)])].sort()
  return datas.filter((de) => a[de] !== d[de]).map((de) => ({ de, para: d[de] ?? null }))
}

/** O que mudou num lançamento, cada coisa com a frase dela. */
function mudancasDoLancamento(antes: Lancamento, depois: Lancamento, dados: DadosFinancas): Mudanca[] {
  const nome = depois.descricao
  const mudancas: Mudanca[] = []

  /** Ao encerrar, as mudanças de um dia depois do novo fim saem junto: não são outra alteração. */
  const depoisDoFim = (data: DataISO) => !!depois.fim && depois.fim !== antes.fim && data > depois.fim

  for (const { de, para } of mudancasDeDia(antes, depois).filter((m) => m.para || !depoisDoFim(m.de))) {
    mudancas.push(
      para
        ? { frase: `Levou ${nome} de ${formatarDiaMes(de)} para ${formatarDiaMes(para)}`, curto: 'dia' }
        : { frase: `Voltou ${nome} para o dia ${formatarDiaMes(de)}`, curto: 'dia' },
    )
  }

  const ea = antes.excecoes ?? {}
  const ed = depois.excecoes ?? {}
  for (const data of [...new Set([...Object.keys(ea), ...Object.keys(ed)])].sort()) {
    if (ea[data] === ed[data] || depoisDoFim(data)) continue
    const valor = ed[data]
    if (valor === 0) mudancas.push({ frase: `Pulou ${nome} em ${formatarDiaMes(data)}`, curto: 'um dia' })
    else if (valor !== undefined) {
      mudancas.push({
        frase: `Mudou o valor de ${nome} só em ${formatarDiaMes(data)} para ${formatarBRL(valor)}`,
        curto: 'valor de um dia',
      })
    } else if (ea[data] === 0) mudancas.push({ frase: `Voltou a contar ${nome} em ${formatarDiaMes(data)}`, curto: 'um dia' })
    else mudancas.push({ frase: `Voltou ${nome} ao valor de sempre em ${formatarDiaMes(data)}`, curto: 'valor de um dia' })
  }

  if (antes.valorCentavos !== depois.valorCentavos) {
    mudancas.push({ frase: `Mudou o valor de ${nome} para ${formatarBRL(depois.valorCentavos)}`, curto: 'valor' })
  }
  if (antes.descricao !== depois.descricao) {
    mudancas.push({ frase: `Mudou o nome de ${antes.descricao} para ${depois.descricao}`, curto: 'nome' })
  }
  if (antes.tipo !== depois.tipo) {
    mudancas.push({ frase: `Transformou ${nome} em ${ARTIGO_TIPO[depois.tipo].slice(2)}`, curto: 'tipo' })
  }
  if (antes.categoriaId !== depois.categoriaId && depois.categoriaId) {
    const categoria = nomeDe(dados.categorias, depois.categoriaId) ?? 'outra'
    mudancas.push({ frase: `Mudou a categoria de ${nome} para ${categoria}`, curto: 'categoria' })
  }
  if (antes.tagId !== depois.tagId) {
    const tag = nomeDe(dados.tags, depois.tagId)
    mudancas.push({ frase: tag ? `Mudou a tag de ${nome} para ${tag}` : `Tirou a tag de ${nome}`, curto: 'tag' })
  }
  if (antes.pastaId !== depois.pastaId) {
    const pasta = nomeDe(dados.pastas, depois.pastaId)
    mudancas.push({ frase: pasta ? `Pôs ${nome} na pasta ${pasta}` : `Tirou ${nome} da pasta`, curto: 'pasta' })
  }
  if (antes.caixaId !== depois.caixaId || antes.caixaDestinoId !== depois.caixaDestinoId) {
    const caixa = dados.caixas.find((c) => c.id === depois.caixaId)
    mudancas.push({ frase: caixa ? `Passou ${nome} para ${oCaixa(caixa)}` : `Mudou a conta de ${nome}`, curto: 'conta' })
  }
  if (antes.natureza !== depois.natureza && antes.tipo === depois.tipo) {
    mudancas.push({
      frase: `Marcou ${nome} como ${depois.natureza === 'fixa' ? 'fixo' : 'variável'}`,
      curto: 'fixo ou variável',
    })
  }
  const mudouRepeticao =
    !iguais(antes.recorrencia, depois.recorrencia) &&
    !(antes.recorrencia.tipo === 'unica' && depois.recorrencia.tipo === 'unica')
  if (mudouRepeticao) mudancas.push({ frase: `Mudou a repetição de ${nome}: ${quando(depois)}`, curto: 'repetição' })
  if (antes.inicio !== depois.inicio) {
    mudancas.push({
      frase: depois.inicio ? `Mudou o começo de ${nome} para ${formatarDiaMes(depois.inicio)}` : `Tirou a data de começo de ${nome}`,
      curto: 'começo',
    })
  }
  if (antes.fim !== depois.fim) {
    mudancas.push({
      frase: depois.fim ? `Encerrou ${nome}: a última vez fica até ${formatarDiaMes(depois.fim)}` : `Tirou o fim de ${nome}`,
      curto: 'fim',
    })
  }
  return mudancas
}

/** Antes deste, outro com o mesmo nome e caixa terminou na véspera: é "mudar daqui para frente". */
function antecessor(novo: Lancamento, dados: DadosFinancas): Lancamento | undefined {
  if (!novo.inicio || novo.recorrencia.tipo === 'unica') return undefined
  const vespera = somarDias(novo.inicio, -1)
  return dados.lancamentos.find(
    (l) => l.id !== novo.id && l.descricao === novo.descricao && l.caixaId === novo.caixaId && l.fim === vespera,
  )
}

function descreverNovoLancamento(l: Lancamento, dados: DadosFinancas): DescricaoAtividade {
  const base = { tipo: 'lancamento' as const, tom: tomDoTipo(l.tipo), caixaId: l.caixaId }
  const caixa = dados.caixas.find((c) => c.id === l.caixaId)
  if (ehAjusteDeSaldo(l)) {
    const quem = caixa && dados.caixas.length > 1 ? ` de ${caixa.nome}` : ''
    const oque = caixa && ehCartao(caixa) ? 'a fatura' : 'o saldo'
    return { ...base, texto: `Conferiu ${oque}${quem}: ajuste de ${formatarBRL(l.valorCentavos)}` }
  }
  const anterior = antecessor(l, dados)
  if (anterior && l.inicio) {
    const comparavel = { ...anterior, inicio: l.inicio, fim: l.fim, excecoes: l.excecoes, movidas: l.movidas }
    const curtos = [...new Set(mudancasDoLancamento(comparavel, l, dados).map((m) => m.curto))]
    const desde = `a partir de ${formatarDiaMes(l.inicio)}`
    const texto =
      curtos.length === 1 && curtos[0] === 'valor'
        ? `Mudou o valor de ${l.descricao} ${desde} para ${formatarBRL(l.valorCentavos)}`
        : `Mudou ${l.descricao} ${desde}${curtos.length ? ` (${listarNomes(curtos)})` : ''}`
    return { ...base, texto }
  }
  const destino = l.tipo === 'transferencia' ? nomeDe(dados.caixas, l.caixaDestinoId) : undefined
  const rota = destino && caixa ? `, de ${caixa.nome} para ${destino}` : ''
  return {
    ...base,
    texto: `Adicionou ${ARTIGO_TIPO[l.tipo]} ${l.descricao} de ${formatarBRL(l.valorCentavos)} ${quando(l)}${rota}`,
  }
}

function descreverLancamentoSalvo(l: Lancamento, dados: DadosFinancas): DescricaoAtividade | null {
  const antes = dados.lancamentos.find((x) => x.id === l.id)
  if (!antes) return descreverNovoLancamento(l, dados)
  const mudancas = mudancasDoLancamento(antes, l, dados)
  if (mudancas.length === 0) return null
  const texto =
    mudancas.length === 1
      ? mudancas[0].frase
      : `Editou ${ARTIGO_TIPO[l.tipo]} ${l.descricao} (${listarNomes([...new Set(mudancas.map((m) => m.curto))])})`
  return { tipo: 'lancamento', texto, tom: tomDoTipo(l.tipo), caixaId: l.caixaId }
}

/** O mesmo valor em todos (ou undefined se variar). */
function unico<T>(valores: T[]): { valor: T } | undefined {
  return valores.length > 0 && valores.every((v) => v === valores[0]) ? { valor: valores[0] } : undefined
}

/** Vários lançamentos de uma vez (mudar o dia de vários, edição em lote, desfazer): uma frase só. */
function descreverVarios(lista: Lancamento[], dados: DadosFinancas): DescricaoAtividade | null {
  const porId = new Map(dados.lancamentos.map((l) => [l.id, l]))
  const mudados = lista.filter((l) => !iguais(porId.get(l.id), l))
  if (mudados.length === 0) return null
  if (mudados.length === 1) return descreverLancamentoSalvo(mudados[0], dados)

  const tom = unico(mudados.map((l) => tomDoTipo(l.tipo)))?.valor
  const caixaId = unico(mudados.map((l) => l.caixaId))?.valor
  const base = { tipo: 'lancamento' as const, tom, caixaId }
  const quais = quaisLancamentos(mudados)

  const novos = mudados.filter((l) => !porId.has(l.id))
  if (novos.length === mudados.length) return { ...base, texto: `Adicionou ${quais}` }
  if (novos.length > 0) return { ...base, texto: `Mudou ${quais}` }

  const pares = mudados.map((l) => ({ antes: porId.get(l.id)!, depois: l }))
  const dias = pares.map(({ antes, depois }) => mudancasDeDia(antes, depois))
  const soDia = pares.every(({ antes, depois }, i) => {
    const resto = mudancasDoLancamento(antes, depois, dados).filter((m) => m.curto !== 'dia')
    return dias[i].length > 0 && resto.length === 0
  })
  if (soDia) {
    const movidas = dias.flat()
    const de = unico(movidas.map((m) => m.de))?.valor
    const para = unico(movidas.map((m) => m.para))?.valor
    if (para === null) return { ...base, texto: `Voltou ${quais} para o dia de sempre` }
    if (para && de) return { ...base, texto: `Levou ${quais} de ${formatarDiaMes(de)} para ${formatarDiaMes(para)}` }
    if (para) return { ...base, texto: `Levou ${quais} para ${formatarDiaMes(para)}` }
    return { ...base, texto: `Mudou o dia de ${quais}` }
  }

  const curtos = new Set(pares.flatMap(({ antes, depois }) => mudancasDoLancamento(antes, depois, dados).map((m) => m.curto)))
  if (curtos.size === 1) {
    const [campo] = curtos
    if (campo === 'categoria') {
      const nome = nomeDe(dados.categorias, unico(mudados.map((l) => l.categoriaId))?.valor)
      if (nome) return { ...base, texto: `Mudou a categoria de ${quais} para ${nome}` }
    }
    if (campo === 'tag') {
      const tagId = unico(mudados.map((l) => l.tagId))
      if (tagId && !tagId.valor) return { ...base, texto: `Tirou a tag de ${quais}` }
      const nome = nomeDe(dados.tags, tagId?.valor)
      if (nome) return { ...base, texto: `Mudou a tag de ${quais} para ${nome}` }
    }
    if (campo === 'pasta') {
      const pastaId = unico(mudados.map((l) => l.pastaId))
      if (pastaId && !pastaId.valor) return { ...base, texto: `Tirou ${quais} da pasta` }
      const nome = nomeDe(dados.pastas, pastaId?.valor)
      if (nome) return { ...base, texto: `Pôs ${quais} na pasta ${nome}` }
    }
    if (campo === 'conta') {
      const caixa = dados.caixas.find((c) => c.id === unico(mudados.map((l) => l.caixaId))?.valor)
      if (caixa) return { ...base, texto: `Passou ${quais} para ${oCaixa(caixa)}` }
    }
    return { ...base, texto: `Mudou ${quais} (${campo})` }
  }
  return { ...base, texto: `Mudou ${quais}` }
}

function descreverExclusao(ids: string[], dados: DadosFinancas): DescricaoAtividade | null {
  const conjunto = new Set(ids)
  const removidos = dados.lancamentos.filter((l) => conjunto.has(l.id))
  if (removidos.length === 0) return null
  const tom = unico(removidos.map((l) => tomDoTipo(l.tipo)))?.valor
  const caixaId = unico(removidos.map((l) => l.caixaId))?.valor
  if (removidos.length === 1) {
    const [l] = removidos
    const texto = ehAjusteDeSaldo(l)
      ? `Excluiu um ajuste de saldo de ${formatarBRL(l.valorCentavos)}`
      : `Excluiu ${ARTIGO_TIPO[l.tipo]} ${l.descricao}`
    return { tipo: 'lancamento', texto, tom, caixaId }
  }
  return { tipo: 'lancamento', texto: `Excluiu ${quaisLancamentos(removidos)}`, tom, caixaId }
}

function descreverMeta(meta: MetaEconomia, dados: DadosFinancas): DescricaoAtividade | null {
  const base = { tipo: 'meta' as const, tom: 'economia' as const, caixaId: meta.caixaId }
  const antes = dados.metas.find((m) => m.id === meta.id)
  if (!antes) return { ...base, texto: `Criou a meta ${meta.nome}` }

  const nome = meta.nome
  const frases: string[] = []
  const resgatesAntes = new Map((antes.resgates ?? []).map((r) => [r.id, r]))
  const resgatesDepois = new Map((meta.resgates ?? []).map((r) => [r.id, r]))
  for (const r of resgatesDepois.values()) {
    const anterior = resgatesAntes.get(r.id)
    if (!anterior) frases.push(`Usou ${formatarBRL(r.valorCentavos)} da meta ${nome}`)
    else if (!iguais(anterior, r)) frases.push(`Mudou o uso de dinheiro da meta ${nome} para ${formatarBRL(r.valorCentavos)}`)
  }
  for (const r of resgatesAntes.values()) {
    if (!resgatesDepois.has(r.id)) frases.push(`Desfez o uso de ${formatarBRL(r.valorCentavos)} da meta ${nome}`)
  }
  if (!antes.encerradaEm && meta.encerradaEm) frases.push(`Parou a meta ${nome}`)
  if (antes.encerradaEm && !meta.encerradaEm) frases.push(`Voltou a guardar na meta ${nome}`)
  if (antes.nome !== meta.nome) frases.push(`Mudou o nome da meta ${antes.nome} para ${nome}`)
  if (antes.aporteMensalCentavos !== meta.aporteMensalCentavos) {
    frases.push(`Mudou quanto guarda por mês na meta ${nome} para ${formatarBRL(meta.aporteMensalCentavos)}`)
  }
  if (antes.valorAlvoCentavos !== meta.valorAlvoCentavos) {
    frases.push(
      meta.valorAlvoCentavos
        ? `Mudou o valor a juntar da meta ${nome} para ${formatarBRL(meta.valorAlvoCentavos)}`
        : `Tirou o valor a juntar da meta ${nome}`,
    )
  }
  const meses = [...new Set([...Object.keys(antes.ajustes), ...Object.keys(meta.ajustes)])].filter(
    (m) => antes.ajustes[m] !== meta.ajustes[m],
  )
  if (meses.length === 1) {
    const [mes] = meses
    const valor = meta.ajustes[mes]
    frases.push(
      valor === undefined
        ? `Voltou ao plano a meta ${nome} em ${formatarMesAno(`${mes}-01`)}`
        : `Anotou que guardou ${formatarBRL(valor)} na meta ${nome} em ${formatarMesAno(`${mes}-01`)}`,
    )
  } else if (meses.length > 1) frases.push(`Corrigiu quanto guardou na meta ${nome} em ${meses.length} meses`)

  if (frases.length === 1) return { ...base, texto: frases[0] }
  if (frases.length > 1) return { ...base, texto: `Mudou a meta ${nome}: ${frases.length} alterações` }
  return iguais(antes, meta) ? null : { ...base, texto: `Editou a meta ${nome}` }
}

function descreverCaixa(caixa: Caixa, dados: DadosFinancas): DescricaoAtividade | null {
  const base = { tipo: 'caixa' as const, caixaId: caixa.id }
  const antes = dados.caixas.find((c) => c.id === caixa.id)
  if (!antes) return { ...base, texto: `Criou ${oCaixa(caixa)}` }
  if (iguais(antes, caixa)) return null

  const frases: string[] = []
  if (!antes.arquivado && caixa.arquivado) frases.push(`Arquivou ${oCaixa(caixa)}`)
  if (antes.arquivado && !caixa.arquivado) frases.push(`Voltou a usar ${oCaixa(caixa)}`)
  if (antes.nome !== caixa.nome) frases.push(`Mudou o nome de ${oCaixa(antes)} para ${caixa.nome}`)
  if (antes.saldoInicialCentavos !== caixa.saldoInicialCentavos || antes.dataSaldoInicial !== caixa.dataSaldoInicial) {
    frases.push(
      caixa.tipo === 'cartao'
        ? `Mudou quanto devia no cartão ${caixa.nome} para ${formatarBRL(Math.abs(caixa.saldoInicialCentavos))}`
        : `Mudou o saldo inicial de ${caixa.nome} para ${formatarBRL(caixa.saldoInicialCentavos)} em ${formatarDiaMes(caixa.dataSaldoInicial)}`,
    )
  }
  if (frases.length === 1) return { ...base, texto: frases[0] }
  if (frases.length > 1) return { ...base, texto: `Editou ${oCaixa(caixa)}` }

  const soOrdem = iguais({ ...antes, ordem: 0 }, { ...caixa, ordem: 0 })
  if (soOrdem) return { tipo: 'caixa', texto: 'Mudou a ordem das contas' }
  return { ...base, texto: `Editou ${oCaixa(caixa)}` }
}

/** Categoria, tag ou pasta: criar, renomear, mudar a cor ou outra edição. */
function descreverCadastro<T extends { id: string; nome: string; cor: string }>(
  item: T,
  lista: T[],
  nomeDoTipo: string,
): DescricaoAtividade | null {
  const base = { tipo: 'organizacao' as const }
  const antes = lista.find((x) => x.id === item.id)
  if (!antes) return { ...base, texto: `Criou a ${nomeDoTipo} ${item.nome}` }
  if (iguais(antes, item)) return null
  if (antes.nome !== item.nome) return { ...base, texto: `Mudou o nome da ${nomeDoTipo} ${antes.nome} para ${item.nome}` }
  if (antes.cor !== item.cor && iguais({ ...antes, cor: '' }, { ...item, cor: '' })) {
    return { ...base, texto: `Mudou a cor da ${nomeDoTipo} ${item.nome}` }
  }
  return { ...base, texto: `Editou a ${nomeDoTipo} ${item.nome}` }
}

function descreverExclusaoDeCadastro(nome: string | undefined, nomeDoTipo: string): DescricaoAtividade | null {
  return nome === undefined ? null : { tipo: 'organizacao', texto: `Excluiu a ${nomeDoTipo} ${nome}` }
}

/**
 * Frase do que a pessoa fez com uma ação do reducer, comparando com os dados de antes; null se a ação não muda dados
 * (carregar, ocultar saldos) ou não mudou nada.
 */
export function descreverAcao(antes: DadosFinancas, acao: AcaoFinancas): DescricaoAtividade | null {
  switch (acao.tipo) {
    case 'lancamento/salvar':
      return descreverLancamentoSalvo(acao.lancamento, antes)
    case 'lancamento/salvarVarios':
      return descreverVarios(acao.lancamentos, antes)
    case 'lancamento/excluir':
      return descreverExclusao([acao.id], antes)
    case 'lancamento/excluirVarios':
      return descreverExclusao(acao.ids, antes)
    case 'meta/salvar':
      return descreverMeta(acao.meta, antes)
    case 'meta/excluir': {
      const meta = antes.metas.find((m) => m.id === acao.id)
      return meta ? { tipo: 'meta', texto: `Excluiu a meta ${meta.nome}`, tom: 'economia', caixaId: meta.caixaId } : null
    }
    case 'caixa/salvar':
      return descreverCaixa(acao.caixa, antes)
    case 'caixa/excluir': {
      const caixa = antes.caixas.find((c) => c.id === acao.id)
      return caixa ? { tipo: 'caixa', texto: `Excluiu ${oCaixa(caixa)}` } : null
    }
    case 'categoria/salvar':
      return descreverCadastro(acao.categoria, antes.categorias, 'categoria')
    case 'categoria/excluir':
      return descreverExclusaoDeCadastro(nomeDe(antes.categorias, acao.id), 'categoria')
    case 'tag/salvar':
      return descreverCadastro(acao.tag, antes.tags, 'tag')
    case 'tag/excluir':
      return descreverExclusaoDeCadastro(nomeDe(antes.tags, acao.id), 'tag')
    case 'pasta/salvar':
      return descreverCadastro(acao.pasta, antes.pastas, 'pasta')
    case 'pasta/excluir':
      return descreverExclusaoDeCadastro(nomeDe(antes.pastas, acao.id), 'pasta')
    case 'dados/importar':
      return { tipo: 'dados', texto: 'Importou um backup' }
    case 'dados/carregar':
    case 'atividade/registrar':
    case 'saldos/alternarVisibilidade':
      return null
  }
}
