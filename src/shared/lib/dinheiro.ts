const formatador = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** 125000 → "R$ 1.250,00" */
export function formatarBRL(centavos: number): string {
  return formatador.format(centavos / 100)
}

/** Converte um valor em reais (ex.: 119.87) para centavos inteiros (11987). */
export function reaisParaCentavos(reais: number): number {
  return Math.round(reais * 100)
}

/**
 * Lê o texto de um campo com máscara de moeda considerando só os dígitos,
 * como numa máscara de caixa registradora: "R$ 1.250,00" → 125000, "123" → 123.
 */
export function centavosDeTexto(texto: string): number {
  const digitos = texto.replace(/\D/g, '')
  return digitos ? Number.parseInt(digitos, 10) : 0
}

const formatadorCompacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** 1265000 → "R$ 12,7 mil" (eixos de gráfico) */
export function formatarBRLCompacto(centavos: number): string {
  return formatadorCompacto.format(centavos / 100)
}
