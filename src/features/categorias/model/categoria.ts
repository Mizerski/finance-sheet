import type { TipoMovimento } from '@/features/lancamentos/model/lancamento'

export interface Categoria {
  id: string
  nome: string
  /** Cor em hexadecimal, ex.: "#16a34a" */
  cor: string
  tipo: TipoMovimento
}

export const CATEGORIA_DESCONHECIDA = { nome: 'Sem categoria', cor: '#a39a8e' }

/** Oferecidas enquanto o tipo não tem nenhuma categoria; cores bem diferentes da paleta Bauhaus. */
export const CATEGORIAS_SUGERIDAS: Record<TipoMovimento, readonly Omit<Categoria, 'id' | 'tipo'>[]> = {
  saida: [
    { nome: 'Moradia', cor: '#7a4a26' },
    { nome: 'Mercado', cor: '#ee7a1a' },
    { nome: 'Contas da casa', cor: '#c99a1a' },
    { nome: 'Transporte', cor: '#1f45c4' },
    { nome: 'Saúde', cor: '#2e8b4e' },
    { nome: 'Restaurantes', cor: '#9e1f1f' },
    { nome: 'Lazer', cor: '#c2378f' },
    { nome: 'Educação', cor: '#142b6e' },
  ],
  entrada: [
    { nome: 'Salário', cor: '#157a86' },
    { nome: 'Aposentadoria', cor: '#6c3fb5' },
    { nome: 'Extras', cor: '#5b9be0' },
    { nome: 'Outras entradas', cor: '#6b6e78' },
  ],
}

/** As sugeridas do tipo que ainda não existem (pelo nome, sem diferenciar maiúsculas), prontas para salvar. */
export function categoriasSugeridas(tipo: TipoMovimento, existentes: readonly Categoria[]): Categoria[] {
  const nomes = new Set(existentes.filter((c) => c.tipo === tipo).map((c) => c.nome.toLocaleLowerCase('pt-BR')))
  return CATEGORIAS_SUGERIDAS[tipo]
    .filter((c) => !nomes.has(c.nome.toLocaleLowerCase('pt-BR')))
    .map((c) => ({ ...c, tipo, id: crypto.randomUUID() }))
}
