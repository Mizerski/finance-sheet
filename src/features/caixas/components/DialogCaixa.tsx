import { useState } from 'react'
import { useModoSimples } from '@/features/modo-simples/hooks/useModoSimples'
import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useFormularioCaixa } from '../hooks/useFormularioCaixa'
import type { Caixa } from '../model/caixa'
import { FormularioCaixa } from './FormularioCaixa'
import { FormularioCaixaPassos } from './FormularioCaixaPassos'

interface DialogCaixaProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = novo caixa. */
  caixa?: Caixa
}

/** No modo simples, o caixa é feito em passos; editar abre direto na conferência, com "Mudar" em cada resposta. */
export function DialogCaixa({ aberto, onOpenChange, caixa }: DialogCaixaProps) {
  /** Cada abertura começa do zero, mesmo que o conteúdo anterior ainda esteja saindo da tela. */
  const [abertura, setAbertura] = useState(0)
  const [abertoAntes, setAbertoAntes] = useState(aberto)
  if (aberto !== abertoAntes) {
    setAbertoAntes(aberto)
    if (aberto) setAbertura((n) => n + 1)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-2xl')}>
        <ConteudoCaixa key={`${caixa?.id ?? 'novo'}-${abertura}`} caixa={caixa} onConcluir={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

/** Guarda o estado do caixa, para "Ver todos os campos" levar o que já foi respondido nos passos. */
function ConteudoCaixa({ caixa, onConcluir }: { caixa?: Caixa; onConcluir: () => void }) {
  const f = useFormularioCaixa(caixa)
  const modo = useModoSimples()
  const [completo, setCompleto] = useState(false)
  const emPassos = modo.ligado && !completo

  return (
    <>
      <DialogHeader>
        <DialogTitle className={TITULO_DIALOG}>{caixa ? 'Editar caixa' : 'Novo caixa'}</DialogTitle>
        <DialogDescription className={cn(emPassos && 'sr-only')}>
          {emPassos
            ? caixa
              ? 'Mude só o que precisar.'
              : 'Uma pergunta de cada vez.'
            : 'Cada caixa tem o próprio saldo. Categorias, tags e pastas valem para todos.'}
        </DialogDescription>
      </DialogHeader>
      {emPassos ? (
        <FormularioCaixaPassos f={f} editando={!!caixa} onConcluir={onConcluir} onVerTudo={() => setCompleto(true)} />
      ) : (
        <FormularioCaixa f={f} onConcluir={onConcluir} />
      )}
    </>
  )
}
