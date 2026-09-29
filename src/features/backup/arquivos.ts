import { appDataDir, join } from '@tauri-apps/api/path'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { ARQUIVO_DADOS } from '@/store/armazenamento-local'

/*
 * Leitura e gravação pelos diálogos do sistema. O app só consegue ler ou gravar
 * o arquivo que a pessoa escolher no diálogo (permissões em src-tauri/capabilities).
 */

const FILTROS = [{ name: 'Backup da Projeção Financeira', extensions: ['json'] }]

/** Pergunta onde salvar e grava. Devolve o caminho, ou null se a pessoa cancelar. */
export async function salvarBackup(nomeSugerido: string, conteudo: string): Promise<string | null> {
  const caminho = await save({ title: 'Exportar backup', defaultPath: nomeSugerido, filters: FILTROS })
  if (!caminho) return null
  await writeTextFile(caminho, conteudo)
  return caminho
}

/** Pergunta qual backup abrir e devolve o conteúdo, ou null se a pessoa cancelar. */
export async function abrirBackup(): Promise<string | null> {
  const caminho = await open({ title: 'Importar backup', multiple: false, directory: false, filters: FILTROS })
  if (!caminho) return null
  return readTextFile(caminho)
}

/** Onde o app guarda os dados neste computador. */
export async function caminhoDosDados(): Promise<string> {
  return join(await appDataDir(), ARQUIVO_DADOS)
}
