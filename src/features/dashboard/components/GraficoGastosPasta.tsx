import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { Pasta } from '@/features/pastas/pasta'
import type { GastoCategoria, GastoPasta } from '@/features/projecao/projecao'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { PontoCor } from '@/shared/components/PontoCor'
import { CAMPO_SELECT, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { CardGrafico } from './CardGrafico'
import { RoscaGastos } from './RoscaGastos'

interface GraficoGastosPastaProps {
  gastos: GastoPasta[]
  pastas: Pasta[]
  /** Pasta detalhada por categoria à direita. */
  pasta: Pasta | undefined
  onPasta: (id: string) => void
  /** Saídas da pasta escolhida, por categoria. */
  categoriasDaPasta: GastoCategoria[]
  /** "no mês", "na semana"… do período escolhido no topo do dashboard. */
  noPeriodo: string
  className?: string
}

/** Saídas por pasta (ex.: Assinaturas) e, ao lado, as categorias de uma pasta. */
export function GraficoGastosPasta({
  gastos,
  pastas,
  pasta,
  onPasta,
  categoriasDaPasta,
  noPeriodo: periodo,
  className,
}: GraficoGastosPastaProps) {
  return (
    <CardGrafico
      faixa="bg-foreground"
      titulo="Gastos por pasta"
      descricao={`Quanto cada pasta levou das saídas ${periodo}`}
      className={className}
      acoes={
        pasta && (
          <Select value={pasta.id} onValueChange={onPasta}>
            <SelectTrigger aria-label="Pasta detalhada por categoria" className={cn(CAMPO_SELECT, 'w-44')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              {pastas.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <PontoCor cor={p.cor} />
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
    >
      {pastas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma pasta ainda"
          descricao={
            <>
              <Link to="/organizacao" search={{ aba: 'pastas' }} className="underline underline-offset-4 hover:text-foreground">
                Crie pastas
              </Link>{' '}
              como Assinaturas e coloque os lançamentos nelas para ver quanto cada pacote custa.
            </>
          }
        />
      ) : gastos.length === 0 ? (
        <EstadoVazio titulo={`Nenhuma saída ${periodo}`} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-4">
          <Metade titulo="Todas as pastas">
            <RoscaGastos
              itens={gastos.map((g) => ({ id: g.pastaId || 'sem-pasta', nome: g.nome, cor: g.cor, centavos: g.totalCentavos }))}
              rotuloValor={`Saídas ${periodo}`}
            />
          </Metade>
          {pasta && (
            <Metade
              titulo={
                <>
                  <PontoCor cor={pasta.cor} className="size-2.5 rounded-none" />
                  {pasta.nome} por categoria
                </>
              }
              className="border-t-2 border-foreground pt-4 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-4"
            >
              {categoriasDaPasta.length === 0 ? (
                <EstadoVazio titulo={`Nenhuma saída em ${pasta.nome} ${periodo}`} />
              ) : (
                <RoscaGastos
                  itens={categoriasDaPasta.map((g) => ({
                    id: g.categoriaId,
                    nome: g.nome,
                    cor: g.cor,
                    centavos: g.totalCentavos,
                  }))}
                  rotuloValor={`${pasta.nome} ${periodo}`}
                />
              )}
            </Metade>
          )}
        </div>
      )}
    </CardGrafico>
  )
}

function Metade({ titulo, className, children }: { titulo: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-3', className)}>
      <h3 className={cn(ROTULO, 'flex items-center gap-2 px-2 text-muted-foreground sm:px-3')}>{titulo}</h3>
      {children}
    </section>
  )
}
