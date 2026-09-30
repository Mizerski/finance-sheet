import { Forma } from '@/shared/components/Forma'
import { BOTAO, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useAtualizacao, type EstadoAtualizacao } from '../useAtualizacao'

/** Desktop: avisa no canto da tela quando há versão nova e instala com um clique. */
export function AvisoAtualizacao() {
  const { estado, instalar, adiar } = useAtualizacao()
  if (estado.etapa === 'nenhuma') return null
  return <Aviso estado={estado} onInstalar={instalar} onAdiar={adiar} />
}

interface AvisoProps {
  estado: Exclude<EstadoAtualizacao, { etapa: 'nenhuma' }>
  onInstalar: () => void
  onAdiar: () => void
}

function Aviso({ estado, onInstalar, onAdiar }: AvisoProps) {
  const baixando = estado.etapa === 'baixando'

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 border-2 border-foreground bg-card p-4 text-sm shadow-bloco-lg sm:right-auto sm:w-96"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex items-end gap-1">
          <Forma forma="quadrado" cor="vermelho" className="size-3" />
          <Forma forma="circulo" cor="azul" className="size-3" />
          <Forma forma="triangulo" cor="amarelo" className="size-3" />
        </span>
        <p className="font-heading text-base leading-none font-bold uppercase">
          Nova versão <span className="font-light tabular-nums">{estado.versao}</span>
        </p>
      </div>

      {estado.etapa === 'disponivel' && (
        <p className="text-muted-foreground">
          Pronta para instalar. O app fecha e abre de novo sozinho; seus dados continuam onde estão.
        </p>
      )}
      {baixando && <Progresso fracao={estado.progresso} />}
      {estado.etapa === 'erro' && (
        <div className="flex flex-col gap-1">
          <p className="text-negativo">Não foi possível atualizar. Verifique a internet e tente de novo.</p>
          <p className="text-xs break-words text-muted-foreground">{estado.mensagem}</p>
        </div>
      )}

      {!baixando && (
        <div className="flex justify-end gap-2 border-t-2 border-foreground pt-3">
          <Button variant="outline" className={BOTAO} onClick={onAdiar}>
            Depois
          </Button>
          <Button className={BOTAO} onClick={onInstalar}>
            {estado.etapa === 'erro' ? 'Tentar de novo' : 'Atualizar'}
          </Button>
        </div>
      )}
    </div>
  )
}

/** Barra reta com contorno preto; sem tamanho conhecido, mostra só o texto. */
function Progresso({ fracao }: { fracao: number | null }) {
  const porcento = fracao === null ? null : Math.round(fracao * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn(ROTULO, 'flex justify-between')}>
        <span>{porcento === 100 ? 'Instalando…' : 'Baixando…'}</span>
        {porcento !== null && <span className="tabular-nums">{porcento}%</span>}
      </div>
      <div
        role="progressbar"
        aria-label="Download da atualização"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcento ?? undefined}
        className="h-3 border-2 border-foreground bg-background"
      >
        <div className="h-full bg-foreground transition-[width] duration-100" style={{ width: `${porcento ?? 0}%` }} />
      </div>
    </div>
  )
}
