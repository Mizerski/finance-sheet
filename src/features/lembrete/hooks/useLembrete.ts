import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { resumirMeta } from '@/features/economias/utils/aportes'
import { metaPrincipal } from '@/features/economias/utils/marcos'
import { paraDataISO } from '@/shared/lib/datas'
import { traduzirErro } from '@/shared/lib/erros'
import { useFinancas } from '@/store/context/financas-context'
import type { EstadoFinancas } from '@/store/reducer/financas-reducer'
import { deveAvisar, textoDoLembrete, type MetaDoLembrete, type PreferenciasLembrete } from '../utils/lembrete'
import { notificar } from '../api/notificacao'
import { carregarPreferencias, salvarPreferencias } from '../api/preferencias'

/** A cada minuto confere se é hora do lembrete. */
const INTERVALO_MS = 60_000

function metaDoLembrete(estado: EstadoFinancas, hoje: string): MetaDoLembrete | null {
  const resumos = new Map(estado.metas.map((m) => [m.id, resumirMeta(m, hoje)]))
  const meta = metaPrincipal(estado.metas, resumos)
  return meta ? { nome: meta.nome, faltaCentavos: resumos.get(meta.id)!.faltaCentavos } : null
}

/**
 * Lembrete diário de registrar os gastos (desktop, com o app aberto ou na bandeja).
 * Salvar um lançamento marca o dia como registrado.
 */
export function useLembrete() {
  const { estado } = useFinancas()
  const [prefs, setPrefs] = useState<PreferenciasLembrete | null>(null)
  const [erro, setErro] = useState<string | null>(null)
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

  const assinatura = useMemo(() => JSON.stringify(estado.lancamentos), [estado.lancamentos])
  const assinaturaInicial = useRef(assinatura)
  useEffect(() => {
    if (!prefs || assinatura === assinaturaInicial.current) return
    assinaturaInicial.current = assinatura
    alterar({ ultimoRegistro: paraDataISO(new Date()) })
  }, [assinatura, alterar, prefs])

  const bandeja = prefs?.bandeja
  useEffect(() => {
    if (bandeja === undefined) return
    invoke('definir_bandeja', { ativa: bandeja }).catch((e) => setErro(traduzirErro(e)))
  }, [bandeja])

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
