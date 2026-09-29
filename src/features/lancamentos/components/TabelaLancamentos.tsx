import { Pencil, Trash2 } from 'lucide-react'
import { CATEGORIA_DESCONHECIDA, type Categoria } from '@/features/categorias/categoria'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { TABELA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { Lancamento } from '../lancamento'
import { descreverPeriodo, descreverRecorrencia, ROTULO_NATUREZA } from '../textos'

interface TabelaLancamentosProps {
  lancamentos: Lancamento[]
  categorias: Map<string, Categoria>
  onEditar: (l: Lancamento) => void
  onExcluir: (l: Lancamento) => void
}

export function TabelaLancamentos({ lancamentos, categorias, onEditar, onExcluir }: TabelaLancamentosProps) {
  return (
    <Table className={TABELA.tabela}>
      <TableHeader>
        <TableRow className={TABELA.linhaCabecalho}>
          <TableHead className={cn(TABELA.cabecalho, TABELA.primeira)}>Descrição</TableHead>
          <TableHead className={cn(TABELA.cabecalho, 'hidden md:table-cell')}>Categoria</TableHead>
          <TableHead className={cn(TABELA.cabecalho, 'hidden md:table-cell')}>Natureza</TableHead>
          <TableHead className={cn(TABELA.cabecalho, 'hidden md:table-cell')}>Recorrência</TableHead>
          <TableHead className={cn(TABELA.cabecalho, 'text-right')}>Valor</TableHead>
          <TableHead className={cn(TABELA.cabecalho, TABELA.ultima, 'w-0')}>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lancamentos.map((l) => (
          <LinhaLancamento
            key={l.id}
            lancamento={l}
            categoria={categorias.get(l.categoriaId) ?? CATEGORIA_DESCONHECIDA}
            onEditar={() => onEditar(l)}
            onExcluir={() => onExcluir(l)}
          />
        ))}
      </TableBody>
    </Table>
  )
}

interface LinhaLancamentoProps {
  lancamento: Lancamento
  categoria: Pick<Categoria, 'nome' | 'cor'>
  onEditar: () => void
  onExcluir: () => void
}

function LinhaLancamento({ lancamento: l, categoria, onEditar, onExcluir }: LinhaLancamentoProps) {
  const entrada = l.tipo === 'entrada'
  const recorrencia = descreverRecorrencia(l)
  const periodo = descreverPeriodo(l)

  return (
    <TableRow className={TABELA.linha}>
      <TableCell className={cn(TABELA.celula, TABELA.primeira, 'whitespace-normal')}>
        <div className="flex flex-col gap-1">
          <span>{l.descricao}</span>
          {/* No celular, categoria, natureza e recorrência vêm empilhadas sob a descrição. */}
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.7rem] text-muted-foreground md:hidden">
            <PontoCor cor={categoria.cor} />
            {categoria.nome} · {ROTULO_NATUREZA[l.natureza]} · {recorrencia}
            {periodo && ` · ${periodo}`}
          </span>
        </div>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden md:table-cell')}>
        <span className="flex items-center gap-1.5">
          <PontoCor cor={categoria.cor} />
          {categoria.nome}
        </span>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden md:table-cell')}>
        <Badge variant="outline" className="rounded-full font-normal text-muted-foreground">
          {ROTULO_NATUREZA[l.natureza]}
        </Badge>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'hidden md:table-cell')}>
        <div className="flex flex-col gap-0.5">
          <span className="tabular-nums">{recorrencia}</span>
          {periodo && <span className="text-[0.7rem] text-muted-foreground tabular-nums">{periodo}</span>}
        </div>
      </TableCell>
      <TableCell className={cn(TABELA.celula, 'text-right tabular-nums', entrada ? 'text-entrada' : 'text-saida')}>
        {entrada ? '+' : '−'} {formatarBRL(l.valorCentavos)}
      </TableCell>
      <TableCell className={cn(TABELA.celula, TABELA.ultima)}>
        <div className="flex justify-end">
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
