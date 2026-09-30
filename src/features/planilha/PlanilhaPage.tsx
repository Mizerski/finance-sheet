import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { DialogSaldoInicial } from '@/features/projecao/components/DialogSaldoInicial'
import { SeletorAno } from '@/features/projecao/components/SeletorAno'
import { useAno } from '@/features/projecao/useAno'
import { DialogLancamento } from '@/features/lancamentos/components/DialogLancamento'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import { useProjecoes } from '@/features/projecao/useProjecao'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { formatarData, paraDataISO, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useFinancas } from '@/store/financas-context'
import { NavegacaoMeses } from './components/NavegacaoMeses'
import { PrimeirosPassos } from './components/PrimeirosPassos'
import { TabelaMes } from './components/TabelaMes'

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
  const { estado } = useFinancas()
  const { ano, anoAtual, intervalo } = useAno()
  const projecoes = useProjecoes()
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const [edicao, setEdicao] = useState<Edicao>({ aberto: false })
  const [editandoSaldo, setEditandoSaldo] = useState(false)

  // Cada mês precisa de ~430px para os valores caberem com folga.
  const telaGrande = useMediaQuery('(min-width: 90rem)')
  const telaMedia = useMediaQuery('(min-width: 64rem)')
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

  const adicionar = (data: DataISO) => setEdicao({ aberto: true, data })

  // O ano na URL é o do primeiro mês visível; o ano atual fica fora da URL.
  const irPara = (absoluto: number) => {
    const novoAno = Math.floor(absoluto / 12)
    navigate({
      search: { mes: (absoluto % 12) + 1, ano: novoAno === anoAtual ? undefined : novoAno },
      replace: true,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina
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
              em {formatarData(abertura.data)} · <BotaoSaldoInicial onClick={() => setEditandoSaldo(true)} /> · clique
              em um dia para ver ou adicionar lançamentos
            </>
          ) : (
            <>
              Sem dados antes de {formatarData(estado.config.dataSaldoInicial)} ·{' '}
              <BotaoSaldoInicial onClick={() => setEditandoSaldo(true)} />
            </>
          )
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
              className={cn(BOTAO, 'ml-auto bg-card md:ml-0')}
              onClick={() => navigate({ search: { ano: undefined }, replace: true })}
            >
              Hoje
            </Button>
          </div>
        }
      />

      <PrimeirosPassos
        saldoDefinido={estado.configDefinida}
        temCategorias={estado.categorias.length > 0}
        temLancamentos={estado.lancamentos.length > 0}
        onDefinirSaldo={() => setEditandoSaldo(true)}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2 min-[90rem]:grid-cols-3">
        {visiveis.map(({ projecao, resumo }) => (
          <TabelaMes
            key={`${projecao.ano}-${resumo.mes}`}
            ano={projecao.ano}
            resumo={resumo}
            dias={projecao.dias.filter((d) => d.mes === resumo.mes)}
            hoje={hoje}
            categorias={categorias}
            onEditar={editar}
            onAdicionar={adicionar}
          />
        ))}
      </div>

      <DialogLancamento
        aberto={edicao.aberto}
        lancamento={edicao.lancamento}
        dataInicial={edicao.data}
        onOpenChange={(aberto) => setEdicao((e) => ({ ...e, aberto }))}
      />

      <DialogSaldoInicial aberto={editandoSaldo} onOpenChange={setEditandoSaldo} />
    </div>
  )
}

function BotaoSaldoInicial({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full text-foreground underline decoration-border underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      alterar saldo inicial
    </button>
  )
}
