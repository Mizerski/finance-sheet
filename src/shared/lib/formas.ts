export type TipoForma = 'quadrado' | 'circulo' | 'triangulo' | 'semicirculo' | 'quarto'

/** `papel` é a cor de `--sobre-bloco`, para formas sobre blocos de cor e o item ativo (papel no claro, tinta no escuro). `tinta` usa a cor do texto em volta: fica preta no papel e vira papel no item ativo (preto). */
export type CorForma = 'vermelho' | 'azul' | 'amarelo' | 'papel' | 'tinta'

export interface FormaDaPagina {
  forma: TipoForma
  cor: CorForma
}

/**
 * Forma de cada tela, repetida no menu e ao lado do título da página.
 * Quadrado vermelho, círculo azul e triângulo amarelo são as três formas primárias da Bauhaus;
 * a economia leva o amarelo, que é a cor dela nas tabelas e gráficos.
 */
export const FORMA_PAGINA = {
  planilha: { forma: 'quadrado', cor: 'vermelho' },
  lancamentos: { forma: 'circulo', cor: 'azul' },
  organizacao: { forma: 'triangulo', cor: 'tinta' },
  economias: { forma: 'semicirculo', cor: 'amarelo' },
  dashboard: { forma: 'quarto', cor: 'azul' },
} as const satisfies Record<string, FormaDaPagina>
