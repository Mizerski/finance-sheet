import type { Atividade } from '../model/atividade'

/**
 * Por quantos dias o histórico guarda cada registro antes de apagar sozinho; 0 = não apaga por idade (só o limite
 * de `LIMITE_ATIVIDADES` vale). Fica só neste aparelho, como o tema, mas o que ele apaga sai de todo lugar.
 */
export type PrazoHistorico = 0 | 30 | 90 | 365

export const PRAZOS_HISTORICO: PrazoHistorico[] = [0, 30, 90, 365]

const CHAVE = 'historico-prazo'

const ouvintes = new Set<() => void>()

/** Sem armazenamento (navegação privada), a escolha vale só até fechar. */
let semArmazenamento: PrazoHistorico | null = null

export function ehPrazoHistorico(valor: number): valor is PrazoHistorico {
  return PRAZOS_HISTORICO.includes(valor as PrazoHistorico)
}

export function prazoDoHistorico(): PrazoHistorico {
  if (semArmazenamento !== null) return semArmazenamento
  try {
    const valor = Number(localStorage.getItem(CHAVE))
    return ehPrazoHistorico(valor) ? valor : 0
  } catch {
    return 0
  }
}

export function escolherPrazoDoHistorico(prazo: PrazoHistorico) {
  try {
    if (prazo) localStorage.setItem(CHAVE, String(prazo))
    else localStorage.removeItem(CHAVE)
  } catch {
    semArmazenamento = prazo
  }
  ouvintes.forEach((ouvinte) => ouvinte())
}

/** Também acompanha a escolha feita em outra aba. */
export function assinarPrazoDoHistorico(ouvinte: () => void) {
  const deOutraAba = (e: StorageEvent) => e.key === CHAVE && ouvinte()
  ouvintes.add(ouvinte)
  window.addEventListener('storage', deOutraAba)
  return () => {
    ouvintes.delete(ouvinte)
    window.removeEventListener('storage', deOutraAba)
  }
}

/** O momento (ISO) antes do qual os registros saem, para um prazo em dias. */
export function limiteDoPrazo(prazo: Exclude<PrazoHistorico, 0>, agora: Date): string {
  return new Date(agora.getTime() - prazo * 24 * 60 * 60 * 1000).toISOString()
}

/** Quantos registros um prazo apagaria agora. */
export function quantosSaem(atividades: Atividade[], prazo: PrazoHistorico, agora: Date): number {
  if (!prazo) return 0
  const limite = limiteDoPrazo(prazo, agora)
  return atividades.filter((a) => a.em < limite).length
}

/** Espaço que o histórico ocupa guardado (o JSON, em bytes UTF-8). */
export function tamanhoDoHistorico(atividades: Atividade[]): number {
  return new TextEncoder().encode(JSON.stringify(atividades)).length
}

/** "820 bytes", "84 KB", "1,2 MB", "118 GB". */
export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  const numero = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: n < 10 ? 1 : 0 })
  if (bytes < 1024 ** 2) return `${numero(bytes / 1024)} KB`
  if (bytes < 1024 ** 3) return `${numero(bytes / 1024 ** 2)} MB`
  return `${numero(bytes / 1024 ** 3)} GB`
}

/** "0,4%", "menos de 0,01%": quanto `parte` é de `todo`. */
export function formatarFracao(parte: number, todo: number): string {
  if (todo <= 0) return '0%'
  const pct = (parte / todo) * 100
  if (pct > 0 && pct < 0.01) return 'menos de 0,01%'
  return `${pct.toLocaleString('pt-BR', { maximumFractionDigits: pct < 1 ? 2 : 1 })}%`
}

/** Largura da fatia na barra, em %: o que existe aparece com pelo menos um fio (0,8%), mesmo diante de GB livres. */
export function larguraNaBarra(parte: number, todo: number): number {
  if (parte <= 0 || todo <= 0) return 0
  return Math.min(100, Math.max(0.8, (parte / todo) * 100))
}
