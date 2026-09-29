import type { Categoria } from '@/features/categorias/categoria'
import type { DiaProjetado, ResumoMes } from '@/features/projecao/projecao'
import type { DataISO } from '@/shared/lib/datas'
import { nomeDoMes } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { VALOR_SALDO } from '@/shared/lib/estilos'
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
}

/** Larguras fixas para as colunas ficarem alinhadas entre os meses lado a lado. */
const COLUNAS: { rotulo: string; curto?: string; largura: string; className: string }[] = [
  { rotulo: 'Dia', largura: 'lg:w-[14%]', className: cn(COR_COLUNA.dia, 'text-left') },
  { rotulo: 'Entradas', largura: 'lg:w-[21%]', className: COR_COLUNA.entrada },
  { rotulo: 'Saídas fixas', curto: 'Fixas', largura: 'lg:w-[21%]', className: COR_COLUNA.saida },
  { rotulo: 'Diário', largura: 'lg:w-[21%]', className: COR_COLUNA.saida },
  { rotulo: 'Saldo', largura: 'lg:w-[23%]', className: COR_COLUNA.saldo },
]

/** Todo mês ocupa 31 linhas, para as tabelas terem a mesma altura. */
const LINHAS_POR_MES = 31

export function TabelaMes({ ano, resumo, dias, hoje, categorias, onEditar }: TabelaMesProps) {
  const saldoInicial = resumo.saldoInicialCentavos

  return (
    <Card className="gap-0 rounded-3xl py-0 shadow-none ring-border">
      <header className="flex items-end justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <h2 className="text-lg leading-none font-medium tracking-tight">
          <span className="capitalize">{nomeDoMes(resumo.mes)}</span>{' '}
          <span className="font-normal text-muted-foreground">{ano}</span>
        </h2>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-[0.7rem] tracking-wide text-muted-foreground uppercase">Saldo inicial</span>
          <span
            className={cn(
              'text-sm leading-none font-medium tabular-nums',
              VALOR_SALDO,
              saldoInicial !== null && saldoInicial < 0 && 'text-negativo',
            )}
          >
            {saldoInicial === null ? '—' : formatarBRL(saldoInicial)}
          </span>
        </div>
      </header>

      <Table className="text-[0.7rem] sm:text-[0.8125rem] lg:table-fixed">
        <TableHeader>
          <TableRow className="border-b-border/70 hover:bg-transparent">
            {COLUNAS.map((c) => (
              <TableHead
                key={c.rotulo}
                className={cn(
                  c.rotulo === 'Dia' ? CELULA_DIA : CELULA,
                  'h-auto text-right text-[0.68rem] font-medium tracking-wide uppercase',
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
            />
          ))}
          {Array.from({ length: LINHAS_POR_MES - dias.length }, (_, i) => (
            <LinhaVazia key={i} />
          ))}
        </TableBody>

        <TableFooter className="border-t-border/70 bg-transparent font-medium">
          <TableRow className="hover:bg-transparent">
            <TableCell className={cn(CELULA_DIA, 'text-[0.68rem] tracking-wide text-muted-foreground uppercase')}>
              Total
            </TableCell>
            <CelulaValor centavos={resumo.entradasCentavos} className={COR_COLUNA.entrada} />
            <CelulaValor centavos={resumo.saidasFixasCentavos} className={COR_COLUNA.saida} />
            <CelulaValor centavos={resumo.saidasVariaveisCentavos} className={COR_COLUNA.saida} />
            <CelulaSaldo centavos={resumo.saldoFinalCentavos} />
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  )
}

/** Linha sem dia, com a mesma altura e as mesmas cores de coluna de uma linha normal. */
function LinhaVazia() {
  return (
    <TableRow aria-hidden className="border-b-transparent hover:bg-transparent">
      <TableCell className={CELULA_DIA}>
        <div className="h-6" />
      </TableCell>
      <TableCell className={cn(CELULA, COR_COLUNA.entrada)} />
      <TableCell className={cn(CELULA, COR_COLUNA.saida)} />
      <TableCell className={cn(CELULA, COR_COLUNA.saida)} />
      <TableCell className={cn(CELULA, COR_COLUNA.saldo)} />
    </TableRow>
  )
}
