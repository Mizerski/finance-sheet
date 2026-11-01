import { ehCartao, ehInvestimento, rotuloDoCaixa, somaNoTotal, type Caixa } from '@/features/caixas/model/caixa'
import { proximoFechamento, vencimentoDaFatura } from '@/features/caixas/utils/cartao'
import type { Categoria } from '@/features/categorias/model/categoria'
import type { MetaEconomia } from '@/features/economias/model/meta'
import { descreverRecorrencia, ROTULO_NATUREZA, ROTULO_TIPO } from '@/features/lancamentos/constants/textos'
import type { Lancamento } from '@/features/lancamentos/model/lancamento'
import { ehAjusteDeSaldo } from '@/features/lancamentos/utils/ajuste'
import { parcelasDe, proximasVezes, type Parcelas } from '@/features/lancamentos/utils/parcelas'
import type { Tag } from '@/features/tags/model/tag'
import { formatarData, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import type { DadosFinancas } from '@/store/model/dados'
import type { DetalheAtividade, LinhaDetalhe, ParteDetalhe } from '../model/atividade'

/** Até quantos itens um lote lista no extrato; o resto vira "e mais N". */
const MAX_LINHAS_LOTE = 20

/** "Nubank · Cartão de crédito", "Poupança · Investimento"; caixa que sumiu vira "Conta excluída". */
export function nomeComTipo(caixa: Caixa | undefined): string {
  return caixa ? `${caixa.nome} · ${rotuloDoCaixa(caixa)}` : 'Conta excluída'
}

/** Parcelas de um recorrente com começo e fim, contadas desde o começo (o registro é do dia em que foi lançado). */
export function parcelasDoLancamento(l: Lancamento): Parcelas | null {
  return l.inicio ? parcelasDe(l, l.inicio) : null
}

/** "2 vezes", "1 vez". */
export function vezes(n: number): string {
  return `${n} ${n === 1 ? 'vez' : 'vezes'}`
}

const linha = (rotulo: string, valor: string, antes?: string): LinhaDetalhe => (antes === undefined ? { rotulo, valor } : { rotulo, valor, antes })

/** "Saída", "Compra no cartão", "Estorno no cartão", "Transferência", "Ajuste de saldo". */
function rotuloDoTipo(l: Lancamento, caixa: Caixa | undefined): string {
  if (ehAjusteDeSaldo(l)) return 'Ajuste de saldo'
  if (caixa && ehCartao(caixa) && l.tipo !== 'transferencia') return l.tipo === 'saida' ? 'Compra no cartão' : 'Estorno no cartão'
  return ROTULO_TIPO[l.tipo]
}

function nomeDaTag(tag: Tag | undefined): string {
  if (!tag) return 'Sem tag'
  return tag.evitavel ? `${tag.nome} (dava para evitar)` : tag.nome
}

/** Primeira data em que o lançamento acontece (a do único, ou a primeira vez do recorrente a partir do começo). */
function primeiraVez(l: Lancamento): DataISO | undefined {
  if (l.recorrencia.tipo === 'unica') return l.recorrencia.data
  return l.inicio ? proximasVezes(l, l.inicio, 1)[0] : undefined
}

/** As partes que dizem tudo de um lançamento: o que é, de onde, quando e, no cartão, em que fatura cai. */
export function partesDoLancamento(l: Lancamento, dados: DadosFinancas, titulo?: string): ParteDetalhe[] {
  const caixa = dados.caixas.find((c) => c.id === l.caixaId)
  const categoria = dados.categorias.find((c) => c.id === l.categoriaId)
  const pasta = dados.pastas.find((p) => p.id === l.pastaId)
  const ajuste = ehAjusteDeSaldo(l)

  const oQue: LinhaDetalhe[] = [linha('Tipo', rotuloDoTipo(l, caixa)), linha('Descrição', l.descricao)]
  if (l.tipo === 'transferencia') {
    const destino = dados.caixas.find((c) => c.id === l.caixaDestinoId)
    oQue.push(linha('Sai de', nomeComTipo(caixa)), linha('Entra em', nomeComTipo(destino)))
    if (destino && ehInvestimento(destino)) oQue.push(linha('Para quê', 'Guardar na conta de investimento'))
  } else {
    oQue.push(linha(caixa && ehCartao(caixa) ? 'Cartão' : 'Conta', nomeComTipo(caixa)))
    if (ajuste) {
      oQue.push(linha('O banco tinha', l.tipo === 'entrada' ? 'Mais do que o app' : 'Menos do que o app'))
    } else {
      oQue.push(linha('Categoria', categoria?.nome ?? 'Sem categoria'))
      if (l.tipo === 'saida') oQue.push(linha('Necessário?', nomeDaTag(dados.tags.find((t) => t.id === l.tagId))))
    }
  }
  if (!ajuste) oQue.push(linha('Fixo ou variável', ROTULO_NATUREZA[l.natureza]))
  if (pasta) oQue.push(linha('Pasta', pasta.nome))

  const quando: LinhaDetalhe[] = []
  if (l.recorrencia.tipo === 'unica') quando.push(linha('Dia', formatarData(l.recorrencia.data)))
  else {
    quando.push(linha('Repete', descreverRecorrencia(l)))
    quando.push(linha('Começa em', l.inicio ? formatarData(l.inicio) : 'Desde sempre'))
    quando.push(linha('Termina em', l.fim ? formatarData(l.fim) : 'Sem fim'))
    const parcelas = parcelasDoLancamento(l)
    if (parcelas) {
      quando.push(linha('Quantas vezes', vezes(parcelas.total)))
      quando.push(linha('Total', formatarBRL(parcelas.totalCentavos)))
    }
    const primeiras = l.inicio ? proximasVezes(l, l.inicio, 4) : []
    if (primeiras.length > 0) {
      const mais = parcelas ? parcelas.total > 3 : primeiras.length > 3
      quando.push(linha('Datas', `${primeiras.slice(0, 3).map(formatarData).join(', ')}${mais ? '…' : ''}`))
    }
  }
  const dias = Object.keys(l.excecoes ?? {}).length
  if (dias > 0) quando.push(linha('Dias com outro valor', String(dias)))
  const movidas = Object.keys(l.movidas ?? {}).length
  if (movidas > 0) quando.push(linha('Vezes em outro dia', String(movidas)))

  const partes: ParteDetalhe[] = [{ titulo, linhas: oQue }, { titulo: 'Quando', linhas: quando }]

  const data = primeiraVez(l)
  if (caixa && ehCartao(caixa) && data && !ajuste && l.tipo !== 'transferencia') {
    const fechamento = proximoFechamento(data, caixa.cartao)
    const pagadora = dados.caixas.find((c) => c.id === caixa.cartao.contaPagadoraId)
    partes.push({
      titulo: l.recorrencia.tipo === 'unica' ? 'Fatura' : 'Primeira fatura',
      linhas: [
        linha('Fecha em', formatarData(fechamento)),
        linha('Vence em', formatarData(vencimentoDaFatura(fechamento, caixa.cartao))),
        linha('Paga com', pagadora?.nome ?? 'Conta excluída'),
      ],
    })
  }
  return partes
}

/** Topo do extrato de um lançamento: o valor de cada vez (ou o total das parcelas embaixo). */
export function topoDoLancamento(l: Lancamento): DetalheAtividade['topo'] {
  const recorrente = l.recorrencia.tipo !== 'unica'
  const parcelas = recorrente ? parcelasDoLancamento(l) : null
  const sinal = l.tipo === 'entrada' ? '+' : l.tipo === 'saida' ? '−' : undefined
  return {
    rotulo: ehAjusteDeSaldo(l) ? 'Ajuste' : recorrente ? 'Valor de cada vez' : 'Valor',
    valorCentavos: l.valorCentavos,
    ...(sinal && { sinal }),
    ...(parcelas && { legenda: `${vezes(parcelas.total)} · total de ${formatarBRL(parcelas.totalCentavos)}` }),
    ...(recorrente && !parcelas && { legenda: descreverRecorrencia(l) }),
  }
}

/** Extrato de vários lançamentos: um por linha, com o valor (até `MAX_LINHAS_LOTE`). */
export function parteDaLista(lista: Lancamento[], titulo: string): ParteDetalhe {
  const linhas = lista.slice(0, MAX_LINHAS_LOTE).map((l) => linha(l.descricao, formatarBRL(l.valorCentavos)))
  if (lista.length > MAX_LINHAS_LOTE) linhas.push(linha(`E mais ${lista.length - MAX_LINHAS_LOTE}`, ''))
  return { titulo, linhas }
}

/** Corta a lista de mudanças de um lote no mesmo limite. */
export function limitarLinhas(linhas: LinhaDetalhe[]): LinhaDetalhe[] {
  if (linhas.length <= MAX_LINHAS_LOTE) return linhas
  return [...linhas.slice(0, MAX_LINHAS_LOTE), linha(`E mais ${linhas.length - MAX_LINHAS_LOTE}`, '')]
}

/** Tudo de uma meta: de onde sai, onde fica, quanto juntar, por mês e o prazo. */
export function parteDaMeta(meta: MetaEconomia, dados: DadosFinancas, titulo?: string): ParteDetalhe {
  const origem = dados.caixas.find((c) => c.id === meta.caixaId)
  const destino = dados.caixas.find((c) => c.id === meta.destinoId)
  const linhas = [
    linha('Nome', meta.nome),
    linha('Sai de', nomeComTipo(origem)),
    linha('Fica em', meta.destinoId ? nomeComTipo(destino) : 'Separado na própria conta'),
    linha('Valor a juntar', meta.valorAlvoCentavos ? formatarBRL(meta.valorAlvoCentavos) : 'Sem valor certo (cofrinho)'),
    linha('Por mês', formatarBRL(meta.aporteMensalCentavos)),
    linha('Dia de guardar', `Todo dia ${meta.diaDoMes}`),
    linha('Começa em', formatarData(meta.inicio)),
  ]
  if (meta.prazo) linhas.push(linha('Prazo', formatarData(meta.prazo)))
  if (meta.jaGuardadoCentavos) linhas.push(linha('Já tinha guardado', formatarBRL(meta.jaGuardadoCentavos)))
  if (meta.encerradaEm) linhas.push(linha('Parou em', formatarData(meta.encerradaEm)))
  return { titulo, linhas }
}

/** Tudo de um caixa: tipo, saldo inicial e, no cartão, fechamento, vencimento, quem paga e o limite. */
export function parteDoCaixa(caixa: Caixa, dados: DadosFinancas, titulo?: string): ParteDetalhe {
  const cartao = ehCartao(caixa)
  const linhas = [
    linha('Nome', caixa.nome),
    linha('Tipo', rotuloDoCaixa(caixa)),
    cartao
      ? linha('Devia', formatarBRL(Math.abs(caixa.saldoInicialCentavos)))
      : linha('Saldo inicial', formatarBRL(caixa.saldoInicialCentavos)),
    linha('Em', formatarData(caixa.dataSaldoInicial)),
  ]
  if (caixa.tipo !== 'beneficio') linhas.push(linha('Soma no total', somaNoTotal(caixa) ? 'Sim' : 'Não'))
  if (cartao) {
    linhas.push(
      linha('Fecha', `Todo dia ${caixa.cartao.diaFechamento}`),
      linha('Vence', `Todo dia ${caixa.cartao.diaVencimento}`),
      linha('Paga com', dados.caixas.find((c) => c.id === caixa.cartao.contaPagadoraId)?.nome ?? 'Conta excluída'),
    )
    if (caixa.cartao.limiteCentavos) linhas.push(linha('Limite', formatarBRL(caixa.cartao.limiteCentavos)))
  }
  if (caixa.arquivado) linhas.push(linha('Arquivado', 'Sim'))
  return { titulo, linhas }
}

/** Categoria, tag ou pasta: nome, de que tipo e, na tag, se o gasto dava para evitar. */
export function parteDoCadastro(item: { nome: string } & Partial<Pick<Categoria, 'tipo'> & Pick<Tag, 'evitavel'>>): ParteDetalhe {
  const linhas = [linha('Nome', item.nome)]
  if (item.tipo) linhas.push(linha('Para', item.tipo === 'entrada' ? 'Entradas' : 'Saídas'))
  if (item.evitavel !== undefined) linhas.push(linha('Dava para evitar?', item.evitavel ? 'Sim' : 'Não'))
  return { linhas }
}

/** Quantos lançamentos usavam o item (categoria, tag ou pasta) ao ser excluído. */
export function usosDoCadastro(campo: 'categoriaId' | 'tagId' | 'pastaId', id: string, dados: DadosFinancas): LinhaDetalhe {
  const n = dados.lancamentos.filter((l) => l[campo] === id).length
  return linha('Lançamentos com ele', String(n))
}
