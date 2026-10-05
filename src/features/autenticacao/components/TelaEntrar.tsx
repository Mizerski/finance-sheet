import { useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { TelaCentralizada } from '@/shared/components/TelaCentralizada'
import { BOTAO, CAMPO } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { traduzirErro } from '@/shared/lib/erros'

type Modo = 'entrar' | 'criar'

const OPCOES_MODO = [
  { valor: 'entrar' as const, rotulo: 'Entrar' },
  { valor: 'criar' as const, rotulo: 'Criar conta' },
]

/** Cadastro sem sessão de volta quer dizer que o projeto exige confirmar o e-mail antes do primeiro login. */
export function TelaEntrar({ supabase }: { supabase: SupabaseClient }) {
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmarEmail, setConfirmarEmail] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        if (!data.session) setConfirmarEmail(true)
      }
    } catch (falha) {
      setErro(traduzirErro(falha))
    } finally {
      setEnviando(false)
    }
  }

  if (confirmarEmail) {
    return (
      <TelaCentralizada
        titulo="Confirme seu e-mail"
        descricao={
          <>
            Enviamos um link para <span className="text-foreground">{email}</span>. Depois de confirmar, volte aqui
            e entre com a sua senha.
          </>
        }
      >
        <Button
          variant="outline"
          className={BOTAO}
          onClick={() => {
            setConfirmarEmail(false)
            setModo('entrar')
          }}
        >
          Voltar para entrar
        </Button>
      </TelaCentralizada>
    )
  }

  return (
    <TelaCentralizada
      titulo={modo === 'entrar' ? 'Entrar' : 'Criar conta'}
      descricao="Seus lançamentos ficam salvos na sua conta e só você tem acesso."
    >
      <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <ControleSegmentado
          rotulo="Entrar ou criar conta"
          valor={modo}
          opcoes={OPCOES_MODO}
          onChange={(m) => {
            setModo(m)
            setErro(null)
          }}
        />

        <Field>
          <FieldLabel htmlFor="auth-email">E-mail</FieldLabel>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CAMPO}
          />
        </Field>

        <Field data-invalid={!!erro || undefined}>
          <FieldLabel htmlFor="auth-senha">Senha</FieldLabel>
          <Input
            id="auth-senha"
            type="password"
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={!!erro || undefined}
            className={CAMPO}
          />
          <FieldError>{erro}</FieldError>
        </Field>

        <Button type="submit" className={BOTAO} disabled={enviando || !email || !senha}>
          {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </Button>
      </form>
    </TelaCentralizada>
  )
}
