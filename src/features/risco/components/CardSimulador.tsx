import { useMemo, useState } from 'react'
import { MAX_VEZES } from '@/features/lancamentos/utils/parcelas'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMPO, CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { COR_RISCO } from '../constants/cores'
import { maiorDosMeses, type AnaliseRisco } from '../utils/risco'
import { contaSimulada, maiorContaSemPiorar, naoPiora, riscoCom, type ContextoRisco } from '../utils/simulacao'
import { DataForte, DinheiroForte, Forte, NomeNivel, SaldoForte } from './Destaques'
import { FaixaMeses } from './FaixaMeses'
import { DesdeQuando, FraseFalta } from './MensagemRisco'

type ComoPaga = 'unica' | 'parcelado' | 'mensal'

const OPCOES_COMO = [
  { valor: 'unica' as const, rotulo: 'Uma vez' },
  { valor: 'parcelado' as const, rotulo: 'Parcelado' },
  { valor: 'mensal' as const, rotulo: 'Todo mês' },
]
const OPCOES_VALOR = [
  { valor: 'total' as const, rotulo: 'O total' },
  { valor: 'cada' as const, rotulo: 'Cada parcela' },
]

/** Vezes de 2 até o máximo do formulário de lançamento; fora disso, ainda não dá para simular. */
function lerVezes(texto: string): number | null {
  const n = Number(texto)
  return texto.trim() && Number.isInteger(n) && n >= 2 && n <= MAX_VEZES ? n : null
}

/**
 * "Posso assumir uma conta nova?": o risco do caixa com uma saída nova, antes de cadastrá-la. Uma vez, parcelada
 * (o valor digitado pode ser o total, que o app divide, ou o de cada parcela) ou todo mês, sem fim.
 */
export function CardSimulador({ risco, contexto }: { risco: AnaliseRisco; contexto: ContextoRisco }) {
  const [valor, setValor] = useState(0)
  const [como, setComo] = useState<ComoPaga>('unica')
  const [textoVezes, setTextoVezes] = useState('12')
  const [ehTotal, setEhTotal] = useState(true)
  const [data, setData] = useState(contexto.hoje)

  const parcelado = como === 'parcelado'
  const vezes = parcelado ? lerVezes(textoVezes) : undefined
  const pronto = !parcelado || vezes !== null
  const frequencia = como === 'unica' ? 'unica' : 'mensal'
  const dividir = parcelado && ehTotal && vezes ? vezes : 1
  const cada = Math.round(valor / dividir)

  const simulado = useMemo(
    () =>
      cada > 0 && pronto
        ? riscoCom(contexto, [...contexto.lancamentos, contaSimulada(cada, frequencia, data, contexto.caixa.id, vezes ?? undefined)])
        : null,
    [contexto, cada, pronto, frequencia, data, vezes],
  )
  const maximoCada = useMemo(
    () => (pronto ? maiorContaSemPiorar(contexto, frequencia, data, risco, vezes ?? undefined) : 0),
    [contexto, pronto, frequencia, data, risco, vezes],
  )
  /** O máximo no mesmo jeito que a pessoa digita: o total da compra parcelada, se ela digita o total. */
  const maximo = maximoCada * dividir
  const maximoTexto = <DinheiroForte centavos={maximo} className="text-foreground" />

  const quantoCabe =
    risco.menorSaldo.valorCentavos < 0 ? (
      <>Seu saldo já fica negativo nos próximos meses, então nenhuma conta nova cabe agora.</>
    ) : !pronto ? (
      <>Diga em quantas vezes (de 2 a {MAX_VEZES}) para ver quanto cabe.</>
    ) : maximo <= 0 ? (
      <>Qualquer conta nova {como === 'unica' ? 'nessa data' : 'a partir dessa data'} já deixa o caixa mais apertado.</>
    ) : como === 'unica' ? (
      <>Hoje cabe uma conta de até {maximoTexto} sem piorar o risco do caixa.</>
    ) : como === 'mensal' ? (
      <>Hoje cabe uma conta de até {maximoTexto} por mês sem piorar o risco do caixa.</>
    ) : ehTotal ? (
      <>
        Hoje cabe uma compra de até {maximoTexto} em {vezes} vezes sem piorar o risco do caixa.
      </>
    ) : (
      <>
        Hoje cabem {vezes} parcelas de até {maximoTexto} sem piorar o risco do caixa.
      </>
    )

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Posso assumir uma conta nova?"
        faixa="bg-tinta"
        forma={{ forma: 'triangulo', cor: 'amarelo' }}
        descricao="Veja o efeito antes de fechar negócio"
        ajuda={
          <Ajuda titulo="Posso assumir uma conta nova?">
            <p>
              Digite o valor de uma compra, parcela ou assinatura. O app junta essa conta às que você já tem e mostra como
              fica o risco do caixa de {contexto.caixa.nome} nos próximos 12 meses.
            </p>
            <p>
              <Forte>Parcelado:</Forte> digite o total da compra (o app divide pelas vezes) ou o valor de cada parcela.
              Nada é salvo: é só uma conta de cabeça, feita pelo app.
            </p>
          </Ajuda>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <p className="text-sm">{quantoCabe}</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="simular-valor">{parcelado && ehTotal ? 'Valor total' : parcelado ? 'Valor da parcela' : 'Valor'}</FieldLabel>
            <CampoDinheiro id="simular-valor" centavos={valor} onChange={setValor} />
          </Field>
          <Field>
            <FieldLabel htmlFor="simular-como">Como paga</FieldLabel>
            <ControleSegmentado
              id="simular-como"
              rotulo="Como paga"
              valor={como}
              opcoes={OPCOES_COMO}
              onChange={setComo}
              className="h-10"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="simular-data">
              {como === 'unica' ? 'Quando' : parcelado ? 'Primeira parcela' : 'A partir de'}
            </FieldLabel>
            <SeletorData id="simular-data" valor={data} onChange={(v) => v && setData(v)} />
          </Field>
        </div>

        {parcelado && (
          <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <Field data-invalid={vezes === null || undefined}>
              <FieldLabel htmlFor="simular-vezes">Em quantas vezes?</FieldLabel>
              <Input
                id="simular-vezes"
                type="number"
                inputMode="numeric"
                min={2}
                max={MAX_VEZES}
                placeholder="Ex.: 12"
                value={textoVezes}
                onChange={(e) => setTextoVezes(e.target.value)}
                aria-invalid={vezes === null || undefined}
                className={cn(CAMPO, 'tabular-nums')}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="simular-valor-total">O valor digitado é</FieldLabel>
              <ControleSegmentado
                id="simular-valor-total"
                rotulo="O valor digitado é"
                valor={ehTotal ? 'total' : 'cada'}
                opcoes={OPCOES_VALOR}
                onChange={(v) => setEhTotal(v === 'total')}
                className="sm:self-start"
              />
            </Field>
            {vezes && valor > 0 && (
              <FieldDescription className="-mt-2 sm:col-span-2">
                <Forte className="tabular-nums">
                  {vezes} × {formatarBRL(cada)}
                </Forte>{' '}
                = <DinheiroForte centavos={cada * vezes} />
              </FieldDescription>
            )}
          </div>
        )}

        {simulado && (
          <>
            <Resultado atual={risco} simulado={simulado} />
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <p className="min-w-0 flex-1 basis-60 text-sm text-muted-foreground">{quantoCabe}</p>
              {maximo > 0 && maximo !== valor && (
                <Button variant="outline" className={cn(BOTAO, 'h-8 px-3')} onClick={() => setValor(maximo)}>
                  Simular {formatarBRL(maximo)}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

/** O veredito da conta simulada, na cor do nível que o caixa teria, e os meses comparados na mesma escala. */
function Resultado({ atual, simulado }: { atual: AnaliseRisco; simulado: AnaliseRisco }) {
  const saldo = simulado.menorSaldo
  const falta = saldo.valorCentavos < 0
  const bem = naoPiora(simulado, atual.nivel)
  const cores = COR_RISCO[simulado.nivel]
  const titulo = falta ? 'Não cabe.' : bem ? 'Pode assumir.' : simulado.nivel >= 4 ? 'Arriscado.' : 'Cabe, mas o caixa aperta.'
  const escala = maiorDosMeses(atual.meses, simulado.meses)

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
        <FaixaMeses meses={atual.meses} rotulo="Hoje" comRotulo maximoCentavos={escala} />
        <FaixaMeses meses={simulado.meses} rotulo="Com a conta nova" comRotulo maximoCentavos={escala} />
      </div>
    </>
  )
}
