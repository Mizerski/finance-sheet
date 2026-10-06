/**
 * Modo simples: o app pergunta uma coisa de cada vez (por enquanto, ao criar um lançamento). Fica só neste aparelho,
 * como o tema, porque quem precisa dele costuma ser quem usa este computador ou celular.
 */
const CHAVE = 'modo-simples'

const ouvintes = new Set<() => void>()

/** Sem armazenamento (navegação privada), a escolha vale só até fechar. */
let semArmazenamento: boolean | null = null

export function modoSimplesLigado(): boolean {
  if (semArmazenamento !== null) return semArmazenamento
  try {
    return localStorage.getItem(CHAVE) === 'ligado'
  } catch {
    return false
  }
}

export function escolherModoSimples(ligado: boolean) {
  try {
    if (ligado) localStorage.setItem(CHAVE, 'ligado')
    else localStorage.removeItem(CHAVE)
  } catch {
    semArmazenamento = ligado
  }
  ouvintes.forEach((ouvinte) => ouvinte())
}

/** Também acompanha a escolha feita em outra aba. */
export function assinarModoSimples(ouvinte: () => void) {
  const deOutraAba = (e: StorageEvent) => e.key === CHAVE && ouvinte()
  ouvintes.add(ouvinte)
  window.addEventListener('storage', deOutraAba)
  return () => {
    ouvintes.delete(ouvinte)
    window.removeEventListener('storage', deOutraAba)
  }
}
