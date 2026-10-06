import { useState } from 'react'
import { CupomExtrato, LinhaExtrato, ParteExtrato, TopoExtrato } from '@/shared/components/Extrato'
import { PontoCor } from '@/shared/components/PontoCor'
import { deDataISO, formatarData, nomeDoDiaDaSemana, paraDataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMADA, RODAPE_DIALOG, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Pencil, Trash2 } from '@/shared/ui/icones'
import { useFinancas } from '@/store/context/financas-context'
import { descreverPeriodo, descreverRecorrencia, ROTULO_NATUREZA, ROTULO_TIPO } from '../constants/textos'
import { valorNoDia, type Lancamento } from '../model/lancamento'
import { parcelasDe, proximasVezes } from '../utils/parcelas'

interface DialogExtratoLancamentoProps {
  /** O lançamento mostrado; mantido ao fechar, para o conteúdo não sumir na animação de saída. */
  lancamento?: Lancamento
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  onEditar: (l: Lancamento) => void
  onExcluir: (l: Lancamento) => void
}

const COR = { saida: 'text-saida', entrada: 'text-entrada', transferencia: 'text-foreground' }
const SINAL = { saida: '− ', entrada: '+ ', transferencia: '' }

/** Clicar num lançamento abre o extrato dele, como uma nota: tudo o que foi lançado, sem campos para mexer. */
export function DialogExtratoLancamento({ lancamento, aberto, onOpenChange, onEditar, onExcluir }: DialogExtratoLancamentoProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-4 overflow-y-auto sm:max-w-md')}>
        {lancamento && (
          <Extrato
            l={lancamento}
            onEditar={() => onEditar(lancamento)}
            onExcluir={() => onExcluir(lancamento)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Extrato({ l, onEditar, onExcluir }: { l: Lancamento; onEditar: () => void; onExcluir: () => void }) {
  const { estado } = useFinancas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const caixa = (id: string | undefined) => estado.caixas.find((c) => c.id === id)
  const categoria = estado.categorias.find((c) => c.id === l.categoriaId)
  const tag = estado.tags.find((t) => t.id === l.tagId)
  const pasta = estado.pastas.find((p) => p.id === l.pastaId)
  const recorrente = l.recorrencia.tipo !== 'unica'
  const periodo = descreverPeriodo(l)
  const parcelas = parcelasDe(l, hoje)
  const proximas = proximasVezes(l, hoje)
  const mudancas = Object.keys(l.excecoes ?? {}).length
  const transferencia = l.tipo === 'transferencia'

  return (
    <>
      <DialogHeader>
        <DialogTitle className={TITULO_DIALOG}>{l.descricao}</DialogTitle>
        <DialogDescription>
          {ROTULO_TIPO[l.tipo]}
          {!transferencia && estado.caixas.length > 1 && ` · ${caixa(l.caixaId)?.nome ?? ''}`}
        </DialogDescription>
      </DialogHeader>

      <CupomExtrato>
        <TopoExtrato rotulo={recorrente ? 'Valor de cada vez' : 'Valor'} valor={SINAL[l.tipo] + formatarBRL(l.valorCentavos)} cor={COR[l.tipo]}>
          {descreverRecorrencia(l)}
          {periodo && `, ${periodo}`}
        </TopoExtrato>

        <ParteExtrato>
          {transferencia ? (
            <>
              <LinhaExtrato rotulo="Sai de">{caixa(l.caixaId)?.nome}</LinhaExtrato>
              <LinhaExtrato rotulo="Entra em">{caixa(l.caixaDestinoId)?.nome}</LinhaExtrato>
            </>
          ) : (
            <>
              <LinhaExtrato rotulo="Categoria">
                <span className="inline-flex items-center gap-1.5">
                  {categoria && <PontoCor cor={categoria.cor} />}
                  {categoria?.nome ?? 'Sem categoria'}
                </span>
              </LinhaExtrato>
              {l.tipo === 'saida' && (
                <LinhaExtrato rotulo="Necessário?">
                  {tag ? (
                    <span className="inline-flex items-center gap-1.5">
                      <PontoCor cor={tag.cor} />
                      {tag.nome}
                      {tag.evitavel && <span className="text-muted-foreground">(dava para evitar)</span>}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sem tag</span>
                  )}
                </LinhaExtrato>
              )}
              <LinhaExtrato rotulo="Fixo ou variável">{ROTULO_NATUREZA[l.natureza]}</LinhaExtrato>
            </>
          )}
          {pasta && (
            <LinhaExtrato rotulo="Pasta">
              <span className="inline-flex items-center gap-1.5">
                <PontoCor cor={pasta.cor} />
                {pasta.nome}
              </span>
            </LinhaExtrato>
          )}
          {mudancas > 0 && (
            <LinhaExtrato rotulo="Dias com outro valor">
              <span className="tabular-nums">{mudancas}</span>
            </LinhaExtrato>
          )}
        </ParteExtrato>

        {parcelas && (
          <ParteExtrato titulo="Parcelas">
            <LinhaExtrato rotulo="Já foram">
              <span className="tabular-nums">
                {parcelas.pagas} de {parcelas.total}
              </span>
            </LinhaExtrato>
            <LinhaExtrato rotulo="Falta pagar">
              <span className="tabular-nums">{formatarBRL(parcelas.restanteCentavos)}</span>
            </LinhaExtrato>
            <LinhaExtrato rotulo="Total" total>
              <span className={cn('tabular-nums', COR[l.tipo])}>{formatarBRL(parcelas.totalCentavos)}</span>
            </LinhaExtrato>
          </ParteExtrato>
        )}

        <ParteExtrato titulo={proximas.length > 1 ? 'Próximas vezes' : 'Próxima vez'}>
          {proximas.length > 0 ? (
            proximas.map((data) => (
              <LinhaExtrato
                key={data}
                rotulo={
                  <span className="tabular-nums">
                    {formatarData(data)}{' '}
                    <span className="text-muted-foreground/80">{nomeDoDiaDaSemana(deDataISO(data).getDay())}</span>
                  </span>
                }
              >
                <span className={cn('tabular-nums', COR[l.tipo])}>{formatarBRL(valorNoDia(l, data))}</span>
              </LinhaExtrato>
            ))
          ) : (
            <p className="text-muted-foreground">Já aconteceu: não tem mais nenhuma vez pela frente.</p>
          )}
        </ParteExtrato>
      </CupomExtrato>

      <DialogFooter className={cn(RODAPE_DIALOG, 'flex-row justify-between gap-2 sm:justify-between')}>
        <Button type="button" variant="outline" className={cn(BOTAO, 'hover:text-destructive')} onClick={onExcluir}>
          <Trash2 className="size-6" />
          Excluir
        </Button>
        <Button type="button" className={BOTAO} onClick={onEditar}>
          <Pencil className="size-6" />
          Editar
        </Button>
      </DialogFooter>
    </>
  )
}
