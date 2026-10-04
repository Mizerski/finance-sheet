import type { ReactNode } from 'react'
import { Archive, ArchiveRestore, ChevronDown, ChevronUp, Pencil, Trash2 } from '@/shared/ui/icones'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarData } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CARD, TABELA, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { ehUltimaConta, NOME_TOTAL, ROTULO_TIPO_CAIXA, somaNoTotal, type Caixa } from '../caixa'
import { EXPLICACAO_TIPO } from '../textos'

interface CardCaixasProps {
  /** Na ordem do seletor (os arquivados vão para o fim). */
  caixas: Caixa[]
  usos: Map<string, { lancamentos: number; metas: number }>
  onEditar: (caixa: Caixa) => void
  /** Sobe (-1) ou desce (+1) o caixa uma posição no seletor. */
  onMover: (caixa: Caixa, passo: -1 | 1) => void
  onArquivar: (caixa: Caixa, arquivado: boolean) => void
  onExcluir: (caixa: Caixa) => void
}

/** Colunas de número com menos recuo no celular, para a tabela caber nos 339px do card. */
const ESTREITA = 'px-2 sm:px-3'

function contar(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`
}

/** O que o caixa é, numa linha curta embaixo do nome: tipo, se soma no total, uso e se está arquivado. */
function detalhe(caixa: Caixa, uso: { lancamentos: number; metas: number }): string {
  const partes = [ROTULO_TIPO_CAIXA[caixa.tipo]]
  // O benefício sempre fica fora do total; na conta, só a exceção é dita.
  if (!somaNoTotal(caixa)) partes.push('fora do total')
  partes.push(contar(uso.lancamentos, 'lançamento', 'lançamentos'))
  if (uso.metas > 0) partes.push(contar(uso.metas, 'meta', 'metas'))
  if (caixa.arquivado) partes.push('arquivado')
  return partes.join(' · ')
}

export function CardCaixas({ caixas, usos, onEditar, onMover, onArquivar, onExcluir }: CardCaixasProps) {
  const ativos = caixas.filter((c) => !c.arquivado)
  const ordenados = [...ativos, ...caixas.filter((c) => c.arquivado)]

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Caixas"
        contagem={ativos.length}
        faixa="bg-tinta"
        forma={{ forma: 'circulo', cor: 'amarelo' }}
        descricao="Cada um com o próprio saldo"
        ajuda={
          <Ajuda titulo="Conta ou benefício?" largo>
            <p>
              <strong className="font-semibold">Conta:</strong> {EXPLICACAO_TIPO.conta}
            </p>
            <p>
              <strong className="font-semibold">Benefício:</strong> {EXPLICACAO_TIPO.beneficio}
            </p>
            <p className="text-muted-foreground">
              No cabeçalho, o seletor de caixa mostra o {NOME_TOTAL} (a soma das contas) ou um caixa só. A ordem da lista é
              a ordem do seletor e dos atalhos Alt+1…9. Categorias, tags e pastas valem para todos os caixas.
            </p>
          </Ajuda>
        }
      />

      <Table className={TABELA.tabela}>
        <TableHeader>
          <TableRow className={TABELA.linhaCabecalho}>
            <TableHead className={cn(TABELA.cabecalho, 'w-0 pr-0 pl-2 sm:pl-3')}>
              <span className="sr-only">Posição</span>
            </TableHead>
            <TableHead className={cn(TABELA.cabecalho, 'pl-1.5')}>Caixa</TableHead>
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
            const posicao = ativos.indexOf(c)
            return (
              <TableRow key={c.id} className={cn(TABELA.linha, c.arquivado && 'text-muted-foreground')}>
                <TableCell className="w-0 py-1 pr-0 pl-2 align-middle sm:pl-3">
                  {/* Setas empilhadas: mudam a posição no seletor (arquivados não aparecem nele). */}
                  {!c.arquivado && (
                    <div className="flex flex-col">
                      <BotaoPosicao rotulo={`Subir ${c.nome}`} desabilitado={posicao === 0} onClick={() => onMover(c, -1)}>
                        <ChevronUp strokeWidth={2.5} />
                      </BotaoPosicao>
                      <BotaoPosicao
                        rotulo={`Descer ${c.nome}`}
                        desabilitado={posicao === ativos.length - 1}
                        onClick={() => onMover(c, 1)}
                      >
                        <ChevronDown strokeWidth={2.5} />
                      </BotaoPosicao>
                    </div>
                  )}
                </TableCell>
                <TableCell className={cn(TABELA.celula, 'pl-1.5 whitespace-normal')}>
                  <span className="flex items-start gap-2">
                    <PontoCor cor={c.cor} className="mt-1 size-2.5 rounded-full" />
                    <span className="flex flex-col">
                      <span className={cn('font-medium', !c.arquivado && 'text-foreground')}>{c.nome}</span>
                      <span className="text-[0.7rem] text-muted-foreground">{detalhe(c, uso)}</span>
                    </span>
                  </span>
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

function BotaoPosicao({
  rotulo,
  desabilitado,
  onClick,
  children,
}: {
  rotulo: string
  desabilitado: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      disabled={desabilitado}
      onClick={onClick}
      className="flex h-5 w-7 items-center justify-center text-muted-foreground transition-colors duration-100 outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-3"
    >
      {children}
    </button>
  )
}
