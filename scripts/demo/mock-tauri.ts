/*
 * Simula o Tauri no navegador para tirar os prints do app desktop com os dados de demonstração.
 * Carregado antes do src/main.tsx (entrada.ts, por scripts/demo/vite.config.ts). Nada é gravado em disco.
 */
import { mockIPC, mockWindows } from '@tauri-apps/api/mocks'
import { VERSAO_DADOS } from '@/store/model/dados'
import { dadosDemo } from './dados-demo'

const arquivos = new Map<string, Map<string, unknown>>([
  ['financas.json', new Map<string, unknown>([['versao', VERSAO_DADOS], ['dados', dadosDemo()]])],
  ['preferencias.json', new Map<string, unknown>([['lembrete', { ativo: true, horario: '20:00', bandeja: true }]])],
])
const porRid = new Map<number, Map<string, unknown>>()
let proximoRid = 1

mockWindows('main')
mockIPC((cmd, args) => {
  const a = (args ?? {}) as Record<string, unknown>
  switch (cmd) {
    case 'plugin:store|load': {
      const path = String(a.path)
      if (!arquivos.has(path)) arquivos.set(path, new Map())
      const rid = proximoRid++
      porRid.set(rid, arquivos.get(path)!)
      return rid
    }
    case 'plugin:store|get': {
      const store = porRid.get(Number(a.rid))!
      return [store.get(String(a.key)), store.has(String(a.key))]
    }
    case 'plugin:store|set':
      porRid.get(Number(a.rid))!.set(String(a.key), a.value)
      return null
    case 'plugin:updater|check':
      return null
    case 'plugin:autostart|is_enabled':
      return true
    case 'plugin:notification|is_permission_granted':
      return true
    case 'assistente_estado':
      return { motor: true, modelos: [], ligado: null }
    default:
      return null
  }
})
