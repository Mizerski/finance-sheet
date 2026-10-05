import { useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { ID_CAMPO_PERGUNTA, useAssistente } from '@/features/assistente/context/assistente-context'
import { DialogLancamento } from '@/features/lancamentos/components/DialogLancamento'
import { ID_BUSCA } from '@/features/lancamentos/utils/filtros'
import { useAtalhos, type MapaAtalhos } from '@/shared/hooks/useAtalhos'
import { EH_DESKTOP } from '@/shared/lib/plataforma'
import { ITENS_MENU, type RotaMenu } from '../layout/itens-menu'
import { useMemoriaNavegacao } from '../navegacao/memoria-context'
import { DialogAtalhos } from './DialogAtalhos'

/**
 * Atalhos que valem em qualquer tela: abas (1–5), novo lançamento (N), busca (/), a lista de atalhos (?)
 * e, no desktop, o assistente (A).
 */
export function AtalhosGlobais() {
  const navigate = useNavigate()
  const rota = useRouterState({ select: (s) => s.location.pathname })
  const { buscaPara } = useMemoriaNavegacao()
  const [novo, setNovo] = useState(false)
  const [ajuda, setAjuda] = useState(false)

  const ir = (to: RotaMenu) => navigate({ to, search: buscaPara(to) })

  const buscar = async () => {
    if (rota !== '/lancamentos') await ir('/lancamentos')
    requestAnimationFrame(() => document.getElementById(ID_BUSCA)?.focus())
  }

  const abas: MapaAtalhos = Object.fromEntries(ITENS_MENU.map(({ to }, i) => [String(i + 1), () => ir(to)]))

  useAtalhos({
    ...abas,
    n: () => setNovo(true),
    '/': buscar,
    '?': () => setAjuda(true),
  })

  return (
    <>
      <DialogLancamento aberto={novo} onOpenChange={setNovo} />
      <DialogAtalhos aberto={ajuda} onOpenChange={setAjuda} />
      {EH_DESKTOP && <AtalhoAssistente />}
    </>
  )
}

/** A abre o assistente com o cursor na pergunta. Só no desktop, onde existe o provider. */
function AtalhoAssistente() {
  const { setAberto } = useAssistente()
  useAtalhos({
    a: () => {
      setAberto(true)
      requestAnimationFrame(() => document.getElementById(ID_CAMPO_PERGUNTA)?.focus())
    },
  })
  return null
}
