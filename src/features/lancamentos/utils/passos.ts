import type { ErrosLancamento, RascunhoLancamento } from './formulario'

/** Perguntas do lançamento novo no modo simples, uma por tela. */
export type Passo = 'tipo' | 'valor' | 'categoria' | 'contas' | 'tag' | 'quando' | 'conferir'

/** A transferência pergunta as contas no lugar da categoria; só a saída pergunta se o gasto era necessário (tag). */
export function passosDo(r: RascunhoLancamento): Passo[] {
  const transferencia = r.tipo === 'transferencia'
  return [
    'tipo',
    'valor',
    transferencia ? 'contas' : 'categoria',
    ...(r.tipo === 'saida' ? (['tag'] as const) : []),
    'quando',
    'conferir',
  ]
}

const PASSO_DO_CAMPO: Partial<Record<keyof RascunhoLancamento, Passo>> = {
  descricao: 'valor',
  valorCentavos: 'valor',
  caixaId: 'valor',
  categoriaId: 'categoria',
  caixaDestinoId: 'contas',
  data: 'quando',
  diasDaSemana: 'quando',
  diaDoMes: 'quando',
  inicio: 'quando',
  fim: 'quando',
}

/** Os erros que impedem de sair deste passo. */
export function errosDoPasso(passo: Passo, erros: ErrosLancamento): ErrosLancamento {
  return Object.fromEntries(
    Object.entries(erros).filter(([campo]) => PASSO_DO_CAMPO[campo as keyof RascunhoLancamento] === passo),
  )
}

/** O primeiro passo com erro, na ordem das perguntas (para voltar a ele ao salvar). */
export function primeiroPassoComErro(passos: Passo[], erros: ErrosLancamento): Passo | undefined {
  return passos.find((p) => Object.keys(errosDoPasso(p, erros)).length > 0)
}
