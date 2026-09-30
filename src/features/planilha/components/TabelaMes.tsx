import type { Categoria } from '@/features/categorias/categoria'
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
  /** Abre um lançamento novo na data do dia clicado. */
  onAdicionar: (data: DataISO) => void
  /** Mostra a coluna Economia (quando há metas de economia). */
  comEconomia: boolean
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

export function TabelaMes({ ano, resumo, dias, hoje, categorias, onEditar, onAdicionar, comEconomia }: TabelaMesProps) {
  const saldoInicial = resumo.saldoInicialCentavos
  const colunas = comEconomia ? COLUNAS_COM_ECONOMIA : COLUNAS

  return (
    <Card className={CARD}>
      <header className="flex items-stretch justify-between gap-3 border-b-2 border-foreground">
        <div className="flex items-stretch">
          {/* Número do mês em bloco preto, como a numeração de um cartaz. */}
          <span
            aria-hidden
            className="flex w-12 items-center justify-center bg-foreground font-heading text-xl font-bold text-background tabular-nums sm:w-14 sm:text-2xl"
          >
            {String(resumo.mes + 1).padStart(2, '0')}
          </span>
          <h2 className={cn(TITULO_CARD, 'self-center px-3 text-xl sm:px-4 sm:text-2xl')}>
            {nomeDoMes(resumo.mes)} <span className="font-light">{ano}</span>
          </h2>
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
          <TableRow className="border-b-2 border-b-foreground hover:bg-transparent">
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
          {dias.map((dia) => (
            <LinhaDia
              key={dia.data}
              dia={dia}
              ehHoje={dia.data === hoje}
              categorias={categorias}
              onEditar={onEditar}
              onAdicionar={onAdicionar}
              comEconomia={comEconomia}
            />
          ))}
          {Array.from({ length: LINHAS_POR_MES - dias.length }, (_, i) => (
            <LinhaVazia key={i} comEconomia={comEconomia} />
          ))}
        </TableBody>

        <TableFooter className="border-t-2 border-foreground bg-transparent font-semibold">
          <TableRow className="hover:bg-transparent">
            <TableCell className={cn(CELULA_DIA, ROTULO, 'font-semibold')}>
              Total
            </TableCell>
            <CelulaValor centavos={resumo.entradasCentavos} className={COR_COLUNA.entrada} compacta={comEconomia} />
            <CelulaValor centavos={resumo.saidasFixasCentavos} className={COR_COLUNA.saida} compacta={comEconomia} />
            <CelulaValor centavos={resumo.saidasVariaveisCentavos} className={COR_COLUNA.saida} compacta={comEconomia} />
            {comEconomia && <CelulaValor centavos={resumo.economiaCentavos} className={COR_COLUNA.economia} compacta />}
            <CelulaSaldo centavos={resumo.saldoFinalCentavos} compacta={comEconomia} />
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
