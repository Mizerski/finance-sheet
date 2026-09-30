import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { formatarData, formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CARD, ROTULO, TABELA, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { GastosGrandes } from '../gastos-grandes'

/** Colunas justas no celular, para as quatro caberem em 339px. */
const CELULA = 'px-1 py-2.5 sm:px-3'

/** Gastos únicos grandes que vêm aí e se o saldo projetado os cobre no dia. */
export function CardGastosGrandes({ gastos, fim }: { gastos: GastosGrandes; fim: DataISO }) {
  const { itens, totalCentavos, minimoCentavos } = gastos
  const descobertos = itens.filter((g) => g.saldoNoDiaCentavos < 0).length

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Gastos grandes à frente"
        faixa="bg-vermelho"
        contagem={itens.length}
        descricao={
          <>
            Saídas únicas até {formatarMesAno(fim, 'curto')} a partir de{' '}
            <span className="tabular-nums">{formatarBRL(minimoCentavos)}</span> (um quarto do gasto mensal)
          </>
        }
      />

      {itens.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">
          Nenhum gasto único grande nos próximos 12 meses. Cadastre IPVA, seguro, matrícula e outros gastos que não se
          repetem todo mês para vê-los aqui.
        </p>
      ) : (
        <Table className={cn(TABELA.tabela, 'text-[0.7rem] tracking-tight sm:tracking-normal')}>
          <TableHeader>
            <TableRow className={TABELA.linhaCabecalho}>
              <TableHead className={cn(TABELA.cabecalho, CELULA, TABELA.primeira)}>Data</TableHead>
              <TableHead className={cn(TABELA.cabecalho, CELULA)}>Gasto</TableHead>
              <TableHead className={cn(TABELA.cabecalho, CELULA, 'text-right text-saida')}>Valor</TableHead>
              <TableHead className={cn(TABELA.cabecalho, CELULA, 'pr-4 text-right sm:pr-5')}>
                <span className="sm:hidden">Saldo</span>
                <span className="hidden sm:inline">Saldo no dia</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((g) => (
              <TableRow key={`${g.lancamentoId}-${g.data}`} className={TABELA.linha}>
                <TableCell className={cn(CELULA, TABELA.primeira, 'tabular-nums')}>{formatarData(g.data)}</TableCell>
                <TableCell className={cn(CELULA, 'max-w-0 w-full truncate')}>{g.descricao}</TableCell>
                <TableCell className={cn(CELULA, 'text-right text-saida tabular-nums')}>
                  {formatarBRL(g.valorCentavos)}
                </TableCell>
                <TableCell
                  className={cn(CELULA, 'pr-4 text-right tabular-nums sm:pr-5', g.saldoNoDiaCentavos < 0 && 'text-negativo')}
                >
                  <span className={VALOR_SALDO}>{formatarBRL(g.saldoNoDiaCentavos)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="border-t-2 border-foreground bg-transparent">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2} className={cn(CELULA, TABELA.primeira, ROTULO)}>
                Total
              </TableCell>
              <TableCell className={cn(CELULA, 'text-right font-semibold text-saida tabular-nums')}>
                {formatarBRL(totalCentavos)}
              </TableCell>
              <TableCell className={cn(CELULA, 'pr-4 sm:pr-5')} />
            </TableRow>
          </TableFooter>
        </Table>
      )}

      {itens.length > 0 && (
        <p className="border-t-2 border-foreground px-4 py-3 text-sm text-muted-foreground sm:px-5">
          {descobertos > 0 ? (
            <>
              Em {descobertos === 1 ? 'um desses dias' : `${descobertos} desses dias`} o saldo fica negativo: antecipe
              uma entrada ou corte gastos antes.{' '}
            </>
          ) : (
            <>O saldo projetado cobre todos. </>
          )}
          A projeção já desconta esses gastos no dia, então "Quanto dá para guardar" deixa espaço para eles. Não crie
          uma meta para eles: o aporte sairia do saldo e o gasto sairia de novo.
        </p>
      )}
    </Card>
  )
}
