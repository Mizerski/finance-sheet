import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useVisao } from '@/features/caixas/useVisao'
import { resumirMeta } from '@/features/economias/aportes'
import { CardMetaPrincipal } from '@/features/economias/components/CardMetaPrincipal'
import { metaPrincipal, progressoDaMeta } from '@/features/economias/marcos'
import { diasDaPasta, gastosPorCategoria, gastosPorPasta, gastosPorTag, resumirAno, totalEvitavel } from '@/features/projecao/projecao'
import { useAno } from '@/features/projecao/useAno'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { anoDe, formatarData, paraDataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { VALOR_SALDO } from '@/shared/lib/estilos'
import { useFinancas } from '@/store/financas-context'
import { GraficoEntradasSaidas } from './components/GraficoEntradasSaidas'
import { GraficoGastosAno } from './components/GraficoGastosAno'
import { GraficoGastosCategoria } from './components/GraficoGastosCategoria'
import { GraficoGastosPasta } from './components/GraficoGastosPasta'
import { GraficoGastosTag } from './components/GraficoGastosTag'
import { GraficoSaldo } from './components/GraficoSaldo'
import { GraficoSobras } from './components/GraficoSobras'
import { Indicadores } from './components/Indicadores'
import { SeletorPeriodo } from './components/SeletorPeriodo'
import { gastosPorAno } from './graficos'
import {
  deslocar,
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
  // Categorias, tags e pastas são de todos os caixas; saldos, metas e gastos são do que a tela mostra.
  const { estado } = useFinancas()
  const { projecoes, projecoesDoRelatorio, metas, dataInicial, ehBeneficio } = useVisao()
  const { ano, anoAtual, intervalo } = useAno()
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
  // Gastos por categoria, tag e pasta: ver `projecoesDoRelatorio` (hoje, os mesmos caixas dos saldos).
  const diasGastos = useMemo(
    () => (projecoesDoRelatorio === projecoes ? dias : diasNoPeriodo(projecoesDoRelatorio, periodo)),
    [projecoesDoRelatorio, projecoes, dias, periodo],
  )
  const resumoGastos = useMemo(() => (diasGastos === dias ? resumo : resumirAno(diasGastos)), [diasGastos, dias, resumo])
  const anuais = useMemo(
    () => gastosPorAno(projecoesDoRelatorio, estado.categorias),
    [projecoesDoRelatorio, estado.categorias],
  )
  const gastos = useMemo(() => gastosPorCategoria(diasGastos, estado.categorias), [diasGastos, estado.categorias])
  const porTag = useMemo(() => gastosPorTag(diasGastos, estado.tags), [diasGastos, estado.tags])
  const porPasta = useMemo(() => gastosPorPasta(diasGastos, estado.pastas), [diasGastos, estado.pastas])
  // Sem ?pasta= (ou com uma pasta excluída), detalha a pasta que mais gastou no período.
  const pasta =
    estado.pastas.find((p) => p.id === search.pasta) ??
    estado.pastas.find((p) => p.id === porPasta.find((g) => g.pastaId)?.pastaId) ??
    estado.pastas[0]
  const categoriasDaPasta = useMemo(
    () => (pasta ? gastosPorCategoria(diasDaPasta(diasGastos, pasta.id, estado.pastas), estado.categorias) : []),
    [pasta, diasGastos, estado.pastas, estado.categorias],
  )
  const evitaveis = useMemo(() => {
    // Só compara com o período anterior se ele foi todo calculado (sem dias antes do saldo inicial).
    const anterior = deslocar(periodo, -1)
    const diasAnteriores = diasNoPeriodo(projecoesDoRelatorio, anterior)
    const comparavel =
      diasAnteriores.length === diasDoPeriodo(anterior) && diasAnteriores.every((d) => d.noCalculo)
    return {
      temTagEvitavel: estado.tags.some((t) => t.evitavel),
      totalCentavos: totalEvitavel(porTag),
      saidasCentavos: resumoGastos.totalSaidasCentavos,
      anteriorCentavos: comparavel ? totalEvitavel(gastosPorTag(diasAnteriores, estado.tags)) : null,
    }
  }, [periodo, projecoesDoRelatorio, porTag, resumoGastos, estado.tags])
  const abertura = resumo.saldoInicial

  // A meta em destaque olha para hoje, não para o período do relatório.
  const principal = useMemo(() => {
    const resumos = new Map(metas.map((m) => [m.id, resumirMeta(m, hoje)]))
    const meta = metaPrincipal(metas, resumos)
    return meta && { meta, resumo: resumos.get(meta.id)!, progresso: progressoDaMeta(meta, hoje) }
  }, [metas, hoje])

  // O ano das outras telas acompanha o início do período.
  const irPara = (novo: Periodo) =>
    navigate({
      search: (s) => ({ ...s, de: novo.de, ate: novo.ate, ano: anoDe(novo.de) === anoAtual ? undefined : anoDe(novo.de) }),
      replace: true,
      resetScroll: false,
    })

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina
        forma={FORMA_PAGINA.dashboard}
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
            `Sem dados antes de ${formatarData(dataInicial)}`
          )
        }
        acoes={<SeletorPeriodo periodo={periodo} intervalo={intervalo} hoje={hoje} onChange={irPara} />}
      />

      <Indicadores resumo={resumo} evitaveis={evitaveis} periodo={periodo} />

      {/* Benefício não tem metas: o card só convidaria a criar uma no lugar errado. */}
      {!ehBeneficio && <CardMetaPrincipal principal={principal} totalDeMetas={metas.length} hoje={hoje} />}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Saldo na largura toda: com o gráfico de tags, a grade fica sem buracos. */}
        <GraficoSaldo dados={grupos} unidade={unidade} className="lg:col-span-2" />
        <GraficoEntradasSaidas dados={grupos} unidade={unidade} />
        <GraficoSobras dados={grupos} unidade={unidade} />
        <GraficoGastosCategoria gastos={gastos} noPeriodo={noPeriodo} />
        <GraficoGastosTag gastos={porTag} temTags={estado.tags.length > 0} noPeriodo={noPeriodo} />
        <GraficoGastosPasta
          gastos={porPasta}
          pastas={estado.pastas}
          pasta={pasta}
          onPasta={(id) => navigate({ search: (s) => ({ ...s, pasta: id }), replace: true, resetScroll: false })}
          categoriasDaPasta={categoriasDaPasta}
          noPeriodo={noPeriodo}
          className="lg:col-span-2"
        />
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
