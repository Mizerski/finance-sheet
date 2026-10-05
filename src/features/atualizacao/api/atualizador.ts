import { relaunch } from '@tauri-apps/plugin-process'
import { check, type Update } from '@tauri-apps/plugin-updater'

export type Atualizacao = Update

/**
 * Procura uma versão mais nova no latest.json da última Release. Devolve null se já estiver na última ou se não
 * der para consultar (tenta de novo quando o app abrir).
 */
export async function buscarAtualizacao(): Promise<Atualizacao | null> {
  try {
    return await check({ timeout: 15_000 })
  } catch {
    return null
  }
}

/**
 * Baixa, instala e reinicia o app. `aoProgredir` recebe de 0 a 1, ou null enquanto o
 * tamanho do download for desconhecido. No Windows o instalador fecha e reabre o app sozinho.
 */
export async function instalarAtualizacao(
  atualizacao: Atualizacao,
  aoProgredir: (fracao: number | null) => void,
): Promise<void> {
  let total: number | undefined
  let baixado = 0
  await atualizacao.downloadAndInstall((evento) => {
    if (evento.event === 'Started') {
      total = evento.data.contentLength
      aoProgredir(total ? 0 : null)
    } else if (evento.event === 'Progress') {
      baixado += evento.data.chunkLength
      aoProgredir(total ? Math.min(baixado / total, 1) : null)
    } else {
      aoProgredir(1)
    }
  })
  await relaunch()
}
