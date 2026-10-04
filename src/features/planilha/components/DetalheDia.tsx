import { Link } from '@tanstack/react-router'
import { Pencil, PiggyBank, Plus, Trash2 } from 'lucide-react'
import { CATEGORIA_DESCONHECIDA, type Categoria } from '@/features/categorias/categoria'
import type { Aporte } from '@/features/economias/aportes'
import type { DiaProjetado, Ocorrencia } from '@/features/projecao/projecao'
import { SeloRisco } from '@/features/risco/components/SeloRisco'
import { NIVEL, type NivelRisco } from '@/features/risco/risco'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarData, nomeDoDiaDaSemana } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { PopoverDescription, PopoverHeader, PopoverTitle } from '@/shared/ui/popover'

interface DetalheDiaProps {
  dia: DiaProjetado
  categorias: Map<string, Categoria>
  /** Abre a edição do lançamento que gerou a ocorrência. */
  onEditar: (lancamentoId: string) => void
  /** Pede a confirmação para excluir o lançamento que gerou a ocorrência. */
  onExcluir: (lancamentoId: string) => void
  /** Abre um lançamento novo já com a data deste dia. */
  onAdicionar: () => void
  /** Risco do caixa no dia; null sem risco (benefício, dia fora do cálculo). */
  nivel?: NivelRisco | null
}

/** Conteúdo do popover: lançamentos de um dia da planilha. */
export function DetalheDia({ dia, categorias, onEditar, onExcluir, onAdicionar, nivel = null }: DetalheDiaProps) {
  const quantidade = dia.ocorrencias.length + dia.aportes.length

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
      ) : dia.ocorrencias.length === 0 && dia.aportes.length === 0 ? (
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
              onEditar={() => onEditar(o.lancamentoId)}
              onExcluir={() => onExcluir(o.lancamentoId)}
            />
          ))}
          {dia.aportes.map((a) => (
            <ItemAporte key={a.metaId} aporte={a} />
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
          <Plus aria-hidden className="size-4" />
          Adicionar lançamento
        </Button>
      )}
    </>
  )
}

/** Aporte de uma meta: leva à tela Economias, onde a meta é editada. */
function ItemAporte({ aporte }: { aporte: Aporte }) {
  return (
    <li className="group/item flex items-start transition-colors hover:bg-selecao-forte">
      <Link
        to="/economias"
        className="flex min-w-0 flex-1 items-start justify-between gap-3 py-1.5 pl-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-semibold">{aporte.nome}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PiggyBank aria-hidden className="size-3.5 text-economia" />
            Meta de economia{aporte.ajustado && ' · valor ajustado'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Pencil
            aria-hidden
            className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
          />
          <span className="text-economia tabular-nums">− {formatarBRL(aporte.valorCentavos)}</span>
        </span>
      </Link>
      {/* Aporte não se exclui aqui (é da meta); o espaço mantém os valores alinhados com os lançamentos. */}
      <span aria-hidden className="mx-0.5 size-7 shrink-0" />
    </li>
  )
}

function ItemOcorrencia({
  ocorrencia,
  categoria,
  onEditar,
  onExcluir,
}: {
  ocorrencia: Ocorrencia
  categoria: Pick<Categoria, 'nome' | 'cor'>
  onEditar: () => void
  onExcluir: () => void
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
            className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
          />
          <span className={cn('tabular-nums', entrada ? 'text-entrada' : 'text-saida')}>
            {entrada ? '+' : '−'} {formatarBRL(ocorrencia.valorCentavos)}
          </span>
        </span>
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="mx-0.5 mt-0.5 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
        onClick={onExcluir}
        aria-label={`Excluir ${ocorrencia.descricao}`}
        title="Excluir lançamento"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  )
}
