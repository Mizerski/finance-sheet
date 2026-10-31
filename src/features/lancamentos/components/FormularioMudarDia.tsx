import { useMemo, useState, type FormEvent } from 'react'
import { useVisao } from '@/features/caixas/hooks/useVisao'
import { lancamentosNoDia, type LancamentoDoDia } from '@/features/projecao/utils/projecao'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarDiaMes, somarDias, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, RODAPE_DIALOG, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'
import { useFinancas } from '@/store/context/financas-context'
import { moverDoDia } from '../utils/excecoes'

interface FormularioMudarDiaProps {
  /** O dia da planilha de onde os lançamentos saem. */
  data: DataISO
  hoje: DataISO
  /** Já vem marcado (o item em que a pessoa clicou); sem ele, nada marcado. */
  marcado?: { lancamentoId: string; de: DataISO }
  onConcluir: () => void
}

/** Uma vez de um lançamento no dia: `de` é a data original (a do próprio dia, se não veio de outro). */
interface ItemDoDia {
  chave: string
  lancamento: LancamentoDoDia
  de: DataISO
}

const chaveDe = (lancamentoId: string, de: DataISO) => `${lancamentoId}|${de}`

/**
 * Leva para outro dia o que aconteceu antes (ou depois) do previsto: marca quais e escolhe o dia.
 * No recorrente, muda só esta vez; o único muda de data.
 */
export function FormularioMudarDia({ data, hoje, marcado, onConcluir }: FormularioMudarDiaProps) {
  const { estado, dispatch } = useFinancas()
  const { lancamentos } = useVisao()
  const itens = useMemo<ItemDoDia[]>(
    () =>
      lancamentosNoDia(lancamentos, data).map((l) => {
        const de = l.movidaDe ?? data
        return { chave: chaveDe(l.id, de), lancamento: l, de }
      }),
    [lancamentos, data],
  )
  const [marcados, setMarcados] = useState<Set<string>>(
    () => new Set(marcado ? [chaveDe(marcado.lancamentoId, marcado.de)] : []),
  )
  const [para, setPara] = useState<DataISO | undefined>(data !== hoje ? hoje : undefined)

  const todos = itens.length > 0 && itens.every((i) => marcados.has(i.chave))
  const algum = itens.some((i) => marcados.has(i.chave))
  const escolhidos = itens.filter((i) => marcados.has(i.chave))
  const pode = !!para && para !== data && escolhidos.length > 0

  function alternar(chave: string, marcar: boolean) {
    setMarcados((atual) => {
      const novo = new Set(atual)
      if (marcar) novo.add(chave)
      else novo.delete(chave)
      return novo
    })
  }

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (!pode) return
    const vezes = escolhidos.map(({ lancamento, de }) => ({ lancamentoId: lancamento.id, de }))
    const { alterados } = moverDoDia(estado.lancamentos, vezes, para)
    dispatch({ tipo: 'lancamento/salvarVarios', lancamentos: alterados })
    onConcluir()
  }

  const atalhos = [
    { rotulo: 'Hoje', valor: hoje },
    { rotulo: 'Ontem', valor: somarDias(hoje, -1) },
  ].filter((a) => a.valor !== data)

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="mudar-para">Aconteceu em que dia?</FieldLabel>
        <div className="flex flex-wrap items-center gap-2">
          {atalhos.map((a) => (
            <Button
              key={a.valor}
              type="button"
              variant="outline"
              aria-pressed={para === a.valor}
              className={cn(BOTAO, 'px-3', para === a.valor && 'translate-0.5 bg-foreground text-background shadow-none hover:text-background')}
              onClick={() => setPara(a.valor)}
            >
              {a.rotulo}
            </Button>
          ))}
          <div className="min-w-40 flex-1">
            <SeletorData id="mudar-para" valor={para} onChange={setPara} mesInicial={data} placeholder="Outro dia" />
          </div>
        </div>
        {para === data && <FieldDescription>Escolha um dia diferente de {formatarDiaMes(data)}.</FieldDescription>}
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[0.7rem] leading-snug font-semibold tracking-[0.08em] uppercase">O que mudou de dia?</legend>
        <label className="flex cursor-pointer items-center gap-2.5 border-b-2 border-contorno pb-2">
          <Checkbox
            checked={todos ? true : algum ? 'indeterminate' : false}
            onCheckedChange={() => setMarcados(todos ? new Set() : new Set(itens.map((i) => i.chave)))}
          />
          <span className={ROTULO}>Todos deste dia</span>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {escolhidos.length} de {itens.length}
          </span>
        </label>
        <ul className="-mx-1 flex max-h-64 flex-col overflow-y-auto overscroll-contain">
          {itens.map((i) => (
            <LinhaItem key={i.chave} item={i} data={data} marcado={marcados.has(i.chave)} onMarcar={(m) => alternar(i.chave, m)} />
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Nos que se repetem, muda só esta vez: as próximas continuam no dia de sempre.
        </p>
      </fieldset>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO} disabled={!pode}>
          {pode
            ? `Levar ${escolhidos.length === 1 ? '1' : escolhidos.length} para ${formatarDiaMes(para)}`
            : 'Levar para o dia'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Uma linha da lista: checkbox, nome e valor na cor do tipo; o que já veio de outro dia diz de qual. */
function LinhaItem({
  item: { lancamento: l, de },
  data,
  marcado,
  onMarcar,
}: {
  item: ItemDoDia
  data: DataISO
  marcado: boolean
  onMarcar: (marcado: boolean) => void
}) {
  const sinal = l.tipo === 'entrada' ? '+' : l.tipo === 'saida' ? '−' : ''
  const cor = l.tipo === 'entrada' ? 'text-entrada' : l.tipo === 'saida' ? 'text-saida' : 'text-foreground'
  return (
    <li>
      <label
        className={cn(
          'flex cursor-pointer items-start gap-2.5 px-1 py-1.5 transition-colors hover:bg-selecao-forte',
          marcado && 'bg-selecao',
        )}
      >
        <Checkbox className="mt-0.5" checked={marcado} onCheckedChange={(m) => onMarcar(m === true)} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{l.descricao}</span>
          <span className="text-xs text-muted-foreground">
            {l.recorrencia.tipo === 'unica' ? 'Uma vez' : 'Se repete'}
            {de !== data && ` · era dia ${formatarDiaMes(de)}`}
          </span>
        </span>
        <span className={cn('shrink-0 text-sm tabular-nums', cor)}>
          {sinal} {formatarBRL(l.valorCentavos)}
        </span>
      </label>
    </li>
  )
}
