import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { gastosPorCategoria, resumirAno } from '@/features/projecao/projecao'
import { useAno } from '@/features/projecao/useAno'
import { useProjecoes } from '@/features/projecao/useProjecao'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { anoDe, formatarData, paraDataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { VALOR_SALDO } from '@/shared/lib/estilos'
import { useFinancas } from '@/store/financas-context'
import { GraficoEntradasSaidas } from './components/GraficoEntradasSaidas'
import { GraficoGastosAno } from './components/GraficoGastosAno'
import { GraficoGastosCategoria } from './components/GraficoGastosCategoria'
import { GraficoSaldo } from './components/GraficoSaldo'
import { GraficoSobras } from './components/GraficoSobras'
import { Indicadores } from './components/Indicadores'
import { SeletorPeriodo } from './components/SeletorPeriodo'
import { gastosPorAno } from './graficos'
import {
  diasDoPeriodo,
  limitarPeriodo,
  NO_PERIODO,
  periodoDoAno,
  rotuloDoPeriodo,
  tipoDoPeriodo,
  type Periodo,
} from './periodo'
import { agrupamentoPara, agrupar, diasNoPeriodo } from './relatorio'

export function DashboardPage() {
  const { estado } = useFinancas()
  const { ano, anoAtual, intervalo } = useAno()
  const projecoes = useProjecoes()
  const search = useSearch({ from: '/dashboard' })
  const navigate = useNavigate({ from: '/dashboard' })
  const [hoje] = useState(() => paraDataISO(new Date()))

  // Sem ?de=&ate=, o relatório é o ano selecionado (o mesmo das outras telas).
  const { min, max } = intervalo
  const periodo = useMemo(
    () => limitarPeriodo(search.de && search.ate ? { de: search.de, ate: search.ate } : periodoDoAno(ano), { min, max }),
    [search.de, search.ate, ano, min, max],
  )
  const { de, ate } = periodo
  const unidade = agrupamentoPara(periodo)
  const noPeriodo = NO_PERIODO[tipoDoPeriodo(periodo)]

  const dias = useMemo(() => diasNoPeriodo(projecoes, periodo), [projecoes, periodo])
  const resumo = useMemo(() => resumirAno(dias), [dias])
  const grupos = useMemo(() => agrupar(dias, unidade), [dias, unidade])
  const anuais = useMemo(() => gastosPorAno(projecoes, estado.categorias), [projecoes, estado.categorias])
  const gastos = useMemo(() => gastosPorCategoria(dias, estado.categorias), [dias, estado.categorias])
  const abertura = resumo.saldoInicial

  // O ano das outras telas acompanha o início do período.
  const irPara = (novo: Periodo) =>
    navigate({
      search: { de: novo.de, ate: novo.ate, ano: anoDe(novo.de) === anoAtual ? undefined : anoDe(novo.de) },
      replace: true,
      resetScroll: false,
    })

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina
        titulo={
          <>
            Dashboard <span className="text-muted-foreground">{rotuloDoPeriodo(periodo)}</span>
          </>
        }
        descricao={
          abertura ? (
            <>
              Saldo inicial de{' '}
              <span className={`font-medium text-foreground ${VALOR_SALDO}`}>{formatarBRL(abertura.valorCentavos)}</span>{' '}
              em {formatarData(abertura.data)} · relatório até {formatarData(ate)} ({diasDoPeriodo(periodo)}{' '}
              {diasDoPeriodo(periodo) === 1 ? 'dia' : 'dias'})
            </>
          ) : (
            `Sem dados antes de ${formatarData(estado.config.dataSaldoInicial)}`
          )
        }
        acoes={<SeletorPeriodo periodo={periodo} intervalo={intervalo} hoje={hoje} onChange={irPara} />}
      />

      <Indicadores resumo={resumo} periodo={periodo} />

      <div className="grid gap-4 lg:grid-cols-2">
        <GraficoSaldo dados={grupos} unidade={unidade} />
        <GraficoEntradasSaidas dados={grupos} unidade={unidade} />
        <GraficoGastosCategoria gastos={gastos} noPeriodo={noPeriodo} />
        <GraficoSobras dados={grupos} unidade={unidade} />
        <GraficoGastosAno
          dados={anuais.dados}
          series={anuais.series}
          destaque={(a) => a >= anoDe(de) && a <= anoDe(ate)}
          anoAtual={anoAtual}
          onAno={(a) => irPara(periodoDoAno(a))}
        />
      </div>
    </div>
  )
}
