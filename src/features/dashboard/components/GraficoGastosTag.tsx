import { Link } from '@tanstack/react-router'
import type { GastoTag } from '@/features/projecao/utils/projecao'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { CardGrafico } from './CardGrafico'
import { RoscaGastos } from './RoscaGastos'

interface GraficoGastosTagProps {
  gastos: GastoTag[]
  /** O usuário já criou alguma tag. */
  temTags: boolean
  /** "no mês", "na semana"… do período escolhido no topo do dashboard. */
  noPeriodo: string
}

export function GraficoGastosTag({ gastos, temTags, noPeriodo: periodo }: GraficoGastosTagProps) {
  return (
    <CardGrafico faixa="bg-amarelo" forma={{ forma: 'triangulo', cor: 'tinta' }} titulo="Gastos por tag" descricao={`Quanto das saídas ${periodo} era necessário ou evitável`}>
      {!temTags ? (
        <EstadoVazio
          titulo="Nenhuma tag ainda"
          descricao={
            <>
              <Link to="/organizacao" search={{ aba: 'tags' }} className="underline underline-offset-4 hover:text-foreground">
                Crie tags
              </Link>{' '}
              como Necessário e Superficial e marque os gastos para ver o que dava para evitar.
            </>
          }
        />
      ) : gastos.length === 0 ? (
        <EstadoVazio titulo={`Nenhuma saída ${periodo}`} />
      ) : (
        <RoscaGastos
          itens={gastos.map((g) => ({
            id: g.tagId || 'sem-tag',
            nome: g.nome,
            cor: g.cor,
            centavos: g.totalCentavos,
            ...(g.evitavel && { detalhe: 'evitável' }),
          }))}
          rotuloValor={`Saídas ${periodo}`}
        />
      )}
    </CardGrafico>
  )
}
