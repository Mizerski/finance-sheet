import { useState, type FormEvent } from 'react'
import { caixasAtivos, ehContaCorrente, ehInvestimento, type Caixa } from '@/features/caixas/model/caixa'
import { CampoCaixa } from '@/features/caixas/components/CampoCaixa'
import { useVisao } from '@/features/caixas/hooks/useVisao'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarMesAno, paraDataISO, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMPO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { useFinancas } from '@/store/context/financas-context'
import { aporteParaOPrazo, resumirMeta } from '../utils/aportes'
import type { MetaEconomia } from '../model/meta'
import { contaDeInvestimentoDaMeta, saldoProprioDaConta } from '../utils/na-conta'
import { useAvaliacaoMeta } from '../hooks/useAvaliacaoMeta'
import { DiagnosticoMeta } from './DiagnosticoMeta'

/** Valores que o formulário já abre preenchidos (ex.: a reserva de emergência sugerida). */
export type SugestaoMeta = Partial<Pick<MetaEconomia, 'nome' | 'valorAlvoCentavos' | 'aporteMensalCentavos'>>

interface FormularioMetaProps {
  /** Ausente = nova meta. */
  meta?: MetaEconomia
  /** Sobrepõe os valores da meta (ou os padrões, numa meta nova). */
  sugestao?: SugestaoMeta
  onConcluir: () => void
}

type Erros = Partial<Record<'nome' | 'destino' | 'jaGuardado' | 'aporte' | 'dia' | 'inicio' | 'prazo', string>>

type Onde = 'conta' | 'outra'
const OPCOES_ONDE = [
  { valor: 'conta' as const, rotulo: 'Separado na conta' },
  { valor: 'outra' as const, rotulo: 'Em outra conta' },
]
const ehConta = (c: Caixa) => c.tipo === 'conta'

/**
 * Com uma conta só, o dinheiro fica separado nela. Com uma conta de investimento como destino, o saldo dela conta
 * como guardado.
 */
export function FormularioMeta({ meta, sugestao, onConcluir }: FormularioMetaProps) {
  const { estado, dispatch } = useFinancas()
  const { contaPadrao } = useVisao()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const [caixaId, setCaixaId] = useState(meta?.caixaId ?? contaPadrao?.id ?? '')
  const [onde, setOnde] = useState<Onde>(meta?.destinoId ? 'outra' : 'conta')
  const [destinoId, setDestinoId] = useState(meta?.destinoId ?? '')
  const variasContas = caixasAtivos(estado.caixas).filter(ehConta).length >= 2 || !!meta?.destinoId
  const comDestino = onde === 'outra' && !!destinoId && destinoId !== caixaId
  const investimento = comDestino ? contaDeInvestimentoDaMeta({ destinoId }, estado.caixas) : undefined
  const naConta = investimento ? saldoProprioDaConta(investimento, estado.lancamentos, hoje) : null
  /** Investimento que já é o destino de outra meta: cada conta de investimento fica com uma meta só. */
  const ocupado = (c: Caixa) => ehInvestimento(c) && estado.metas.some((m) => m.destinoId === c.id && m.id !== meta?.id)
  const [nome, setNome] = useState(sugestao?.nome ?? meta?.nome ?? '')
  const [alvo, setAlvo] = useState(sugestao?.valorAlvoCentavos ?? meta?.valorAlvoCentavos ?? 0)
  const [aporte, setAporte] = useState(sugestao?.aporteMensalCentavos ?? meta?.aporteMensalCentavos ?? 0)
  const [jaGuardado, setJaGuardado] = useState(meta?.jaGuardadoCentavos ?? 0)
  const [dia, setDia] = useState(String(meta?.diaDoMes ?? Number(hoje.slice(8, 10))))
  const [inicio, setInicio] = useState<DataISO | undefined>(meta?.inicio ?? hoje)
  const [prazo, setPrazo] = useState<DataISO | undefined>(meta?.prazo)
  const [tentouSalvar, setTentouSalvar] = useState(false)

  const diaDoMes = Number(dia)
  const diaValido = Number.isInteger(diaDoMes) && diaDoMes >= 1 && diaDoMes <= 31

  const rascunho: MetaEconomia | null =
    diaValido && inicio
      ? {
          id: meta?.id ?? '',
          caixaId,
          ...(comDestino && { destinoId }),
          nome: '',
          ...(alvo > 0 && { valorAlvoCentavos: alvo }),
          aporteMensalCentavos: aporte,
          ...(naConta !== null ? { naContaCentavos: naConta } : jaGuardado > 0 && { jaGuardadoCentavos: jaGuardado }),
          diaDoMes,
          inicio,
          ...(prazo && { prazo }),
          ajustes: meta?.ajustes ?? {},
          ...(meta?.resgates && { resgates: meta.resgates }),
          ...(meta?.encerradaEm && { encerradaEm: meta.encerradaEm }),
        }
      : null

  const avaliacao = useAvaliacaoMeta(rascunho, hoje)

  function validar(): Erros {
    const erros: Erros = {}
    if (!nome.trim()) erros.nome = 'Informe um nome.'
    if (onde === 'outra' && !comDestino) erros.destino = 'Escolha a conta que recebe o dinheiro.'
    if (alvo > 0 && (naConta ?? jaGuardado) >= alvo) {
      erros.jaGuardado = naConta !== null ? 'A conta já tem o valor que quer juntar.' : 'Já passa do valor que quer juntar.'
    }
    if (aporte <= 0) erros.aporte = 'Informe quanto guardar por mês.'
    if (!diaValido) erros.dia = 'Use um dia de 1 a 31.'
    if (!inicio) erros.inicio = 'Escolha a data do primeiro aporte.'
    if (prazo && alvo <= 0) erros.prazo = 'Para ter prazo, diga quanto quer juntar.'
    else if (prazo && inicio && prazo < inicio) erros.prazo = 'O prazo precisa ser depois do início.'
    else if (rascunho?.prazo && aporteParaOPrazo(rascunho) === null) erros.prazo = 'Não há dia de aporte até essa data.'
    return erros
  }
  const erros = tentouSalvar ? validar() : {}

  function montar(): MetaEconomia | null {
    if (Object.keys(validar()).length || !rascunho) return null
    return { ...rascunho, id: meta?.id ?? crypto.randomUUID(), nome: nome.trim() }
  }

  const conclusao = rascunho && aporte > 0 ? resumirMeta(rascunho, hoje).conclusaoNoPlano : null

  function salvar(e: FormEvent) {
    e.preventDefault()
    const pronta = montar()
    if (!pronta) {
      setTentouSalvar(true)
      return
    }
    dispatch({ tipo: 'meta/salvar', meta: pronta })
    onConcluir()
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <Field data-invalid={!!erros.nome || undefined}>
        <FieldLabel htmlFor="meta-nome">Nome</FieldLabel>
        <Input
          id="meta-nome"
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Reserva de emergência"
          aria-invalid={!!erros.nome || undefined}
          className={CAMPO}
        />
        <FieldError>{erros.nome}</FieldError>
      </Field>

      <CampoCaixa
        id="meta-caixa"
        valor={caixaId}
        onChange={(id) => {
          setCaixaId(id)
          if (id === destinoId) setDestinoId('')
        }}
        filtro={ehContaCorrente}
        descricao="Conta de onde sai o dinheiro guardado."
      />

      {variasContas && (
        <Field data-invalid={!!erros.destino || undefined}>
          <FieldLabel htmlFor="meta-onde">Onde fica o dinheiro</FieldLabel>
          <ControleSegmentado
            id="meta-onde"
            rotulo="Onde fica o dinheiro"
            valor={onde}
            opcoes={OPCOES_ONDE}
            onChange={setOnde}
          />
          {onde === 'conta' && <FieldDescription>Sai do disponível, mas continua na conta, separado.</FieldDescription>}
        </Field>
      )}
      {variasContas && onde === 'outra' && (
        <CampoCaixa
          id="meta-destino"
          rotulo="Vai para"
          valor={destinoId}
          onChange={setDestinoId}
          filtro={(c) => ehConta(c) && c.id !== caixaId && !ocupado(c)}
          placeholder="Escolher"
          descricao={
            investimento
              ? `Cada aporte vira uma transferência para lá, e o que ${investimento.nome} já tem (${formatarBRL(naConta ?? 0)} hoje) conta como guardado nesta meta.`
              : 'Cada aporte vira uma transferência para essa conta.'
          }
          erro={erros.destino}
          sempre
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="meta-alvo">
            Quero juntar <span className="font-normal text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <CampoDinheiro id="meta-alvo" centavos={alvo} onChange={setAlvo} />
          {alvo === 0 && <FieldDescription>Sem valor, guarda todo mês, sem fim.</FieldDescription>}
        </Field>
        {naConta !== null ? (
          <Field data-invalid={!!erros.jaGuardado || undefined}>
            <FieldLabel>Já está na conta</FieldLabel>
            <p className="flex h-10 items-center text-sm font-semibold tabular-nums">{formatarBRL(naConta)}</p>
            {erros.jaGuardado ? (
              <FieldError>{erros.jaGuardado}</FieldError>
            ) : (
              <FieldDescription>O saldo de {investimento?.nome}, com rendimentos lançados. Muda sozinho.</FieldDescription>
            )}
          </Field>
        ) : (
          <Field data-invalid={!!erros.jaGuardado || undefined}>
            <FieldLabel htmlFor="meta-ja-guardado">
              Já tenho guardado <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <CampoDinheiro
              id="meta-ja-guardado"
              centavos={jaGuardado}
              onChange={setJaGuardado}
              aria-invalid={!!erros.jaGuardado || undefined}
            />
            {erros.jaGuardado ? (
              <FieldError>{erros.jaGuardado}</FieldError>
            ) : (
              <FieldDescription>Juntado antes, fora do app. Conta para a meta e não mexe no saldo.</FieldDescription>
            )}
          </Field>
        )}
        <Field data-invalid={!!erros.prazo || undefined}>
          <FieldLabel htmlFor="meta-prazo">
            Até quando <span className="font-normal text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <SeletorData
            id="meta-prazo"
            valor={prazo}
            onChange={setPrazo}
            placeholder="Sem prazo"
            opcional
            mesInicial={inicio}
            invalido={!!erros.prazo}
          />
          <FieldError>{erros.prazo}</FieldError>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={!!erros.aporte || undefined}>
          <FieldLabel htmlFor="meta-aporte">Guardar por mês</FieldLabel>
          <CampoDinheiro
            id="meta-aporte"
            centavos={aporte}
            onChange={setAporte}
            aria-invalid={!!erros.aporte || undefined}
          />
          {erros.aporte ? (
            <FieldError>{erros.aporte}</FieldError>
          ) : (
            aporte === 0 && <FieldDescription>Em branco, o app sugere um valor.</FieldDescription>
          )}
        </Field>
        <Field data-invalid={!!erros.dia || undefined}>
          <FieldLabel htmlFor="meta-dia">Dia do aporte</FieldLabel>
          <Input
            id="meta-dia"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            aria-invalid={!!erros.dia || undefined}
            className={cn(CAMPO, 'tabular-nums')}
          />
          <FieldError>{erros.dia}</FieldError>
        </Field>
        <Field data-invalid={!!erros.inicio || undefined}>
          <FieldLabel htmlFor="meta-inicio">A partir de</FieldLabel>
          <SeletorData id="meta-inicio" valor={inicio} onChange={setInicio} invalido={!!erros.inicio} />
          <FieldError>{erros.inicio}</FieldError>
        </Field>
      </div>

      {rascunho && (
        <DiagnosticoMeta rascunho={rascunho} avaliacao={avaliacao} hoje={hoje} onUsarAporte={setAporte} />
      )}

      <FieldDescription>
        O aporte sai do {comDestino ? 'saldo' : 'disponível'} todo mês, na coluna Economia da planilha,{' '}
        {alvo > 0 ? 'e para quando a meta é atingida' : 'sem data para acabar'}. Se o mês não tiver o dia escolhido, vale
        o último dia.
        {conclusao && (
          <>
            {' '}
            Nesse plano, a meta fica completa em <span className="text-foreground">{formatarMesAno(conclusao)}</span>.
          </>
        )}
      </FieldDescription>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO}>
          {meta ? 'Salvar alterações' : 'Criar meta'}
        </Button>
      </DialogFooter>
    </form>
  )
}
