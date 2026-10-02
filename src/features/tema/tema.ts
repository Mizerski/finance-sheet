/**
 * Tema claro ou escuro. Sem escolha salva, segue o sistema. A escolha é uma preferência deste aparelho
 * (fica no navegador ou no app desktop, fora dos dados e do backup).
 * `public/tema-inicial.js` aplica a classe antes do React carregar, para a tela não piscar no tema errado; mantenha a
 * chave e os valores iguais lá.
 */
export type Tema = 'claro' | 'escuro'

const CHAVE = 'tema'
const CONSULTA_ESCURO = '(prefers-color-scheme: dark)'

const ouvintes = new Set<() => void>()

function temaSalvo(): Tema | null {
  try {
    const valor = localStorage.getItem(CHAVE)
    return valor === 'claro' || valor === 'escuro' ? valor : null
  } catch {
    return null
  }
}

function temaDoSistema(): Tema {
  return window.matchMedia(CONSULTA_ESCURO).matches ? 'escuro' : 'claro'
}

export function temaAtual(): Tema {
  return temaSalvo() ?? temaDoSistema()
}

function aplicar() {
  document.documentElement.classList.toggle('dark', temaAtual() === 'escuro')
  ouvintes.forEach((ouvinte) => ouvinte())
}

export function escolherTema(tema: Tema) {
  try {
    // Escolher o mesmo tema do sistema apaga a escolha, para voltar a seguir o sistema se ele mudar.
    if (tema === temaDoSistema()) localStorage.removeItem(CHAVE)
    else localStorage.setItem(CHAVE, tema)
  } catch {
    // Sem armazenamento, o tema vale só até fechar.
    document.documentElement.classList.toggle('dark', tema === 'escuro')
    ouvintes.forEach((ouvinte) => ouvinte())
    return
  }
  aplicar()
}

export function assinarTema(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  const mql = window.matchMedia(CONSULTA_ESCURO)
  mql.addEventListener('change', aplicar)
  return () => {
    ouvintes.delete(ouvinte)
    mql.removeEventListener('change', aplicar)
  }
}
