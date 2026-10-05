import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { ehTransferencia } from '@/features/lancamentos/lancamento'
import { proximaCorLivre } from '@/features/categorias/cores'
import { SeletorCor } from '@/features/categorias/components/SeletorCor'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { Forma } from '@/shared/components/Forma'
import { MaisDetalhes } from '@/shared/components/MaisDetalhes'
import { SeletorData } from '@/shared/components/SeletorData'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { BOTAO, CAMPO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import type { FormaDaPagina } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { useFinancas } from '@/store/financas-context'
import {
  caixasAtivos,
  cartoesPagosPor,
  ehContaCorrente,
  ehUltimaConta,
  metasDoCaixa,
  ROTULO_TIPO_CAIXA,
  type Caixa,
  type TipoCaixa,
} from '../caixa'
import { CampoCaixa } from './CampoCaixa'
import { EXPLICACAO_TIPO } from '../textos'

interface FormularioCaixaProps {
  /** Ausente = novo caixa. */
  caixa?: Caixa
  onConcluir: () => void
}

const OPCOES_SIM_NAO = [
  { valor: 'sim' as const, rotulo: 'Sim' },
  { valor: 'nao' as const, rotulo: 'Não' },
]
const OPCOES_SINAL = [
  { valor: 'positivo' as const, rotulo: 'Positivo' },
  { valor: 'negativo' as const, rotulo: 'Negativo' },
]

/** O que a pessoa escolhe em "Que dinheiro é esse?": o investimento é uma conta com `investimento`. */
type Escolha = TipoCaixa | 'investimento'

/** Forma de cada escolha no cartão (decorativa). */
const FORMA_TIPO: Record<Escolha, Omit<FormaDaPagina, 'cor'>> = {
  conta: { forma: 'circulo' },
  investimento: { forma: 'semicirculo' },
  beneficio: { forma: 'quarto' },
  cartao: { forma: 'quadrado' },
}
const ESCOLHAS: Escolha[] = ['conta', 'investimento', 'beneficio', 'cartao']
const ROTULO_ESCOLHA: Record<Escolha, string> = { ...ROTULO_TIPO_CAIXA, investimento: 'Investimento' }

type Erros = Partial<Record<'nome' | 'tipo' | 'fechamento' | 'vencimento' | 'pagadora', string>>

/** Dia do mês digitado (1–31) ou null. */
function lerDia(texto: string): number | null {
  const dia = Number(texto)
  return texto.trim() && Number.isInteger(dia) && dia >= 1 && dia <= 31 ? dia : null
}

export function FormularioCaixa({ caixa, onConcluir }: FormularioCaixaProps) {
  const { estado, dispatch } = useFinancas()
  const [nome, setNome] = useState(caixa?.nome ?? '')
  const [escolha, setEscolha] = useState<Escolha>(caixa?.investimento ? 'investimento' : (caixa?.tipo ?? 'conta'))
  const tipo: TipoCaixa = escolha === 'investimento' ? 'conta' : escolha
  const investimento = escolha === 'investimento'
  const [cor, setCor] = useState(() => caixa?.cor ?? proximaCorLivre(estado.caixas.map((c) => c.cor)))
  const [centavos, setCentavos] = useState(Math.abs(caixa?.saldoInicialCentavos ?? 0))
  const [sinal, setSinal] = useState<'positivo' | 'negativo'>(
    (caixa?.saldoInicialCentavos ?? 0) < 0 ? 'negativo' : 'positivo',
  )
  // Caixa novo começa hoje: os dias anteriores ficam fora do cálculo dele.
  const [data, setData] = useState<DataISO>(() => caixa?.dataSaldoInicial ?? paraDataISO(new Date()))
  // Só a conta escolhe: benefício fica sempre fora do total (o dinheiro dele não paga qualquer conta).
  const [contaNoTotal, setContaNoTotal] = useState(caixa && caixa.tipo !== 'beneficio' ? caixa.entraNoTotal : true)
  // Cartão: ciclo da fatura, conta que paga e limite (opcional).
  const contas = caixasAtivos(estado.caixas).filter((c) => ehContaCorrente(c) && c.id !== caixa?.id)
  const [fechamento, setFechamento] = useState(caixa?.cartao ? String(caixa.cartao.diaFechamento) : '')
  const [vencimento, setVencimento] = useState(caixa?.cartao ? String(caixa.cartao.diaVencimento) : '')
  const [pagadora, setPagadora] = useState(caixa?.cartao?.contaPagadoraId ?? contas[0]?.id ?? '')
  const [limite, setLimite] = useState(caixa?.cartao?.limiteCentavos ?? 0)
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const cartao = tipo === 'cartao'

  function validar(): Erros {
    const erros: Erros = {}
    const limpo = nome.trim()
    if (!limpo) erros.nome = 'Informe um nome.'
    else if (
      estado.caixas.some(
        (c) => c.id !== caixa?.id && c.nome.toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'),
      )
    ) {
      erros.nome = 'Já existe um caixa com esse nome.'
    }
    if (caixa && tipo !== 'conta' && caixa.tipo === 'conta') {
      if (ehUltimaConta(caixa, estado.caixas)) erros.tipo = 'É a única conta: o app precisa de pelo menos uma.'
      else if (cartoesPagosPor(estado.caixas, caixa.id).length > 0) erros.tipo = 'Esta conta paga a fatura de um cartão.'
      else if (metasDoCaixa(estado.metas, caixa.id).length > 0) erros.tipo = 'Este caixa tem metas, e metas só ficam em contas.'
      else if (estado.lancamentos.some((l) => ehTransferencia(l) && (l.caixaId === caixa.id || l.caixaDestinoId === caixa.id))) {
        erros.tipo = 'Este caixa tem transferências, e transferência é só entre contas.'
      }
    }
    // Virar investimento: a conta sai do risco e deixa de pagar cartão e de ser origem de meta.
    if (caixa && investimento && ehContaCorrente(caixa)) {
      const outrasDoDiaADia = caixasAtivos(estado.caixas).filter((c) => ehContaCorrente(c) && c.id !== caixa.id)
      if (outrasDoDiaADia.length === 0) erros.tipo = 'É a única conta do dia a dia: o app precisa de pelo menos uma.'
      else if (cartoesPagosPor(estado.caixas, caixa.id).length > 0) erros.tipo = 'Esta conta paga a fatura de um cartão.'
      else if (estado.metas.some((m) => m.caixaId === caixa.id)) erros.tipo = 'Esta conta tem metas que guardam dinheiro dela.'
    }
    if (caixa && investimento && estado.metas.filter((m) => m.destinoId === caixa.id).length > 1) {
      erros.tipo = 'Mais de uma meta manda dinheiro para esta conta; o investimento fica com uma só.'
    }
    if (cartao) {
      if (lerDia(fechamento) === null) erros.fechamento = 'Use um dia entre 1 e 31.'
      if (lerDia(vencimento) === null) erros.vencimento = 'Use um dia entre 1 e 31.'
      else if (lerDia(vencimento) === lerDia(fechamento)) erros.vencimento = 'O vencimento precisa ser em outro dia.'
      if (!contas.some((c) => c.id === pagadora)) erros.pagadora = 'Escolha a conta que paga a fatura.'
    }
    return erros
  }
  const erros = tentouSalvar ? validar() : {}

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (Object.keys(validar()).length > 0) {
      setTentouSalvar(true)
      return
    }
    dispatch({
      tipo: 'caixa/salvar',
      caixa: {
        id: caixa?.id ?? crypto.randomUUID(),
        nome: nome.trim(),
        cor,
        tipo,
        // Benefício não fica negativo no começo: o sinal só vale para conta. No cartão, o valor é o que se deve.
        saldoInicialCentavos: cartao ? -centavos : escolha === 'conta' && sinal === 'negativo' ? -centavos : centavos,
        dataSaldoInicial: data,
        saldoDefinido: true,
        entraNoTotal: tipo !== 'beneficio' && contaNoTotal,
        ...(investimento && { investimento: true }),
        ...(cartao && {
          cartao: {
            diaFechamento: lerDia(fechamento)!,
            diaVencimento: lerDia(vencimento)!,
            contaPagadoraId: pagadora,
            ...(limite > 0 && { limiteCentavos: limite }),
          },
        }),
        // Caixa novo entra no fim do seletor; a posição muda com as setas da lista.
        ordem: caixa?.ordem ?? Math.max(-1, ...estado.caixas.map((c) => c.ordem)) + 1,
        ...(caixa?.arquivado && { arquivado: true }),
      },
    })
    onConcluir()
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <Field data-invalid={!!erros.nome || undefined}>
        <FieldLabel htmlFor="caixa-nome">Nome</FieldLabel>
        <Input
          id="caixa-nome"
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={
            investimento
              ? 'Ex.: Tesouro, CDB, Corretora'
              : tipo === 'conta'
                ? 'Ex.: Nubank, Carteira'
                : cartao
                  ? 'Ex.: Cartão Nubank'
                  : 'Ex.: Vale-refeição'
          }
          aria-invalid={!!erros.nome || undefined}
          className={CAMPO}
        />
        <FieldError>{erros.nome}</FieldError>
      </Field>

      <Field data-invalid={!!erros.tipo || undefined}>
        <FieldLabel id="caixa-tipo-rotulo">Que dinheiro é esse?</FieldLabel>
        <EscolhaTipo
          valor={escolha}
          onChange={(e) => {
            setEscolha(e)
            // Investimento novo começa fora do total (não é dinheiro para o dia a dia); dá para mudar em Mais opções.
            if (!caixa) setContaNoTotal(e !== 'investimento')
          }}
        />
        <FieldError>{erros.tipo}</FieldError>
      </Field>

      {cartao && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoDia id="caixa-fechamento" rotulo="Fecha no dia" valor={fechamento} onChange={setFechamento} erro={erros.fechamento} />
            <CampoDia id="caixa-vencimento" rotulo="Vence no dia" valor={vencimento} onChange={setVencimento} erro={erros.vencimento} />
          </div>
          <CampoCaixa
            id="caixa-pagadora"
            rotulo="Paga com"
            valor={pagadora}
            onChange={setPagadora}
            filtro={(c) => ehContaCorrente(c) && c.id !== caixa?.id}
            placeholder="Escolher"
            descricao="A fatura sai desta conta no dia do vencimento."
            erro={erros.pagadora}
            sempre
          />
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="caixa-saldo">{cartao ? 'Quanto deve hoje' : 'Saldo inicial'}</FieldLabel>
          <CampoDinheiro id="caixa-saldo" centavos={centavos} onChange={setCentavos} />
          {cartao && <FieldDescription>A fatura fechada mais a aberta, sem as parcelas que ainda vão vir.</FieldDescription>}
        </Field>
        <Field>
          <FieldLabel htmlFor="caixa-data">No começo do dia</FieldLabel>
          <SeletorData id="caixa-data" valor={data} onChange={(d) => d && setData(d)} />
        </Field>
      </div>

      {/* Só a conta do dia a dia fica negativa (cheque especial). */}
      {escolha === 'conta' && (
        <Field>
          <FieldLabel htmlFor="caixa-sinal">Situação da conta</FieldLabel>
          <ControleSegmentado
            id="caixa-sinal"
            rotulo="Situação da conta"
            valor={sinal}
            opcoes={OPCOES_SINAL}
            onChange={setSinal}
          />
          <FieldDescription>Negativo se a conta estava no cheque especial.</FieldDescription>
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor="caixa-cor">Cor</FieldLabel>
        <SeletorCor id="caixa-cor" valor={cor} onChange={setCor} />
      </Field>

      {tipo !== 'beneficio' && (
        <MaisDetalhes rotulo="Mais opções" rotuloAberto="Menos opções">
          {cartao && (
            <Field>
              <FieldLabel htmlFor="caixa-limite">
                Limite <span className="font-normal text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <CampoDinheiro id="caixa-limite" centavos={limite} onChange={setLimite} />
              <FieldDescription>Só para mostrar quanto ainda dá para gastar no cartão.</FieldDescription>
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="caixa-total">Soma no total</FieldLabel>
            <ControleSegmentado
              id="caixa-total"
              rotulo="Soma no total"
              valor={contaNoTotal ? 'sim' : 'nao'}
              opcoes={OPCOES_SIM_NAO}
              onChange={(v) => setContaNoTotal(v === 'sim')}
              className="sm:w-60"
            />
            <FieldDescription>
              {cartao
                ? 'Com "Sim", o Total desconta o que você deve no cartão já no dia da compra. Com "Não", o Total só muda quando a fatura sai da conta.'
                : investimento
                  ? 'Com "Sim", o dinheiro aplicado entra no saldo do Total. O risco do caixa nunca conta com ele.'
                  : 'Escolha "Não" para uma conta que fica de lado, como investimento ou poupança: ela continua com saldo e risco próprios, mas não entra no saldo do Total.'}
            </FieldDescription>
          </Field>
        </MaisDetalhes>
      )}

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO}>
          {caixa ? 'Salvar alterações' : 'Adicionar caixa'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Conta ou benefício em dois cartões com a explicação à vista: a diferença muda o que o app calcula
 * (total, risco e metas na conta; quanto dá por dia até a recarga no benefício). O escolhido fica em bloco preto.
 */
function EscolhaTipo({ valor, onChange }: { valor: Escolha; onChange: (escolha: Escolha) => void }) {
  const tipos = ESCOLHAS

  // Setas trocam a escolha, como num grupo de rádio.
  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const passo = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1
    const proximo = tipos[(tipos.indexOf(valor) + passo + tipos.length) % tipos.length]
    onChange(proximo)
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')[tipos.indexOf(proximo)]?.focus()
  }

  return (
    <div role="radiogroup" aria-labelledby="caixa-tipo-rotulo" onKeyDown={aoTeclar} className="grid gap-2 sm:grid-cols-2">
      {tipos.map((t) => {
        const ativo = t === valor
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={ativo}
            tabIndex={ativo ? 0 : -1}
            onClick={() => onChange(t)}
            className={cn(
              'group flex flex-col gap-1.5 border-2 border-contorno p-3 text-left transition-[background-color,box-shadow,translate] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              ativo
                ? 'bg-foreground text-background motion-safe:translate-x-[2px] motion-safe:translate-y-[2px]'
                : 'bg-card shadow-bloco-sm hover:bg-amarelo hover:text-tinta active:shadow-none motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px]',
            )}
          >
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.06em] uppercase">
              <Forma {...FORMA_TIPO[t]} cor={ativo ? 'papel' : 'tinta'} className="size-3.5" />
              {ROTULO_ESCOLHA[t]}
            </span>
            <span className={cn('text-[0.8125rem] leading-snug', ativo ? 'text-background/85' : 'text-muted-foreground dark:group-hover:text-tinta/80')}>
              {EXPLICACAO_TIPO[t]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function CampoDia({
  id,
  rotulo,
  valor,
  onChange,
  erro,
}: {
  id: string
  rotulo: string
  valor: string
  onChange: (valor: string) => void
  erro?: string
}) {
  return (
    <Field data-invalid={!!erro || undefined}>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={31}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!erro || undefined}
        className={cn(CAMPO, 'tabular-nums')}
      />
      <FieldError>{erro}</FieldError>
    </Field>
  )
}
