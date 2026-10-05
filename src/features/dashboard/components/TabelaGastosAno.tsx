import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { TABELA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { DadoGastoAno, SerieCategoria } from '../utils/graficos'

interface TabelaGastosAnoProps {
  dados: DadoGastoAno[]
  series: SerieCategoria[]
  destaque: (d: DadoGastoAno) => boolean
}

/**
 * Visão em tabela do gráfico de gastos por ano: um ano por linha e uma coluna por categoria.
 * Com muitas categorias, a tabela rola na horizontal dentro do card.
 */
export function TabelaGastosAno({ dados, series, destaque }: TabelaGastosAnoProps) {
  return (
    <Table className={TABELA.tabela}>
      <TableHeader>
        <TableRow className={TABELA.linhaCabecalho}>
          <TableHead className={cn(TABELA.cabecalho, TABELA.primeira)}>Ano</TableHead>
          {series.map((s) => (
            <TableHead key={s.chave} className={cn(TABELA.cabecalho, 'text-right')}>
              <span className="inline-flex items-center gap-1.5">
                <PontoCor cor={s.cor} />
                {s.nome}
              </span>
            </TableHead>
          ))}
          <TableHead className={cn(TABELA.cabecalho, 'pr-4 text-right sm:pr-5')}>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map((d) => (
          <TableRow
            key={d.ano}
            className={cn(
              TABELA.linha,
              destaque(d) && 'font-semibold [&>td]:shadow-[inset_0_0_0_999px_var(--color-selecao)]',
            )}
          >
            <TableCell className={cn(TABELA.celula, TABELA.primeira)}>{d.ano}</TableCell>
            {series.map((s) => (
              <TableCell key={s.chave} className={cn(TABELA.celula, 'text-right tabular-nums text-saida')}>
                {d.valores[s.chave] ? formatarBRL(d.valores[s.chave]) : ''}
              </TableCell>
            ))}
            <TableCell className={cn(TABELA.celula, 'pr-4 text-right tabular-nums text-saida sm:pr-5')}>
              {formatarBRL(d.saidas)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
