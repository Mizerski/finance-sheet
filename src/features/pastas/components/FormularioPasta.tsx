import { useState, type FormEvent } from 'react'
import { proximaCorLivre } from '@/features/categorias/cores'
import { SeletorCor } from '@/features/categorias/components/SeletorCor'
import { BOTAO, CAMPO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { useFinancas } from '@/store/financas-context'
import type { Pasta } from '../pasta'

interface FormularioPastaProps {
  /** Ausente = nova pasta. */
  pasta?: Pasta
  onConcluir: () => void
}

export function FormularioPasta({ pasta, onConcluir }: FormularioPastaProps) {
  const { estado, dispatch } = useFinancas()
  const [nome, setNome] = useState(pasta?.nome ?? '')
  const [cor, setCor] = useState(() => pasta?.cor ?? proximaCorLivre(estado.pastas.map((p) => p.cor)))
  const [tentouSalvar, setTentouSalvar] = useState(false)

  function validar(): string | undefined {
    const limpo = nome.trim()
    if (!limpo) return 'Informe um nome.'
    const repetida = estado.pastas.some(
      (p) => p.id !== pasta?.id && p.nome.toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'),
    )
    if (repetida) return 'Já existe uma pasta com esse nome.'
  }
  const erroNome = tentouSalvar ? validar() : undefined

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (validar()) {
      setTentouSalvar(true)
      return
    }
    dispatch({ tipo: 'pasta/salvar', pasta: { id: pasta?.id ?? crypto.randomUUID(), nome: nome.trim(), cor } })
    onConcluir()
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <Field data-invalid={!!erroNome || undefined}>
        <FieldLabel htmlFor="pasta-nome">Nome</FieldLabel>
        <Input
          id="pasta-nome"
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Mercado"
          aria-invalid={!!erroNome || undefined}
          className={CAMPO}
        />
        <FieldError>{erroNome}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="pasta-cor">Cor</FieldLabel>
        <SeletorCor id="pasta-cor" valor={cor} onChange={setCor} />
      </Field>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={cn(BOTAO, 'bg-card')}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO}>
          {pasta ? 'Salvar alterações' : 'Adicionar pasta'}
        </Button>
      </DialogFooter>
    </form>
  )
}
