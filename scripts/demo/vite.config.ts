/*
 * O app desktop no navegador, com o Tauri simulado e os dados de demonstração (prints do README).
 *
 *   npx vite --config scripts/demo/vite.config.ts
 */
import { mergeConfig, type Plugin } from 'vite'
import base from '../../vite.config'

const simularTauri: Plugin = {
  name: 'simular-tauri',
  transformIndexHtml: (html) =>
    html.replace('/src/main.tsx', '/scripts/demo/entrada.ts'),
}

export default mergeConfig(base, {
  plugins: [simularTauri],
  define: { 'import.meta.env.TAURI_ENV_PLATFORM': JSON.stringify('windows') },
  server: { port: Number(process.env.PORT) || 5174, strictPort: false },
})
