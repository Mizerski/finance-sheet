import { useState } from 'react'
import { useModoSimples } from '@/features/modo-simples/hooks/useModoSimples'
import type { DataISO } from '@/shared/lib/datas'
import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { Lancamento } from '../model/lancamento'
import type { RascunhoLancamento } from '../utils/formulario'
import { FormularioLancamento } from './FormularioLancamento'
import { FormularioPassos } from './FormularioPassos'

interface DialogLancamentoProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Ausente = novo lançamento. */
  lancamento?: Lancamento
  /** Data sugerida para um lançamento novo (ex.: o dia clicado na planilha). */
  dataInicial?: DataISO
}

/**
 * No modo simples, o lançamento é feito em passos (`FormularioPassos`); editar abre direto na conferência, com
 * "Mudar" em cada resposta. Fora do modo, o formulário completo oferece passar a fazer em passos.
 */
export function DialogLancamento({ aberto, onOpenChange, lancamento, dataInicial }: DialogLancamentoProps) {
  const modo = useModoSimples()
  /** "Ver todos os campos" nos passos: abre o formulário completo com o que já foi respondido. */
  const [completo, setCompleto] = useState<RascunhoLancamento | null>(null)
  const emPassos = modo.ligado && !completo
  /** Cada abertura começa do zero, mesmo que o conteúdo anterior ainda esteja saindo da tela (animação de fechar). */
  const [abertura, setAbertura] = useState(0)
  const [abertoAntes, setAbertoAntes] = useState(aberto)
  if (aberto !== abertoAntes) {
    setAbertoAntes(aberto)
    if (aberto) {
      setAbertura((n) => n + 1)
      setCompleto(null)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-lg')}
      >
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>
            {lancamento ? 'Editar lançamento' : 'Novo lançamento'}
          </DialogTitle>
          <DialogDescription className={cn(emPassos && 'sr-only')}>
            {emPassos ? (
              lancamento ? 'Mude só o que precisar.' : 'Uma pergunta de cada vez.'
            ) : lancamento ? (
              'As mudanças refletem na planilha e no dashboard na hora.'
            ) : (
              <>
                Entradas e saídas, únicas ou recorrentes, entram na projeção do ano.{' '}
                {!modo.ligado && (
                  <button
                    type="button"
                    onClick={() => modo.escolher(true)}
                    className="font-medium text-foreground underline underline-offset-4 transition-colors duration-100 outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    Prefere uma pergunta de cada vez?
                  </button>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {emPassos ? (
          <FormularioPassos key={abertura} lancamento={lancamento} dataInicial={dataInicial} onConcluir={() => onOpenChange(false)} onVerTudo={setCompleto} />
        ) : (
          <FormularioLancamento
            key={abertura}
            lancamento={lancamento}
            dataInicial={dataInicial}
            rascunhoInicial={completo ?? undefined}
            onConcluir={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
