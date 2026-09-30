import { formatarData } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMADA, RODAPE_DIALOG, TITULO_DIALOG, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import type { DadosFinancas } from '@/store/estado'
import type { Backup } from '../backup'

interface ConfirmarImportacaoProps {
  /** Backup escolhido; null mantém o dialog fechado. */
  backup: Backup | null
  atual: DadosFinancas
  onCancelar: () => void
  onConfirmar: (backup: Backup) => void
}

const ROTULO = 'text-[0.68rem] tracking-wide text-muted-foreground uppercase'

/** Mostra o que muda antes de trocar os dados atuais pelos do backup. */
export function ConfirmarImportacao({ backup, atual, onCancelar, onConfirmar }: ConfirmarImportacaoProps) {
  return (
    <Dialog open={backup !== null} onOpenChange={(aberto) => !aberto && onCancelar()}>
      <DialogContent showCloseButton={false} className={cn(CAMADA, 'gap-5 sm:max-w-sm')}>
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>Importar backup?</DialogTitle>
          <DialogDescription>
            Os dados deste computador serão substituídos pelos do backup
            {backup && ` de ${formatarData(backup.exportadoEm)}`}. Para guardar os atuais, exporte um backup antes.
          </DialogDescription>
        </DialogHeader>

        {backup && (
          <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-5 gap-y-2 text-sm tabular-nums">
            <span />
            <span className={cn(ROTULO, 'text-right')}>Atual</span>
            <span className={cn(ROTULO, 'text-right')}>Backup</span>
            <Linha rotulo="Lançamentos" atual={atual.lancamentos.length} novo={backup.dados.lancamentos.length} />
            <Linha rotulo="Categorias" atual={atual.categorias.length} novo={backup.dados.categorias.length} />
            <Linha rotulo="Metas de economia" atual={atual.metas.length} novo={backup.dados.metas.length} />
            <span className="text-muted-foreground">Saldo inicial</span>
            <Saldo centavos={atual.config.saldoInicialCentavos} />
            <Saldo centavos={backup.dados.config.saldoInicialCentavos} />
          </div>
        )}

        <DialogFooter className={RODAPE_DIALOG}>
          <DialogClose asChild>
            <Button variant="outline" className={cn(BOTAO, 'bg-card')}>
              Cancelar
            </Button>
          </DialogClose>
          <Button className={BOTAO} onClick={() => backup && onConfirmar(backup)}>
            Substituir dados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Linha({ rotulo, atual, novo }: { rotulo: string; atual: number; novo: number }) {
  return (
    <>
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right">{atual}</span>
      <span className="text-right">{novo}</span>
    </>
  )
}

function Saldo({ centavos }: { centavos: number }) {
  return (
    <span className={cn('text-right whitespace-nowrap', VALOR_SALDO, centavos < 0 && 'text-negativo')}>
      {formatarBRL(centavos)}
    </span>
  )
}
