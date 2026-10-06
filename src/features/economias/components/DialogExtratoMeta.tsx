import { CupomExtrato, LinhaExtrato, ParteExtrato, TopoExtrato } from '@/shared/components/Extrato'
import { formatarData, formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMADA, RODAPE_DIALOG, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Pencil } from '@/shared/ui/icones'
import { useFinancas } from '@/store/context/financas-context'
import type { MetaEconomia } from '../model/meta'
import { aportesDaMeta, type ResumoMeta } from '../utils/aportes'

/** Quantos movimentos o extrato mostra; o resto fica em "Quanto guardei em cada mês". */
const MOVIMENTOS = 6

interface DialogExtratoMetaProps {
  /** A meta mostrada; mantida ao fechar, para o conteúdo não sumir na animação de saída. */
  meta?: MetaEconomia
  resumo?: ResumoMeta
  hoje: DataISO
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  onEditar: (meta: MetaEconomia) => void
  /** Abre "Quanto guardei em cada mês" (todos os meses, para corrigir). */
  onVerMeses: (meta: MetaEconomia) => void
}

/** Clicar numa meta abre o extrato dela: quanto já tem, o plano e os últimos movimentos, como num banco. */
export function DialogExtratoMeta({ meta, resumo, hoje, aberto, onOpenChange, onEditar, onVerMeses }: DialogExtratoMetaProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-4 overflow-y-auto sm:max-w-md')}>
        {meta && resumo && (
          <Extrato meta={meta} resumo={resumo} hoje={hoje} onEditar={() => onEditar(meta)} onVerMeses={() => onVerMeses(meta)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ExtratoProps {
  meta: MetaEconomia
  resumo: ResumoMeta
  hoje: DataISO
  onEditar: () => void
  onVerMeses: () => void
}

function Extrato({ meta, resumo, hoje, onEditar, onVerMeses }: ExtratoProps) {
  const { estado } = useFinancas()
  const conta = (id: string | undefined) => estado.caixas.find((c) => c.id === id)?.nome
  const alvo = meta.valorAlvoCentavos
  const percentual = Math.floor(resumo.percentual * 100)
  const movimentos = aportesDaMeta(meta, hoje)
    .filter((a) => a.data <= hoje)
    .sort((a, b) => b.data.localeCompare(a.data))
  const jaTinha = meta.naContaCentavos ?? meta.jaGuardadoCentavos ?? 0

  return (
    <>
      <DialogHeader>
        <DialogTitle className={TITULO_DIALOG}>{meta.nome}</DialogTitle>
        <DialogDescription>
          Meta de economia{resumo.encerrada ? ' · parada' : resumo.concluida ? ' · completa' : ''}
        </DialogDescription>
      </DialogHeader>

      <CupomExtrato>
        <TopoExtrato rotulo="Guardado até hoje" valor={formatarBRL(resumo.guardadoCentavos)} cor="text-economia">
          {alvo ? `de ${formatarBRL(alvo)} · ${percentual}%` : 'sem valor certo: guarda todo mês, sem fim'}
        </TopoExtrato>

        <ParteExtrato titulo="O plano">
          <LinhaExtrato rotulo="Por mês">
            <span className="tabular-nums">
              {formatarBRL(meta.aporteMensalCentavos)} todo dia {meta.diaDoMes}
            </span>
          </LinhaExtrato>
          <LinhaExtrato rotulo="Começou em">
            <span className="tabular-nums">{formatarData(meta.inicio)}</span>
          </LinhaExtrato>
          {meta.prazo && (
            <LinhaExtrato rotulo="Prazo">
              <span className="tabular-nums">{formatarData(meta.prazo)}</span>
            </LinhaExtrato>
          )}
          <LinhaExtrato rotulo="Onde fica">
            {meta.destinoId ? `Vai para ${conta(meta.destinoId) ?? 'outra conta'}` : `Separado em ${conta(meta.caixaId) ?? 'a conta'}`}
          </LinhaExtrato>
          {jaTinha > 0 && (
            <LinhaExtrato rotulo={meta.naContaCentavos !== undefined ? 'Já na conta' : 'Já tinha guardado'}>
              <span className="tabular-nums">{formatarBRL(jaTinha)}</span>
            </LinhaExtrato>
          )}
          {alvo && !resumo.concluida && (
            <LinhaExtrato rotulo="Falta">
              <span className="tabular-nums">{formatarBRL(resumo.faltaCentavos)}</span>
            </LinhaExtrato>
          )}
          {alvo && (
            <LinhaExtrato rotulo={resumo.concluida ? 'Situação' : 'Completa em'} total>
              {resumo.concluida
                ? 'Completa'
                : resumo.conclusaoNoPlano
                  ? formatarMesAno(resumo.conclusaoNoPlano)
                  : 'Sem previsão'}
            </LinhaExtrato>
          )}
        </ParteExtrato>

        <ParteExtrato titulo="Últimos movimentos">
          {movimentos.length === 0 ? (
            <p className="text-muted-foreground">Ainda não guardou nada: o primeiro é em {formatarData(meta.inicio)}.</p>
          ) : (
            movimentos.slice(0, MOVIMENTOS).map((a) => (
              <LinhaExtrato
                key={a.resgateId ?? a.data}
                rotulo={
                  <span className="tabular-nums">
                    {formatarData(a.data)} · {a.resgateId ? 'Usou' : a.ajustado ? 'Guardou (corrigido)' : 'Guardou'}
                  </span>
                }
              >
                <span className={cn('tabular-nums', a.valorCentavos < 0 ? 'text-saida' : 'text-economia')}>
                  {a.valorCentavos < 0 ? '− ' : '+ '}
                  {formatarBRL(Math.abs(a.valorCentavos))}
                </span>
              </LinhaExtrato>
            ))
          )}
          {movimentos.length > MOVIMENTOS && (
            <p className="pt-1 text-xs text-muted-foreground">e mais {movimentos.length - MOVIMENTOS} antes desses.</p>
          )}
        </ParteExtrato>
      </CupomExtrato>

      <DialogFooter className={cn(RODAPE_DIALOG, 'flex-row justify-between gap-2 sm:justify-between')}>
        <Button type="button" variant="outline" className={BOTAO} onClick={onVerMeses}>
          Cada mês
        </Button>
        <Button type="button" className={BOTAO} onClick={onEditar}>
          <Pencil className="size-6" />
          Editar
        </Button>
      </DialogFooter>
    </>
  )
}
