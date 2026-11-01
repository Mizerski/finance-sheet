import { invoke } from '@tauri-apps/api/core'

/** O que o comando `espaco_dos_dados` do Rust devolve (cada campo é null quando o sistema não diz). */
export interface EspacoDosDados {
  /** Tamanho do `financas.json` (todos os dados do app, com o histórico). */
  arquivoBytes: number | null
  /** Espaço livre no disco onde ficam os dados. */
  livreBytes: number | null
  totalBytes: number | null
}

/** Só no desktop: o tamanho do arquivo de dados e o espaço livre do disco. */
export function lerEspacoDosDados(): Promise<EspacoDosDados> {
  return invoke<EspacoDosDados>('espaco_dos_dados')
}
