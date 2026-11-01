import { ehCartao, ehInvestimento, type Caixa } from '@/features/caixas/model/caixa'
import type { MetaEconomia } from '@/features/economias/model/meta'
import { descreverRecorrencia, ROTULO_NATUREZA, ROTULO_TIPO } from '@/features/lancamentos/constants/textos'
import { valorNoDia, type Lancamento, type TipoLancamento } from '@/features/lancamentos/model/lancamento'
import { ehAjusteDeSaldo } from '@/features/lancamentos/utils/ajuste'
import { formatarData, formatarDiaMes, formatarMesAno, somarDias, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import type { DadosFinancas } from '@/store/model/dados'
import type { AcaoFinancas } from '@/store/reducer/financas-reducer'
import type { DescricaoAtividade, LinhaDetalhe, ParteDetalhe, TomAtividade } from '../model/atividade'
import {
  limitarLinhas,
  parcelasDoLancamento,
  parteDaLista,
  parteDaMeta,
  parteDoCadastro,
  parteDoCaixa,
  partesDoLancamento,
  topoDoLancamento,
  usosDoCadastro,
  vezes,
} from './detalhes'
import { regexDosNomes } from './destaque'

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

const nomeDaTag = (dados: DadosFinancas, id: string | undefined) => nomeDe(dados.tags, id) ?? 'Sem tag'
const nomeDaPasta = (dados: DadosFinancas, id: string | undefined) => nomeDe(dados.pastas, id) ?? 'Sem pasta'
const nomeDaCategoria = (dados: DadosFinancas, id: string | undefined) => nomeDe(dados.categorias, id) ?? 'Sem categoria'
const nomeDoCaixa = (dados: DadosFinancas, id: string | undefined) => nomeDe(dados.caixas, id) ?? 'Conta excluída'

/** "a conta Nubank", "o cartão Nubank", "o benefício VR", "a conta de investimento Poupança". */
function oCaixa(caixa: Caixa): string {
  if (ehInvestimento(caixa)) return `a conta de investimento ${caixa.nome}`
  if (caixa.tipo === 'cartao') return `o cartão ${caixa.nome}`
  if (caixa.tipo === 'beneficio') return `o benefício ${caixa.nome}`
  return `a conta ${caixa.nome}`
}

/** "31/10" no ano de hoje; "31/10/2027" em outro ano, para a data não ficar ambígua. */
function dataCurta(data: DataISO): string {
  return data.slice(0, 4) === String(new Date().getFullYear()) ? formatarDiaMes(data) : formatarData(data)
}

/** "todo dia 5", "em 31/10", "toda terça"… */
function quando(l: Lancamento): string {
  if (l.recorrencia.tipo === 'unica') return `em ${dataCurta(l.recorrencia.data)}`
  const texto = descreverRecorrencia(l)
  return texto.charAt(0).toLowerCase() + texto.slice(1)
}

/**
 * Quanto e quando, por extenso: " de R$ 112,00 em 31/10", " de R$ 225,46 todo dia 6, a partir de 06/11" ou, com
 * começo e fim, as vezes: ": 2 vezes de R$ 225,46 (todo dia 6, de 06/11 a 06/12)".
 */
function quantoEQuando(l: Lancamento): string {
  const valor = formatarBRL(l.valorCentavos)
  if (l.recorrencia.tipo === 'unica') return ` de ${valor} ${quando(l)}`
  const parcelas = parcelasDoLancamento(l)
  if (parcelas && l.inicio) {
    return `: ${vezes(parcelas.total)} de ${valor} (${quando(l)}, de ${dataCurta(l.inicio)} a ${dataCurta(parcelas.ultima)})`
  }
  const desde = l.inicio ? `, a partir de ${dataCurta(l.inicio)}` : ''
  const ate = l.fim ? `, até ${dataCurta(l.fim)}` : ''
  return ` de ${valor} ${quando(l)}${desde}${ate}`
}

/**
 * Uma mudança num lançamento: a frase sozinha, o nome curto (para quando muda mais de uma coisa) e a linha do
 * extrato, com o antes e o depois.
 */
interface Mudanca {
  frase: string
  curto: string
  rotulo: string
  antes: string
  depois: string
}

const linhaDa = (m: Pick<Mudanca, 'rotulo' | 'antes' | 'depois'>): LinhaDetalhe => ({
  rotulo: m.rotulo,
  valor: m.depois,
  antes: m.antes,
})

/** O valor de um dia de um recorrente, por extenso ("Pulado" quando é 0). */
function valorDoDia(l: Lancamento, data: DataISO): string {
  const valor = valorNoDia(l, data)
  return valor === 0 ? 'Pulado' : formatarBRL(valor)
}

/** "Conta principal" ou, na transferência, "Conta principal → Poupança". */
function contasDo(l: Lancamento, dados: DadosFinancas): string {
  const origem = nomeDoCaixa(dados, l.caixaId)
  return l.tipo === 'transferencia' ? `${origem} → ${nomeDoCaixa(dados, l.caixaDestinoId)}` : origem
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

/** O que mudou num lançamento, cada coisa com a frase dela e o antes e depois. */
function mudancasDoLancamento(antes: Lancamento, depois: Lancamento, dados: DadosFinancas): Mudanca[] {
  const nome = depois.descricao
  const mudancas: Mudanca[] = []

  /** Ao encerrar, as mudanças de um dia depois do novo fim saem junto: não são outra alteração. */
  const depoisDoFim = (data: DataISO) => !!depois.fim && depois.fim !== antes.fim && data > depois.fim

  const unico = depois.recorrencia.tipo === 'unica'
  for (const { de, para } of mudancasDeDia(antes, depois).filter((m) => m.para || !depoisDoFim(m.de))) {
    const dia = { curto: 'dia', rotulo: unico ? 'Dia' : `Vez de ${dataCurta(de)}`, antes: dataCurta(antes.movidas?.[de] ?? de) }
    mudancas.push(
      para
        ? { ...dia, frase: `Levou ${nome} de ${dataCurta(de)} para ${dataCurta(para)}`, depois: dataCurta(para) }
        : { ...dia, frase: `Voltou ${nome} para o dia ${dataCurta(de)}`, depois: dataCurta(de) },
    )
  }

  const ea = antes.excecoes ?? {}
  const ed = depois.excecoes ?? {}
  for (const data of [...new Set([...Object.keys(ea), ...Object.keys(ed)])].sort()) {
    if (ea[data] === ed[data] || depoisDoFim(data)) continue
    const valor = ed[data]
    const dia = { rotulo: `Valor em ${formatarData(data)}`, antes: valorDoDia(antes, data), depois: valorDoDia(depois, data) }
    if (valor === 0) mudancas.push({ ...dia, frase: `Pulou ${nome} em ${dataCurta(data)}`, curto: 'um dia' })
    else if (valor !== undefined) {
      mudancas.push({
        ...dia,
        frase: `Mudou o valor de ${nome} só em ${dataCurta(data)}: de ${dia.antes} para ${dia.depois}`,
        curto: 'valor de um dia',
      })
    } else if (ea[data] === 0) mudancas.push({ ...dia, frase: `Voltou a contar ${nome} em ${dataCurta(data)}`, curto: 'um dia' })
    else mudancas.push({ ...dia, frase: `Voltou ${nome} ao valor de sempre em ${dataCurta(data)}`, curto: 'valor de um dia' })
  }

  if (antes.valorCentavos !== depois.valorCentavos) {
    const valor = { rotulo: 'Valor', antes: formatarBRL(antes.valorCentavos), depois: formatarBRL(depois.valorCentavos) }
    mudancas.push({ ...valor, frase: `Mudou o valor de ${nome} de ${valor.antes} para ${valor.depois}`, curto: 'valor' })
  }
  if (antes.descricao !== depois.descricao) {
    mudancas.push({
      frase: `Mudou o nome de ${antes.descricao} para ${depois.descricao}`,
      curto: 'nome',
      rotulo: 'Descrição',
      antes: antes.descricao,
      depois: depois.descricao,
    })
  }
  if (antes.tipo !== depois.tipo) {
    mudancas.push({
      frase: `Transformou ${nome} em ${ARTIGO_TIPO[depois.tipo].slice(2)}`,
      curto: 'tipo',
      rotulo: 'Tipo',
      antes: ROTULO_TIPO[antes.tipo],
      depois: ROTULO_TIPO[depois.tipo],
    })
  }
  if (antes.categoriaId !== depois.categoriaId && depois.categoriaId) {
    const categoria = { rotulo: 'Categoria', antes: nomeDaCategoria(dados, antes.categoriaId), depois: nomeDaCategoria(dados, depois.categoriaId) }
    mudancas.push({ ...categoria, frase: `Mudou a categoria de ${nome} para ${categoria.depois}`, curto: 'categoria' })
  }
  if (antes.tagId !== depois.tagId) {
    const tag = nomeDe(dados.tags, depois.tagId)
    mudancas.push({
      frase: tag ? `Mudou a tag de ${nome} para ${tag}` : `Tirou a tag de ${nome}`,
      curto: 'tag',
      rotulo: 'Necessário?',
      antes: nomeDaTag(dados, antes.tagId),
      depois: nomeDaTag(dados, depois.tagId),
    })
  }
  if (antes.pastaId !== depois.pastaId) {
    const pasta = nomeDe(dados.pastas, depois.pastaId)
    mudancas.push({
      frase: pasta ? `Pôs ${nome} na pasta ${pasta}` : `Tirou ${nome} da pasta`,
      curto: 'pasta',
      rotulo: 'Pasta',
      antes: nomeDaPasta(dados, antes.pastaId),
      depois: nomeDaPasta(dados, depois.pastaId),
    })
  }
  if (antes.caixaId !== depois.caixaId || antes.caixaDestinoId !== depois.caixaDestinoId) {
    const caixa = dados.caixas.find((c) => c.id === depois.caixaId)
    const transferencia = depois.tipo === 'transferencia'
    const contas = { rotulo: transferencia ? 'Contas' : 'Conta', antes: contasDo(antes, dados), depois: contasDo(depois, dados) }
    const frase = transferencia
      ? `Mudou as contas de ${nome}: agora de ${contas.depois.replace(' → ', ' para ')}`
      : caixa
        ? `Passou ${nome} de ${contas.antes} para ${oCaixa(caixa)}`
        : `Mudou a conta de ${nome}`
    mudancas.push({ ...contas, frase, curto: 'conta' })
  }
  if (antes.natureza !== depois.natureza && antes.tipo === depois.tipo) {
    mudancas.push({
      frase: `Marcou ${nome} como ${depois.natureza === 'fixa' ? 'fixo' : 'variável'}`,
      curto: 'fixo ou variável',
      rotulo: 'Fixo ou variável',
      antes: ROTULO_NATUREZA[antes.natureza],
      depois: ROTULO_NATUREZA[depois.natureza],
    })
  }
  const mudouRepeticao =
    !iguais(antes.recorrencia, depois.recorrencia) &&
    !(antes.recorrencia.tipo === 'unica' && depois.recorrencia.tipo === 'unica')
  if (mudouRepeticao) {
    mudancas.push({
      frase: `Mudou a repetição de ${nome}: ${quando(depois)}`,
      curto: 'repetição',
      rotulo: 'Repete',
      antes: descreverRecorrencia(antes),
      depois: descreverRecorrencia(depois),
    })
  }
  if (antes.inicio !== depois.inicio) {
    mudancas.push({
      frase: depois.inicio ? `Mudou o começo de ${nome} para ${dataCurta(depois.inicio)}` : `Tirou a data de começo de ${nome}`,
      curto: 'começo',
      rotulo: 'Começa em',
      antes: antes.inicio ? formatarData(antes.inicio) : 'Desde sempre',
      depois: depois.inicio ? formatarData(depois.inicio) : 'Desde sempre',
    })
  }
  if (antes.fim !== depois.fim) {
    mudancas.push({
      frase: depois.fim ? `Encerrou ${nome}: a última vez fica até ${dataCurta(depois.fim)}` : `Tirou o fim de ${nome}`,
      curto: 'fim',
      rotulo: 'Termina em',
      antes: antes.fim ? formatarData(antes.fim) : 'Sem fim',
      depois: depois.fim ? formatarData(depois.fim) : 'Sem fim',
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

/**
 * A frase de um lançamento novo, com o tipo, quanto, quando e onde: "Comprou Tênis no cartão Nubank: 3 vezes de…",
 * "Transferiu R$ 500,00 todo dia 5 de Conta principal para a conta de investimento Poupança (Guardar)".
 */
function textoDoNovo(l: Lancamento, dados: DadosFinancas): string {
  const caixa = dados.caixas.find((c) => c.id === l.caixaId)
  if (l.tipo === 'transferencia') {
    const destino = dados.caixas.find((c) => c.id === l.caixaDestinoId)
    const rota = `de ${caixa?.nome ?? 'uma conta'} para ${destino ? oCaixa(destino) : 'outra conta'}`
    const valor = quantoEQuando(l)
    return valor.startsWith(':')
      ? `Transferiu ${l.descricao} ${rota}${valor}`
      : `Transferiu${valor.replace(/^ de/, '')} ${rota} (${l.descricao})`
  }
  if (caixa && ehCartao(caixa) && l.tipo === 'saida') return `Comprou ${l.descricao} no cartão ${caixa.nome}${quantoEQuando(l)}`
  const onde = caixa && dados.caixas.length > 1 ? ` · ${caixa.nome}` : ''
  return `Adicionou ${ARTIGO_TIPO[l.tipo]} ${l.descricao}${quantoEQuando(l)}${onde}`
}

function descreverNovoLancamento(l: Lancamento, dados: DadosFinancas): DescricaoAtividade {
  const base = { tipo: 'lancamento' as const, tom: tomDoTipo(l.tipo), caixaId: l.caixaId }
  const caixa = dados.caixas.find((c) => c.id === l.caixaId)
  const topo = topoDoLancamento(l)
  if (ehAjusteDeSaldo(l)) {
    const quem = caixa && dados.caixas.length > 1 ? ` de ${caixa.nome}` : ''
    const valor = formatarBRL(l.valorCentavos)
    const texto =
      caixa && ehCartao(caixa)
        ? `Conferiu a fatura${quem}: era ${valor} ${l.tipo === 'entrada' ? 'menor' : 'maior'} que no app`
        : `Conferiu o saldo${quem}: o banco tinha ${valor} a ${l.tipo === 'entrada' ? 'mais' : 'menos'} que o app`
    return { ...base, texto, detalhe: { topo, partes: partesDoLancamento(l, dados) } }
  }
  const anterior = antecessor(l, dados)
  if (anterior && l.inicio) {
    const comparavel = { ...anterior, inicio: l.inicio, fim: l.fim, excecoes: l.excecoes, movidas: l.movidas }
    const mudancas = mudancasDoLancamento(comparavel, l, dados)
    const curtos = [...new Set(mudancas.map((m) => m.curto))]
    const desde = `a partir de ${dataCurta(l.inicio)}`
    const texto =
      curtos.length === 1 && curtos[0] === 'valor'
        ? `Mudou o valor de ${l.descricao} ${desde}: de ${formatarBRL(anterior.valorCentavos)} para ${formatarBRL(l.valorCentavos)}`
        : `Mudou ${l.descricao} ${desde}${curtos.length ? ` (${listarNomes(curtos)})` : ''}`
    const vale: LinhaDetalhe = { rotulo: 'Vale a partir de', valor: formatarData(l.inicio) }
    return {
      ...base,
      texto,
      detalhe: {
        topo,
        partes: [{ titulo: 'O que mudou', linhas: [vale, ...mudancas.map(linhaDa)] }, ...partesDoLancamento(l, dados, 'Como ficou')],
      },
    }
  }
  return { ...base, texto: textoDoNovo(l, dados), detalhe: { topo, partes: partesDoLancamento(l, dados) } }
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
  return {
    tipo: 'lancamento',
    texto,
    tom: tomDoTipo(l.tipo),
    caixaId: l.caixaId,
    detalhe: {
      topo: topoDoLancamento(l),
      partes: [{ titulo: 'O que mudou', linhas: mudancas.map(linhaDa) }, ...partesDoLancamento(l, dados, 'Como ficou')],
    },
  }
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
  const quais = quaisLancamentos(mudados)

  const novos = mudados.filter((l) => !porId.has(l.id))
  if (novos.length === mudados.length) {
    return { tipo: 'lancamento', tom, caixaId, texto: `Adicionou ${quais}`, detalhe: { partes: [parteDaLista(novos, 'Quais')] } }
  }

  const pares = mudados.filter((l) => porId.has(l.id)).map((l) => ({ antes: porId.get(l.id)!, depois: l }))
  const porItem = pares.map(({ antes, depois }) => ({ depois, mudancas: mudancasDoLancamento(antes, depois, dados) }))
  const curtosDoLote = new Set(porItem.flatMap((p) => p.mudancas.map((m) => m.curto)))
  /** Quando todo o lote muda a mesma coisa, ela vai para o título e cada linha leva só o nome. */
  const umCampo = curtosDoLote.size === 1 ? porItem.find((p) => p.mudancas.length)?.mudancas[0] : undefined
  const linhas = porItem.flatMap(({ depois, mudancas }) =>
    mudancas.map((m) => ({
      ...linhaDa(m),
      rotulo: umCampo || m.curto === 'dia' ? depois.descricao : `${depois.descricao} · ${m.rotulo}`,
    })),
  )
  const titulo = umCampo && umCampo.curto !== 'dia' ? `O que mudou: ${umCampo.curto}` : 'O que mudou'
  const partes: ParteDetalhe[] = [{ titulo, linhas: limitarLinhas(linhas) }]
  if (novos.length > 0) partes.push(parteDaLista(novos, 'Voltaram'))
  const base = { tipo: 'lancamento' as const, tom, caixaId, detalhe: { partes } }
  if (novos.length > 0) return { ...base, texto: `Mudou ${quais}` }

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
    if (para && de) return { ...base, texto: `Levou ${quais} de ${dataCurta(de)} para ${dataCurta(para)}` }
    if (para) return { ...base, texto: `Levou ${quais} para ${dataCurta(para)}` }
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
      : `Excluiu ${ARTIGO_TIPO[l.tipo]} ${l.descricao}${quantoEQuando(l)}`
    return { tipo: 'lancamento', texto, tom, caixaId, detalhe: { topo: topoDoLancamento(l), partes: partesDoLancamento(l, dados, 'Como era') } }
  }
  return {
    tipo: 'lancamento',
    texto: `Excluiu ${quaisLancamentos(removidos)}`,
    tom,
    caixaId,
    detalhe: { partes: [parteDaLista(removidos, 'Quais')] },
  }
}

/** Uma mudança numa meta: a frase e a linha do extrato. */
type MudancaMeta = Pick<Mudanca, 'frase' | 'rotulo' | 'antes' | 'depois'>

function descreverMeta(meta: MetaEconomia, dados: DadosFinancas): DescricaoAtividade | null {
  const base = { tipo: 'meta' as const, tom: 'economia' as const, caixaId: meta.caixaId }
  const antes = dados.metas.find((m) => m.id === meta.id)
  if (!antes) {
    const alvo = meta.valorAlvoCentavos ? `juntar ${formatarBRL(meta.valorAlvoCentavos)}, ` : ''
    const texto = `Criou a meta ${meta.nome}: ${alvo}guardando ${formatarBRL(meta.aporteMensalCentavos)} todo dia ${meta.diaDoMes}`
    return {
      ...base,
      texto,
      detalhe: { topo: { rotulo: 'Por mês', valorCentavos: meta.aporteMensalCentavos }, partes: [parteDaMeta(meta, dados)] },
    }
  }

  const nome = meta.nome
  const mudancas: MudancaMeta[] = []
  const origem = nomeDoCaixa(dados, meta.caixaId)
  const resgatesAntes = new Map((antes.resgates ?? []).map((r) => [r.id, r]))
  const resgatesDepois = new Map((meta.resgates ?? []).map((r) => [r.id, r]))
  let usado: number | undefined
  for (const r of resgatesDepois.values()) {
    const anterior = resgatesAntes.get(r.id)
    const rotulo = `Uso em ${formatarData(r.data)}`
    if (!anterior) {
      usado = r.valorCentavos
      mudancas.push({
        frase: `Usou ${formatarBRL(r.valorCentavos)} da meta ${nome} em ${dataCurta(r.data)}: volta para ${origem}`,
        rotulo,
        antes: '—',
        depois: formatarBRL(r.valorCentavos),
      })
    } else if (!iguais(anterior, r)) {
      mudancas.push({
        frase: `Mudou o uso de dinheiro da meta ${nome} para ${formatarBRL(r.valorCentavos)}`,
        rotulo,
        antes: `${formatarBRL(anterior.valorCentavos)} em ${formatarData(anterior.data)}`,
        depois: formatarBRL(r.valorCentavos),
      })
    }
  }
  for (const r of resgatesAntes.values()) {
    if (resgatesDepois.has(r.id)) continue
    mudancas.push({
      frase: `Desfez o uso de ${formatarBRL(r.valorCentavos)} da meta ${nome}`,
      rotulo: `Uso em ${formatarData(r.data)}`,
      antes: formatarBRL(r.valorCentavos),
      depois: 'Desfeito',
    })
  }
  if (!antes.encerradaEm && meta.encerradaEm) {
    mudancas.push({ frase: `Parou a meta ${nome}`, rotulo: 'Guardando', antes: 'Sim', depois: `Parou em ${formatarData(meta.encerradaEm)}` })
  }
  if (antes.encerradaEm && !meta.encerradaEm) {
    mudancas.push({ frase: `Voltou a guardar na meta ${nome}`, rotulo: 'Guardando', antes: 'Parada', depois: 'Sim' })
  }
  if (antes.nome !== meta.nome) {
    mudancas.push({ frase: `Mudou o nome da meta ${antes.nome} para ${nome}`, rotulo: 'Nome', antes: antes.nome, depois: nome })
  }
  if (antes.aporteMensalCentavos !== meta.aporteMensalCentavos) {
    const [de, para] = [formatarBRL(antes.aporteMensalCentavos), formatarBRL(meta.aporteMensalCentavos)]
    mudancas.push({ frase: `Mudou quanto guarda por mês na meta ${nome} de ${de} para ${para}`, rotulo: 'Por mês', antes: de, depois: para })
  }
  if (antes.valorAlvoCentavos !== meta.valorAlvoCentavos) {
    const alvo = (v: number | undefined) => (v ? formatarBRL(v) : 'Sem valor certo')
    mudancas.push({
      frase: meta.valorAlvoCentavos
        ? `Mudou o valor a juntar da meta ${nome} para ${formatarBRL(meta.valorAlvoCentavos)}`
        : `Tirou o valor a juntar da meta ${nome}`,
      rotulo: 'Valor a juntar',
      antes: alvo(antes.valorAlvoCentavos),
      depois: alvo(meta.valorAlvoCentavos),
    })
  }
  if (antes.destinoId !== meta.destinoId || antes.caixaId !== meta.caixaId) {
    const onde = (m: MetaEconomia) => `${nomeDoCaixa(dados, m.caixaId)} → ${m.destinoId ? nomeDoCaixa(dados, m.destinoId) : 'separado'}`
    mudancas.push({ frase: `Mudou onde fica o dinheiro da meta ${nome}`, rotulo: 'Sai de → fica em', antes: onde(antes), depois: onde(meta) })
  }
  if (antes.prazo !== meta.prazo) {
    const prazo = (d: DataISO | undefined) => (d ? formatarData(d) : 'Sem prazo')
    mudancas.push({ frase: `Mudou o prazo da meta ${nome} para ${prazo(meta.prazo)}`, rotulo: 'Prazo', antes: prazo(antes.prazo), depois: prazo(meta.prazo) })
  }
  const meses = [...new Set([...Object.keys(antes.ajustes), ...Object.keys(meta.ajustes)])]
    .filter((m) => antes.ajustes[m] !== meta.ajustes[m])
    .sort()
  const guardou = (v: number | undefined) => (v === undefined ? 'O plano' : formatarBRL(v))
  const linhasMeses = meses.map((mes) => ({
    rotulo: `Guardou em ${formatarMesAno(`${mes}-01`)}`,
    antes: guardou(antes.ajustes[mes]),
    depois: guardou(meta.ajustes[mes]),
  }))
  if (meses.length === 1) {
    const [mes] = meses
    const valor = meta.ajustes[mes]
    mudancas.push({
      ...linhasMeses[0],
      frase:
        valor === undefined
          ? `Voltou ao plano a meta ${nome} em ${formatarMesAno(`${mes}-01`)}`
          : `Anotou que guardou ${formatarBRL(valor)} na meta ${nome} em ${formatarMesAno(`${mes}-01`)}`,
    })
  } else if (meses.length > 1) {
    mudancas.push(...linhasMeses.map((l, i) => ({ ...l, frase: i === 0 ? `Corrigiu quanto guardou na meta ${nome} em ${meses.length} meses` : '' })))
  }

  const frases = mudancas.map((m) => m.frase).filter(Boolean)
  const detalhe = {
    ...(usado !== undefined && { topo: { rotulo: 'Usou', valorCentavos: usado } }),
    partes: [{ titulo: 'O que mudou', linhas: mudancas.map(linhaDa) }, parteDaMeta(meta, dados, 'Como ficou')],
  }
  if (frases.length === 1) return { ...base, texto: frases[0], detalhe }
  if (frases.length > 1) return { ...base, texto: `Mudou a meta ${nome}: ${frases.length} alterações`, detalhe }
  if (mudancas.length > 0) return { ...base, texto: `Editou a meta ${nome}`, detalhe }
  return iguais(antes, meta) ? null : { ...base, texto: `Editou a meta ${nome}`, detalhe: { partes: [parteDaMeta(meta, dados, 'Como ficou')] } }
}

function descreverCaixa(caixa: Caixa, dados: DadosFinancas): DescricaoAtividade | null {
  const base = { tipo: 'caixa' as const, caixaId: caixa.id }
  const antes = dados.caixas.find((c) => c.id === caixa.id)
  if (!antes) return { ...base, texto: `Criou ${oCaixa(caixa)}`, detalhe: { partes: [parteDoCaixa(caixa, dados)] } }
  if (iguais(antes, caixa)) return null

  const frases: string[] = []
  const linhas: LinhaDetalhe[] = []
  if (!antes.arquivado && caixa.arquivado) frases.push(`Arquivou ${oCaixa(caixa)}`)
  if (antes.arquivado && !caixa.arquivado) frases.push(`Voltou a usar ${oCaixa(caixa)}`)
  if (!!antes.arquivado !== !!caixa.arquivado) {
    linhas.push({ rotulo: 'Arquivado', antes: antes.arquivado ? 'Sim' : 'Não', valor: caixa.arquivado ? 'Sim' : 'Não' })
  }
  if (antes.nome !== caixa.nome) {
    frases.push(`Mudou o nome de ${oCaixa(antes)} para ${caixa.nome}`)
    linhas.push({ rotulo: 'Nome', antes: antes.nome, valor: caixa.nome })
  }
  if (antes.saldoInicialCentavos !== caixa.saldoInicialCentavos || antes.dataSaldoInicial !== caixa.dataSaldoInicial) {
    const cartao = caixa.tipo === 'cartao'
    const saldo = (c: Caixa) => `${formatarBRL(cartao ? Math.abs(c.saldoInicialCentavos) : c.saldoInicialCentavos)} em ${formatarData(c.dataSaldoInicial)}`
    frases.push(
      cartao
        ? `Mudou quanto devia no cartão ${caixa.nome} para ${formatarBRL(Math.abs(caixa.saldoInicialCentavos))}`
        : `Mudou o saldo inicial de ${caixa.nome} para ${formatarBRL(caixa.saldoInicialCentavos)} em ${dataCurta(caixa.dataSaldoInicial)}`,
    )
    linhas.push({ rotulo: cartao ? 'Devia' : 'Saldo inicial', antes: saldo(antes), valor: saldo(caixa) })
  }
  if (antes.entraNoTotal !== caixa.entraNoTotal && caixa.tipo !== 'beneficio') {
    linhas.push({ rotulo: 'Soma no total', antes: antes.entraNoTotal ? 'Sim' : 'Não', valor: caixa.entraNoTotal ? 'Sim' : 'Não' })
  }
  if (antes.cartao && caixa.cartao && !iguais(antes.cartao, caixa.cartao)) {
    const ciclo = (c: Caixa) =>
      `fecha ${c.cartao!.diaFechamento}, vence ${c.cartao!.diaVencimento}, paga com ${nomeDoCaixa(dados, c.cartao!.contaPagadoraId)}`
    linhas.push({ rotulo: 'Fatura', antes: ciclo(antes), valor: ciclo(caixa) })
  }
  const partes: ParteDetalhe[] = [parteDoCaixa(caixa, dados, 'Como ficou')]
  if (linhas.length > 0) partes.unshift({ titulo: 'O que mudou', linhas })
  if (frases.length === 1) return { ...base, texto: frases[0], detalhe: { partes } }
  if (frases.length > 1) return { ...base, texto: `Editou ${oCaixa(caixa)}`, detalhe: { partes } }

  const soOrdem = iguais({ ...antes, ordem: 0 }, { ...caixa, ordem: 0 })
  if (soOrdem) return { tipo: 'caixa', texto: 'Mudou a ordem das contas' }
  return { ...base, texto: `Editou ${oCaixa(caixa)}`, detalhe: { partes } }
}

/** Categoria, tag ou pasta: criar, renomear, mudar a cor ou outra edição. */
function descreverCadastro<T extends { id: string; nome: string; cor: string; tipo?: 'entrada' | 'saida'; evitavel?: boolean }>(
  item: T,
  lista: T[],
  nomeDoTipo: string,
): DescricaoAtividade | null {
  const base = { tipo: 'organizacao' as const }
  const antes = lista.find((x) => x.id === item.id)
  const parte = parteDoCadastro(item)
  if (!antes) return { ...base, texto: `Criou a ${nomeDoTipo} ${item.nome}`, detalhe: { partes: [parte] } }
  if (iguais(antes, item)) return null
  const linhas: LinhaDetalhe[] = []
  if (antes.nome !== item.nome) linhas.push({ rotulo: 'Nome', antes: antes.nome, valor: item.nome })
  if (antes.cor !== item.cor) linhas.push({ rotulo: 'Cor', antes: antes.cor, valor: item.cor })
  if (antes.evitavel !== item.evitavel) linhas.push({ rotulo: 'Dava para evitar?', antes: antes.evitavel ? 'Sim' : 'Não', valor: item.evitavel ? 'Sim' : 'Não' })
  const detalhe = { partes: [{ titulo: 'O que mudou', linhas }, { ...parte, titulo: 'Como ficou' }] }
  if (antes.nome !== item.nome) return { ...base, texto: `Mudou o nome da ${nomeDoTipo} ${antes.nome} para ${item.nome}`, detalhe }
  if (antes.cor !== item.cor && iguais({ ...antes, cor: '' }, { ...item, cor: '' })) {
    return { ...base, texto: `Mudou a cor da ${nomeDoTipo} ${item.nome}`, detalhe }
  }
  return { ...base, texto: `Editou a ${nomeDoTipo} ${item.nome}`, detalhe }
}

function descreverExclusaoDeCadastro(
  campo: 'categoriaId' | 'tagId' | 'pastaId',
  item: { id: string; nome: string } | undefined,
  nomeDoTipo: string,
  dados: DadosFinancas,
): DescricaoAtividade | null {
  if (!item) return null
  return {
    tipo: 'organizacao',
    texto: `Excluiu a ${nomeDoTipo} ${item.nome}`,
    detalhe: { partes: [{ titulo: 'Como era', linhas: [...parteDoCadastro(item).linhas, usosDoCadastro(campo, item.id, dados)] }] },
  }
}

/** Nomes que a ação traz (o item salvo ou os do lote), além dos que já existiam nos dados. */
function nomesDaAcao(acao: AcaoFinancas): string[] {
  switch (acao.tipo) {
    case 'lancamento/salvar':
      return [acao.lancamento.descricao]
    case 'lancamento/salvarVarios':
      return acao.lancamentos.map((l) => l.descricao)
    case 'meta/salvar':
      return [acao.meta.nome]
    case 'caixa/salvar':
      return [acao.caixa.nome]
    case 'categoria/salvar':
      return [acao.categoria.nome]
    case 'tag/salvar':
      return [acao.tag.nome]
    case 'pasta/salvar':
      return [acao.pasta.nome]
    default:
      return []
  }
}

/**
 * Os nomes de itens (lançamentos, tags, contas, metas…) que aparecem na frase como palavra inteira, do mais longo ao
 * mais curto, para o extrato sublinhar.
 */
function nomesNaFrase(texto: string, antes: DadosFinancas, acao: AcaoFinancas): string[] {
  const candidatos = new Set([
    ...nomesDaAcao(acao),
    ...antes.lancamentos.map((l) => l.descricao),
    ...[...antes.caixas, ...antes.categorias, ...antes.tags, ...antes.pastas, ...antes.metas].map((x) => x.nome),
  ])
  const normalizado = texto.toLocaleLowerCase('pt-BR')
  return [...candidatos]
    .filter((nome) => nome.trim().length >= 2 && normalizado.includes(nome.toLocaleLowerCase('pt-BR')))
    .filter((nome) => regexDosNomes([nome]).test(texto))
    .sort((a, b) => b.length - a.length)
}

/**
 * Frase do que a pessoa fez com uma ação do reducer, com o extrato (o que foi lançado, o que mudou) e os nomes citados,
 * comparando com os dados de antes; null se a ação não muda dados (carregar, ocultar saldos, limpar o histórico) ou não
 * mudou nada.
 */
export function descreverAcao(antes: DadosFinancas, acao: AcaoFinancas): DescricaoAtividade | null {
  const descricao = descreverSemNomes(antes, acao)
  if (!descricao?.detalhe) return descricao
  const nomes = nomesNaFrase(descricao.texto, antes, acao)
  return nomes.length ? { ...descricao, detalhe: { ...descricao.detalhe, nomes } } : descricao
}

function descreverSemNomes(antes: DadosFinancas, acao: AcaoFinancas): DescricaoAtividade | null {
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
      return meta
        ? {
            tipo: 'meta',
            texto: `Excluiu a meta ${meta.nome}`,
            tom: 'economia',
            caixaId: meta.caixaId,
            detalhe: { partes: [parteDaMeta(meta, antes, 'Como era')] },
          }
        : null
    }
    case 'caixa/salvar':
      return descreverCaixa(acao.caixa, antes)
    case 'caixa/excluir': {
      const caixa = antes.caixas.find((c) => c.id === acao.id)
      return caixa
        ? { tipo: 'caixa', texto: `Excluiu ${oCaixa(caixa)}`, detalhe: { partes: [parteDoCaixa(caixa, antes, 'Como era')] } }
        : null
    }
    case 'categoria/salvar':
      return descreverCadastro(acao.categoria, antes.categorias, 'categoria')
    case 'categoria/excluir':
      return descreverExclusaoDeCadastro('categoriaId', antes.categorias.find((c) => c.id === acao.id), 'categoria', antes)
    case 'tag/salvar':
      return descreverCadastro(acao.tag, antes.tags, 'tag')
    case 'tag/excluir':
      return descreverExclusaoDeCadastro('tagId', antes.tags.find((t) => t.id === acao.id), 'tag', antes)
    case 'pasta/salvar':
      return descreverCadastro(acao.pasta, antes.pastas, 'pasta')
    case 'pasta/excluir':
      return descreverExclusaoDeCadastro('pastaId', antes.pastas.find((p) => p.id === acao.id), 'pasta', antes)
    case 'dados/importar': {
      const d = acao.dados
      const linhas = [
        { rotulo: 'Contas e cartões', valor: String(d.caixas.length) },
        { rotulo: 'Lançamentos', valor: String(d.lancamentos.length) },
        { rotulo: 'Metas', valor: String(d.metas.length) },
        { rotulo: 'Categorias', valor: String(d.categorias.length) },
      ]
      return { tipo: 'dados', texto: 'Importou um backup', detalhe: { partes: [{ titulo: 'O que veio', linhas }] } }
    }
    case 'dados/carregar':
    case 'atividade/registrar':
    case 'atividade/limpar':
    case 'saldos/alternarVisibilidade':
      return null
  }
}
