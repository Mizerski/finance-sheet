import { useEffect, useState } from 'react'
import { EH_DESKTOP } from '@/shared/lib/plataforma'
import { lerEspacoDosDados, type EspacoDosDados } from '../api/espaco'

/** Atraso para ler o arquivo depois de uma mudança, quando a gravação já terminou. */
const ESPERA_MS = 600

/**
 * Só no desktop: tamanho do arquivo de dados e espaço livre do disco, lidos de novo quando `versao` muda (ex.: a
 * quantidade de registros). Na web, null: os dados ficam no servidor, não no computador.
 */
export function useEspacoDosDados(versao: unknown): EspacoDosDados | null {
  const [espaco, setEspaco] = useState<EspacoDosDados | null>(null)

  useEffect(() => {
    if (!EH_DESKTOP) return
    let ativo = true
    const espera = setTimeout(() => {
      lerEspacoDosDados().then(
        (lido) => ativo && setEspaco(lido),
        () => {},
      )
    }, ESPERA_MS)
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [versao])

  return espaco
}
