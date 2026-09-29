import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { TipoMovimento } from '@/features/lancamentos/lancamento'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CARD, TABELA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { Categoria } from '../categoria'

interface CardCategoriasProps {
  tipo: TipoMovimento
  categorias: Categoria[]
  /** Quantidade de lançamentos por categoria. */
  usos: Map<string, number>
  /** Total projetado no ano por categoria. */
  totais: Map<string, number>
  onNova: () => void
  onEditar: (c: Categoria) => void
  onExcluir: (c: Categoria) => void
}

const TITULO: Record<TipoMovimento, string> = { entrada: 'Entradas', saida: 'Saídas' }

export function CardCategorias({ tipo, categorias, usos, totais, onNova, onEditar, onExcluir }: CardCategoriasProps) {
  const corValor = tipo === 'entrada' ? 'text-entrada' : 'text-saida'
  const totalDoTipo = categorias.reduce((t, c) => t + (totais.get(c.id) ?? 0), 0)

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <header className="flex items-end justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <h2 className="text-lg leading-none font-medium tracking-tight">
          {TITULO[tipo]} <span className="font-normal text-muted-foreground">{categorias.length}</span>
        </h2>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-[0.7rem] tracking-wide text-muted-foreground uppercase">Total no ano</span>
          <span className={cn('text-sm leading-none font-medium tabular-nums', corValor)}>
            {formatarBRL(totalDoTipo)}
          </span>
        </div>
      </header>

      {categorias.length === 0 ? (
        <EstadoVazio
          titulo={`Nenhuma categoria de ${tipo === 'entrada' ? 'entrada' : 'saída'}`}
          acao={
            <Button variant="outline" className={cn(BOTAO, 'bg-card')} onClick={onNova}>
              <Plus />
              Nova categoria
            </Button>
          }
        />
      ) : (
        <Table className={TABELA.tabela}>
          <TableHeader>
            <TableRow className={TABELA.linhaCabecalho}>
              <TableHead className={cn(TABELA.cabecalho, TABELA.primeira)}>Categoria</TableHead>
              <TableHead className={cn(TABELA.cabecalho, 'text-right')}>
                <span className="sm:hidden">Lanç.</span>
                <span className="hidden sm:inline">Lançamentos</span>
              </TableHead>
              <TableHead className={cn(TABELA.cabecalho, 'text-right')}>No ano</TableHead>
              <TableHead className={cn(TABELA.cabecalho, TABELA.ultima, 'w-0')}>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.map((c) => (
              <TableRow key={c.id} className={TABELA.linha}>
                <TableCell className={cn(TABELA.celula, TABELA.primeira, 'whitespace-normal')}>
                  <span className="flex items-center gap-2">
                    <PontoCor cor={c.cor} className="size-2.5" />
                    {c.nome}
                  </span>
                </TableCell>
                <TableCell className={cn(TABELA.celula, 'text-right text-muted-foreground tabular-nums')}>
                  {usos.get(c.id) ?? 0}
                </TableCell>
                <TableCell className={cn(TABELA.celula, 'text-right tabular-nums', corValor)}>
                  {formatarBRL(totais.get(c.id) ?? 0)}
                </TableCell>
                <TableCell className={cn(TABELA.celula, TABELA.ultima)}>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-muted-foreground"
                      onClick={() => onEditar(c)}
                      aria-label={`Editar ${c.nome}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-muted-foreground hover:text-destructive"
                      onClick={() => onExcluir(c)}
                      aria-label={`Excluir ${c.nome}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
