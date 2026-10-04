import { useState, type FormEvent } from 'react'
import { proximaCorLivre } from '@/features/categorias/cores'
import { SeletorCor } from '@/features/categorias/components/SeletorCor'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { BOTAO, CAMPO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { useFinancas } from '@/store/financas-context'
import type { Tag } from '../tag'

interface FormularioTagProps {
  /** Ausente = nova tag. */
  tag?: Tag
  /** Recebe a tag salva (ex.: para escolhê-la no lançamento). */
  onConcluir: (tag: Tag) => void
}

const OPCOES_EVITAVEL = [
  { valor: 'nao' as const, rotulo: 'Não' },
  { valor: 'sim' as const, rotulo: 'Sim, dava para evitar' },
]

export function FormularioTag({ tag, onConcluir }: FormularioTagProps) {
  const { estado, dispatch } = useFinancas()
  const [nome, setNome] = useState(tag?.nome ?? '')
  const [cor, setCor] = useState(() => tag?.cor ?? proximaCorLivre(estado.tags.map((t) => t.cor)))
  const [evitavel, setEvitavel] = useState(tag?.evitavel ?? false)
  const [tentouSalvar, setTentouSalvar] = useState(false)

  function validar(): string | undefined {
    const limpo = nome.trim()
    if (!limpo) return 'Informe um nome.'
    const repetida = estado.tags.some(
      (t) => t.id !== tag?.id && t.nome.toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'),
    )
    if (repetida) return 'Já existe uma tag com esse nome.'
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
    const salva = { id: tag?.id ?? crypto.randomUUID(), nome: nome.trim(), cor, evitavel }
    dispatch({ tipo: 'tag/salvar', tag: salva })
    onConcluir(salva)
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <Field data-invalid={!!erroNome || undefined}>
        <FieldLabel htmlFor="tag-nome">Nome</FieldLabel>
        <Input
          id="tag-nome"
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Superficial"
          aria-invalid={!!erroNome || undefined}
          className={CAMPO}
        />
        <FieldError>{erroNome}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="tag-evitavel">Gasto evitável?</FieldLabel>
        <ControleSegmentado
          id="tag-evitavel"
          rotulo="Gasto evitável?"
          valor={evitavel ? 'sim' : 'nao'}
          opcoes={OPCOES_EVITAVEL}
          onChange={(v) => setEvitavel(v === 'sim')}
        />
        <FieldDescription>Os gastos evitáveis somam num indicador próprio do Dashboard.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="tag-cor">Cor</FieldLabel>
        <SeletorCor id="tag-cor" valor={cor} onChange={setCor} />
      </Field>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO}>
          {tag ? 'Salvar alterações' : 'Adicionar tag'}
        </Button>
      </DialogFooter>
    </form>
  )
}
