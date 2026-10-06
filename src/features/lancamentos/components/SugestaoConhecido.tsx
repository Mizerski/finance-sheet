import { CaixaSugestao } from '@/shared/components/CaixaSugestao'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { useFinancas } from '@/store/context/financas-context'
import { useConhecidos } from '../hooks/useConhecidos'
import { conhecidoPara, type Conhecido } from '../utils/conhecidos'
import type { RascunhoLancamento } from '../utils/formulario'

interface SugestaoConhecidoProps {
  rascunho: RascunhoLancamento
  /** Recebe o rascunho já preenchido como da última vez. */
  onUsar: (rascunho: RascunhoLancamento) => void
}

/** Ao digitar uma descrição já lançada antes, oferece preencher o resto como da última vez. */
export function SugestaoConhecido({ rascunho, onUsar }: SugestaoConhecidoProps) {
  const { conhecidos, aplicar } = useConhecidos()
  const achado = conhecidoPara(conhecidos, rascunho)
  if (!achado) return null

  return (
    <CaixaSugestao titulo="Já lançado antes" onUsar={() => onUsar(aplicar(rascunho, achado))}>
      <ResumoConhecido conhecido={achado} />
    </CaixaSugestao>
  )
}

/** "Mercado · Alimentação · Necessário · Conta corrente · R$ 320,00 (5 vezes)"; `semNome` tira a descrição. */
export function ResumoConhecido({ conhecido: c, semNome }: { conhecido: Conhecido; semNome?: boolean }) {
  const { estado } = useFinancas()
  const nome = (lista: { id: string; nome: string }[], id: string) => lista.find((x) => x.id === id)?.nome
  const partes = [
    c.tipo === 'transferencia'
      ? `De ${nome(estado.caixas, c.caixaId) ?? '?'} para ${nome(estado.caixas, c.caixaDestinoId) ?? '?'}`
      : nome(estado.categorias, c.categoriaId),
    c.tipo === 'saida' && nome(estado.tags, c.tagId),
    c.tipo !== 'transferencia' && estado.caixas.length > 1 && nome(estado.caixas, c.caixaId),
  ].filter(Boolean)
  const cor = c.tipo === 'saida' ? 'text-saida' : c.tipo === 'entrada' ? 'text-entrada' : 'text-foreground'

  return (
    <>
      {!semNome && <strong className="font-semibold">{c.descricao} · </strong>}
      {partes.length > 0 && <span className="text-foreground/80">{partes.join(' · ')} · </span>}
      <span className={`font-semibold tabular-nums ${cor}`}>{formatarBRL(c.valorCentavos)}</span>
      {c.usos > 1 && <span className="text-foreground/70"> ({c.usos} vezes)</span>}
    </>
  )
}
