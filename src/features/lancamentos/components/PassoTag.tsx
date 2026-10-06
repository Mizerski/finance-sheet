import { useState } from 'react'
import { DialogTag } from '@/features/tags/components/DialogTag'
import { TAGS_SUGERIDAS } from '@/features/tags/model/tag'
import { EscolhaGrande } from '@/shared/components/EscolhaGrande'
import { PontoCor } from '@/shared/components/PontoCor'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { BOTAO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Plus } from '@/shared/ui/icones'
import { useFinancas } from '@/store/context/financas-context'
import { NENHUMA } from '../constants/selecao'

interface PassoTagProps {
  rotuloId: string
  /** '' = sem tag. */
  valor: string
  /** Já respondeu (mesmo que "não marcar"): ao voltar, a resposta aparece escolhida. */
  respondida: boolean
  /** Escolher (inclusive "não marcar") já avança. */
  onEscolher: (tagId: string) => void
}

/**
 * A tag vira uma pergunta ("era necessário?") em vez de um campo opcional no meio do formulário, que era fácil esquecer.
 * Sem tags, oferece criar as sugeridas com um clique.
 */
export function PassoTag({ rotuloId, valor, respondida, onEscolher }: PassoTagProps) {
  const { estado, dispatch } = useFinancas()
  const [criando, setCriando] = useState(false)

  function criarSugeridas() {
    for (const tag of TAGS_SUGERIDAS) dispatch({ tipo: 'tag/salvar', tag: { ...tag, id: crypto.randomUUID() } })
  }

  const opcoes = [
    ...estado.tags.map((t) => ({
      valor: t.id,
      rotulo: t.nome,
      descricao: t.evitavel ? 'Dava para evitar.' : undefined,
      marca: <PontoCor cor={t.cor} className="size-3.5" />,
    })),
    { valor: NENHUMA, rotulo: 'Não quero marcar', descricao: 'Fica sem tag; dá para marcar depois.' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {estado.tags.length === 0 && (
        <CaixaDestaque fundo="bg-economia-suave" faixa="border-l-amarelo" className="gap-3">
          <p>
            As tags dizem se um gasto era <strong className="font-semibold">necessário</strong> ou{' '}
            <strong className="font-semibold">dava para evitar</strong>. Você ainda não tem nenhuma.
          </p>
          <Button type="button" variant="outline" className={cn(BOTAO, 'h-auto min-h-10 self-start py-2 whitespace-normal')} onClick={criarSugeridas}>
            <Plus className="size-6" />
            Criar {TAGS_SUGERIDAS.map((t) => t.nome).join(', ')}
          </Button>
        </CaixaDestaque>
      )}
      <EscolhaGrande
        rotuloId={rotuloId}
        valor={valor || (respondida ? NENHUMA : '')}
        opcoes={opcoes}
        onChange={(v) => onEscolher(v === NENHUMA ? '' : v)}
        className="grid-cols-2"
      />
      <Button type="button" variant="outline" className={cn(BOTAO, 'self-start')} onClick={() => setCriando(true)}>
        <Plus className="size-6" />
        Nova tag
      </Button>
      <DialogTag aberto={criando} onOpenChange={setCriando} onSalvar={(t) => onEscolher(t.id)} />
    </div>
  )
}
