import { useSearch } from '@tanstack/react-router'
import { SecaoCategorias } from '@/features/categorias/SecaoCategorias'
import { SecaoPastas } from '@/features/pastas/SecaoPastas'
import { SecaoTags } from '@/features/tags/SecaoTags'

/** Cadastros que classificam e organizam os lançamentos: categorias, tags e pastas, uma aba cada. */
export function OrganizacaoPage() {
  const { aba } = useSearch({ from: '/organizacao' })
  if (aba === 'tags') return <SecaoTags />
  if (aba === 'pastas') return <SecaoPastas />
  return <SecaoCategorias />
}
