import { COR_RISCO } from '@/features/risco/constants/cores'
import { DinheiroForte, Forte } from '@/features/risco/components/Destaques'
import { Ajuda } from '@/shared/components/Ajuda'
import { nivelDoSaldo } from '@/features/risco/utils/risco'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { formatarData, formatarMesAno, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CARD, ROTULO, TABELA, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { GastosGrandes } from '../utils/gastos-grandes'

/** Colunas justas no celular, para as quatro caberem em 339px. */
const CELULA = 'px-1 py-2.5 sm:px-3'

interface CardGastosGrandesProps {
  gastos: GastosGrandes
  fim: DataISO
  /** O gasto de um mês, para pintar o saldo do dia com a cor do risco do caixa. */
  referenciaCentavos: number
}

/**
 * Contas únicas grandes que vêm aí (IPVA, seguro, matrícula) e se o saldo cobre cada uma no dia, na cor do risco.
 * A conclusão vem antes da tabela, com o porquê do card: elas já saem do saldo, então não pedem meta.
 */
export function CardGastosGrandes({ gastos, fim, referenciaCentavos }: CardGastosGrandesProps) {
  const { itens, totalCentavos, minimoCentavos } = gastos
  const descobertos = itens.filter((g) => g.saldoNoDiaCentavos < 0).length

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Contas grandes pela frente"
        faixa="bg-vermelho"
        forma={{ forma: 'triangulo', cor: 'papel' }}
        contagem={itens.length}
        descricao={<>O que não é de todo mês, até {formatarMesAno(fim, 'curto')}</>}
        ajuda={
          <Ajuda titulo="Contas grandes pela frente">
            <p>
              Contas que não se repetem todo mês, a partir de <DinheiroForte centavos={minimoCentavos} /> (¼ do que você
              gasta num mês). A cor do saldo mostra o risco do caixa no dia.
            </p>
            <p>
              <Forte>Não precisa de meta para eles.</Forte> A projeção já tira esses gastos do saldo no dia certo (e
              "Quanto dá para guardar" deixa espaço para eles). Se quiser separar o dinheiro aos poucos, crie uma meta e,
              no dia do pagamento, use o dinheiro dela ("Usar dinheiro"); sem isso, ele sairia duas vezes.
            </p>
          </Ajuda>
        }
      />

      {itens.length > 0 && (
        <div className="px-4 py-4 text-sm sm:px-5">
          {descobertos > 0 ? (
            <CaixaDestaque fundo="bg-negativo-suave" faixa="border-l-vermelho">
              <p>
                <Forte className="text-negativo">
                  Em {descobertos === 1 ? 'um desses dias' : `${descobertos} desses dias`} falta dinheiro.
                </Forte>{' '}
                Antecipe uma entrada ou corte gastos antes.
              </p>
            </CaixaDestaque>
          ) : (
            <p>
              <Forte>{itens.length === 1 ? 'O saldo cobre essa conta.' : 'O saldo cobre todas.'}</Forte>{' '}
              {itens.length === 1 ? 'Ela já sai' : 'Elas já saem'} do saldo no dia certo, então não precisa juntar
              dinheiro numa meta para {itens.length === 1 ? 'ela' : 'elas'}.
            </p>
          )}
        </div>
      )}

      {itens.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">
          Nenhum gasto único grande nos próximos 12 meses. Cadastre IPVA, seguro, matrícula e outros gastos que não se
          repetem todo mês para vê-los aqui.
        </p>
      ) : (
        <Table className={cn(TABELA.tabela, 'border-t-2 border-contorno text-[0.7rem] tracking-tight sm:tracking-normal')}>
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
                  className={cn(
                    CELULA,
                    'pr-4 text-right font-medium tabular-nums sm:pr-5',
                    COR_RISCO[nivelDoSaldo(g.saldoNoDiaCentavos, referenciaCentavos)].suave,
                    g.saldoNoDiaCentavos < 0 && 'text-negativo',
                  )}
                >
                  <span className={VALOR_SALDO}>{formatarBRL(g.saldoNoDiaCentavos)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="border-t-2 border-contorno bg-transparent">
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

    </Card>
  )
}
