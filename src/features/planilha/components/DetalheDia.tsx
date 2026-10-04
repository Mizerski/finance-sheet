import { Link } from '@tanstack/react-router'
import { ArrowLeftRight, CalendarDays, Pencil, PiggyBank, Plus, Trash2, Undo2 } from '@/shared/ui/icones'
import { useVisao } from '@/features/caixas/useVisao'
import { CATEGORIA_DESCONHECIDA, type Categoria } from '@/features/categorias/categoria'
import type { Aporte } from '@/features/economias/aportes'
import { semExcecaoNoDia } from '@/features/lancamentos/excecoes'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import { ocorreEm, type DiaProjetado, type MovimentoTransferencia, type Ocorrencia } from '@/features/projecao/projecao'
import { SeloRisco } from '@/features/risco/components/SeloRisco'
import { NIVEL, type NivelRisco } from '@/features/risco/risco'
import { PontoCor } from '@/shared/components/PontoCor'
import { deDataISO, diaDoCalendario, formatarData, nomeDoDiaDaSemana, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { PopoverDescription, PopoverHeader, PopoverTitle } from '@/shared/ui/popover'
import { useFinancas } from '@/store/financas-context'

interface DetalheDiaProps {
  dia: DiaProjetado
  categorias: Map<string, Categoria>
  /** Abre a edição do lançamento que gerou a ocorrência. */
  onEditar: (lancamentoId: string) => void
  /** Pede a confirmação para excluir o lançamento que gerou a ocorrência. */
  onExcluir: (lancamentoId: string) => void
  /** Recorrente: muda o valor só neste dia (ou pula o dia). */
  onMudarDia: (lancamentoId: string) => void
  /** Abre um lançamento novo já com a data deste dia. */
  onAdicionar: () => void
  /** Risco do caixa no dia; null sem risco (benefício, dia fora do cálculo). */
  nivel?: NivelRisco | null
}

/** Conteúdo do popover: lançamentos de um dia da planilha. */
export function DetalheDia({ dia, categorias, onEditar, onExcluir, onMudarDia, onAdicionar, nivel = null }: DetalheDiaProps) {
  const { lancamentos } = useVisao()
  const porId = new Map(lancamentos.map((l) => [l.id, l]))
  // Recorrentes pulados neste dia: não entram na projeção, mas aparecem aqui para poder voltar.
  const calendario = diaDoCalendario(deDataISO(dia.data))
  const pulados = lancamentos.filter((l) => l.excecoes?.[dia.data] === 0 && ocorreEm(l, calendario))
  const quantidade = dia.ocorrencias.length + dia.transferencias.length + dia.aportes.length + pulados.length
  /** Só o recorrente muda num dia; o único se edita inteiro. */
  const mudarDia = (id: string) => {
    const l = porId.get(id)
    return l && l.recorrencia.tipo !== 'unica' ? () => onMudarDia(id) : undefined
  }

  return (
    <>
      <PopoverHeader className="shrink-0">
        <PopoverTitle className="first-letter:uppercase">
          {nomeDoDiaDaSemana(dia.diaDaSemana, 'longo')}, {formatarData(dia.data)}
        </PopoverTitle>
        {/* Num dia cheio, a lista rola: a contagem diz quanto há embaixo. */}
        {quantidade > 5 && (
          <PopoverDescription className="text-xs tabular-nums">{quantidade} lançamentos neste dia</PopoverDescription>
        )}
      </PopoverHeader>

      {!dia.noCalculo ? (
        <p className="text-muted-foreground">Antes da data do saldo inicial, fora do cálculo.</p>
      ) : quantidade === 0 ? (
        <p className="text-muted-foreground">Nenhum lançamento neste dia.</p>
      ) : (
        // A lista é a única parte que encolhe e rola; título, saldo e o botão de adicionar continuam à vista.
        <ul
          className={cn(
            '-mx-2 flex flex-col overflow-y-auto overscroll-contain',
            quantidade > 3 && 'min-h-24 border-y border-border',
          )}
        >
          {dia.ocorrencias.map((o) => (
            <ItemOcorrencia
              key={o.lancamentoId}
              ocorrencia={o}
              categoria={categorias.get(o.categoriaId) ?? CATEGORIA_DESCONHECIDA}
              normal={normalDoDia(porId.get(o.lancamentoId), dia.data)}
              onEditar={() => onEditar(o.lancamentoId)}
              onExcluir={() => onExcluir(o.lancamentoId)}
              onMudarDia={mudarDia(o.lancamentoId)}
            />
          ))}
          {dia.transferencias.map((m) =>
            m.metaId ? (
              <ItemMetaDeOutraConta key={`${m.metaId}-${m.sentido}`} movimento={m} />
            ) : (
              <ItemTransferencia
                key={m.lancamentoId}
                movimento={m}
                normal={normalDoDia(porId.get(m.lancamentoId), dia.data)}
                onEditar={() => onEditar(m.lancamentoId)}
                onExcluir={() => onExcluir(m.lancamentoId)}
                onMudarDia={mudarDia(m.lancamentoId)}
              />
            ),
          )}
          {dia.aportes.map((a) => (
            <ItemAporte key={a.resgateId ?? a.metaId} aporte={a} />
          ))}
          {pulados.map((l) => (
            <ItemPulado key={l.id} lancamento={l} data={dia.data} />
          ))}
        </ul>
      )}

      {dia.saldoCentavos !== null && (
        <div className="flex shrink-0 justify-between border-t-2 border-contorno pt-3 font-semibold">
          <span>Saldo do dia</span>
          <span className={cn('tabular-nums', VALOR_SALDO, dia.saldoCentavos < 0 && 'text-negativo')}>
            {formatarBRL(dia.saldoCentavos)}
          </span>
        </div>
      )}

      {nivel && (
        <p
          className="flex shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground"
          title={NIVEL[nivel].significado}
        >
          Caixa no dia: <SeloRisco nivel={nivel} />{' '}
          {/* Num dia cheio, o significado vira dica, para sobrar altura para a lista. */}
          {quantidade > 5 ? <span className="sr-only">{NIVEL[nivel].significado}</span> : <span>{NIVEL[nivel].significado}</span>}
        </p>
      )}

      {dia.noCalculo && (
        <Button variant="outline" className={cn(BOTAO, 'mt-1 w-full shrink-0')} onClick={onAdicionar}>
          <Plus aria-hidden className="size-6" />
          Adicionar lançamento
        </Button>
      )}
    </>
  )
}

/** Valor normal de um recorrente quando neste dia ele tem outro; undefined se o dia está no valor normal. */
function normalDoDia(l: Lancamento | undefined, data: DataISO): number | undefined {
  return l?.excecoes?.[data] !== undefined ? l.valorCentavos : undefined
}

/** Valor do item; quando foi mudado só neste dia, com o normal embaixo, em letra pequena. */
function ValorDoItem({ texto, normal, className }: { texto: string; normal?: number; className?: string }) {
  return (
    <span className="flex flex-col items-end">
      <span className={cn('tabular-nums', className)}>{texto}</span>
      {normal !== undefined && (
        <span className="flex flex-col items-end text-[0.65rem] whitespace-nowrap text-muted-foreground tabular-nums">
          <span>só neste dia</span>
          <span>normal {formatarBRL(normal)}</span>
        </span>
      )}
    </span>
  )
}

/** Botões da direita do item: mudar só neste dia (recorrente) e excluir. */
function AcoesItem({
  descricao,
  tituloExcluir,
  onMudarDia,
  onExcluir,
}: {
  descricao: string
  tituloExcluir: string
  onMudarDia?: () => void
  onExcluir: () => void
}) {
  return (
    <span className="mx-0.5 mt-0.5 flex shrink-0">
      {onMudarDia && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-muted-foreground"
          onClick={onMudarDia}
          aria-label={`Mudar só neste dia: ${descricao}`}
          title="Mudar só neste dia"
        >
          <CalendarDays className="size-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full text-muted-foreground hover:text-destructive"
        onClick={onExcluir}
        aria-label={`Excluir ${descricao}`}
        title={tituloExcluir}
      >
        <Trash2 className="size-3" />
      </Button>
    </span>
  )
}

/** Recorrente pulado neste dia: valor riscado e o botão de voltar ao normal. */
function ItemPulado({ lancamento: l, data }: { lancamento: Lancamento; data: DataISO }) {
  const { dispatch } = useFinancas()
  return (
    <li className="flex items-start text-muted-foreground">
      <span className="flex min-w-0 flex-1 items-start justify-between gap-3 py-1.5 pl-2">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-semibold">{l.descricao}</span>
          <span className="text-xs">Pulado neste dia</span>
        </span>
        <span className="shrink-0 tabular-nums line-through">{formatarBRL(l.valorCentavos)}</span>
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="mx-0.5 mt-0.5 shrink-0 rounded-full text-muted-foreground"
        onClick={() => dispatch({ tipo: 'lancamento/salvar', lancamento: semExcecaoNoDia(l, data) })}
        aria-label={`Voltar ${l.descricao} neste dia`}
        title="Voltar neste dia"
      >
        <Undo2 className="size-3" />
      </Button>
    </li>
  )
}

/** Aporte (ou dinheiro usado) de uma meta: leva à tela Economias, onde a meta é editada. */
function ItemAporte({ aporte }: { aporte: Aporte }) {
  const usado = !!aporte.resgateId
  return (
    <li className="group/item flex items-start transition-colors hover:bg-selecao-forte">
      <Link
        to="/economias"
        className="flex min-w-0 flex-1 items-start justify-between gap-3 py-1.5 pl-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-semibold">{aporte.nome}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PiggyBank aria-hidden className="size-3 text-economia" />
            {usado ? 'Dinheiro usado da meta' : `Meta de economia${aporte.ajustado ? ' · valor ajustado' : ''}`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Pencil
            aria-hidden
            className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
          />
          <span className="text-economia tabular-nums">
            {usado ? '+' : '−'} {formatarBRL(Math.abs(aporte.valorCentavos))}
          </span>
        </span>
      </Link>
      {/* Aporte não se exclui aqui (é da meta); o espaço mantém os valores alinhados com os lançamentos. */}
      <span aria-hidden className="mx-0.5 size-7 shrink-0" />
    </li>
  )
}

/** Transferência entre contas: entra ou sai da conta, mas não é entrada nem gasto (valor em preto). */
function ItemTransferencia({
  movimento: m,
  normal,
  onEditar,
  onExcluir,
  onMudarDia,
}: {
  movimento: MovimentoTransferencia
  normal?: number
  onEditar: () => void
  onExcluir: () => void
  onMudarDia?: () => void
}) {
  const { estado } = useFinancas()
  const outro = estado.caixas.find((c) => c.id === m.outroCaixaId)?.nome ?? 'outra conta'
  const entrada = m.sentido === 'entrada'

  return (
    <li className="group/item flex items-start transition-colors hover:bg-selecao-forte">
      <button
        type="button"
        onClick={onEditar}
        className="flex min-w-0 flex-1 items-start justify-between gap-3 py-1.5 pl-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-semibold">
            <span className="sr-only">Editar </span>
            {m.descricao}
          </span>
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowLeftRight aria-hidden className="size-3 text-foreground" />
            {entrada ? `Transferência de ${outro}` : `Transferência para ${outro}`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Pencil
            aria-hidden
            className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
          />
          <ValorDoItem texto={`${entrada ? '+' : '−'} ${formatarBRL(m.valorCentavos)}`} normal={normal} />
        </span>
      </button>
      <AcoesItem descricao={m.descricao} tituloExcluir="Excluir transferência" onMudarDia={onMudarDia} onExcluir={onExcluir} />
    </li>
  )
}

/** Meta de outra conta que manda o dinheiro para esta: o aporte chega e o dinheiro usado sai. Edita em Economias. */
function ItemMetaDeOutraConta({ movimento: m }: { movimento: MovimentoTransferencia }) {
  const { estado } = useFinancas()
  const outra = estado.caixas.find((c) => c.id === m.outroCaixaId)?.nome ?? 'outra conta'
  const entrada = m.sentido === 'entrada'

  return (
    <li className="group/item flex items-start transition-colors hover:bg-selecao-forte">
      <Link
        to="/economias"
        className="flex min-w-0 flex-1 items-start justify-between gap-3 py-1.5 pl-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-semibold">{m.descricao}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PiggyBank aria-hidden className="size-3 text-economia" />
            {entrada ? `Meta de economia, de ${outra}` : `Dinheiro usado, volta para ${outra}`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Pencil
            aria-hidden
            className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
          />
          <span className="tabular-nums">
            {entrada ? '+' : '−'} {formatarBRL(m.valorCentavos)}
          </span>
        </span>
      </Link>
      <span aria-hidden className="mx-0.5 size-7 shrink-0" />
    </li>
  )
}

function ItemOcorrencia({
  ocorrencia,
  categoria,
  normal,
  onEditar,
  onExcluir,
  onMudarDia,
}: {
  ocorrencia: Ocorrencia
  categoria: Pick<Categoria, 'nome' | 'cor'>
  normal?: number
  onEditar: () => void
  onExcluir: () => void
  onMudarDia?: () => void
}) {
  const entrada = ocorrencia.tipo === 'entrada'

  return (
    // O véu do hover fica no item todo, para a lixeira fazer parte da mesma linha.
    <li className="group/item flex items-start transition-colors hover:bg-selecao-forte">
      <button
        type="button"
        onClick={onEditar}
        className="flex min-w-0 flex-1 items-start justify-between gap-3 py-1.5 pl-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-semibold">
            <span className="sr-only">Editar </span>
            {ocorrencia.descricao}
          </span>
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <PontoCor cor={categoria.cor} />
            {categoria.nome}
            {!entrada && (
              <Badge variant="outline" className="h-4 px-1 text-[0.6rem]">
                {ocorrencia.natureza === 'fixa' ? 'fixa' : 'variável'}
              </Badge>
            )}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {/* Lápis só no hover/foco: indica que o item abre a edição. */}
          <Pencil
            aria-hidden
            className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
          />
          <ValorDoItem
            texto={`${entrada ? '+' : '−'} ${formatarBRL(ocorrencia.valorCentavos)}`}
            normal={normal}
            className={entrada ? 'text-entrada' : 'text-saida'}
          />
        </span>
      </button>
      <AcoesItem
        descricao={ocorrencia.descricao}
        tituloExcluir="Excluir lançamento"
        onMudarDia={onMudarDia}
        onExcluir={onExcluir}
      />
    </li>
  )
}
