import { useSearch } from '@tanstack/react-router'
import { SecaoCaixas } from '@/features/caixas/SecaoCaixas'
import { SecaoCategorias } from '@/features/categorias/SecaoCategorias'
import { SecaoHistorico } from '@/features/historico/SecaoHistorico'
import { SecaoPastas } from '@/features/pastas/SecaoPastas'
import { SecaoTags } from '@/features/tags/SecaoTags'

/** Cadastros que classificam e organizam os lançamentos (categorias, tags, pastas e caixas) e o histórico do que a pessoa fez, uma aba cada. */
export function OrganizacaoPage() {
  const { aba } = useSearch({ from: '/organizacao' })
  if (aba === 'tags') return <SecaoTags />
  if (aba === 'pastas') return <SecaoPastas />
  if (aba === 'caixas') return <SecaoCaixas />
  if (aba === 'historico') return <SecaoHistorico />
  return <SecaoCategorias />
}
