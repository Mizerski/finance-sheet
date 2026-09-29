import { formatarBRL } from '@/shared/lib/dinheiro'
import { TABELA, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { ValoresPeriodo } from '../graficos'

interface TabelaPeriodosProps<T extends ValoresPeriodo> {
  dados: T[]
  /** Cabeçalho da primeira coluna ("Mês", "Ano"). */
  periodo: string
  /** Texto da primeira coluna de cada linha. */
  rotulo: (d: T) => string
  colunas: { chave: keyof ValoresPeriodo; rotulo: string }[]
  /** Linha realçada com o véu de seleção (ex.: o ano aberto). */
  destaque?: (d: T) => boolean
}

/** Visão em tabela dos gráficos por período: os mesmos números, sem depender de cor. */
export function TabelaPeriodos<T extends ValoresPeriodo>({ dados, periodo, rotulo, colunas, destaque }: TabelaPeriodosProps<T>) {
  return (
    <Table className={TABELA.tabela}>
      <TableHeader>
        <TableRow className={TABELA.linhaCabecalho}>
          <TableHead className={cn(TABELA.cabecalho, TABELA.primeira)}>{periodo}</TableHead>
          {colunas.map((c, i) => (
            <TableHead
              key={c.chave}
              className={cn(TABELA.cabecalho, 'text-right', i === colunas.length - 1 && 'pr-4 sm:pr-5')}
            >
              {c.rotulo}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map((d) => (
          <TableRow
            key={rotulo(d)}
            className={cn(TABELA.linha, destaque?.(d) && 'font-medium [&>td]:shadow-[inset_0_0_0_999px_color-mix(in_oklch,var(--color-foreground)_6%,transparent)]')}
          >
            <TableCell className={cn(TABELA.celula, TABELA.primeira, 'first-letter:uppercase')}>{rotulo(d)}</TableCell>
            {colunas.map((c, i) => {
              const valor = d[c.chave]
              return (
                <TableCell
                  key={c.chave}
                  className={cn(
                    TABELA.celula,
                    'text-right tabular-nums',
                    valor !== null && valor < 0 && 'text-negativo',
                    i === colunas.length - 1 && 'pr-4 sm:pr-5',
                  )}
                >
                  {valor === null ? (
                    '—'
                  ) : (
                    <span className={cn(c.chave === 'saldo' && VALOR_SALDO)}>{formatarBRL(valor)}</span>
                  )}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
