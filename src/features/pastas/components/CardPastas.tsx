import { Pencil, Plus, Trash2 } from 'lucide-react'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CARD, TABELA, TITULO_CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { CHAVE_SEM_PASTA, type GrupoPasta } from '../grupos'
import type { Pasta } from '../pasta'

interface CardPastasProps {
  pastas: Pasta[]
  /** Todos os lançamentos agrupados por pasta (inclui "Sem pasta"). */
  grupos: GrupoPasta[]
  onNova: () => void
  onEditar: (p: Pasta) => void
  onExcluir: (p: Pasta) => void
}

export function CardPastas({ pastas, grupos, onNova, onEditar, onExcluir }: CardPastasProps) {
  const porChave = new Map(grupos.map((g) => [g.chave, g]))
  const semPasta = porChave.get(CHAVE_SEM_PASTA)?.lancamentos.length ?? 0

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <header className="flex items-end justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <h2 className={TITULO_CARD}>
          Pastas <span className="font-normal text-muted-foreground">{pastas.length}</span>
        </h2>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-[0.7rem] tracking-wide text-muted-foreground uppercase">Sem pasta</span>
          <span className="text-sm leading-none font-medium tabular-nums">
            {semPasta} {semPasta === 1 ? 'lançamento' : 'lançamentos'}
          </span>
        </div>
      </header>

      {pastas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma pasta ainda"
          descricao="Pastas agrupam os lançamentos na lista (ex.: Mercado, Transporte, Assinaturas), sem mudar a projeção."
          acao={
            <Button variant="outline" className={cn(BOTAO, 'bg-card')} onClick={onNova}>
              <Plus />
              Nova pasta
            </Button>
          }
        />
      ) : (
        <Table className={TABELA.tabela}>
          <TableHeader>
            <TableRow className={TABELA.linhaCabecalho}>
              <TableHead className={cn(TABELA.cabecalho, TABELA.primeira)}>Pasta</TableHead>
              <TableHead className={cn(TABELA.cabecalho, 'text-right')}>
                <span className="sm:hidden">Lanç.</span>
                <span className="hidden sm:inline">Lançamentos</span>
              </TableHead>
              <TableHead className={cn(TABELA.cabecalho, 'text-right text-entrada')}>
                <span className="sm:hidden">Entradas</span>
                <span className="hidden sm:inline">Entradas no ano</span>
              </TableHead>
              <TableHead className={cn(TABELA.cabecalho, 'text-right text-saida')}>
                <span className="sm:hidden">Saídas</span>
                <span className="hidden sm:inline">Saídas no ano</span>
              </TableHead>
              <TableHead className={cn(TABELA.cabecalho, TABELA.ultima, 'w-0')}>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pastas.map((p) => {
              const grupo = porChave.get(p.id)
              return (
                <TableRow key={p.id} className={TABELA.linha}>
                  <TableCell className={cn(TABELA.celula, TABELA.primeira, 'whitespace-normal')}>
                    <span className="flex items-center gap-2">
                      <PontoCor cor={p.cor} className="size-2.5" />
                      {p.nome}
                    </span>
                  </TableCell>
                  <TableCell className={cn(TABELA.celula, 'text-right text-muted-foreground tabular-nums')}>
                    {grupo?.lancamentos.length ?? 0}
                  </TableCell>
                  <TableCell className={cn(TABELA.celula, 'text-right text-entrada tabular-nums')}>
                    {!!grupo?.entradasCentavos && formatarBRL(grupo.entradasCentavos)}
                  </TableCell>
                  <TableCell className={cn(TABELA.celula, 'text-right text-saida tabular-nums')}>
                    {!!grupo?.saidasCentavos && formatarBRL(grupo.saidasCentavos)}
                  </TableCell>
                  <TableCell className={cn(TABELA.celula, TABELA.ultima)}>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground"
                        onClick={() => onEditar(p)}
                        aria-label={`Editar ${p.nome}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => onExcluir(p)}
                        aria-label={`Excluir ${p.nome}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
