import { Pencil, Plus, Sparkles, Trash2 } from '@/shared/ui/icones'
import type { TipoMovimento } from '@/features/lancamentos/model/lancamento'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CARD, TABELA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { CATEGORIAS_SUGERIDAS, type Categoria } from '../model/categoria'

interface CardCategoriasProps {
  tipo: TipoMovimento
  categorias: Categoria[]
  /** Quantidade de lançamentos por categoria. */
  usos: Map<string, number>
  /** Total projetado no ano por categoria. */
  totais: Map<string, number>
  onNova: () => void
  /** Cria as categorias sugeridas do tipo (oferecido enquanto ele não tem nenhuma). */
  onUsarSugeridas: () => void
  onEditar: (c: Categoria) => void
  onExcluir: (c: Categoria) => void
}

const TITULO: Record<TipoMovimento, string> = { entrada: 'Entradas', saida: 'Saídas' }

export function CardCategorias({ tipo, categorias, usos, totais, onNova, onUsarSugeridas, onEditar, onExcluir }: CardCategoriasProps) {
  const corValor = tipo === 'entrada' ? 'text-entrada' : 'text-saida'
  const totalDoTipo = categorias.reduce((t, c) => t + (totais.get(c.id) ?? 0), 0)

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo={TITULO[tipo]}
        contagem={categorias.length}
        faixa={tipo === 'entrada' ? 'bg-azul' : 'bg-vermelho'}
        forma={tipo === 'entrada' ? { forma: 'circulo', cor: 'papel' } : { forma: 'quadrado', cor: 'papel' }}
        destaque={{ rotulo: 'Total no ano', valor: formatarBRL(totalDoTipo), className: corValor }}
      />

      {categorias.length === 0 ? (
        <EstadoVazio
          titulo={`Nenhuma categoria de ${tipo === 'entrada' ? 'entrada' : 'saída'}`}
          descricao={`Comece com ${CATEGORIAS_SUGERIDAS[tipo].map((c) => c.nome).join(', ')} ou crie as suas.`}
          acao={
            <div className="flex flex-wrap justify-center gap-2">
              <Button className={BOTAO} onClick={onUsarSugeridas}>
                <Sparkles />
                Usar sugeridas
              </Button>
              <Button variant="outline" className={BOTAO} onClick={onNova}>
                <Plus />
                Nova categoria
              </Button>
            </div>
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
