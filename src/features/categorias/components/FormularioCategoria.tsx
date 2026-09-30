import { useState, type FormEvent } from 'react'
import type { TipoMovimento } from '@/features/lancamentos/lancamento'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { BOTAO, CAMPO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { useFinancas } from '@/store/financas-context'
import type { Categoria } from '../categoria'
import { proximaCorLivre } from '../cores'
import { SeletorCor } from './SeletorCor'
import { COR_ATIVA_TIPO } from '@/features/lancamentos/cores'

interface FormularioCategoriaProps {
  /** Ausente = nova categoria. */
  categoria?: Categoria
  /** Tipo sugerido ao criar. */
  tipoInicial?: TipoMovimento
  /** Recebe a categoria salva. */
  onConcluir: (categoria: Categoria) => void
}

const OPCOES_TIPO = [
  { valor: 'saida' as const, rotulo: 'Saída', corAtiva: COR_ATIVA_TIPO.saida },
  { valor: 'entrada' as const, rotulo: 'Entrada', corAtiva: COR_ATIVA_TIPO.entrada },
]

export function FormularioCategoria({ categoria, tipoInicial = 'saida', onConcluir }: FormularioCategoriaProps) {
  const { estado, dispatch } = useFinancas()
  const [nome, setNome] = useState(categoria?.nome ?? '')
  const [tipo, setTipo] = useState<TipoMovimento>(categoria?.tipo ?? tipoInicial)
  const [cor, setCor] = useState(() => categoria?.cor ?? proximaCorLivre(estado.categorias.map((c) => c.cor)))
  const [tentouSalvar, setTentouSalvar] = useState(false)

  // Mudar o tipo deixaria lançamentos em uso com categoria do tipo errado.
  const emUso = categoria ? estado.lancamentos.filter((l) => l.categoriaId === categoria.id).length : 0

  function validar(): string | undefined {
    const limpo = nome.trim()
    if (!limpo) return 'Informe um nome.'
    const repetida = estado.categorias.some(
      (c) => c.id !== categoria?.id && c.tipo === tipo && c.nome.toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'),
    )
    if (repetida) return 'Já existe uma categoria com esse nome.'
  }
  const erroNome = tentouSalvar ? validar() : undefined

  function salvar(e: FormEvent) {
    e.preventDefault()
    // O dialog pode abrir de dentro de outro formulário (o de lançamento); o submit não deve chegar lá.
    e.stopPropagation()
    if (validar()) {
      setTentouSalvar(true)
      return
    }
    const salva = { id: categoria?.id ?? crypto.randomUUID(), nome: nome.trim(), tipo, cor }
    dispatch({ tipo: 'categoria/salvar', categoria: salva })
    onConcluir(salva)
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <Field data-invalid={!!erroNome || undefined}>
        <FieldLabel htmlFor="cat-nome">Nome</FieldLabel>
        <Input
          id="cat-nome"
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Transporte"
          aria-invalid={!!erroNome || undefined}
          className={CAMPO}
        />
        <FieldError>{erroNome}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="cat-tipo">Tipo</FieldLabel>
        <ControleSegmentado
          id="cat-tipo"
          rotulo="Tipo"
          valor={tipo}
          opcoes={OPCOES_TIPO}
          onChange={setTipo}
          desabilitado={emUso > 0}
        />
        {emUso > 0 && (
          <FieldDescription>
            Em uso por {emUso} {emUso === 1 ? 'lançamento' : 'lançamentos'}, por isso o tipo não pode mudar.
          </FieldDescription>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="cat-cor">Cor</FieldLabel>
        <SeletorCor id="cat-cor" valor={cor} onChange={setCor} />
      </Field>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO}>
          {categoria ? 'Salvar alterações' : 'Adicionar categoria'}
        </Button>
      </DialogFooter>
    </form>
  )
}
