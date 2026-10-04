import { useState } from 'react'
import { Check, FolderInput } from '@/shared/ui/icones'
import { PontoCor } from '@/shared/components/PontoCor'
import { CAMADA, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { SEM_PASTA, type Pasta } from '../pasta'

interface MoverParaPastaProps {
  /** Descrição do lançamento, para o nome acessível do botão. */
  descricao: string
  pastaAtual?: string
  pastas: Pasta[]
  /** undefined = tirar da pasta. */
  onMover: (pastaId: string | undefined) => void
}

/** Botão da linha que abre a lista de pastas para mudar o lançamento de pasta. */
export function MoverParaPasta({ descricao, pastaAtual, pastas, onMover }: MoverParaPastaProps) {
  const [aberto, setAberto] = useState(false)
  const atual = pastas.some((p) => p.id === pastaAtual) ? pastaAtual : undefined
  const opcoes = [...pastas.map((p) => ({ id: p.id as string | undefined, nome: p.nome, cor: p.cor })), { id: undefined, ...SEM_PASTA }]

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          aria-label={`Mover ${descricao} para outra pasta`}
        >
          <FolderInput />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className={cn(CAMADA, 'w-60 gap-3')}>
        <p className={cn(ROTULO, 'border-b-2 border-contorno pb-1.5')}>Mover para</p>
        <ul className="-mt-1.5 flex flex-col">
          {opcoes.map((o) => {
            const ativa = o.id === atual
            return (
              <li key={o.id ?? 'sem'}>
                <button
                  type="button"
                  aria-current={ativa || undefined}
                  onClick={() => {
                    if (!ativa) onMover(o.id)
                    setAberto(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-2 py-2 text-left text-[0.8125rem] transition-colors outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-ring',
                    ativa && 'font-semibold',
                  )}
                >
                  <PontoCor cor={o.cor} />
                  <span className="min-w-0 flex-1 truncate">{o.nome}</span>
                  {ativa && <Check strokeWidth={3} className="size-6" />}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
