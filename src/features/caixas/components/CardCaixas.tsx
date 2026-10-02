import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarData } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CARD, TABELA, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { ehUltimaConta, ROTULO_TIPO_CAIXA, type Caixa } from '../caixa'

interface CardCaixasProps {
  /** Na ordem do seletor (os arquivados vão para o fim). */
  caixas: Caixa[]
  usos: Map<string, { lancamentos: number; metas: number }>
  onEditar: (caixa: Caixa) => void
  onArquivar: (caixa: Caixa, arquivado: boolean) => void
  onExcluir: (caixa: Caixa) => void
}

/** Colunas de número com menos recuo no celular, para a tabela caber nos 339px do card. */
const ESTREITA = 'px-2 sm:px-3'

/** O que o caixa é, numa linha curta embaixo do nome: tipo, se entra no total e se está arquivado. */
function detalhe(caixa: Caixa): string {
  const partes = [ROTULO_TIPO_CAIXA[caixa.tipo]]
  // O padrão (conta no total, benefício fora) não precisa ser dito.
  if (caixa.tipo === 'conta' && !caixa.entraNoTotal) partes.push('fora do total')
  if (caixa.tipo === 'beneficio' && caixa.entraNoTotal) partes.push('entra no total')
  if (caixa.arquivado) partes.push('arquivado')
  return partes.join(' · ')
}

export function CardCaixas({ caixas, usos, onEditar, onArquivar, onExcluir }: CardCaixasProps) {
  const ordenados = [...caixas.filter((c) => !c.arquivado), ...caixas.filter((c) => c.arquivado)]

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Caixas"
        contagem={caixas.filter((c) => !c.arquivado).length}
        faixa="bg-foreground"
        forma={{ forma: 'circulo', cor: 'amarelo' }}
        descricao="Categorias, tags e pastas valem para todos"
      />

      <Table className={TABELA.tabela}>
        <TableHeader>
          <TableRow className={TABELA.linhaCabecalho}>
            <TableHead className={cn(TABELA.cabecalho, TABELA.primeira)}>Caixa</TableHead>
            <TableHead className={cn(TABELA.cabecalho, ESTREITA, 'text-right')}>
              <span className="sm:hidden">Lanç.</span>
              <span className="hidden sm:inline">Lançamentos</span>
            </TableHead>
            <TableHead className={cn(TABELA.cabecalho, ESTREITA, 'text-right')}>
              <span className="sm:hidden">Saldo ini.</span>
              <span className="hidden sm:inline">Saldo inicial</span>
            </TableHead>
            <TableHead className={cn(TABELA.cabecalho, TABELA.ultima, 'w-0')}>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenados.map((c) => {
            const uso = usos.get(c.id) ?? { lancamentos: 0, metas: 0 }
            const ultima = ehUltimaConta(c, caixas)
            const emUso = uso.lancamentos > 0 || uso.metas > 0
            return (
              <TableRow key={c.id} className={cn(TABELA.linha, c.arquivado && 'text-muted-foreground')}>
                <TableCell className={cn(TABELA.celula, TABELA.primeira, 'whitespace-normal')}>
                  <span className="flex items-start gap-2">
                    <PontoCor cor={c.cor} className="mt-1 size-2.5" />
                    <span className="flex flex-col">
                      <span className={cn(!c.arquivado && 'text-foreground')}>{c.nome}</span>
                      <span className="text-[0.7rem] text-muted-foreground">{detalhe(c)}</span>
                    </span>
                  </span>
                </TableCell>
                <TableCell className={cn(TABELA.celula, ESTREITA, 'text-right align-top text-muted-foreground tabular-nums')}>
                  {uso.lancamentos}
                  {uso.metas > 0 && (
                    <span className="block text-[0.7rem]">
                      {uso.metas} {uso.metas === 1 ? 'meta' : 'metas'}
                    </span>
                  )}
                </TableCell>
                <TableCell className={cn(TABELA.celula, ESTREITA, 'text-right align-top tabular-nums')}>
                  <span className={cn(VALOR_SALDO, c.saldoInicialCentavos < 0 && 'text-negativo')}>
                    {formatarBRL(c.saldoInicialCentavos)}
                  </span>
                  <span className="block text-[0.7rem] text-muted-foreground">{formatarData(c.dataSaldoInicial)}</span>
                </TableCell>
                <TableCell className={cn(TABELA.celula, TABELA.ultima, 'align-top')}>
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
                    {c.arquivado ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground"
                        onClick={() => onArquivar(c, false)}
                        aria-label={`Desarquivar ${c.nome}`}
                        title="Desarquivar"
                      >
                        <ArchiveRestore />
                      </Button>
                    ) : emUso ? (
                      // Com lançamentos ou metas, não dá para excluir: arquivar mantém o histórico.
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground"
                        onClick={() => onArquivar(c, true)}
                        disabled={ultima}
                        aria-label={`Arquivar ${c.nome}`}
                        title={ultima ? 'É a única conta: não dá para arquivar' : 'Arquivar (some do seletor, mas mantém o histórico)'}
                      >
                        <Archive />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => onExcluir(c)}
                        disabled={ultima}
                        aria-label={`Excluir ${c.nome}`}
                        title={ultima ? 'É a única conta: não dá para excluir' : undefined}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
