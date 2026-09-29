/** Mensagens de erro do Supabase (auth e banco) em português, para as que aparecem no uso normal. */
const TRADUCOES: [trecho: string, mensagem: string][] = [
  ['Invalid login credentials', 'E-mail ou senha incorretos.'],
  ['Email not confirmed', 'Confirme o e-mail pelo link que enviamos antes de entrar.'],
  ['User already registered', 'Já existe uma conta com esse e-mail. Use "Entrar".'],
  ['Password should be at least', 'A senha precisa ter pelo menos 6 caracteres.'],
  ['Unable to validate email address', 'E-mail inválido.'],
  ['rate limit', 'Muitas tentativas seguidas. Espere um pouco e tente de novo.'],
  ['Failed to fetch', 'Sem conexão com o Supabase. Verifique a internet e a URL do projeto.'],
]

export function traduzirErro(erro: unknown): string {
  const mensagem = erro instanceof Error ? erro.message : String((erro as { message?: string })?.message ?? erro)
  return TRADUCOES.find(([trecho]) => mensagem.toLowerCase().includes(trecho.toLowerCase()))?.[1] ?? mensagem
}
