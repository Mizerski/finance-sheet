import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** Cliente do Supabase; `null` quando as variáveis de ambiente não foram definidas (.env.local). */
export const supabase = url && chave ? createClient(url, chave) : null
