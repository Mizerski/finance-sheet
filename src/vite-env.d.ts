/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  /** Chave pública do projeto (publishable key, ou a anon key antiga). */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Definida pelo CLI do Tauri só no app desktop (ex.: "windows"). */
  readonly TAURI_ENV_PLATFORM?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
