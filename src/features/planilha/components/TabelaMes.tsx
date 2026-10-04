import type { Categoria } from '@/features/categorias/categoria'
import { QuadradoRisco } from '@/features/risco/components/SeloRisco'
import { NIVEL, type NivelRisco } from '@/features/risco/risco'
import type { DiaProjetado, ResumoMes } from '@/features/projecao/projecao'
import type { DataISO } from '@/shared/lib/datas'
import { nomeDoMes } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CARD, ROTULO, TITULO_CARD, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { somarColunas } from '../colunas'
import { CELULA, CELULA_DIA, COR_COLUNA } from '../cores'
import { CelulaSaldo, CelulaValor } from './CelulaValor'
import { LinhaDia } from './LinhaDia'

interface TabelaMesProps {
  ano: number
  resumo: ResumoMes
  dias: DiaProjetado[]
  hoje: DataISO
  categorias: Map<string, Categoria>
  /** Abre a edição de um lançamento a partir do popover do dia. */
  onEditar: (lancamentoId: string) => void
  onExcluir: (lancamentoId: string) => void
  /** Muda um recorrente só no dia clicado. */
  onMudarDia: (lancamentoId: string, data: DataISO) => void
  /** Abre um lançamento novo na data do dia clicado. */
  onAdicionar: (data: DataISO) => void
  /** Mostra a coluna Economia (quando há metas de economia). */
  comEconomia: boolean
  /** Cartão de crédito: saldo negativo é dívida, sem a cor de alerta. */
  divida?: boolean
  /** Nível de risco do caixa no dia; null sem risco (benefício, sem projeção à frente). */
  nivelDoDia: ((dia: DiaProjetado) => NivelRisco | null) | null
}

interface Coluna {
  rotulo: string
  curto?: string
  largura: string
  className: string
}

/** Larguras fixas para as colunas ficarem alinhadas entre os meses lado a lado. */
const COLUNAS: Coluna[] = [
  { rotulo: 'Dia', largura: 'lg:w-[14%]', className: cn(COR_COLUNA.dia, 'text-left') },
  { rotulo: 'Entradas', largura: 'lg:w-[21%]', className: COR_COLUNA.entrada },
  { rotulo: 'Saídas fixas', curto: 'Fixas', largura: 'lg:w-[21%]', className: COR_COLUNA.saida },
  { rotulo: 'Diário', largura: 'lg:w-[21%]', className: COR_COLUNA.saida },
  { rotulo: 'Saldo', largura: 'lg:w-[23%]', className: COR_COLUNA.saldo },
]

/** Com a coluna Economia, as de valor dividem o espaço que sobra do dia. */
const COLUNAS_COM_ECONOMIA: Coluna[] = [
  { rotulo: 'Dia', largura: 'lg:w-[12%]', className: cn(COR_COLUNA.dia, 'text-left') },
  { rotulo: 'Entradas', largura: 'lg:w-[17%]', className: COR_COLUNA.entrada },
  { rotulo: 'Saídas fixas', curto: 'Fixas', largura: 'lg:w-[17%]', className: COR_COLUNA.saida },
  { rotulo: 'Diário', largura: 'lg:w-[17%]', className: COR_COLUNA.saida },
  { rotulo: 'Economia', curto: 'Econ.', largura: 'lg:w-[17%]', className: COR_COLUNA.economia },
  { rotulo: 'Saldo', largura: 'lg:w-[20%]', className: COR_COLUNA.saldo },
]

/** Todo mês ocupa 31 linhas, para as tabelas terem a mesma altura. */
const LINHAS_POR_MES = 31

export function TabelaMes({
  ano,
  resumo,
  dias,
  hoje,
  categorias,
  onEditar,
  onExcluir,
  onMudarDia,
  onAdicionar,
  comEconomia,
  nivelDoDia,
  divida,
}: TabelaMesProps) {
  const saldoInicial = resumo.saldoInicialCentavos
  const colunas = comEconomia ? COLUNAS_COM_ECONOMIA : COLUNAS
  const totais = somarColunas(dias)
  // Risco do mês: o nível do dia mais apertado.
  const niveis = dias.map((d) => nivelDoDia?.(d) ?? null)
  const doMes = niveis.filter((n): n is NivelRisco => n !== null)
  const nivelDoMes = doMes.length > 0 ? (Math.max(...doMes) as NivelRisco) : null

  return (
    <Card className={CARD}>
      <header className="flex items-stretch justify-between gap-3 border-b-2 border-contorno">
        <div className="flex items-stretch">
          {/* Número do mês em bloco preto, como a numeração de um cartaz. */}
          <span
            aria-hidden
            className="flex w-12 items-center justify-center bg-foreground font-heading text-xl font-bold text-background tabular-nums sm:w-14 sm:text-2xl"
          >
            {String(resumo.mes + 1).padStart(2, '0')}
          </span>
          <div className="flex flex-col justify-center gap-1 px-3 py-2 sm:px-4">
            <h2 className={cn(TITULO_CARD, 'text-xl sm:text-2xl')}>
              {nomeDoMes(resumo.mes)} <span className="font-light">{ano}</span>
            </h2>
            {nivelDoMes && (
              <span className="flex items-center gap-1.5 text-[0.7rem] leading-none" title={NIVEL[nivelDoMes].significado}>
                <QuadradoRisco nivel={nivelDoMes} className="size-2.5" />
                <span className="text-muted-foreground">Caixa:</span>
                <strong className="font-semibold">{NIVEL[nivelDoMes].nome}</strong>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end justify-center gap-1 py-2.5 pr-3 text-right sm:pr-4">
          <span className={cn(ROTULO, 'text-muted-foreground')}>Saldo inicial</span>
          <span
            className={cn(
              'text-sm leading-none font-semibold tabular-nums',
              VALOR_SALDO,
              saldoInicial !== null && saldoInicial < 0 && 'text-negativo',
            )}
          >
            {saldoInicial === null ? '—' : formatarBRL(saldoInicial)}
          </span>
        </div>
      </header>

      <Table className="text-[0.7rem] tracking-tight sm:text-[0.8125rem] sm:tracking-normal lg:table-fixed">
        <TableHeader>
          <TableRow className="border-b-2 border-b-contorno hover:bg-transparent">
            {colunas.map((c) => (
              <TableHead
                key={c.rotulo}
                className={cn(
                  c.rotulo === 'Dia' ? CELULA_DIA : CELULA,
                  // No celular, sem o espaçamento entre letras: os rótulos em caixa alta não podem alargar as colunas.
                  'h-auto text-right text-[0.6rem] font-semibold uppercase sm:text-[0.65rem] sm:tracking-[0.06em]',
                  c.largura,
                  c.className,
                )}
              >
                {c.curto ? (
                  <>
                    <span className="sm:hidden">{c.curto}</span>
                    <span className="hidden sm:inline">{c.rotulo}</span>
                  </>
                ) : (
                  c.rotulo
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {dias.map((dia, i) => (
            <LinhaDia
              key={dia.data}
              dia={dia}
              ehHoje={dia.data === hoje}
              categorias={categorias}
              onEditar={onEditar}
              onExcluir={onExcluir}
              onMudarDia={onMudarDia}
              onAdicionar={onAdicionar}
              comEconomia={comEconomia}
              nivel={niveis[i]}
              divida={divida}
            />
          ))}
          {Array.from({ length: LINHAS_POR_MES - dias.length }, (_, i) => (
            <LinhaVazia key={i} comEconomia={comEconomia} />
          ))}
        </TableBody>

        <TableFooter className="border-t-2 border-contorno bg-transparent font-semibold">
          <TableRow className="hover:bg-transparent">
            <TableCell className={cn(CELULA_DIA, ROTULO, 'font-semibold')}>
              Total
            </TableCell>
            <CelulaValor centavos={totais.entradasCentavos} className={COR_COLUNA.entrada} compacta={comEconomia} />
            <CelulaValor centavos={totais.saidasFixasCentavos} className={COR_COLUNA.saida} compacta={comEconomia} />
            <CelulaValor centavos={totais.saidasVariaveisCentavos} className={COR_COLUNA.saida} compacta={comEconomia} />
            {comEconomia && <CelulaValor centavos={resumo.economiaCentavos} className={COR_COLUNA.economia} compacta />}
            <CelulaSaldo
              centavos={resumo.saldoFinalCentavos}
              compacta={comEconomia}
              nivel={niveis.at(-1) ?? null}
              divida={divida}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  )
}

/** Linha sem dia, com a mesma altura e as mesmas cores de coluna de uma linha normal. */
function LinhaVazia({ comEconomia }: { comEconomia: boolean }) {
  return (
    <TableRow aria-hidden className="border-b-transparent hover:bg-transparent">
      <TableCell className={CELULA_DIA}>
        <div className="h-6" />
      </TableCell>
      <TableCell className={cn(CELULA, COR_COLUNA.entrada)} />
      <TableCell className={cn(CELULA, COR_COLUNA.saida)} />
      <TableCell className={cn(CELULA, COR_COLUNA.saida)} />
      {comEconomia && <TableCell className={cn(CELULA, COR_COLUNA.economia)} />}
      <TableCell className={cn(CELULA, COR_COLUNA.saldo)} />
    </TableRow>
  )
}
