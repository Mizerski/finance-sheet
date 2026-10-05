import { useMemo, useState } from 'react'
import { Plus } from '@/shared/ui/icones'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { lancamentosDoCaixa, metasDoCaixa, NOME_TOTAL } from '@/features/caixas/model/caixa'
import { CardBeneficio } from '@/features/caixas/components/CardBeneficio'
import { CardCartao } from '@/features/caixas/components/CardCartao'
import { useEscolherCaixa, useVisao } from '@/features/caixas/hooks/useVisao'
import { useProjecoesDosCaixas } from '@/features/projecao/hooks/useProjecoesDosCaixas'
import { paraProjetar } from '@/features/projecao/utils/projecao'
import { useProjecao } from '@/features/projecao/hooks/useProjecao'
import { CardRisco } from '@/features/risco/components/CardRisco'
import { capacidadePorNivelDaVisao } from '@/features/risco/utils/risco-por-conta'
import type { ContextoRisco } from '@/features/risco/utils/simulacao'
import { useRisco } from '@/features/risco/hooks/useRisco'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { paraDataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CARD } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { useFinancas } from '@/store/context/financas-context'
import { resumirMeta } from './utils/aportes'
import { capacidadeDePoupanca, periodoDaCapacidade } from './utils/capacidade'
import { gastosGrandes } from './utils/gastos-grandes'
import { metaPrincipal } from './utils/marcos'
import { montarSugestoes } from './utils/sugestoes'
import { gastoEssencial, MESES_DE_RESERVA_PADRAO, metaDeReserva, NOME_RESERVA } from './utils/reserva'
import { CardCapacidade } from './components/CardCapacidade'
import { CardGastosGrandes } from './components/CardGastosGrandes'
import { CardMeta } from './components/CardMeta'
import { CardSobras } from './components/CardSobras'
import { DialogAportes } from './components/DialogAportes'
import { DialogResgate } from './components/DialogResgate'
import { CardReserva } from './components/CardReserva'
import { CardSugestoes } from './components/CardSugestoes'
import { DialogMeta } from './components/DialogMeta'
import type { SugestaoMeta } from './components/FormularioMeta'
import { temAlvo, type MetaEconomia } from './model/meta'

/** A meta continua guardada ao fechar, para o conteúdo não mudar durante a animação de saída. */
interface Selecao {
  aberto: boolean
  meta?: MetaEconomia
  /** Valores sugeridos pelo app (reserva de emergência). */
  sugestao?: SugestaoMeta
}

const FECHADO: Selecao = { aberto: false }

/**
 * Metas, reserva e capacidade são de contas: num benefício ou cartão, a tela só explica isso.
 * Olha os próximos meses a partir de hoje, sem depender do ano exibido.
 */
export function EconomiasPage() {
  const { caixa, ehBeneficio, ehCartao } = useVisao()
  const escolher = useEscolherCaixa()
  if (!ehBeneficio && !ehCartao) return <ConteudoEconomias />

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina forma={FORMA_PAGINA.economias} titulo="Economias" descricao={caixa?.nome} />
      {caixa && (ehCartao ? <CardCartao caixa={caixa} /> : <CardBeneficio caixa={caixa} />)}
      <Card className={CARD}>
        <EstadoVazio
          titulo="Metas ficam nas contas"
          descricao={
            ehCartao
              ? `${caixa?.nome} é um cartão de crédito: ele guarda o que você deve, não dinheiro. Metas, reserva e risco do caixa ficam nas contas (a fatura já entra no risco da conta que paga).`
              : `${caixa?.nome} é um benefício: o dinheiro dele só paga alguns gastos, então não dá para guardar dele. Metas, reserva e risco do caixa ficam nas contas.`
          }
          acao={
            <Button variant="outline" className={BOTAO} onClick={() => escolher(null)}>
              Ver o {NOME_TOTAL}
            </Button>
          }
        />
      </Card>
    </div>
  )
}

function ConteudoEconomias() {
  const { estado, dispatch } = useFinancas()
  const { metas, lancamentos, projecoes } = useVisao()
  const { ano, meses } = useProjecao()
  const { reserva: mesesDeReserva = MESES_DE_RESERVA_PADRAO } = useSearch({ from: '/economias' })
  const navigate = useNavigate({ from: '/economias' })
  const [hoje] = useState(() => paraDataISO(new Date()))
  const [edicao, setEdicao] = useState<Selecao>(FECHADO)
  const [ajuste, setAjuste] = useState<Selecao>(FECHADO)
  const [uso, setUso] = useState<Selecao>(FECHADO)
  const [exclusao, setExclusao] = useState<Selecao>(FECHADO)

  const resumos = useMemo(
    () => new Map(metas.map((m) => [m.id, resumirMeta(m, hoje)])),
    [metas, hoje],
  )
  const dias = useMemo(() => projecoes.flatMap((p) => p.dias), [projecoes])
  const capacidade = useMemo(() => capacidadeDePoupanca(dias, hoje), [dias, hoje])
  const risco = useRisco()
  const porNivel = useMemo(() => risco && capacidadePorNivelDaVisao(risco, hoje), [risco, hoje])
  const guardarSemPiorar = risco && porNivel ? porNivel[risco.nivel] : null
  const contaDoRisco = risco && (risco.caixa ?? risco.contas[0].caixa)
  const { faturas } = useProjecoesDosCaixas()
  const contextoRisco: ContextoRisco | null = useMemo(
    () =>
      contaDoRisco && {
        caixa: paraProjetar(contaDoRisco, faturas),
        lancamentos: lancamentosDoCaixa(estado.lancamentos, contaDoRisco.id),
        metas: metasDoCaixa(estado.metas, contaDoRisco.id),
        hoje,
      },
    [contaDoRisco, faturas, estado.lancamentos, estado.metas, hoje],
  )
  const essencial = useMemo(() => gastoEssencial(dias, estado.tags, hoje), [dias, estado.tags, hoje])
  const grandes = useMemo(() => gastosGrandes(dias, lancamentos, hoje), [dias, lancamentos, hoje])
  const reserva = metaDeReserva(metas)
  const principal = metaPrincipal(metas, resumos)
  const referencias = useMemo(
    () => new Map(risco?.contas.map((c) => [c.caixa.id, c.analise.referenciaCentavos])),
    [risco],
  )
  const sugestoes = useMemo(
    () =>
      montarSugestoes({
        caixas: estado.caixas.map((c) => paraProjetar(c, faturas)),
        lancamentos,
        metas,
        projecoes,
        referencias,
        resumos,
        hoje,
      }),
    [estado.caixas, faturas, lancamentos, metas, projecoes, referencias, resumos, hoje],
  )
  const guardado = [...resumos.values()].reduce((t, r) => t + r.guardadoCentavos, 0)
  const alvo = metas.every(temAlvo) ? metas.reduce((t, m) => t + (m.valorAlvoCentavos ?? 0), 0) : null
  const quantidade = metas.length
  const nova = () => setEdicao({ aberto: true })

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina
        forma={FORMA_PAGINA.economias}
        titulo="Economias"
        descricao={
          quantidade > 0 ? (
            <>
              {quantidade} {quantidade === 1 ? 'meta' : 'metas'} ·{' '}
              <span className="font-semibold text-foreground tabular-nums">{formatarBRL(guardado)}</span> guardados
              {alvo !== null && <> de {formatarBRL(alvo)}</>}
            </>
          ) : (
            'Separe dinheiro todo mês para um objetivo e acompanhe quanto já guardou'
          )
        }
        ajuda={
          quantidade > 0 && (
            <Ajuda titulo="Como as metas funcionam">
              <p>
                No dia combinado, o dinheiro guardado sai do saldo e aparece em amarelo na coluna Economia da planilha.
              </p>
            </Ajuda>
          )
        }
        acoes={
          <Button className={BOTAO} onClick={nova}>
            <Plus />
            Nova meta
          </Button>
        }
      />

      {quantidade === 0 ? (
        <Card className={CARD}>
          <EstadoVazio
            titulo="Nenhuma meta de economia ainda"
            descricao="Diga quanto quer juntar e quanto guardar por mês. No dia combinado, o app tira esse valor do saldo e mostra quanto falta."
            acao={
              <Button className={BOTAO} onClick={nova}>
                <Plus />
                Nova meta
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2 min-[90rem]:grid-cols-3">
          {metas.map((meta) => (
            <CardMeta
              key={meta.id}
              meta={meta}
              principal={meta.id === principal?.id && metas.length > 1}
              resumo={resumos.get(meta.id)!}
              hoje={hoje}
              destino={estado.caixas.find((c) => c.id === meta.destinoId)?.nome}
              onEditar={() => setEdicao({ aberto: true, meta })}
              onAjustar={() => setAjuste({ aberto: true, meta })}
              onUsar={() => setUso({ aberto: true, meta })}
              onRetomar={() => {
                const { encerradaEm: _fim, ...emAndamento } = meta
                dispatch({ tipo: 'meta/salvar', meta: emAndamento })
              }}
              onExcluir={() => setExclusao({ aberto: true, meta })}
            />
          ))}
        </div>
      )}

      {risco && contextoRisco && <CardRisco risco={risco} contexto={contextoRisco} />}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {capacidade && risco && porNivel && <CardCapacidade capacidade={capacidade} risco={risco} porNivel={porNivel} />}
        <CardSugestoes
          sugestoes={sugestoes}
          risco={risco}
          guardarSemPiorarCentavos={guardarSemPiorar}
          onAplicar={(meta) => dispatch({ tipo: 'meta/salvar', meta })}
          onNovaMeta={nova}
        />
        <CardReserva
          gasto={essencial}
          meses={mesesDeReserva}
          onMeses={(m) =>
            navigate({
              search: (s) => ({ ...s, reserva: m === MESES_DE_RESERVA_PADRAO ? undefined : m }),
              replace: true,
              resetScroll: false,
            })
          }
          existente={reserva && { meta: reserva, resumo: resumos.get(reserva.id)! }}
          onCriar={(alvoReserva) =>
            setEdicao({
              aberto: true,
              sugestao: {
                nome: NOME_RESERVA,
                valorAlvoCentavos: alvoReserva,
                aporteMensalCentavos: Math.min(guardarSemPiorar ?? 0, alvoReserva),
              },
            })
          }
          onAtualizarAlvo={(meta, alvoReserva) =>
            setEdicao({ aberto: true, meta, sugestao: { valorAlvoCentavos: alvoReserva } })
          }
        />
        <CardGastosGrandes
          gastos={grandes}
          fim={periodoDaCapacidade(hoje).fim}
          referenciaCentavos={risco?.referenciaCentavos ?? 0}
        />
      </div>

      <CardSobras ano={ano} meses={meses} />

      <DialogMeta
        aberto={edicao.aberto}
        meta={edicao.meta}
        sugestao={edicao.sugestao}
        onOpenChange={(aberto) => setEdicao((e) => ({ ...e, aberto }))}
      />
      <DialogAportes
        aberto={ajuste.aberto}
        meta={ajuste.meta}
        hoje={hoje}
        onOpenChange={(aberto) => setAjuste((e) => ({ ...e, aberto }))}
      />
      <DialogResgate
        aberto={uso.aberto}
        metaId={uso.meta?.id}
        hoje={hoje}
        onOpenChange={(aberto) => setUso((e) => ({ ...e, aberto }))}
      />
      <ConfirmarExclusao
        aberto={exclusao.aberto}
        onOpenChange={(aberto) => setExclusao((e) => ({ ...e, aberto }))}
        titulo="Excluir meta?"
        descricao={
          <>
            <span className="font-medium text-foreground">{exclusao.meta?.nome}</span> e os aportes dela saem da
            planilha e da projeção. Não dá para desfazer.
          </>
        }
        onConfirmar={() => exclusao.meta && dispatch({ tipo: 'meta/excluir', id: exclusao.meta.id })}
      />
    </div>
  )
}
