import { useMemo, useState } from 'react'
import { useNavigate, useRouterState, useSearch } from '@tanstack/react-router'
import { Landmark } from '@/shared/ui/icones'
import { CardBeneficio } from '@/features/caixas/components/CardBeneficio'
import { useVisao } from '@/features/caixas/useVisao'
import { DialogSaldoInicial } from '@/features/projecao/components/DialogSaldoInicial'
import { SeletorAno } from '@/features/projecao/components/SeletorAno'
import { useAno } from '@/features/projecao/useAno'
import { DialogLancamento } from '@/features/lancamentos/components/DialogLancamento'
import { ExcluirLancamento } from '@/features/lancamentos/components/ExcluirLancamento'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import { ResumoRiscoPlanilha } from '@/features/risco/components/ResumoRiscoPlanilha'
import { useRisco } from '@/features/risco/useRisco'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { useAtalhos } from '@/shared/hooks/useAtalhos'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { formatarData, paraDataISO, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useFinancas } from '@/store/financas-context'
import { DialogConferirSaldo } from './components/DialogConferirSaldo'
import { NavegacaoMeses } from './components/NavegacaoMeses'
import { PrimeirosPassos } from './components/PrimeirosPassos'
import { TabelaMes } from './components/TabelaMes'

/** Larguras em que cabem 2 e 3 meses lado a lado; as classes da grade repetem os mesmos breakpoints. */
const LAYOUT = {
  doisMeses: '(min-width: 64rem)',
  tresMeses: '(min-width: 90rem)',
  grade: 'lg:grid-cols-2 min-[90rem]:grid-cols-3',
}
const LAYOUT_COM_ECONOMIA = {
  doisMeses: '(min-width: 72rem)',
  tresMeses: '(min-width: 106rem)',
  grade: 'min-[72rem]:grid-cols-2 min-[106rem]:grid-cols-3',
}

/**
 * Sem `lancamento`, o dialog cria um novo na `data` clicada.
 * Os campos continuam guardados ao fechar, para o conteúdo não mudar durante a animação de saída.
 */
interface Edicao {
  aberto: boolean
  lancamento?: Lancamento
  data?: DataISO
}

export function PlanilhaPage() {
  // Categorias e a busca do lançamento a editar valem para todos os caixas; o resto é do que a tela mostra.
  const { estado } = useFinancas()
  const visao = useVisao()
  const { projecoes } = visao
  const { ano, anoAtual, intervalo } = useAno()
  const risco = useRisco()
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const [edicao, setEdicao] = useState<Edicao>({ aberto: false })
  const [exclusao, setExclusao] = useState<{ aberto: boolean; lancamento?: Lancamento }>({ aberto: false })
  const [editandoSaldo, setEditandoSaldo] = useState(false)
  const [conferindo, setConferindo] = useState(false)

  // Cada mês precisa de ~430px para os valores caberem com folga (~540px com a coluna Economia).
  const comEconomia = visao.metas.length > 0
  const layout = comEconomia ? LAYOUT_COM_ECONOMIA : LAYOUT
  const telaGrande = useMediaQuery(layout.tresMeses)
  const telaMedia = useMediaQuery(layout.doisMeses)
  const quantidade = telaGrande ? 3 : telaMedia ? 2 : 1
  const [hoje] = useState(() => paraDataISO(new Date()))
  const mesDeHoje = hoje.startsWith(String(ano)) ? Number(hoje.slice(5, 7)) - 1 : 0

  // Meses contados desde o ano zero, para a janela atravessar a virada do ano (dez → jan).
  // `mes` na URL é 1–12 (primeiro mês visível); sem ele, começa no mês atual.
  const primeiro = intervalo.min * 12
  const ultimo = intervalo.max * 12 + 11 - (quantidade - 1)
  const inicio = Math.min(Math.max(ano * 12 + (search.mes ?? mesDeHoje + 1) - 1, primeiro), ultimo)
  const visiveis = Array.from({ length: quantidade }, (_, i) => {
    const projecao = projecoes[Math.floor((inicio + i) / 12) - intervalo.min]
    return { projecao, resumo: projecao.meses[(inicio + i) % 12] }
  })
  const abertura = visiveis[0].projecao.resumo.saldoInicial

  const categorias = useMemo(
    () => new Map(estado.categorias.map((c) => [c.id, c])),
    [estado.categorias],
  )

  const editar = (lancamentoId: string) => {
    const lancamento = estado.lancamentos.find((l) => l.id === lancamentoId)
    if (lancamento) setEdicao({ aberto: true, lancamento })
  }

  const excluir = (lancamentoId: string) => {
    const lancamento = estado.lancamentos.find((l) => l.id === lancamentoId)
    if (lancamento) setExclusao({ aberto: true, lancamento })
  }

  const adicionar = (data: DataISO) => setEdicao({ aberto: true, data })

  // O ano na URL é o do primeiro mês visível; o ano atual fica fora da URL.
  const irPara = (absoluto: number) => {
    const novoAno = Math.floor(absoluto / 12)
    navigate({
      search: { mes: (absoluto % 12) + 1, ano: novoAno === anoAtual ? undefined : novoAno },
      replace: true,
    })
  }

  const irParaHoje = () => navigate({ search: { ano: undefined }, replace: true })

  // A planilha continua na tela enquanto outra página carrega; aí as setas já não são dela.
  const naPlanilha = useRouterState({ select: (s) => s.location.pathname === '/' })
  useAtalhos(
    {
      ArrowLeft: () => inicio > primeiro && irPara(inicio - 1),
      ArrowRight: () => inicio < ultimo && irPara(inicio + 1),
      t: irParaHoje,
    },
    naPlanilha,
  )

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina
        forma={FORMA_PAGINA.planilha}
        titulo={
          <>
            Planilha <span className="text-muted-foreground">{ano}</span>
          </>
        }
        descricao={
          abertura ? (
            <>
              Saldo inicial de{' '}
              <span className={`font-medium text-foreground ${VALOR_SALDO}`}>{formatarBRL(abertura.valorCentavos)}</span>{' '}
              em {formatarData(abertura.data)} · <BotaoSaldoInicial onClick={() => setEditandoSaldo(true)} />
            </>
          ) : (
            <>
              Sem dados antes de {formatarData(visao.dataInicial)} ·{' '}
              <BotaoSaldoInicial onClick={() => setEditandoSaldo(true)} />
            </>
          )
        }
        ajuda={
          <Ajuda titulo="Como usar a planilha">
            <p>
              <strong className="font-semibold">Clique em um dia</strong> para ver ou adicionar lançamentos.
            </p>
            <p>
              No teclado, <kbd className="font-semibold">←</kbd> e <kbd className="font-semibold">→</kbd> trocam de mês
              e <kbd className="font-semibold">T</kbd> volta para hoje.
            </p>
          </Ajuda>
        }
        acoes={
          // No celular: ano e "Hoje" numa linha, meses na linha de baixo com a largura toda.
          <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:flex-nowrap">
            <SeletorAno />
            <NavegacaoMeses
              className="order-last w-full md:order-none md:w-auto"
              meses={visiveis.map(({ projecao, resumo }) => ({ ano: projecao.ano, mes: resumo.mes }))}
              temAnterior={inicio > primeiro}
              temProximo={inicio < ultimo}
              onAnterior={() => irPara(inicio - 1)}
              onProximo={() => irPara(inicio + 1)}
            />
            <Button
              variant="outline"
              className={cn(BOTAO, 'ml-auto md:ml-0')}
              title="Voltar para hoje (atalho T)"
              onClick={irParaHoje}
            >
              Hoje
            </Button>
            <Button variant="outline" className={BOTAO} onClick={() => setConferindo(true)}>
              <Landmark aria-hidden />
              <span className="sm:hidden">Conferir</span>
              <span className="hidden sm:inline">Conferir saldo</span>
            </Button>
          </div>
        }
      />

      <PrimeirosPassos
        saldoDefinido={visao.saldoDefinido}
        temCategorias={estado.categorias.length > 0}
        temLancamentos={visao.lancamentos.length > 0}
        onDefinirSaldo={() => setEditandoSaldo(true)}
      />

      {risco && visao.lancamentos.length > 0 && (
        <ResumoRiscoPlanilha
          risco={risco}
          onMes={(mes) => irPara(Number(mes.slice(0, 4)) * 12 + Number(mes.slice(5, 7)) - 1)}
        />
      )}
      {/* Benefício não tem risco: a pergunta dele é quanto sobra até a recarga. */}
      {visao.ehBeneficio && visao.caixa && <CardBeneficio caixa={visao.caixa} />}

      <div className={cn('grid items-start gap-4', layout.grade)}>
        {visiveis.map(({ projecao, resumo }) => (
          <TabelaMes
            key={`${projecao.ano}-${resumo.mes}`}
            ano={projecao.ano}
            resumo={resumo}
            dias={projecao.dias.filter((d) => d.mes === resumo.mes)}
            hoje={hoje}
            categorias={categorias}
            onEditar={editar}
            onExcluir={excluir}
            onAdicionar={adicionar}
            comEconomia={comEconomia}
            nivelDoDia={risco?.nivelDoDia ?? null}
          />
        ))}
      </div>

      <DialogLancamento
        aberto={edicao.aberto}
        lancamento={edicao.lancamento}
        dataInicial={edicao.data}
        onOpenChange={(aberto) => setEdicao((e) => ({ ...e, aberto }))}
      />

      <ExcluirLancamento
        aberto={exclusao.aberto}
        lancamento={exclusao.lancamento}
        onOpenChange={(aberto) => setExclusao((e) => ({ ...e, aberto }))}
      />

      <DialogSaldoInicial aberto={editandoSaldo} onOpenChange={setEditandoSaldo} />

      <DialogConferirSaldo aberto={conferindo} onOpenChange={setConferindo} />
    </div>
  )
}

function BotaoSaldoInicial({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-foreground underline decoration-foreground/30 decoration-2 underline-offset-4 outline-none transition-colors hover:decoration-vermelho focus-visible:outline-2 focus-visible:outline-ring"
    >
      alterar saldo inicial
    </button>
  )
}
