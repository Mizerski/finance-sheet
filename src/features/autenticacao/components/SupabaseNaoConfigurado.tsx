import { TelaCentralizada } from '@/shared/components/TelaCentralizada'

export function SupabaseNaoConfigurado() {
  return (
    <TelaCentralizada
      titulo="Conecte o Supabase"
      descricao="Os dados ficam no seu projeto Supabase. Falta informar qual é ele."
    >
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
        <li>
          Copie <code className="border border-foreground bg-muted px-1">.env.example</code> para{' '}
          <code className="border border-foreground bg-muted px-1">.env.local</code>.
        </li>
        <li>Preencha a URL e a chave pública do projeto (Project Settings → API).</li>
        <li>
          Rode o SQL de <code className="border border-foreground bg-muted px-1">supabase/migrations</code> no SQL Editor.
        </li>
        <li>Reinicie o servidor de desenvolvimento.</li>
      </ol>
    </TelaCentralizada>
  )
}
