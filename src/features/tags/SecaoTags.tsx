import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { CabecalhoOrganizacao } from '@/features/organizacao/components/CabecalhoOrganizacao'
import { gastosPorTag } from '@/features/projecao/projecao'
import { useProjecao } from '@/features/projecao/useProjecao'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { BOTAO } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { useFinancas } from '@/store/financas-context'
import { CardTags } from './components/CardTags'
import { DialogTag } from './components/DialogTag'
import { TAGS_SUGERIDAS, type Tag } from './tag'

/** O item continua guardado ao fechar, para o conteúdo não mudar durante a animação de saída. */
interface Selecao {
  aberto: boolean
  tag?: Tag
}

/** Aba Tags da tela Organização. */
export function SecaoTags() {
  const { estado, dispatch } = useFinancas()
  const { ano, dias } = useProjecao()
  const [edicao, setEdicao] = useState<Selecao>({ aberto: false })
  const [exclusao, setExclusao] = useState<Selecao>({ aberto: false })

  const gastos = useMemo(() => gastosPorTag(dias, estado.tags), [dias, estado.tags])
  // Só saídas levam tag; as sem tag (ou com tag já excluída) contam em ''.
  const usos = useMemo(() => {
    const ids = new Set(estado.tags.map((t) => t.id))
    const contagem = new Map<string, number>()
    for (const l of estado.lancamentos) {
      if (l.tipo !== 'saida') continue
      const chave = l.tagId && ids.has(l.tagId) ? l.tagId : ''
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
    }
    return contagem
  }, [estado.lancamentos, estado.tags])

  const usosExcluindo = exclusao.tag ? (usos.get(exclusao.tag.id) ?? 0) : 0
  const nova = () => setEdicao({ aberto: true })

  function usarSugeridas() {
    for (const tag of TAGS_SUGERIDAS) dispatch({ tipo: 'tag/salvar', tag: { ...tag, id: crypto.randomUUID() } })
  }

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoOrganizacao
        descricao={`Tags dizem se cada gasto era necessário ou dava para evitar · totais projetados para ${ano}`}
        acao={
          <Button className={BOTAO} onClick={nova}>
            <Plus />
            Nova tag
          </Button>
        }
      />

      <CardTags
        tags={estado.tags}
        usos={usos}
        gastos={gastos}
        onNova={nova}
        onUsarSugeridas={usarSugeridas}
        onEditar={(tag) => setEdicao({ aberto: true, tag })}
        onExcluir={(tag) => setExclusao({ aberto: true, tag })}
      />

      <DialogTag
        aberto={edicao.aberto}
        tag={edicao.tag}
        onOpenChange={(aberto) => setEdicao((e) => ({ ...e, aberto }))}
      />

      <ConfirmarExclusao
        aberto={exclusao.aberto}
        onOpenChange={(aberto) => setExclusao((e) => ({ ...e, aberto }))}
        titulo="Excluir tag?"
        descricao={
          <>
            <span className="font-medium text-foreground">{exclusao.tag?.nome}</span>{' '}
            {usosExcluindo > 0
              ? `é usada por ${usosExcluindo} ${usosExcluindo === 1 ? 'lançamento, que vai' : 'lançamentos, que vão'} ficar sem tag. Eles continuam na projeção.`
              : 'não é usada por nenhum lançamento.'}
          </>
        }
        onConfirmar={() => exclusao.tag && dispatch({ tipo: 'tag/excluir', id: exclusao.tag.id })}
      />
    </div>
  )
}
