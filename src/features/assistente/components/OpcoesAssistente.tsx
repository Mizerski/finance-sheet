import { useState } from 'react'
import { RefreshCw, Settings2, Trash2 } from 'lucide-react'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { BOTAO, CAMADA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/shared/ui/popover'
import { useAssistente } from '../assistente-context'
import { formatarTamanho, infoModelo } from '../modelos'

/** Modelo instalado: trocar por outro ou apagar para liberar espaço. */
export function OpcoesAssistente({ id }: { id: string }) {
  const { modelos, trocarModelo, excluir } = useAssistente()
  const [aberto, setAberto] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const modelo = modelos.find((m) => m.id === id)
  const info = infoModelo(id)

  return (
    <>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Modelo do assistente" title="Modelo do assistente">
            <Settings2 />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className={cn(CAMADA, 'w-72 gap-3')}>
          <PopoverHeader>
            <PopoverTitle>Modelo do assistente</PopoverTitle>
            <PopoverDescription>
              {info.nome}
              {modelo && <span className="tabular-nums"> · {formatarTamanho(modelo.bytes)} no disco</span>}. Roda só neste
              computador.
            </PopoverDescription>
          </PopoverHeader>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className={cn(BOTAO, 'w-full')}
              onClick={() => {
                setAberto(false)
                trocarModelo()
              }}
            >
              <RefreshCw />
              Trocar modelo
            </Button>
            <Button
              variant="outline"
              className={cn(BOTAO, 'w-full')}
              onClick={() => {
                setAberto(false)
                setConfirmar(true)
              }}
            >
              <Trash2 />
              Apagar modelo
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <ConfirmarExclusao
        aberto={confirmar}
        onOpenChange={setConfirmar}
        titulo="Apagar o modelo?"
        descricao={`Libera ${modelo ? formatarTamanho(modelo.bytes) : 'o espaço'} no disco. Para usar o assistente de novo, é preciso baixar outra vez.`}
        onConfirmar={() => excluir(id)}
      />
    </>
  )
}
