import { useState } from 'react'
import { useModoSimples } from '@/features/modo-simples/hooks/useModoSimples'
import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useFormularioMeta, type SugestaoMeta } from '../hooks/useFormularioMeta'
import type { MetaEconomia } from '../model/meta'
import { FormularioMeta } from './FormularioMeta'
import { FormularioMetaPassos } from './FormularioMetaPassos'

interface DialogMetaProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = nova meta. */
  meta?: MetaEconomia
  sugestao?: SugestaoMeta
}

/** No modo simples, a meta é feita em passos; editar abre direto na conferência, com "Mudar" em cada resposta. */
export function DialogMeta({ aberto, onOpenChange, meta, sugestao }: DialogMetaProps) {
  /** Cada abertura começa do zero, mesmo que o conteúdo anterior ainda esteja saindo da tela. */
  const [abertura, setAbertura] = useState(0)
  const [abertoAntes, setAbertoAntes] = useState(aberto)
  if (aberto !== abertoAntes) {
    setAbertoAntes(aberto)
    if (aberto) setAbertura((n) => n + 1)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-lg')}
      >
        <ConteudoMeta
          key={`${meta?.id ?? 'nova'}-${abertura}`}
          meta={meta}
          sugestao={sugestao}
          onConcluir={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

interface ConteudoMetaProps {
  meta?: MetaEconomia
  sugestao?: SugestaoMeta
  onConcluir: () => void
}

/** Guarda o estado da meta, para "Ver todos os campos" levar o que já foi respondido nos passos. */
function ConteudoMeta({ meta, sugestao, onConcluir }: ConteudoMetaProps) {
  const f = useFormularioMeta(meta, sugestao)
  const modo = useModoSimples()
  const [completo, setCompleto] = useState(false)
  const emPassos = modo.ligado && !completo

  return (
    <>
      <DialogHeader>
        <DialogTitle className={TITULO_DIALOG}>{meta ? 'Editar meta' : 'Nova meta de economia'}</DialogTitle>
        <DialogDescription className={cn(emPassos && 'sr-only')}>
          {emPassos
            ? meta
              ? 'Mude só o que precisar.'
              : 'Uma pergunta de cada vez.'
            : 'Quanto você quer juntar e quanto separar do saldo a cada mês.'}
        </DialogDescription>
      </DialogHeader>
      {emPassos ? (
        <FormularioMetaPassos f={f} editando={!!meta} onConcluir={onConcluir} onVerTudo={() => setCompleto(true)} />
      ) : (
        <FormularioMeta f={f} editando={!!meta} onConcluir={onConcluir} />
      )}
    </>
  )
}
