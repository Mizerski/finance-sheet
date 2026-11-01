/** Do que a atividade trata: agrupa a lista e o filtro da aba Histórico. */
export type TipoAtividade = 'lancamento' | 'meta' | 'caixa' | 'organizacao' | 'dados'

/** Cor dos valores em dinheiro do texto: entrada azul, saída vermelha, economia ocre; ausente = sem cor. */
export type TomAtividade = 'entrada' | 'saida' | 'economia'

/**
 * Uma coisa que a pessoa fez no app ("Adicionou a saída Mercado de R$ 260,00"), para ela lembrar depois.
 * O texto fica pronto ao registrar: o item pode mudar de nome ou sumir sem a frase mudar.
 */
export interface Atividade {
  id: string
  /** Data e hora em ISO 8601 (`toISOString`). */
  em: string
  tipo: TipoAtividade
  texto: string
  tom?: TomAtividade
  /** Caixa do item, quando há um. */
  caixaId?: string
  /** O extrato do registro (o que foi lançado, o que mudou); ausente nos registros de antes da versão 14. */
  detalhe?: DetalheAtividade
}

/** Uma linha do extrato, já em texto: o item pode mudar ou sumir depois. */
export interface LinhaDetalhe {
  rotulo: string
  valor: string
  /** Como era antes da mudança (aparece riscado antes do valor novo). */
  antes?: string
}

export interface ParteDetalhe {
  titulo?: string
  linhas: LinhaDetalhe[]
}

/** O extrato de um registro: o valor grande no topo (opcional) e as partes, como no extrato de um lançamento. */
export interface DetalheAtividade {
  topo?: { rotulo: string; valorCentavos: number; sinal?: '+' | '−'; legenda?: string }
  partes: ParteDetalhe[]
  /** Nomes citados na frase (lançamento, tag, conta, meta…), sublinhados no extrato para saltarem aos olhos. */
  nomes?: string[]
}

/** O que `descreverAcao` devolve; o id e a hora entram ao registrar. */
export type DescricaoAtividade = Omit<Atividade, 'id' | 'em'>

/**
 * Teto de segurança de quantas ficam guardadas (as mais antigas saem). Bem acima do uso normal: quem quer menos escolhe
 * um prazo em "Apagar sozinho". Cada registro com extrato tem perto de 1 KB.
 */
export const LIMITE_ATIVIDADES = 20_000

/** Segundos em que a mesma frase repetida conta uma vez só (ex.: trocar a ordem das contas grava duas). */
const SEGUNDOS_REPETIDA = 10

/** A nova atividade repete a última (mesma frase, logo em seguida) e não precisa ser anotada de novo. */
export function repeteAUltima(lista: Atividade[], nova: DescricaoAtividade, agora: Date): boolean {
  const ultima = lista[lista.length - 1]
  if (!ultima || ultima.texto !== nova.texto || ultima.tipo !== nova.tipo) return false
  return agora.getTime() - new Date(ultima.em).getTime() < SEGUNDOS_REPETIDA * 1000
}

/** Acrescenta no fim (a lista vai da mais antiga para a mais nova) e mantém só as últimas `LIMITE_ATIVIDADES`. */
export function comAtividade(lista: Atividade[], atividade: Atividade): Atividade[] {
  return [...lista, atividade].slice(-LIMITE_ATIVIDADES)
}

/** Tira as de antes de `antesDe` (ISO) ou, sem ele, todas. */
export function semAtividadesAntigas(lista: Atividade[], antesDe?: string): Atividade[] {
  return antesDe ? lista.filter((a) => a.em >= antesDe) : []
}

/** Junta duas listas sem repetir id, em ordem de hora, com o limite (ao importar um backup). */
export function juntarAtividades(a: Atividade[], b: Atividade[]): Atividade[] {
  const porId = new Map([...a, ...b].map((x) => [x.id, x]))
  return [...porId.values()].sort((x, y) => x.em.localeCompare(y.em)).slice(-LIMITE_ATIVIDADES)
}
