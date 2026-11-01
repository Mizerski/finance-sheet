function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Acha os nomes como palavra inteira ("Casa" não pega "Casamento"); com o grupo, `split` devolve os nomes nas posições
 * ímpares. Passe os nomes do mais longo ao mais curto, para "Impulso de compra" ganhar de "Impulso".
 */
export function regexDosNomes(nomes: string[]): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(${nomes.map(escaparRegex).join('|')})(?![\\p{L}\\p{N}])`, 'u')
}
