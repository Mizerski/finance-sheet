import { useEffect, useRef, type ReactNode } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { SeletorAno } from '@/features/projecao/components/SeletorAno'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import type { Aba } from '../utils/aba'

const OPCOES_ABA = [
  { valor: 'categorias' as const, rotulo: 'Categorias' },
  { valor: 'tags' as const, rotulo: 'Tags' },
  { valor: 'pastas' as const, rotulo: 'Pastas' },
  { valor: 'caixas' as const, rotulo: 'Caixas' },
  { valor: 'historico' as const, rotulo: 'Histórico' },
]

interface CabecalhoOrganizacaoProps {
  descricao: ReactNode
  /** Ação principal da aba (ex.: "Nova categoria"). */
  acao?: ReactNode
}

/**
 * Título, ano, ação da aba aberta e a troca de abas da tela Organização.
 * No celular as cinco abas não cabem: a faixa rola de lado (sem barra) e a aba aberta fica à vista.
 * O Histórico não depende do ano, então lá o seletor some.
 */
export function CabecalhoOrganizacao({ descricao, acao }: CabecalhoOrganizacaoProps) {
  const { aba = 'categorias' } = useSearch({ from: '/organizacao' })
  const navigate = useNavigate({ from: '/organizacao' })
  const abas = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const faixa = abas.current
    const ativa = faixa?.querySelector<HTMLElement>('[aria-checked=true]')
    if (!faixa || !ativa) return
    const mostrar = () => {
      const fim = ativa.offsetLeft + ativa.offsetWidth + 8 - faixa.clientWidth
      faixa.scrollLeft = ativa.offsetLeft < faixa.scrollLeft ? ativa.offsetLeft : Math.max(faixa.scrollLeft, fim)
    }
    mostrar()
    document.fonts?.ready.then(mostrar)
  }, [aba])

  const trocar = (nova: Aba) =>
    navigate({
      search: (s) => ({ ...s, aba: nova === 'categorias' ? undefined : nova, tipo: undefined }),
      replace: true,
    })

  return (
    <>
      <CabecalhoPagina
        forma={FORMA_PAGINA.organizacao}
        titulo="Organização"
        descricao={descricao}
        acoes={
          <div className="flex flex-wrap items-center gap-2">
            {aba !== 'historico' && <SeletorAno />}
            {acao}
          </div>
        }
      />
      <div ref={abas} className="relative overflow-x-auto [scrollbar-width:none] sm:overflow-visible">
        <ControleSegmentado rotulo="Seção" valor={aba} opcoes={OPCOES_ABA} onChange={trocar} className="min-w-max sm:w-fit" />
      </div>
    </>
  )
}
