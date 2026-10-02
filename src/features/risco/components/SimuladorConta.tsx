import { useMemo, useState } from 'react'
import { Calculator, X } from 'lucide-react'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, TITULO_CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Field, FieldLabel } from '@/shared/ui/field'
import { COR_RISCO } from '../cores'
import type { AnaliseRisco } from '../risco'
import {
  contaSimulada,
  maiorContaSemPiorar,
  naoPiora,
  riscoCom,
  type ContextoRisco,
  type FrequenciaConta,
} from '../simulacao'
import { DataForte, DinheiroForte, Forte, NomeNivel, SaldoForte } from './Destaques'
import { FaixaMeses } from './FaixaMeses'
import { DesdeQuando, FraseFalta } from './MensagemRisco'

const OPCOES_FREQUENCIA = [
  { valor: 'unica' as const, rotulo: 'Uma vez' },
  { valor: 'mensal' as const, rotulo: 'Todo mês' },
]

/** "E se eu assumir esta conta?": o risco do caixa com uma saída nova, antes de cadastrá-la. */
export function SimuladorConta({ risco, contexto }: { risco: AnaliseRisco; contexto: ContextoRisco }) {
  const [valor, setValor] = useState(0)
  const [frequencia, setFrequencia] = useState<FrequenciaConta>('mensal')
  const [data, setData] = useState(contexto.hoje)

  const simulado = useMemo(
    () => (valor > 0 ? riscoCom(contexto, [...contexto.lancamentos, contaSimulada(valor, frequencia, data, contexto.caixa.id)]) : null),
    [contexto, valor, frequencia, data],
  )
  // Não depende do valor digitado: só da frequência e da data.
  const maximo = useMemo(
    () => maiorContaSemPiorar(contexto, frequencia, data, risco),
    [contexto, frequencia, data, risco],
  )
  const porMes = frequencia === 'mensal' ? ' por mês' : ''
  const [aberto, setAberto] = useState(false)

  // Fechado, o simulador é uma linha: quanto cabe hoje e o botão para abrir os campos.
  const quantoCabe =
    risco.menorSaldo.valorCentavos < 0 ? (
      <>Seu saldo já fica negativo nos próximos meses, então nenhuma conta nova cabe agora.</>
    ) : maximo > 0 ? (
      <>
        Hoje cabe uma conta de até <DinheiroForte centavos={maximo} className="text-foreground" />
        {porMes} sem piorar o risco do caixa.
      </>
    ) : (
      <>Qualquer conta nova{porMes} nessa data já deixa o caixa mais apertado.</>
    )

  return (
    <section aria-label="Posso assumir uma conta nova?" className="flex flex-col gap-4 border-t-2 border-contorno px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
          <h3 className={cn(TITULO_CARD, 'text-base')}>Posso assumir uma conta nova?</h3>
          <p className="text-sm text-muted-foreground">
            {aberto ? (
              <>
                Digite o valor de uma compra, parcela ou assinatura e veja o efeito{' '}
                <strong className="font-semibold text-foreground">antes de fechar negócio</strong>.
              </>
            ) : (
              quantoCabe
            )}
          </p>
        </div>
        <Button
          variant={aberto ? 'ghost' : 'outline'}
          className={cn(BOTAO, 'h-8 px-3')}
          aria-expanded={aberto}
          aria-controls="simulador-conta"
          onClick={() => setAberto((a) => !a)}
        >
          {aberto ? <X /> : <Calculator />}
          {aberto ? 'Fechar' : 'Simular'}
        </Button>
      </div>

      {aberto && (
        <div id="simulador-conta" className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="simular-valor">Valor da conta</FieldLabel>
              <CampoDinheiro id="simular-valor" centavos={valor} onChange={setValor} autoFocus />
            </Field>
            <Field>
              <FieldLabel htmlFor="simular-frequencia">Paga</FieldLabel>
              <ControleSegmentado
                id="simular-frequencia"
                rotulo="Com que frequência paga"
                valor={frequencia}
                opcoes={OPCOES_FREQUENCIA}
                onChange={setFrequencia}
                className="h-10"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="simular-data">{frequencia === 'mensal' ? 'A partir de' : 'Quando'}</FieldLabel>
              <SeletorData id="simular-data" valor={data} onChange={(v) => v && setData(v)} />
            </Field>
          </div>

          {simulado ? (
            <Resultado atual={risco} simulado={simulado} />
          ) : (
            <p className="text-sm text-muted-foreground">{quantoCabe}</p>
          )}

          {simulado && (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <p className="min-w-0 flex-1 basis-60 text-sm text-muted-foreground">
                {maximo > 0 ? (
                  <>
                    Sem piorar o risco, a conta pode ser de até{' '}
                    <DinheiroForte centavos={maximo} className="text-foreground" />
                    {porMes}.
                  </>
                ) : (
                  <>Nessa data, qualquer conta nova{porMes} deixa o caixa mais apertado.</>
                )}
              </p>
              {maximo > 0 && maximo !== valor && (
                <Button variant="outline" className={cn(BOTAO, 'h-8 px-3')} onClick={() => setValor(maximo)}>
                  Simular {formatarBRL(maximo)}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/** O veredito da conta simulada, na cor do nível que o caixa teria, e os meses comparados. */
function Resultado({ atual, simulado }: { atual: AnaliseRisco; simulado: AnaliseRisco }) {
  const saldo = simulado.menorSaldo
  const falta = saldo.valorCentavos < 0
  const bem = naoPiora(simulado, atual.nivel)
  const cores = COR_RISCO[simulado.nivel]
  const titulo = falta ? 'Não cabe.' : bem ? 'Pode assumir.' : simulado.nivel >= 4 ? 'Arriscado.' : 'Cabe, mas o caixa aperta.'

  return (
    <>
      <CaixaDestaque fundo={cores.suave} faixa={cores.faixa}>
        <p aria-live="polite">
          <Forte className={cn('uppercase', cores.texto)}>{titulo}</Forte>{' '}
          {falta ? (
            <>
              Com essa conta, falta dinheiro: <FraseFalta risco={simulado} />.
            </>
          ) : bem ? (
            <>
              Seu caixa continua <NomeNivel nivel={simulado.nivel} />. No dia mais apertado, <DataForte data={saldo.data} />,
              ainda sobram <SaldoForte centavos={saldo.valorCentavos} />.
            </>
          ) : (
            <>
              Com essa conta, seu caixa passa de <NomeNivel nivel={atual.nivel} /> para{' '}
              <NomeNivel nivel={simulado.nivel} />
              <DesdeQuando risco={simulado} />. O dia mais apertado vira <DataForte data={saldo.data} />, com{' '}
              {simulado.nivel >= 4 ? 'só ' : ''}
              <SaldoForte centavos={saldo.valorCentavos} /> na conta.
            </>
          )}
        </p>
      </CaixaDestaque>
      <div className="grid gap-3 lg:grid-cols-2">
        <FaixaMeses meses={atual.meses} rotulo="Hoje" comRotulo />
        <FaixaMeses meses={simulado.meses} rotulo="Com a conta nova" comRotulo />
      </div>
    </>
  )
}
