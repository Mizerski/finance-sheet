import { useState } from 'react'
import { CATEGORIAS_SUGERIDAS, categoriasSugeridas, type Categoria } from '@/features/categorias/model/categoria'
import { DialogCategoria } from '@/features/categorias/components/DialogCategoria'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { EscolhaGrande } from '@/shared/components/EscolhaGrande'
import { PontoCor } from '@/shared/components/PontoCor'
import { BOTAO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { FieldError } from '@/shared/ui/field'
import { Plus, Sparkles } from '@/shared/ui/icones'
import { useFinancas } from '@/store/context/financas-context'

interface PassoCategoriaProps {
  rotuloId: string
  tipo: 'entrada' | 'saida'
  valor: string
  erro?: string
  /** Escolher já avança; a categoria criada aqui também conta como escolha. */
  onEscolher: (categoriaId: string) => void
}

/** As categorias do tipo em cartões, com a cor de cada uma; "Nova categoria" fica logo abaixo, sem sair do lançamento. */
export function PassoCategoria({ rotuloId, tipo, valor, erro, onEscolher }: PassoCategoriaProps) {
  const { estado, dispatch } = useFinancas()
  const [criando, setCriando] = useState(false)
  const categorias = estado.categorias.filter((c) => c.tipo === tipo)

  function criada(categoria: Categoria) {
    if (categoria.tipo === tipo) onEscolher(categoria.id)
  }

  return (
    <div className="flex flex-col gap-3">
      {categorias.length > 0 ? (
        <EscolhaGrande
          rotuloId={rotuloId}
          valor={valor}
          opcoes={categorias.map((c) => ({ valor: c.id, rotulo: c.nome, marca: <PontoCor cor={c.cor} className="size-3.5" /> }))}
          onChange={onEscolher}
          className="grid-cols-2"
        />
      ) : (
        <CaixaDestaque fundo={tipo === 'saida' ? 'bg-saida-suave' : 'bg-entrada-suave'} faixa={tipo === 'saida' ? 'border-l-vermelho' : 'border-l-azul'} className="gap-3">
          <p>
            Você ainda não tem categorias de {tipo === 'saida' ? 'saída' : 'entrada'}. Quer começar com as mais comuns?
          </p>
          <Button
            type="button"
            className={cn(BOTAO, 'h-auto min-h-10 self-start py-2 whitespace-normal')}
            onClick={() => {
              for (const categoria of categoriasSugeridas(tipo, estado.categorias)) dispatch({ tipo: 'categoria/salvar', categoria })
            }}
          >
            <Sparkles className="size-6" />
            Criar {CATEGORIAS_SUGERIDAS[tipo].map((c) => c.nome).join(', ')}
          </Button>
        </CaixaDestaque>
      )}
      {erro && <FieldError>{erro}</FieldError>}
      <Button type="button" variant="outline" className={cn(BOTAO, 'self-start')} onClick={() => setCriando(true)}>
        <Plus className="size-6" />
        Nova categoria
      </Button>
      <DialogCategoria aberto={criando} onOpenChange={setCriando} tipoInicial={tipo} onSalvar={criada} />
    </div>
  )
}
