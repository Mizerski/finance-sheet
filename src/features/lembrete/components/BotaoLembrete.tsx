import { Bell, BellOff, BellRing } from 'lucide-react'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { formatarData } from '@/shared/lib/datas'
import { BOTAO, CAMADA, CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/shared/ui/popover'
import { useLembrete } from '../useLembrete'

/** Desktop: liga, desliga e escolhe o horário do lembrete diário de registrar os gastos. */
export function BotaoLembrete() {
  const { prefs, alterar, testar, erro } = useLembrete()
  const ativo = prefs?.ativo ?? false
  const Icone = ativo ? Bell : BellOff

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Lembrete diário"
          title="Lembrete diário"
        >
          <Icone className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className={cn(CAMADA, 'w-80 gap-3')}>
        <PopoverHeader>
          <PopoverTitle>Lembrete diário</PopoverTitle>
          <PopoverDescription>
            Uma notificação por dia para registrar os gastos, só se você ainda não salvou nenhum lançamento. Funciona
            com o app aberto, mesmo minimizado.
          </PopoverDescription>
        </PopoverHeader>

        {prefs && (
          <div className="flex flex-col gap-3">
            <ControleSegmentado
              rotulo="Lembrete diário"
              valor={ativo ? 'ligado' : 'desligado'}
              opcoes={[
                { valor: 'ligado', rotulo: 'Ligado' },
                { valor: 'desligado', rotulo: 'Desligado' },
              ]}
              onChange={(v) => alterar({ ativo: v === 'ligado' })}
            />
            <Field>
              <FieldLabel htmlFor="lembrete-horario">A partir de</FieldLabel>
              <Input
                id="lembrete-horario"
                type="time"
                value={prefs.horario}
                disabled={!ativo}
                onChange={(e) => e.target.value && alterar({ horario: e.target.value })}
                className={cn(CAMPO, 'tabular-nums')}
              />
            </Field>
            <Button variant="outline" className={cn(BOTAO, 'w-full')} onClick={testar}>
              <BellRing className="size-4" />
              Testar notificação
            </Button>
          </div>
        )}

        {erro && (
          <p role="status" className="text-xs text-negativo">
            {erro}
          </p>
        )}
        {prefs && (prefs.ultimoAviso || prefs.ultimoRegistro) && (
          <p className="border-t-2 border-foreground pt-3 text-xs text-muted-foreground">
            {prefs.ultimoRegistro && <>Último registro: {formatarData(prefs.ultimoRegistro)}. </>}
            {prefs.ultimoAviso && <>Último lembrete: {formatarData(prefs.ultimoAviso)}.</>}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
