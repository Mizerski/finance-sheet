import { useState, type FormEvent } from 'react'
import { Trash2 } from '@/shared/ui/icones'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarData, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMADA, ROTULO, RODAPE_DIALOG, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { useFinancas } from '@/store/context/financas-context'
import { guardadoNaMeta, resgatesDaMeta } from '../utils/aportes'
import { temAlvo, type MetaEconomia } from '../model/meta'

interface DialogResgateProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** A meta escolhida; o diálogo lê a versão atual dela no estado (a lista de resgates muda aqui dentro). */
  metaId?: string
  hoje: DataISO
}

/** Tira dinheiro da meta para usar: ele volta para o disponível da conta (ou da outra conta para ela). */
export function DialogResgate({ aberto, onOpenChange, metaId, hoje }: DialogResgateProps) {
  const { estado } = useFinancas()
  const meta = estado.metas.find((m) => m.id === metaId)
  const origem = estado.caixas.find((c) => c.id === meta?.caixaId)?.nome
  const destino = estado.caixas.find((c) => c.id === meta?.destinoId)?.nome

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-md')}
      >
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>Usar dinheiro da meta</DialogTitle>
          <DialogDescription>
            {destino
              ? `O valor sai de ${destino} e volta para ${origem ?? 'a conta de origem'}, no dia escolhido.`
              : 'O valor sai da meta e volta para o disponível da conta, no dia escolhido.'}
          </DialogDescription>
        </DialogHeader>
        {meta && <FormularioResgate key={meta.id} meta={meta} hoje={hoje} onConcluir={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

type Depois = 'continuar' | 'parar'
const OPCOES_DEPOIS = [
  { valor: 'continuar' as const, rotulo: 'Continuar guardando' },
  { valor: 'parar' as const, rotulo: 'Parar esta meta' },
]

function FormularioResgate({ meta, hoje, onConcluir }: { meta: MetaEconomia; hoje: DataISO; onConcluir: () => void }) {
  const { dispatch } = useFinancas()
  const [centavos, setCentavos] = useState(0)
  const [data, setData] = useState<DataISO>(hoje < meta.inicio ? meta.inicio : hoje)
  const [depois, setDepois] = useState<Depois>('continuar')
  const [tentouSalvar, setTentouSalvar] = useState(false)

  const naMeta = guardadoNaMeta(meta, data)
  const encerrada = !!meta.encerradaEm && meta.encerradaEm <= data
  const feitos = resgatesDaMeta(meta)

  function validar(): Partial<Record<'valor' | 'data', string>> {
    const erros: Partial<Record<'valor' | 'data', string>> = {}
    if (data < meta.inicio) erros.data = `A meta começa em ${formatarData(meta.inicio)}.`
    if (centavos <= 0) erros.valor = 'Informe quanto vai usar.'
    else if (centavos > naMeta) erros.valor = `Em ${formatarData(data)}, a meta tem ${formatarBRL(naMeta)}.`
    return erros
  }
  const erros = tentouSalvar ? validar() : {}

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (Object.keys(validar()).length > 0) {
      setTentouSalvar(true)
      return
    }
    const resgate = { id: crypto.randomUUID(), data, valorCentavos: centavos }
    dispatch({
      tipo: 'meta/salvar',
      meta: {
        ...meta,
        resgates: [...(meta.resgates ?? []), resgate],
        ...(depois === 'parar' && !encerrada && { encerradaEm: data }),
      },
    })
    onConcluir()
  }

  function excluirResgate(id: string) {
    const resgates = (meta.resgates ?? []).filter((r) => r.id !== id)
    const { resgates: _antigos, ...semResgates } = meta
    dispatch({ tipo: 'meta/salvar', meta: resgates.length ? { ...meta, resgates } : semResgates })
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!erros.valor || undefined}>
          <FieldLabel htmlFor="resgate-valor">Quanto vai usar</FieldLabel>
          <CampoDinheiro
            id="resgate-valor"
            autoFocus
            centavos={centavos}
            onChange={setCentavos}
            aria-invalid={!!erros.valor || undefined}
          />
          {erros.valor ? (
            <FieldError>{erros.valor}</FieldError>
          ) : (
            naMeta > 0 && (
              <FieldDescription>
                Na meta em {formatarData(data)}: {formatarBRL(naMeta)}.{' '}
                <button
                  type="button"
                  onClick={() => setCentavos(naMeta)}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Usar tudo
                </button>
              </FieldDescription>
            )
          )}
        </Field>
        <Field data-invalid={!!erros.data || undefined}>
          <FieldLabel htmlFor="resgate-data">Quando</FieldLabel>
          <SeletorData id="resgate-data" valor={data} onChange={(d) => d && setData(d)} invalido={!!erros.data} />
          {erros.data ? (
            <FieldError>{erros.data}</FieldError>
          ) : (
            <FieldDescription>Pode ser no futuro, como o dia de uma viagem.</FieldDescription>
          )}
        </Field>
      </div>

      {!encerrada && (
        <Field>
          <FieldLabel htmlFor="resgate-depois">Depois disso</FieldLabel>
          <ControleSegmentado
            id="resgate-depois"
            rotulo="Depois disso"
            valor={depois}
            opcoes={OPCOES_DEPOIS}
            onChange={setDepois}
          />
          <FieldDescription>
            {depois === 'parar'
              ? 'A meta não guarda mais depois desse dia. O que já aconteceu continua na planilha.'
              : temAlvo(meta)
                ? 'A meta volta a guardar todo mês até completar de novo.'
                : 'A meta continua guardando todo mês.'}
          </FieldDescription>
        </Field>
      )}

      {feitos.length > 0 && (
        <section aria-label="Dinheiro já usado" className="flex flex-col gap-1 border-t-2 border-contorno pt-3">
          <h3 className={ROTULO}>Já usado</h3>
          <ul className="flex flex-col">
            {feitos.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 border-b border-border py-1 last:border-b-0">
                <span className="text-sm tabular-nums">{formatarData(r.data)}</span>
                <span className="flex items-center gap-1">
                  <span className="text-sm font-semibold tabular-nums">{formatarBRL(r.valorCentavos)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => excluirResgate(r.id)}
                    aria-label={`Desfazer o uso de ${formatarBRL(r.valorCentavos)} em ${formatarData(r.data)}`}
                    title="Desfazer"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO}>
          Usar dinheiro
        </Button>
      </DialogFooter>
    </form>
  )
}
