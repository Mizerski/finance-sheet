import type { ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { CATEGORIA_DESCONHECIDA, type Categoria } from '@/features/categorias/categoria'
import { CabecalhoGrupo } from '@/features/pastas/components/CabecalhoGrupo'
import { MoverParaPasta } from '@/features/pastas/components/MoverParaPasta'
import type { GrupoPasta } from '@/features/pastas/grupos'
import type { Pasta } from '@/features/pastas/pasta'
import { PilulaTag } from '@/features/tags/components/PilulaTag'
import type { Tag } from '@/features/tags/tag'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { TABELA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { Lancamento } from '../lancamento'
import { descreverPeriodo, descreverRecorrencia, ROTULO_NATUREZA } from '../textos'

/** Descrição, categoria, tag, natureza, recorrência, valor e ações. */
const COLUNAS = 7

interface TabelaLancamentosProps {
  /** Lançamentos visíveis, separados por pasta. */
  grupos: GrupoPasta[]
  categorias: Map<string, Categoria>
  tags: Map<string, Tag>
  /** Sem pastas cadastradas, a lista é uma só, sem cabeçalhos de grupo nem o botão de mover. */
  pastas: Pasta[]
  /** Chaves dos grupos fechados. */
  fechadas: Set<string>
  /** Ano dos totais projetados nos cabeçalhos de grupo. */
  ano: number
  onAlternarGrupo: (chave: string) => void
  onMover: (l: Lancamento, pastaId: string | undefined) => void
  onEditar: (l: Lancamento) => void
  onExcluir: (l: Lancamento) => void
}

export function TabelaLancamentos({
  grupos,
  categorias,
  tags,
  pastas,
  fechadas,
  ano,
  onAlternarGrupo,
  onMover,
  onEditar,
  onExcluir,
}: TabelaLancamentosProps) {
  const agrupar = pastas.length > 0

  const linhas = (lancamentos: Lancamento[]) =>
    lancamentos.map((l) => (
      <LinhaLancamento
        key={l.id}
        lancamento={l}
        categoria={categorias.get(l.categoriaId) ?? CATEGORIA_DESCONHECIDA}
        tag={l.tagId ? tags.get(l.tagId) : undefined}
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

  return (
    <Table className={TABELA.tabela}>
      <TableHeader>
        <TableRow className={TABELA.linhaCabecalho}>
          <TableHead className={cn(TABELA.cabecalho, TABELA.primeira)}>Descrição</TableHead>
          <TableHead className={cn(TABELA.cabecalho, 'hidden lg:table-cell')}>Categoria</TableHead>
          <TableHead className={cn(TABELA.cabecalho, 'hidden lg:table-cell')}>Tag</TableHead>
          <TableHead className={cn(TABELA.cabecalho, 'hidden lg:table-cell')}>Natureza</TableHead>
          <TableHead className={cn(TABELA.cabecalho, 'hidden lg:table-cell')}>Recorrência</TableHead>
          <TableHead className={cn(TABELA.cabecalho, 'text-right')}>Valor</TableHead>
          <TableHead className={cn(TABELA.cabecalho, TABELA.ultima, 'w-0')}>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      {agrupar ? (
        grupos.map((g) => {
          const aberto = !fechadas.has(g.chave)
          return (
            <TableBody key={g.chave}>
              <CabecalhoGrupo
                grupo={g}
                aberto={aberto}
                ano={ano}
                colunas={COLUNAS}
                onAlternar={() => onAlternarGrupo(g.chave)}
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

interface LinhaLancamentoProps {
  lancamento: Lancamento
  categoria: Pick<Categoria, 'nome' | 'cor'>
  tag?: Tag
  /** Botão de mudar de pasta, quando há pastas. */
  mover?: ReactNode
  onEditar: () => void
  onExcluir: () => void
}

function LinhaLancamento({ lancamento: l, categoria, tag, mover, onEditar, onExcluir }: LinhaLancamentoProps) {
  const entrada = l.tipo === 'entrada'
  const recorrencia = descreverRecorrencia(l)
  const periodo = descreverPeriodo(l)

  return (
    <TableRow className={TABELA.linha}>
      <TableCell className={cn(TABELA.celula, TABELA.primeira, 'whitespace-normal')}>
        <div className="flex flex-col gap-1">
          <span className="font-medium">{l.descricao}</span>
          {/* No celular, categoria, tag, natureza e recorrência vêm empilhadas sob a descrição. */}
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.7rem] text-muted-foreground lg:hidden">
            <PontoCor cor={categoria.cor} />
            {categoria.nome}
            {tag && (
              <>
                {' · '}
                <PontoCor cor={tag.cor} />
                {tag.nome}
              </>
            )}{' '}
            · {ROTULO_NATUREZA[l.natureza]} · {recorrencia}
            {periodo && ` · ${periodo}`}
          </span>
        </div>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden lg:table-cell')}>
        <span className="flex items-center gap-1.5">
          <PontoCor cor={categoria.cor} />
          {categoria.nome}
        </span>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden lg:table-cell')}>{tag && <PilulaTag tag={tag} />}</TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden lg:table-cell')}>
        <Badge variant="outline" className="text-muted-foreground">
          {ROTULO_NATUREZA[l.natureza]}
        </Badge>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden lg:table-cell')}>
        <div className="flex flex-col gap-0.5">
          <span className="tabular-nums">{recorrencia}</span>
          {periodo && <span className="text-[0.7rem] text-muted-foreground tabular-nums">{periodo}</span>}
        </div>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'text-right font-semibold tabular-nums', entrada ? 'text-entrada' : 'text-saida')}>
        {entrada ? '+' : '−'} {formatarBRL(l.valorCentavos)}
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
