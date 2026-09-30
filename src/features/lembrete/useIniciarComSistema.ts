import { useEffect, useState } from 'react'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { traduzirErro } from '@/shared/lib/erros'

/** Iniciar o app com o sistema, já na bandeja. O estado vem do próprio sistema, não das preferências. */
export function useIniciarComSistema() {
  const [ativo, setAtivo] = useState<boolean | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    isEnabled().then(setAtivo, (e) => setErro(traduzirErro(e)))
  }, [])

  async function alterar(novo: boolean) {
    setErro(null)
    try {
      await (novo ? enable() : disable())
      setAtivo(await isEnabled())
    } catch (e) {
      setErro(traduzirErro(e))
    }
  }

  return { ativo, alterar, erro }
}
