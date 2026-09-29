import { useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { ptBR } from 'react-day-picker/locale'
import { deDataISO, formatarData, paraDataISO, type DataISO } from '@/shared/lib/datas'
import { CAMADA, CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

interface SeletorDataProps {
  id?: string
  valor: DataISO | undefined
  onChange: (valor: DataISO | undefined) => void
  placeholder?: string
  /** Mostra um botão para limpar a data (campos opcionais). */
  opcional?: boolean
  /** Mês exibido ao abrir sem data escolhida. */
  mesInicial?: DataISO
  invalido?: boolean
}

export function SeletorData({
  id,
  valor,
  onChange,
  placeholder = 'Escolher data',
  opcional,
  mesInicial,
  invalido,
}: SeletorDataProps) {
  const [aberto, setAberto] = useState(false)
  const selecionada = valor ? deDataISO(valor) : undefined

  return (
    <div className="flex items-center gap-1">
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            aria-invalid={invalido || undefined}
            className={cn(CAMPO, 'min-w-0 flex-1 justify-start font-normal tabular-nums')}
          >
            <CalendarDays className="text-muted-foreground" />
            {valor ? formatarData(valor) : <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className={cn(CAMADA, 'w-auto p-2')}>
          <Calendar
            mode="single"
            locale={ptBR}
            selected={selecionada}
            defaultMonth={selecionada ?? (mesInicial ? deDataISO(mesInicial) : undefined)}
            onSelect={(data) => {
              onChange(data ? paraDataISO(data) : undefined)
              setAberto(false)
            }}
            className="bg-transparent"
          />
        </PopoverContent>
      </Popover>

      {opcional && valor && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          onClick={() => onChange(undefined)}
          aria-label="Limpar data"
        >
          <X />
        </Button>
      )}
    </div>
  )
}
