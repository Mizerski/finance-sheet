import type { ReactNode } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { SeletorAno } from '@/features/projecao/components/SeletorAno'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import type { Aba } from '../aba'

const OPCOES_ABA = [
  { valor: 'categorias' as const, rotulo: 'Categorias' },
  { valor: 'tags' as const, rotulo: 'Tags' },
  { valor: 'pastas' as const, rotulo: 'Pastas' },
  { valor: 'caixas' as const, rotulo: 'Caixas' },
]

interface CabecalhoOrganizacaoProps {
  descricao: ReactNode
  /** Ação principal da aba (ex.: "Nova categoria"). */
  acao: ReactNode
}

/** Título, ano, ação da aba aberta e a troca de abas da tela Organização. */
export function CabecalhoOrganizacao({ descricao, acao }: CabecalhoOrganizacaoProps) {
  const { aba = 'categorias' } = useSearch({ from: '/organizacao' })
  const navigate = useNavigate({ from: '/organizacao' })

  const trocar = (nova: Aba) =>
    navigate({ search: (s) => ({ ...s, aba: nova === 'categorias' ? undefined : nova }), replace: true })

  return (
    <>
      <CabecalhoPagina
        forma={FORMA_PAGINA.organizacao}
        titulo="Organização"
        descricao={descricao}
        acoes={
          <div className="flex flex-wrap items-center gap-2">
            <SeletorAno />
            {acao}
          </div>
        }
      />
      <ControleSegmentado rotulo="Seção" valor={aba} opcoes={OPCOES_ABA} onChange={trocar} className="sm:w-fit" />
    </>
  )
}
