import { useState, type FormEvent } from 'react'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarMesAno, paraDataISO, type DataISO } from '@/shared/lib/datas'
import { BOTAO, CAMPO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { useFinancas } from '@/store/financas-context'
import { resumirMeta } from '../aportes'
import type { MetaEconomia } from '../meta'

interface FormularioMetaProps {
  /** Ausente = nova meta. */
  meta?: MetaEconomia
  onConcluir: () => void
}

type Erros = Partial<Record<'nome' | 'alvo' | 'aporte' | 'dia' | 'inicio', string>>

export function FormularioMeta({ meta, onConcluir }: FormularioMetaProps) {
  const { dispatch } = useFinancas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const [nome, setNome] = useState(meta?.nome ?? '')
  const [alvo, setAlvo] = useState(meta?.valorAlvoCentavos ?? 0)
  const [aporte, setAporte] = useState(meta?.aporteMensalCentavos ?? 0)
  const [dia, setDia] = useState(String(meta?.diaDoMes ?? Number(hoje.slice(8, 10))))
  const [inicio, setInicio] = useState<DataISO | undefined>(meta?.inicio ?? hoje)
  const [tentouSalvar, setTentouSalvar] = useState(false)

  const diaDoMes = Number(dia)

  function validar(): Erros {
    const erros: Erros = {}
    if (!nome.trim()) erros.nome = 'Informe um nome.'
    if (alvo <= 0) erros.alvo = 'Informe quanto quer juntar.'
    if (aporte <= 0) erros.aporte = 'Informe quanto guardar por mês.'
    if (!Number.isInteger(diaDoMes) || diaDoMes < 1 || diaDoMes > 31) erros.dia = 'Use um dia de 1 a 31.'
    if (!inicio) erros.inicio = 'Escolha a data do primeiro aporte.'
    return erros
  }
  const erros = tentouSalvar ? validar() : {}

  function montar(): MetaEconomia | null {
    if (Object.keys(validar()).length) return null
    return {
      id: meta?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      valorAlvoCentavos: alvo,
      aporteMensalCentavos: aporte,
      diaDoMes,
      inicio: inicio!,
      // Os valores reais já informados continuam valendo.
      ajustes: meta?.ajustes ?? {},
    }
  }

  // Prévia do término enquanto o formulário é preenchido (o nome não muda a conta).
  const diaValido = Number.isInteger(diaDoMes) && diaDoMes >= 1 && diaDoMes <= 31
  const conclusao =
    alvo > 0 && aporte > 0 && diaValido && inicio
      ? resumirMeta(
          {
            id: '',
            nome: '',
            valorAlvoCentavos: alvo,
            aporteMensalCentavos: aporte,
            diaDoMes,
            inicio,
            ajustes: meta?.ajustes ?? {},
          },
          hoje,
        ).conclusaoNoPlano
      : null

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!erros.alvo || undefined}>
          <FieldLabel htmlFor="meta-alvo">Quero juntar</FieldLabel>
          <CampoDinheiro id="meta-alvo" centavos={alvo} onChange={setAlvo} aria-invalid={!!erros.alvo || undefined} />
          <FieldError>{erros.alvo}</FieldError>
        </Field>
        <Field data-invalid={!!erros.aporte || undefined}>
          <FieldLabel htmlFor="meta-aporte">Guardar por mês</FieldLabel>
          <CampoDinheiro
            id="meta-aporte"
            centavos={aporte}
            onChange={setAporte}
            aria-invalid={!!erros.aporte || undefined}
          />
          <FieldError>{erros.aporte}</FieldError>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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

      <FieldDescription>
        O aporte sai do saldo todo mês, na coluna Economia da planilha, e para quando a meta é atingida. Se o mês não
        tiver o dia escolhido, vale o último dia.
        {conclusao && (
          <>
            {' '}
            Nesse plano, a meta fica completa em <span className="text-foreground">{formatarMesAno(conclusao)}</span>.
          </>
        )}
      </FieldDescription>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={cn(BOTAO, 'bg-card')}>
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
