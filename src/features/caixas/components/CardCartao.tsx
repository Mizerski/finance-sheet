import type { ReactNode } from 'react'
import { DataForte, DinheiroForte, Forte } from '@/features/risco/components/Destaques'
import { Ajuda } from '@/shared/components/Ajuda'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { Forma } from '@/shared/components/Forma'
import { formatarData, formatarDiaMes } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CARD, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { useFinancas } from '@/store/context/financas-context'
import { ehCartao, NOME_TOTAL, type Caixa } from '../model/caixa'
import type { ResumoCartao } from '../utils/cartao'
import { useResumoCartao } from '../hooks/useCartao'

/**
 * Faixa de um cartão de crédito (no lugar do risco do caixa, que é só das contas): a fatura que vem, de que conta
 * ela sai e quanto do limite ainda está livre. Passar do limite fica à vista.
 */
export function CardCartao({ caixa }: { caixa: Caixa }) {
  const { estado } = useFinancas()
  const resumo = useResumoCartao(caixa)
  if (!ehCartao(caixa)) return null
  const pagadora = estado.caixas.find((c) => c.id === caixa.cartao.contaPagadoraId)?.nome ?? 'a conta'
  const estourou = resumo?.disponivelCentavos != null && resumo.disponivelCentavos < 0

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <div className="flex items-stretch">
        <span
          aria-hidden
          className={cn(
            'flex w-10 shrink-0 items-center justify-center border-r-2 border-contorno sm:w-12',
            estourou ? 'bg-vermelho' : 'bg-tinta',
          )}
        >
          <Forma forma={estourou ? 'triangulo' : 'quadrado'} cor={estourou ? 'papel' : 'vermelho'} className="size-5 sm:size-6" />
        </span>
        <div className="grid min-w-0 flex-1 gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center lg:gap-5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn(ROTULO, 'whitespace-nowrap text-muted-foreground')}>Fatura</span>
              <span className="text-sm font-semibold whitespace-nowrap">{caixa.nome}</span>
              <Ajuda titulo="Como a fatura é calculada">
                <p>
                  As compras são saídas do cartão. No dia {caixa.cartao.diaFechamento}, tudo o que você deve no cartão vira
                  a fatura, que sai de {pagadora} no dia {caixa.cartao.diaVencimento}. Não precisa lançar o pagamento.
                </p>
                <p>Compra parcelada: lance como saída mensal com o número de vezes. Cada parcela cai na fatura do mês dela.</p>
                <p className="text-muted-foreground">
                  Cartão não tem risco do caixa nem metas: o risco aparece em {pagadora}, que paga a fatura. No{' '}
                  {NOME_TOTAL}, o que você deve no cartão já conta no dia da compra (se ele soma no total).
                </p>
              </Ajuda>
            </div>
            <Mensagem resumo={resumo} caixa={caixa} pagadora={pagadora} />
          </div>
          {resumo && (
            <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3 lg:border-t-0 lg:border-l-2 lg:border-contorno lg:pt-0 lg:pl-5">
              <Numero rotulo="Aberta">
                <span className="text-saida">{formatarBRL(resumo.aberta.valorCentavos)}</span>
                <span className="block text-[0.7rem] font-normal text-muted-foreground">
                  fecha {formatarDiaMes(resumo.aberta.fechamento)}
                </span>
              </Numero>
              <Numero rotulo={resumo.fechada ? 'Fechada' : 'Deve hoje'}>
                {resumo.fechada ? (
                  <>
                    <span className="text-saida">{formatarBRL(resumo.fechada.valorCentavos)}</span>
                    <span className="block text-[0.7rem] font-normal text-muted-foreground">
                      vence {formatarDiaMes(resumo.fechada.vencimento)}
                    </span>
                  </>
                ) : (
                  formatarBRL(resumo.devendoCentavos)
                )}
              </Numero>
              <Numero rotulo="Limite livre">
                {resumo.disponivelCentavos !== null ? (
                  <span className={cn(resumo.disponivelCentavos < 0 && 'text-negativo')}>
                    {formatarBRL(resumo.disponivelCentavos)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Numero>
            </dl>
          )}
        </div>
      </div>
    </Card>
  )
}

function Numero({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className={cn(ROTULO, 'text-muted-foreground')}>{rotulo}</dt>
      <dd className="text-sm leading-tight font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

/** A conclusão em uma frase, com a abertura em negrito. */
function Mensagem({ resumo, caixa, pagadora }: { resumo: ResumoCartao | null; caixa: Caixa; pagadora: string }) {
  if (!resumo) {
    return (
      <p className="text-sm">
        <Forte>Começa em {formatarData(caixa.dataSaldoInicial)}.</Forte> Antes disso, o cartão fica fora do cálculo.
      </p>
    )
  }
  if (resumo.disponivelCentavos !== null && resumo.disponivelCentavos < 0) {
    return (
      <CaixaDestaque fundo="bg-negativo-suave" faixa="border-l-vermelho">
        <p>
          <Forte className="text-negativo">Passou do limite:</Forte> você deve{' '}
          <DinheiroForte centavos={resumo.devendoCentavos} />, <DinheiroForte centavos={-resumo.disponivelCentavos} /> a
          mais que o limite.
        </p>
      </CaixaDestaque>
    )
  }
  const proxima = resumo.fechada ?? resumo.aberta
  if (proxima.valorCentavos === 0) {
    return (
      <p className="text-sm">
        <Forte>Nada a pagar por enquanto.</Forte> A fatura fecha em <DataForte data={resumo.aberta.fechamento} />.
      </p>
    )
  }
  return (
    <p className="text-sm">
      <Forte>{resumo.fechada ? 'Fatura fechada:' : 'Próxima fatura:'}</Forte>{' '}
      <DinheiroForte centavos={proxima.valorCentavos} className="text-saida" /> sai de {pagadora} em{' '}
      <DataForte data={proxima.vencimento} />.
    </p>
  )
}
