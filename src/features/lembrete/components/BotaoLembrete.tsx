import { Bell, BellOff, BellRing } from '@/shared/ui/icones'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { formatarData } from '@/shared/lib/datas'
import { BOTAO, CAMADA, CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/shared/ui/popover'
import { useIniciarComSistema } from '../hooks/useIniciarComSistema'
import { useLembrete } from '../hooks/useLembrete'

/** Desktop: liga, desliga e escolhe o horário do lembrete diário de registrar os gastos. */
export function BotaoLembrete() {
  const { prefs, alterar, testar, erro } = useLembrete()
  const inicio = useIniciarComSistema()
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
          <Icone className="size-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className={cn(CAMADA, 'w-80 gap-3')}>
        <PopoverHeader>
          <PopoverTitle>Lembrete diário</PopoverTitle>
          <PopoverDescription>
            Uma notificação por dia para registrar os gastos, só se você ainda não salvou nenhum lançamento. Funciona
            com o app aberto ou na bandeja do sistema.
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
              <BellRing className="size-6" />
              Testar notificação
            </Button>

            <div className="flex flex-col gap-3 border-t-2 border-contorno pt-3">
              <Field>
                <FieldLabel>Ao fechar a janela</FieldLabel>
                <ControleSegmentado
                  rotulo="Ao fechar a janela"
                  valor={prefs.bandeja ? 'bandeja' : 'fechar'}
                  opcoes={[
                    { valor: 'bandeja', rotulo: 'Fica na bandeja' },
                    { valor: 'fechar', rotulo: 'Fecha o app' },
                  ]}
                  onChange={(v) => alterar({ bandeja: v === 'bandeja' })}
                />
              </Field>
              <Field>
                <FieldLabel>Iniciar com o sistema</FieldLabel>
                <ControleSegmentado
                  rotulo="Iniciar com o sistema"
                  valor={inicio.ativo ? 'sim' : 'nao'}
                  opcoes={[
                    { valor: 'sim', rotulo: 'Sim, na bandeja' },
                    { valor: 'nao', rotulo: 'Não' },
                  ]}
                  desabilitado={inicio.ativo === null}
                  onChange={(v) => inicio.alterar(v === 'sim')}
                />
              </Field>
            </div>
          </div>
        )}

        {(erro ?? inicio.erro) && (
          <p role="status" className="text-xs text-negativo">
            {erro ?? inicio.erro}
          </p>
        )}
        {prefs && (prefs.ultimoAviso || prefs.ultimoRegistro) && (
          <p className="border-t-2 border-contorno pt-3 text-xs text-muted-foreground">
            {prefs.ultimoRegistro && <>Último registro: {formatarData(prefs.ultimoRegistro)}. </>}
            {prefs.ultimoAviso && <>Último lembrete: {formatarData(prefs.ultimoAviso)}.</>}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
