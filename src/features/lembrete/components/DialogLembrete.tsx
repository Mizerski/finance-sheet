import { BellRing } from '@/shared/ui/icones'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { formatarData } from '@/shared/lib/datas'
import { BOTAO, CAMADA, CAMPO, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useIniciarComSistema } from '../hooks/useIniciarComSistema'
import type { useLembrete } from '../hooks/useLembrete'

interface DialogLembreteProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** O lembrete roda enquanto o hook está montado: quem chama fica sempre na tela (o menu "Mais"). */
  lembrete: ReturnType<typeof useLembrete>
}

/** Desktop: liga, desliga e escolhe o horário do lembrete diário de registrar os gastos. */
export function DialogLembrete({ aberto, onOpenChange, lembrete }: DialogLembreteProps) {
  const { prefs, alterar, testar, erro } = lembrete
  const inicio = useIniciarComSistema()
  const ativo = prefs?.ativo ?? false

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-4 overflow-y-auto sm:max-w-sm')}>
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>Lembrete diário</DialogTitle>
          <DialogDescription>
            Uma notificação por dia para registrar os gastos, só se você ainda não salvou nenhum lançamento. Funciona
            com o app aberto ou na bandeja do sistema.
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  )
}
