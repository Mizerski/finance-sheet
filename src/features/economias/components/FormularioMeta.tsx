import { useState, type FormEvent } from 'react'
import { caixasAtivos, type Caixa } from '@/features/caixas/caixa'
import { CampoCaixa } from '@/features/caixas/components/CampoCaixa'
import { useVisao } from '@/features/caixas/useVisao'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarMesAno, paraDataISO, type DataISO } from '@/shared/lib/datas'
import { BOTAO, CAMPO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { useFinancas } from '@/store/financas-context'
import { aporteParaOPrazo, resumirMeta } from '../aportes'
import type { MetaEconomia } from '../meta'
import { useAvaliacaoMeta } from '../useAvaliacaoMeta'
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

type Erros = Partial<Record<'nome' | 'destino' | 'aporte' | 'dia' | 'inicio' | 'prazo', string>>

type Onde = 'conta' | 'outra'
const OPCOES_ONDE = [
  { valor: 'conta' as const, rotulo: 'Separado na conta' },
  { valor: 'outra' as const, rotulo: 'Em outra conta' },
]
const ehConta = (c: Caixa) => c.tipo === 'conta'

export function FormularioMeta({ meta, sugestao, onConcluir }: FormularioMetaProps) {
  const { estado, dispatch } = useFinancas()
  const { contaPadrao } = useVisao()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const [caixaId, setCaixaId] = useState(meta?.caixaId ?? contaPadrao?.id ?? '')
  const [onde, setOnde] = useState<Onde>(meta?.destinoId ? 'outra' : 'conta')
  const [destinoId, setDestinoId] = useState(meta?.destinoId ?? '')
  // Com uma conta só, o dinheiro fica separado nela (não há para onde mandar).
  const variasContas = caixasAtivos(estado.caixas).filter(ehConta).length >= 2 || !!meta?.destinoId
  const comDestino = onde === 'outra' && !!destinoId && destinoId !== caixaId
  const [nome, setNome] = useState(sugestao?.nome ?? meta?.nome ?? '')
  const [alvo, setAlvo] = useState(sugestao?.valorAlvoCentavos ?? meta?.valorAlvoCentavos ?? 0)
  const [aporte, setAporte] = useState(sugestao?.aporteMensalCentavos ?? meta?.aporteMensalCentavos ?? 0)
  const [dia, setDia] = useState(String(meta?.diaDoMes ?? Number(hoje.slice(8, 10))))
  const [inicio, setInicio] = useState<DataISO | undefined>(meta?.inicio ?? hoje)
  const [prazo, setPrazo] = useState<DataISO | undefined>(meta?.prazo)
  const [tentouSalvar, setTentouSalvar] = useState(false)

  const diaDoMes = Number(dia)
  const diaValido = Number.isInteger(diaDoMes) && diaDoMes >= 1 && diaDoMes <= 31

  // A meta como está no formulário, para a prévia do término e o diagnóstico (o nome não muda a conta).
  // Sem valor alvo, é um cofrinho: guarda todo mês, sem fim.
  const rascunho: MetaEconomia | null =
    diaValido && inicio
      ? {
          id: meta?.id ?? '',
          caixaId,
          ...(comDestino && { destinoId }),
          nome: '',
          ...(alvo > 0 && { valorAlvoCentavos: alvo }),
          aporteMensalCentavos: aporte,
          diaDoMes,
          inicio,
          ...(prazo && { prazo }),
          // Os valores reais já informados, o dinheiro já usado e o encerramento continuam valendo.
          ajustes: meta?.ajustes ?? {},
          ...(meta?.resgates && { resgates: meta.resgates }),
          ...(meta?.encerradaEm && { encerradaEm: meta.encerradaEm }),
        }
      : null

  // A meta simulada no fluxo projetado, sobre as outras metas.
  const avaliacao = useAvaliacaoMeta(rascunho, hoje)

  function validar(): Erros {
    const erros: Erros = {}
    if (!nome.trim()) erros.nome = 'Informe um nome.'
    if (onde === 'outra' && !comDestino) erros.destino = 'Escolha a conta que recebe o dinheiro.'
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

  // Prévia do término enquanto o formulário é preenchido.
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
        filtro={ehConta}
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
          filtro={(c) => ehConta(c) && c.id !== caixaId}
          placeholder="Escolher"
          descricao="Cada aporte vira uma transferência para essa conta."
          erro={erros.destino}
          sempre
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="meta-alvo">
            Quero juntar <span className="font-normal text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <CampoDinheiro id="meta-alvo" centavos={alvo} onChange={setAlvo} />
          {alvo === 0 && <FieldDescription>Sem valor, guarda todo mês, sem fim.</FieldDescription>}
        </Field>
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
