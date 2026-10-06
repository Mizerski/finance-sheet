import type { NivelRisco } from '../utils/risco'

/** O que fazer em cada nível, em uma frase. */
export const CONSELHO: Record<NivelRisco, { titulo: string; texto: string }> = {
  1: { titulo: 'Você está com folga.', texto: 'Dá para assumir uma conta nova ou guardar mais, com calma.' },
  2: { titulo: 'Está tudo bem, mas sem muita sobra.', texto: 'Antes de assumir uma conta nova, veja no simulador como ela fica.' },
  3: {
    titulo: 'Está apertado.',
    texto: 'Um gasto inesperado pode deixar a conta no vermelho. Pense duas vezes antes de gastar mais.',
  },
  4: {
    titulo: 'Está no limite.',
    texto: 'Evite contas novas. Se der, adie algum gasto ou adiante um dinheiro que vai entrar.',
  },
  5: { titulo: 'Pode faltar dinheiro.', texto: 'Qualquer gasto inesperado deixa a conta no vermelho. Não assuma contas novas agora.' },
}

export const CONSELHO_NEGATIVO = {
  titulo: 'Vai faltar dinheiro.',
  texto: 'Corte algum gasto, adie uma conta ou adiante um dinheiro que vai entrar, antes dessa data.',
}
