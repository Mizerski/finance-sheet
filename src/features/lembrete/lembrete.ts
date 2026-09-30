import { format } from 'date-fns'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'

/** Preferências do lembrete diário (só no desktop, fora dos dados financeiros e dos backups). */
export interface PreferenciasLembrete {
  ativo: boolean
  /** Fechar a janela só a esconde na bandeja, e o lembrete continua funcionando. */
  bandeja: boolean
  /** "HH:mm": a partir de quando o lembrete pode aparecer. */
  horario: string
  /** Dia do último lembrete mostrado: no máximo um por dia. */
  ultimoAviso?: DataISO
  /** Dia em que o usuário salvou um lançamento pela última vez: aí o lembrete do dia não é necessário. */
  ultimoRegistro?: DataISO
}

export const PREFERENCIAS_PADRAO: PreferenciasLembrete = { ativo: true, bandeja: true, horario: '20:00' }

/**
 * Se o lembrete deve aparecer agora: ligado, depois do horário, ainda não mostrado hoje,
 * sem lançamento salvo hoje e com o app fora de foco (se o usuário está olhando o app, o aviso não ajuda).
 */
export function deveAvisar(prefs: PreferenciasLembrete, agora: Date, appEmFoco: boolean): boolean {
  const hoje = paraDataISO(agora)
  return (
    prefs.ativo &&
    format(agora, 'HH:mm') >= prefs.horario &&
    prefs.ultimoAviso !== hoje &&
    prefs.ultimoRegistro !== hoje &&
    !appEmFoco
  )
}

/** A meta citada no lembrete: lembrar do objetivo ajuda mais do que só pedir o registro. */
export interface MetaDoLembrete {
  nome: string
  faltaCentavos: number
}

export function textoDoLembrete(meta: MetaDoLembrete | null): { titulo: string; corpo: string } {
  return {
    titulo: 'Registre os gastos de hoje',
    corpo: meta
      ? `Faltam ${formatarBRL(meta.faltaCentavos)} para ${meta.nome}. Leva menos de um minuto.`
      : 'Leva menos de um minuto e deixa a projeção em dia.',
  }
}
