import { relaunch } from '@tauri-apps/plugin-process'
import { check, type Update } from '@tauri-apps/plugin-updater'

/*
 * Atualização do app desktop pelas Releases do GitHub. O app instalado lê o latest.json
 * da última release (endpoint em src-tauri/tauri.conf.json) e só instala o que estiver
 * assinado com a chave do projeto.
 */

export type Atualizacao = Update

/** Procura uma versão mais nova. Devolve null se já estiver na última ou se não der para consultar. */
export async function buscarAtualizacao(): Promise<Atualizacao | null> {
  try {
    return await check({ timeout: 15_000 })
  } catch {
    // Sem internet ou sem release publicada: tenta de novo na próxima vez que o app abrir.
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
