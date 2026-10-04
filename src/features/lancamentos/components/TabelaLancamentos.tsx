import { useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowLeftRight, ArrowUp, ChevronsUpDown, Pencil, Trash2 } from '@/shared/ui/icones'
import type { Caixa } from '@/features/caixas/caixa'
import { CATEGORIA_DESCONHECIDA, type Categoria } from '@/features/categorias/categoria'
import { CabecalhoGrupo } from '@/features/pastas/components/CabecalhoGrupo'
import { MoverParaPasta } from '@/features/pastas/components/MoverParaPasta'
import type { GrupoPasta } from '@/features/pastas/grupos'
import type { Pasta } from '@/features/pastas/pasta'
import { PilulaTag } from '@/features/tags/components/PilulaTag'
import type { Tag } from '@/features/tags/tag'
import { PontoCor } from '@/shared/components/PontoCor'
import { paraDataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { TABELA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { ehTransferencia, type Lancamento } from '../lancamento'
import type { CampoOrdem, Ordem } from '../ordenacao'
import { parcelasDe, type Parcelas } from '../parcelas'
import { descreverPeriodo, descreverRecorrencia, ROTULO_NATUREZA } from '../textos'

/** Descrição, categoria, tag, natureza, recorrência, valor e ações. */
const COLUNAS = 7

/** Seleção em lote (só em telas largas). */
export interface SelecaoTabela {
  ids: Set<string>
  /** Marca ou desmarca um lançamento; com Shift, também os que estão entre ele e o último clicado. */
  onAlternar: (id: string, intervalo: boolean) => void
  /** Marca (true) ou desmarca vários de uma vez (cabeçalho e grupos). */
  onDefinir: (ids: string[], marcar: boolean) => void
}

interface TabelaLancamentosProps {
  /** Lançamentos visíveis, separados por pasta. */
  grupos: GrupoPasta[]
  categorias: Map<string, Categoria>
  tags: Map<string, Tag>
  /** Caixas pelo id, para a bolinha da cor do caixa; ausente com um caixa só (nada novo na tela). */
  caixas?: Map<string, Caixa>
  /** Sem pastas cadastradas, a lista é uma só, sem cabeçalhos de grupo nem o botão de mover. */
  pastas: Pasta[]
  /** Chaves dos grupos fechados. */
  fechadas: Set<string>
  /** Complemento dos totais dos grupos: "em 2026" ou o período do filtro de data. */
  quando: string
  /** Com filtro de data: quantas vezes cada lançamento acontece no período e quanto soma. */
  noPeriodo?: Map<string, { vezes: number; totalCentavos: number }>
  selecao?: SelecaoTabela
  /** Coluna que ordena a lista (null = ordem padrão). */
  ordem: Ordem | null
  onOrdenar: (campo: CampoOrdem) => void
  onAlternarGrupo: (chave: string) => void
  onMover: (l: Lancamento, pastaId: string | undefined) => void
  onEditar: (l: Lancamento) => void
  onExcluir: (l: Lancamento) => void
}

/** Estado de um checkbox que representa vários: todos, alguns ou nenhum marcado. */
function marcacao(ids: string[], selecionados: Set<string>): boolean | 'indeterminate' {
  const quantos = ids.filter((id) => selecionados.has(id)).length
  return quantos === 0 ? false : quantos === ids.length ? true : 'indeterminate'
}

export function TabelaLancamentos({
  grupos,
  categorias,
  tags,
  caixas,
  pastas,
  fechadas,
  quando,
  noPeriodo,
  selecao,
  ordem,
  onOrdenar,
  onAlternarGrupo,
  onMover,
  onEditar,
  onExcluir,
}: TabelaLancamentosProps) {
  const cabecalho = (campo: CampoOrdem, rotulo: string, className?: string) => (
    <CabecalhoOrdenavel
      campo={campo}
      rotulo={rotulo}
      ordem={ordem}
      onOrdenar={onOrdenar}
      className={cn(TABELA.cabecalho, className)}
    />
  )
  const agrupar = pastas.length > 0
  const colunas = COLUNAS + (selecao ? 1 : 0)
  const todos = grupos.flatMap((g) => g.lancamentos.map((l) => l.id))
  // Recorrentes com início e fim: quantas vezes já foram e quanto falta.
  const [hoje] = useState(() => paraDataISO(new Date()))
  const parcelas = useMemo(
    () => new Map(grupos.flatMap((g) => g.lancamentos).map((l) => [l.id, parcelasDe(l, hoje)])),
    [grupos, hoje],
  )

  const linhas = (lancamentos: Lancamento[]) =>
    lancamentos.map((l) => (
      <LinhaLancamento
        key={l.id}
        lancamento={l}
        categoria={categorias.get(l.categoriaId) ?? CATEGORIA_DESCONHECIDA}
        tag={l.tagId ? tags.get(l.tagId) : undefined}
        caixa={caixas?.get(l.caixaId)}
        destino={l.caixaDestinoId ? caixas?.get(l.caixaDestinoId) : undefined}
        noPeriodo={noPeriodo && (noPeriodo.get(l.id) ?? { vezes: 0, totalCentavos: 0 })}
        parcelas={parcelas.get(l.id) ?? undefined}
        selecionado={selecao?.ids.has(l.id)}
        onSelecionar={selecao && ((intervalo) => selecao.onAlternar(l.id, intervalo))}
        mover={
          agrupar && (
            <MoverParaPasta
              descricao={l.descricao}
              pastaAtual={l.pastaId}
              pastas={pastas}
              onMover={(pastaId) => onMover(l, pastaId)}
            />
          )
        }
        onEditar={() => onEditar(l)}
        onExcluir={() => onExcluir(l)}
      />
    ))

  const marcarTodos = selecao && marcacao(todos, selecao.ids)

  return (
    <Table className={TABELA.tabela}>
      <TableHeader>
        <TableRow className={TABELA.linhaCabecalho}>
          {selecao && (
            <TableHead className={cn(TABELA.cabecalho, TABELA.primeira, 'w-0 pr-0')}>
              <Checkbox
                checked={marcarTodos}
                onCheckedChange={() => selecao.onDefinir(todos, marcarTodos !== true)}
                aria-label={marcarTodos === true ? 'Desmarcar todos' : `Selecionar os ${todos.length} lançamentos da lista`}
                title={marcarTodos === true ? 'Desmarcar todos' : `Selecionar os ${todos.length} da lista`}
              />
            </TableHead>
          )}
          {cabecalho('descricao', 'Descrição', selecao ? 'pl-2' : TABELA.primeira)}
          {cabecalho('categoria', 'Categoria', 'hidden lg:table-cell')}
          {cabecalho('tag', 'Tag', 'hidden lg:table-cell')}
          {cabecalho('natureza', 'Natureza', 'hidden lg:table-cell')}
          {cabecalho('recorrencia', 'Recorrência', 'hidden lg:table-cell')}
          {cabecalho('valor', 'Valor', 'text-right')}
          <TableHead className={cn(TABELA.cabecalho, TABELA.ultima, 'w-0')}>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      {agrupar ? (
        grupos.map((g) => {
          const aberto = !fechadas.has(g.chave)
          const ids = g.lancamentos.map((l) => l.id)
          const marcado = selecao && marcacao(ids, selecao.ids)
          return (
            <TableBody key={g.chave}>
              <CabecalhoGrupo
                grupo={g}
                aberto={aberto}
                quando={quando}
                colunas={colunas}
                onAlternar={() => onAlternarGrupo(g.chave)}
                selecao={selecao && { marcado: marcado!, onAlternar: () => selecao.onDefinir(ids, marcado !== true) }}
              />
              {aberto && linhas(g.lancamentos)}
            </TableBody>
          )
        })
      ) : (
        <TableBody>{linhas(grupos.flatMap((g) => g.lancamentos))}</TableBody>
      )}
    </Table>
  )
}

const NOME_DIRECAO = { asc: 'crescente', desc: 'decrescente' } as const

/** Cabeçalho que reorganiza a lista ao clicar (sem filtrar): uma vez, outra na direção contrária, a terceira desfaz. */
function CabecalhoOrdenavel({
  campo,
  rotulo,
  ordem,
  onOrdenar,
  className,
}: {
  campo: CampoOrdem
  rotulo: string
  ordem: Ordem | null
  onOrdenar: (campo: CampoOrdem) => void
  className?: string
}) {
  const direcao = ordem?.campo === campo ? ordem.direcao : null
  const Icone = direcao === 'asc' ? ArrowUp : direcao === 'desc' ? ArrowDown : ChevronsUpDown

  return (
    <TableHead
      aria-sort={direcao === 'asc' ? 'ascending' : direcao === 'desc' ? 'descending' : undefined}
      className={className}
    >
      <button
        type="button"
        onClick={() => onOrdenar(campo)}
        title={direcao ? `Ordenado por ${rotulo.toLowerCase()} (${NOME_DIRECAO[direcao]})` : `Ordenar por ${rotulo.toLowerCase()}`}
        className={cn(
          '-mx-1 inline-flex items-center gap-1 px-1 py-0.5 uppercase transition-colors duration-100 outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-ring',
          direcao && 'bg-foreground text-background hover:text-tinta',
        )}
      >
        {rotulo}
        <Icone aria-hidden strokeWidth={direcao ? 3 : 2} className={cn('size-3', !direcao && 'opacity-50')} />
      </button>
    </TableHead>
  )
}

/** "Conta → Poupança", com a bolinha da cor de cada conta. */
function Rota({ origem, destino }: { origem?: Caixa; destino?: Caixa }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5">
      {origem && <PontoCor cor={origem.cor} className="rounded-full" />}
      {origem?.nome ?? 'Outra conta'}
      <span aria-label="para">→</span>
      {destino && <PontoCor cor={destino.cor} className="rounded-full" />}
      {destino?.nome ?? 'outra conta'}
    </span>
  )
}

interface LinhaLancamentoProps {
  lancamento: Lancamento
  categoria: Pick<Categoria, 'nome' | 'cor'>
  tag?: Tag
  /** Caixa do lançamento, quando há mais de um. */
  caixa?: Caixa
  /** Conta que recebe a transferência. */
  destino?: Caixa
  /** Com filtro de data: vezes e total no período. */
  noPeriodo?: { vezes: number; totalCentavos: number }
  /** Recorrente com início e fim: quantas vezes já foram e quanto falta. */
  parcelas?: Parcelas
  selecionado?: boolean
  /** Seleção em lote; `intervalo` com Shift. */
  onSelecionar?: (intervalo: boolean) => void
  /** Botão de mudar de pasta, quando há pastas. */
  mover?: ReactNode
  onEditar: () => void
  onExcluir: () => void
}

function LinhaLancamento({
  lancamento: l,
  categoria,
  tag,
  caixa,
  destino,
  noPeriodo,
  parcelas,
  selecionado,
  onSelecionar,
  mover,
  onEditar,
  onExcluir,
}: LinhaLancamentoProps) {
  const entrada = l.tipo === 'entrada'
  const transferencia = ehTransferencia(l)
  // Transferência não tem categoria: no lugar dela, de onde sai e para onde vai.
  const classificacao = transferencia ? (
    <Rota origem={caixa} destino={destino} />
  ) : (
    <>
      <PontoCor cor={categoria.cor} />
      {categoria.nome}
    </>
  )
  const recorrencia = descreverRecorrencia(l)
  const periodo = descreverPeriodo(l)
  const selecionar = (e: MouseEvent) => {
    e.stopPropagation()
    onSelecionar?.(e.shiftKey)
  }

  return (
    <TableRow
      data-state={selecionado ? 'selected' : undefined}
      className={cn(TABELA.linha, 'data-[state=selected]:bg-selecao data-[state=selected]:hover:bg-selecao-forte')}
    >
      {onSelecionar && (
        // A célula inteira marca (alvo maior que o quadradinho); Shift marca o intervalo.
        <TableCell
          className={cn(TABELA.celula, TABELA.primeira, 'w-0 cursor-pointer pr-0 select-none')}
          onClick={selecionar}
          onMouseDown={(e) => e.shiftKey && e.preventDefault()}
        >
          <Checkbox
            checked={!!selecionado}
            onClick={selecionar}
            aria-label={`Selecionar ${l.descricao}`}
          />
        </TableCell>
      )}
      {/* Palavra longa quebra no celular, para a tabela caber no card (os botões da linha ocupam espaço fixo). */}
      <TableCell
        className={cn(TABELA.celula, onSelecionar ? 'pl-2' : TABELA.primeira, 'whitespace-normal [overflow-wrap:anywhere]')}
      >
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 font-medium">
            {/* Bolinha (não quadradinho, que é a categoria) na cor do caixa. */}
            {caixa && (
              <span title={caixa.nome} className="flex">
                <PontoCor cor={caixa.cor} className="rounded-full" />
                <span className="sr-only">{caixa.nome}:</span>
              </span>
            )}
            {l.descricao}
          </span>
          {/* No celular, categoria, tag, natureza e recorrência vêm empilhadas sob a descrição. */}
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.7rem] text-muted-foreground lg:hidden">
            {classificacao}
            {tag && (
              <>
                {' · '}
                <PontoCor cor={tag.cor} />
                {tag.nome}
              </>
            )}{' '}
            · {transferencia ? 'Transferência' : ROTULO_NATUREZA[l.natureza]} · {recorrencia}
            {periodo && ` · ${periodo}`}
          </span>
          {parcelas && <ProgressoParcelas parcelas={parcelas} tipo={l.tipo} className="lg:hidden" />}
        </div>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden lg:table-cell')}>
        <span className="flex items-center gap-1.5">{classificacao}</span>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden lg:table-cell')}>{tag && <PilulaTag tag={tag} />}</TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden lg:table-cell')}>
        <Badge variant="outline" className="text-muted-foreground">
          {transferencia ? 'Transferência' : ROTULO_NATUREZA[l.natureza]}
        </Badge>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden lg:table-cell')}>
        <div className="flex flex-col gap-0.5">
          <span className="tabular-nums">{recorrencia}</span>
          {periodo && <span className="text-[0.7rem] text-muted-foreground tabular-nums">{periodo}</span>}
          {parcelas && <ProgressoParcelas parcelas={parcelas} tipo={l.tipo} />}
        </div>
      </TableCell>
      <TableCell
        className={cn(
          TABELA.celula,
          'text-right font-semibold tabular-nums',
          transferencia ? 'text-foreground' : entrada ? 'text-entrada' : 'text-saida',
        )}
      >
        {/* Transferência só muda o dinheiro de conta: sem sinal e em preto, com as setas no lugar. */}
        {transferencia ? (
          <span className="inline-flex items-center gap-1">
            <ArrowLeftRight aria-label="Transferência" className="size-3" />
            {formatarBRL(l.valorCentavos)}
          </span>
        ) : (
          <>
            {entrada ? '+' : '−'} {formatarBRL(l.valorCentavos)}
          </>
        )}
        {/* Com filtro de data, o recorrente diz quantas vezes acontece no período e quanto soma. */}
        {noPeriodo && noPeriodo.vezes > 1 && (
          <span className="block text-[0.7rem] font-normal text-muted-foreground">
            {noPeriodo.vezes}× · {formatarBRL(noPeriodo.totalCentavos)}
          </span>
        )}
      </TableCell>
      <TableCell className={cn(TABELA.celula, TABELA.ultima)}>
        <div className="flex justify-end">
          {mover}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground"
            onClick={onEditar}
            aria-label={`Editar ${l.descricao}`}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-destructive"
            onClick={onExcluir}
            aria-label={`Excluir ${l.descricao}`}
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

const COR_BARRA: Record<Lancamento['tipo'], string> = {
  entrada: 'bg-azul',
  saida: 'bg-vermelho',
  transferencia: 'bg-foreground',
}

/** "2 de 9 · faltam R$ 1.225,00", com uma barra do que já foi. */
function ProgressoParcelas({ parcelas: p, tipo, className }: { parcelas: Parcelas; tipo: Lancamento['tipo']; className?: string }) {
  return (
    <span className={cn('flex max-w-48 flex-col gap-0.5 text-[0.7rem] text-muted-foreground tabular-nums', className)}>
      <span>
        <span className="font-semibold text-foreground">
          {p.pagas} de {p.total}
        </span>
        {p.restantes > 0 ? <> · faltam {formatarBRL(p.restanteCentavos)}</> : ' · terminou'}
      </span>
      <span aria-hidden className="h-1.5 border border-contorno bg-muted">
        <span className={cn('block h-full', COR_BARRA[tipo])} style={{ width: `${(p.pagas / p.total) * 100}%` }} />
      </span>
    </span>
  )
}
