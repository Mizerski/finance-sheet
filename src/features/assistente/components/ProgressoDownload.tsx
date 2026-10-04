import { Pause } from 'lucide-react'
import { BarraProgresso } from '@/features/economias/components/BarraProgresso'
import { BOTAO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useAssistente, type Fase } from '../assistente-context'
import { formatarTamanho, infoModelo } from '../modelos'

/** "faltam 3 min", pela velocidade desde o começo deste download. */
function tempoRestante(fase: Extract<Fase, { tipo: 'baixando' }>): string | null {
  const segundos = (Date.now() - fase.inicio) / 1000
  const baixadosAgora = fase.progresso.baixados - fase.baixadosNoInicio
  if (segundos < 3 || baixadosAgora <= 0) return null
  const restante = (fase.progresso.total - fase.progresso.baixados) / (baixadosAgora / segundos)
  if (restante < 60) return 'falta menos de 1 min'
  const minutos = Math.round(restante / 60)
  return minutos < 60 ? `faltam ${minutos} min` : `faltam ${Math.floor(minutos / 60)} h ${minutos % 60} min`
}

export function ProgressoDownload({ fase }: { fase: Extract<Fase, { tipo: 'baixando' }> }) {
  const { cancelarDownload } = useAssistente()
  const { baixados, total } = fase.progresso
  const percentual = total > 0 ? baixados / total : 0
  const restante = tempoRestante(fase)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <p className="font-heading text-xl leading-tight font-bold uppercase">Baixando o modelo</p>
        <p className="text-sm text-muted-foreground">
          {infoModelo(fase.id).nome}. Pode continuar usando o app; se fechar, o download continua de onde parou na
          próxima vez.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <BarraProgresso percentual={percentual} rotulo="Download do modelo" />
        <p className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
          <span>
            {formatarTamanho(baixados)} de {formatarTamanho(total)} · {Math.floor(percentual * 100)}%
          </span>
          {restante && <span>{restante}</span>}
        </p>
      </div>
      <Button variant="outline" className={cn(BOTAO, 'self-start')} onClick={cancelarDownload}>
        <Pause />
        Pausar
      </Button>
    </div>
  )
}
