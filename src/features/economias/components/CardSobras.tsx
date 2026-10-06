import { SeletorAno } from '@/features/projecao/components/SeletorAno'
import type { ResumoMes } from '@/features/projecao/utils/projecao'
import { nomeDoMes } from '@/shared/lib/datas'
import { formatarBRL, formatarBRLSemSimbolo } from '@/shared/lib/dinheiro'
import { CARD, ROTULO, TABELA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { Card } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { sobraDoMes } from '../utils/sobras'

/** Colunas mais justas no celular, para as cinco caberem em 343px. */
const CELULA = 'px-1 py-2.5 sm:px-3'

const COLUNAS = [
  { rotulo: 'Entradas', cor: 'text-entrada' },
  { rotulo: 'Saídas', cor: 'text-saida' },
  { rotulo: 'Economia', curto: 'Econ.', cor: 'text-economia' },
  { rotulo: 'Sobra', cor: '' },
]

/** Meses antes do saldo inicial ficam fora da média. */
export function CardSobras({ ano, meses }: { ano: number; meses: ResumoMes[] }) {
  const calculados = meses.filter((m) => m.saldoFinalCentavos !== null)
  const soma = (f: (m: ResumoMes) => number) => calculados.reduce((t, m) => t + f(m), 0)
  const total = {
    entradas: soma((m) => m.entradasCentavos),
    saidas: soma((m) => m.saidasCentavos),
    economia: soma((m) => m.economiaCentavos),
    sobra: soma(sobraDoMes),
  }
  const media = (v: number) => (calculados.length ? Math.round(v / calculados.length) : 0)

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo={
          <>
            Sobras <span className="font-light">{ano}</span>
          </>
        }
        faixa="bg-amarelo"
        forma={{ forma: 'semicirculo', cor: 'tinta' }}
        ajuda={
          <Ajuda titulo="Sobras">
            <p>O que fica na conta a cada mês: o que entra, menos o que sai, menos o que vai para as metas.</p>
            <p>Transferências entre contas também mudam a sobra de cada conta; no Total, as entre contas do total se anulam.</p>
          </Ajuda>
        }
        acoes={<SeletorAno />}
      />

      <Table className={cn(TABELA.tabela, 'text-[0.7rem] tracking-tight sm:tracking-normal')}>
        <TableHeader>
          <TableRow className={TABELA.linhaCabecalho}>
            <TableHead className={cn(TABELA.cabecalho, CELULA, TABELA.primeira)}>Mês</TableHead>
            {COLUNAS.map((c, i) => (
              <TableHead
                key={c.rotulo}
                className={cn(TABELA.cabecalho, CELULA, 'text-right', i === COLUNAS.length - 1 && 'pr-4 sm:pr-5')}
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
          {meses.map((m) => {
            const fora = m.saldoFinalCentavos === null
            return (
              <TableRow key={m.mes} className={cn(TABELA.linha, fora && 'text-muted-foreground')}>
                <TableCell className={cn(CELULA, TABELA.primeira)}>
                  <span className="capitalize sm:hidden">{nomeDoMes(m.mes, 'curto')}</span>
                  <span className="hidden capitalize sm:inline">{nomeDoMes(m.mes)}</span>
                </TableCell>
                <Valor centavos={m.entradasCentavos} cor={COLUNAS[0].cor} />
                <Valor centavos={m.saidasCentavos} cor={COLUNAS[1].cor} />
                <Valor centavos={m.economiaCentavos} cor={COLUNAS[2].cor} />
                <Valor centavos={fora ? null : sobraDoMes(m)} sobra ultima />
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter className="bg-transparent font-semibold">
          <LinhaRodape rotulo="Total" valores={total} />
          <LinhaRodape
            rotulo="Média"
            valores={{
              entradas: media(total.entradas),
              saidas: media(total.saidas),
              economia: media(total.economia),
              sobra: media(total.sobra),
            }}
          />
        </TableFooter>
      </Table>
    </Card>
  )
}

/** No celular, sem o "R$" (as cinco colunas não cabiam com os totais do ano). */
function Valor({ centavos, cor, sobra, ultima }: { centavos: number | null; cor?: string; sobra?: boolean; ultima?: boolean }) {
  return (
    <TableCell
      className={cn(
        CELULA,
        'text-right tabular-nums',
        cor,
        sobra && centavos !== null && centavos < 0 && 'text-negativo',
        ultima && 'pr-4 sm:pr-5',
      )}
    >
      {centavos === null ? (
        '—'
      ) : centavos === 0 && !sobra ? (
        ''
      ) : (
        <>
          <span className="sm:hidden">{formatarBRLSemSimbolo(centavos)}</span>
          <span className="hidden sm:inline">{formatarBRL(centavos)}</span>
        </>
      )}
    </TableCell>
  )
}

function LinhaRodape({
  rotulo,
  valores,
}: {
  rotulo: string
  valores: { entradas: number; saidas: number; economia: number; sobra: number }
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className={cn(CELULA, TABELA.primeira, ROTULO, 'font-semibold')}>
        {rotulo}
      </TableCell>
      <Valor centavos={valores.entradas} cor={COLUNAS[0].cor} />
      <Valor centavos={valores.saidas} cor={COLUNAS[1].cor} />
      <Valor centavos={valores.economia} cor={COLUNAS[2].cor} />
      <Valor centavos={valores.sobra} sobra ultima />
    </TableRow>
  )
}
