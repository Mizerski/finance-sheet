import { format } from 'date-fns'
import { CupomExtrato, ParteExtrato, TopoExtrato } from '@/shared/components/Extrato'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { COR_TOM, ROTULO_ATIVIDADE } from '../constants/textos'
import type { Atividade, LinhaDetalhe } from '../model/atividade'
import { diaDaAtividade, rotuloDoDia } from '../utils/grupos'
import { TextoAtividade } from './TextoAtividade'

interface DialogExtratoAtividadeProps {
  /** Mantida ao fechar, para o conteúdo não sumir na animação de saída. */
  atividade?: Atividade
  hoje: string
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

/** Uma cor guardada (categoria, tag, pasta) aparece como o quadradinho dela, não como o código. */
const COR_HEX = /^#[0-9a-f]{6}$/i

function Valor({ texto }: { texto: string }) {
  if (!COR_HEX.test(texto)) return <>{texto}</>
  return <PontoCor cor={texto} />
}

/** Valor da linha; quando mudou, o de antes riscado e o novo em seguida, cada um sem quebrar no meio. */
function ValorDaLinha({ linha }: { linha: LinhaDetalhe }) {
  if (linha.antes === undefined) return <Valor texto={linha.valor} />
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-1.5">
      <s className="whitespace-nowrap text-muted-foreground">
        <Valor texto={linha.antes} />
      </s>
      <span className="whitespace-nowrap font-semibold">
        <span aria-hidden>→ </span>
        <span className="sr-only">passou para </span>
        <Valor texto={linha.valor} />
      </span>
    </span>
  )
}

/**
 * Linha do extrato do registro: ao contrário da `LinhaExtrato`, quem cede espaço é o rótulo (que pode ser o nome de
 * um lançamento), para o antes → depois ficar numa linha só.
 */
function LinhaDoRegistro({ linha }: { linha: LinhaDetalhe }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className="min-w-0 flex-1 text-muted-foreground [overflow-wrap:anywhere]">{linha.rotulo}</dt>
      <dd className="max-w-[70%] text-right tabular-nums [overflow-wrap:anywhere]">
        <ValorDaLinha linha={linha} />
      </dd>
    </div>
  )
}

/** Clicar num registro do histórico abre o extrato dele, como o de um lançamento: o que foi feito, o que mudou e como ficou. */
export function DialogExtratoAtividade({ atividade, hoje, aberto, onOpenChange }: DialogExtratoAtividadeProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-4 overflow-y-auto sm:max-w-md')}>
        {atividade && <Extrato a={atividade} hoje={hoje} />}
      </DialogContent>
    </Dialog>
  )
}

function Extrato({ a, hoje }: { a: Atividade; hoje: string }) {
  const topo = a.detalhe?.topo
  const quando = `${rotuloDoDia(diaDaAtividade(a), hoje)}, às ${format(new Date(a.em), 'HH:mm')}`

  return (
    <>
      <DialogHeader>
        <DialogTitle className={TITULO_DIALOG}>{ROTULO_ATIVIDADE[a.tipo]}</DialogTitle>
        <DialogDescription>{quando}</DialogDescription>
      </DialogHeader>

      <CupomExtrato>
        {topo && (
          <TopoExtrato
            rotulo={topo.rotulo}
            valor={`${topo.sinal ? `${topo.sinal} ` : ''}${formatarBRL(topo.valorCentavos)}`}
            cor={a.tom ? COR_TOM[a.tom] : undefined}
          >
            {topo.legenda}
          </TopoExtrato>
        )}

        <div className={cn('px-4 py-3', topo && 'border-t-2 border-dashed border-contorno')}>
          <TextoAtividade atividade={a} destacarNomes />
        </div>

        {a.detalhe?.partes
          .filter((p) => p.linhas.length > 0)
          .map((parte, i) => (
            <ParteExtrato key={i} titulo={parte.titulo}>
              {parte.linhas.map((linha, j) => (
                <LinhaDoRegistro key={j} linha={linha} />
              ))}
            </ParteExtrato>
          ))}

        {!a.detalhe && (
          <ParteExtrato>
            <p className="text-muted-foreground">
              Este registro é de antes do extrato: ele guarda só a frase. Os novos trazem tudo o que foi lançado e o que
              mudou.
            </p>
          </ParteExtrato>
        )}
      </CupomExtrato>
    </>
  )
}
