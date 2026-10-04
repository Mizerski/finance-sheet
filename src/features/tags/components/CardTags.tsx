import { Link } from '@tanstack/react-router'
import { Pencil, Plus, Sparkles, Trash2 } from '@/shared/ui/icones'
import { FILTRO_SEM_TAG } from '@/features/lancamentos/filtros'
import type { GastoTag } from '@/features/projecao/projecao'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CARD, TABELA } from '@/shared/lib/estilos'
import { formatarPercentual } from '@/shared/lib/percentual'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { SEM_TAG, TAGS_SUGERIDAS, type Tag } from '../tag'

interface CardTagsProps {
  tags: Tag[]
  /** Quantidade de lançamentos por tag ('' = saídas sem tag). */
  usos: Map<string, number>
  /** Saídas projetadas no ano por tag. */
  gastos: GastoTag[]
  onNova: () => void
  onUsarSugeridas: () => void
  onEditar: (t: Tag) => void
  onExcluir: (t: Tag) => void
}

const NOMES_SUGERIDAS = TAGS_SUGERIDAS.map((t) => (t.evitavel ? `${t.nome} (evitável)` : t.nome))
  .join(', ')
  .replace(/, ([^,]+)$/, ' e $1')

export function CardTags({ tags, usos, gastos, onNova, onUsarSugeridas, onEditar, onExcluir }: CardTagsProps) {
  const totais = new Map(gastos.map((g) => [g.tagId, g.totalCentavos]))
  const saidas = gastos.reduce((t, g) => t + g.totalCentavos, 0)
  const evitaveis = gastos.reduce((t, g) => (g.evitavel ? t + g.totalCentavos : t), 0)
  const semTag = { usos: usos.get('') ?? 0, total: totais.get('') ?? 0 }

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Tags"
        contagem={tags.length}
        faixa="bg-amarelo"
        forma={{ forma: 'triangulo', cor: 'tinta' }}
        destaque={{
          rotulo: 'Evitáveis no ano',
          valor: (
            <>
              <span className="text-saida">{formatarBRL(evitaveis)}</span>{' '}
              <span className="font-normal text-muted-foreground">· {formatarPercentual(evitaveis, saidas)}</span>
            </>
          ),
        }}
      />

      {tags.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma tag ainda"
          descricao={`Tags dizem se cada gasto era necessário ou dava para evitar. Comece com ${NOMES_SUGERIDAS} ou crie as suas.`}
          acao={
            <div className="flex flex-wrap justify-center gap-2">
              <Button className={BOTAO} onClick={onUsarSugeridas}>
                <Sparkles />
                Usar sugeridas
              </Button>
              <Button variant="outline" className={BOTAO} onClick={onNova}>
                <Plus />
                Nova tag
              </Button>
            </div>
          }
        />
      ) : (
        <Table className={TABELA.tabela}>
          <TableHeader>
            <TableRow className={TABELA.linhaCabecalho}>
              <TableHead className={cn(TABELA.cabecalho, TABELA.primeira)}>Tag</TableHead>
              <TableHead className={cn(TABELA.cabecalho, 'text-right')}>
                <span className="sm:hidden">Lanç.</span>
                <span className="hidden sm:inline">Lançamentos</span>
              </TableHead>
              <TableHead className={cn(TABELA.cabecalho, 'text-right')}>No ano</TableHead>
              <TableHead className={cn(TABELA.cabecalho, 'text-right')}>
                <span className="sm:hidden">%</span>
                <span className="hidden sm:inline">Das saídas</span>
              </TableHead>
              <TableHead className={cn(TABELA.cabecalho, TABELA.ultima, 'w-0')}>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((t) => {
              const total = totais.get(t.id) ?? 0
              return (
                <TableRow key={t.id} className={TABELA.linha}>
                  <TableCell className={cn(TABELA.celula, TABELA.primeira, 'whitespace-normal')}>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="flex items-center gap-2">
                        <PontoCor cor={t.cor} className="size-2.5" />
                        {t.nome}
                      </span>
                      {t.evitavel && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Evitável
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className={cn(TABELA.celula, 'text-right text-muted-foreground tabular-nums')}>
                    {usos.get(t.id) ?? 0}
                  </TableCell>
                  <TableCell className={cn(TABELA.celula, 'text-right text-saida tabular-nums')}>
                    {total > 0 && formatarBRL(total)}
                  </TableCell>
                  <TableCell className={cn(TABELA.celula, 'text-right text-muted-foreground tabular-nums')}>
                    {total > 0 && formatarPercentual(total, saidas)}
                  </TableCell>
                  <TableCell className={cn(TABELA.celula, TABELA.ultima)}>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground"
                        onClick={() => onEditar(t)}
                        aria-label={`Editar ${t.nome}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => onExcluir(t)}
                        aria-label={`Excluir ${t.nome}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}

            {/* Saídas ainda sem tag: atalho para classificá-las na tela de lançamentos. */}
            {semTag.usos > 0 && (
              <TableRow className={cn(TABELA.linha, 'text-muted-foreground')}>
                <TableCell className={cn(TABELA.celula, TABELA.primeira, 'whitespace-normal')}>
                  <span className="flex items-center gap-2">
                    <PontoCor cor={SEM_TAG.cor} className="size-2.5" />
                    Saídas sem tag
                  </span>
                </TableCell>
                <TableCell className={cn(TABELA.celula, 'text-right tabular-nums')}>{semTag.usos}</TableCell>
                <TableCell className={cn(TABELA.celula, 'text-right tabular-nums')}>
                  {semTag.total > 0 && formatarBRL(semTag.total)}
                </TableCell>
                <TableCell className={cn(TABELA.celula, 'text-right tabular-nums')}>
                  {semTag.total > 0 && formatarPercentual(semTag.total, saidas)}
                </TableCell>
                <TableCell className={cn(TABELA.celula, TABELA.ultima)}>
                  <div className="flex justify-end">
                    <Link
                      to="/lancamentos"
                      search={{ tag: FILTRO_SEM_TAG }}
                      className="px-3 py-1.5 text-xs font-semibold tracking-[0.06em] whitespace-nowrap text-foreground uppercase underline decoration-2 underline-offset-4 outline-none hover:decoration-vermelho focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      Classificar
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
