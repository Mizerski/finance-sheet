import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resumirMeta } from '@/features/economias/aportes'
import { metaPrincipal } from '@/features/economias/marcos'
import { paraDataISO } from '@/shared/lib/datas'
import { traduzirErro } from '@/shared/lib/erros'
import { useFinancas } from '@/store/financas-context'
import type { EstadoFinancas } from '@/store/estado'
import { deveAvisar, textoDoLembrete, type MetaDoLembrete, type PreferenciasLembrete } from './lembrete'
import { notificar } from './notificacao'
import { carregarPreferencias, salvarPreferencias } from './preferencias'

/** A cada minuto confere se é hora do lembrete. */
const INTERVALO_MS = 60_000

function metaDoLembrete(estado: EstadoFinancas, hoje: string): MetaDoLembrete | null {
  const resumos = new Map(estado.metas.map((m) => [m.id, resumirMeta(m, hoje)]))
  const meta = metaPrincipal(estado.metas, resumos)
  return meta ? { nome: meta.nome, faltaCentavos: resumos.get(meta.id)!.faltaCentavos } : null
}

/**
 * Lembrete diário de registrar os gastos (desktop). Só funciona com o app aberto, mesmo minimizado.
 * Salvar um lançamento marca o dia como registrado, e aí o lembrete do dia não aparece.
 */
export function useLembrete() {
  const { estado } = useFinancas()
  const [prefs, setPrefs] = useState<PreferenciasLembrete | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  // Os valores mais recentes, para o intervalo não precisar recomeçar a cada mudança.
  const atual = useRef({ prefs, estado })
  useEffect(() => {
    atual.current = { prefs, estado }
  })

  useEffect(() => {
    carregarPreferencias().then(setPrefs, (e) => setErro(traduzirErro(e)))
  }, [])

  const alterar = useCallback((mudanca: Partial<PreferenciasLembrete>) => {
    const base = atual.current.prefs
    if (!base) return
    const novas = { ...base, ...mudanca }
    atual.current.prefs = novas
    setPrefs(novas)
    salvarPreferencias(novas).catch((e) => setErro(traduzirErro(e)))
  }, [])

  // Lançamentos mudaram depois de abrir o app: o usuário registrou algo hoje.
  const assinatura = useMemo(() => JSON.stringify(estado.lancamentos), [estado.lancamentos])
  const assinaturaInicial = useRef(assinatura)
  useEffect(() => {
    // Espera as preferências carregarem, para a marcação não se perder.
    if (!prefs || assinatura === assinaturaInicial.current) return
    assinaturaInicial.current = assinatura
    alterar({ ultimoRegistro: paraDataISO(new Date()) })
  }, [assinatura, alterar, prefs])

  const ativo = prefs?.ativo ?? false
  useEffect(() => {
    if (!ativo) return
    async function conferir() {
      const { prefs: p, estado: e } = atual.current
      const agora = new Date()
      if (!p || !deveAvisar(p, agora, document.hasFocus())) return
      const hoje = paraDataISO(agora)
      const { titulo, corpo } = textoDoLembrete(metaDoLembrete(e, hoje))
      if (await notificar(titulo, corpo)) alterar({ ultimoAviso: hoje })
      else setErro('As notificações deste app estão bloqueadas nas configurações do sistema.')
    }
    conferir()
    const id = setInterval(conferir, INTERVALO_MS)
    return () => clearInterval(id)
  }, [ativo, alterar])

  /** Mostra o lembrete agora, sem contar como o aviso do dia. */
  async function testar() {
    setErro(null)
    try {
      const { titulo, corpo } = textoDoLembrete(metaDoLembrete(estado, paraDataISO(new Date())))
      if (!(await notificar(titulo, corpo))) {
        setErro('As notificações deste app estão bloqueadas nas configurações do sistema.')
      }
    } catch (e) {
      setErro(traduzirErro(e))
    }
  }

  return { prefs, alterar, testar, erro }
}
