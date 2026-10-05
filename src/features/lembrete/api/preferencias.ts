import { load, type Store } from '@tauri-apps/plugin-store'
import { PREFERENCIAS_PADRAO, type PreferenciasLembrete } from '../utils/lembrete'

/** Arquivo próprio, fora do financas.json: não é dado financeiro e não entra no backup. */
const ARQUIVO = 'preferencias.json'
const CHAVE = 'lembrete'

let arquivo: Promise<Store> | undefined
const abrir = () => (arquivo ??= load(ARQUIVO, { autoSave: false, defaults: {} }))

export async function carregarPreferencias(): Promise<PreferenciasLembrete> {
  const salvas = await (await abrir()).get<Partial<PreferenciasLembrete>>(CHAVE)
  return { ...PREFERENCIAS_PADRAO, ...salvas }
}

export async function salvarPreferencias(prefs: PreferenciasLembrete): Promise<void> {
  const store = await abrir()
  await store.set(CHAVE, prefs)
  await store.save()
}
