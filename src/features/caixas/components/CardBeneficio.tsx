import type { ReactNode } from 'react'
import { DataForte, DinheiroForte, Forte, SaldoForte } from '@/features/risco/components/Destaques'
import { Ajuda } from '@/shared/components/Ajuda'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { Forma } from '@/shared/components/Forma'
import { formatarData, formatarDiaMes } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CARD, ROTULO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import type { ResumoBeneficio } from '../utils/beneficio'
import { NOME_TOTAL, type Caixa } from '../model/caixa'
import { useResumoBeneficio } from '../hooks/useBeneficio'

/**
 * Faixa de um benefício (no lugar do risco do caixa, que é só das contas): quanto sobra até a próxima recarga
 * e quanto isso dá por dia. Se o saldo acaba antes da recarga, o alerta fica à vista.
 */
export function CardBeneficio({ caixa }: { caixa: Caixa }) {
  const resumo = useResumoBeneficio(caixa)
  const falta = resumo?.primeiroNegativo

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <div className="flex items-stretch">
        <span
          aria-hidden
          className={cn(
            'flex w-10 shrink-0 items-center justify-center border-r-2 border-contorno sm:w-12',
            falta ? 'bg-vermelho' : 'bg-tinta',
          )}
        >
          <Forma forma={falta ? 'triangulo' : 'quarto'} cor={falta ? 'papel' : 'amarelo'} className="size-5 sm:size-6" />
        </span>
        <div className="grid min-w-0 flex-1 gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center lg:gap-5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn(ROTULO, 'whitespace-nowrap text-muted-foreground')}>Até a recarga</span>
              <span className="text-sm font-semibold whitespace-nowrap">{caixa.nome}</span>
              <Ajuda titulo="Como o benefício é calculado">
                <p>
                  A sobra já desconta os gastos lançados neste benefício até a véspera da próxima recarga. O valor por
                  dia divide essa sobra pelos dias que faltam.
                </p>
                <p>
                  A recarga é uma entrada do benefício (por exemplo, todo dia 1º). Sem ela, o app não sabe quando o saldo
                  volta.
                </p>
                <p className="text-muted-foreground">
                  Benefício não tem risco do caixa nem metas: o dinheiro dele só paga alguns gastos, por isso fica fora
                  do {NOME_TOTAL}.
                </p>
              </Ajuda>
            </div>
            <Mensagem resumo={resumo} caixa={caixa} />
          </div>
          {resumo && (
            <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3 lg:border-t-0 lg:border-l-2 lg:border-contorno lg:pt-0 lg:pl-5">
              <Numero rotulo="Saldo hoje">
                <span className={cn(VALOR_SALDO, resumo.saldoHojeCentavos < 0 && 'text-negativo')}>
                  {formatarBRL(resumo.saldoHojeCentavos)}
                </span>
              </Numero>
              <Numero rotulo="Recarga">
                {resumo.recarga ? (
                  <>
                    <span className="text-entrada">{formatarBRL(resumo.recarga.valorCentavos)}</span>
                    <span className="block text-[0.7rem] font-normal text-muted-foreground">
                      em {formatarDiaMes(resumo.recarga.data)}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Numero>
              <Numero rotulo="Por dia">
                {resumo.porDiaCentavos !== null ? (
                  <>
                    {formatarBRL(resumo.porDiaCentavos)}
                    <span className="block text-[0.7rem] font-normal text-muted-foreground">
                      {resumo.dias} {resumo.dias === 1 ? 'dia' : 'dias'}
                    </span>
                  </>
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
function Mensagem({ resumo, caixa }: { resumo: ResumoBeneficio | null; caixa: Caixa }) {
  if (!resumo) {
    return (
      <p className="text-sm">
        <Forte>Começa em {formatarData(caixa.dataSaldoInicial)}.</Forte> Antes disso, o benefício fica fora do cálculo.
      </p>
    )
  }
  if (resumo.primeiroNegativo) {
    return (
      <CaixaDestaque fundo="bg-negativo-suave" faixa="border-l-vermelho">
        <p>
          <Forte className="text-negativo">Vai faltar dinheiro:</Forte> com os gastos lançados, o saldo fica negativo em{' '}
          <DataForte data={resumo.primeiroNegativo} />
          {resumo.recarga ? (
            <>
              , antes da recarga de <DataForte data={resumo.recarga.data} />.
            </>
          ) : (
            '.'
          )}
        </p>
      </CaixaDestaque>
    )
  }
  if (!resumo.recarga) {
    return (
      <p className="text-sm">
        <Forte>Sem recarga lançada.</Forte> Cadastre a recarga como uma entrada deste caixa para ver quanto dá por dia.
      </p>
    )
  }
  if (resumo.porDiaCentavos === null) {
    return (
      <p className="text-sm">
        <Forte>Recarga amanhã:</Forte> <DinheiroForte centavos={resumo.recarga.valorCentavos} className="text-entrada" />{' '}
        em <DataForte data={resumo.recarga.data} />. Hoje sobram <SaldoForte centavos={resumo.sobraCentavos} />.
      </p>
    )
  }
  return (
    <p className="text-sm">
      <Forte>Sobram </Forte>
      <SaldoForte centavos={resumo.sobraCentavos} /> até a recarga de <DataForte data={resumo.recarga.data} />: dá{' '}
      <DinheiroForte centavos={resumo.porDiaCentavos} /> por dia.
    </p>
  )
}
