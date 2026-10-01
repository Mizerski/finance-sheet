import type { NivelRisco } from './risco'

/** O que fazer em cada nível, em uma frase. */
export const CONSELHO: Record<NivelRisco, { titulo: string; texto: string }> = {
  1: { titulo: 'Sua conta tem folga.', texto: 'Dá para assumir contas novas e guardar mais com calma.' },
  2: { titulo: 'Há folga, mas sem exagero.', texto: 'Antes de assumir uma conta nova, simule o efeito dela.' },
  3: {
    titulo: 'Pouca folga.',
    texto: 'Uma conta nova ou um imprevisto pode deixar a conta no vermelho. Pense duas vezes antes de gastar mais.',
  },
  4: {
    titulo: 'O caixa fica no limite.',
    texto: 'Evite contas novas e, se puder, adie gastos ou antecipe entradas.',
  },
  5: { titulo: 'Risco de ficar sem dinheiro.', texto: 'Qualquer imprevisto deixa a conta no vermelho. Não assuma contas novas agora.' },
}

export const CONSELHO_NEGATIVO = {
  titulo: 'Vai faltar dinheiro.',
  texto: 'Corte gastos, adie uma conta ou antecipe uma entrada antes dessa data.',
}
