import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useProjecao, useProjecoes } from '@/features/projecao/useProjecao'
import { CardRisco } from '@/features/risco/components/CardRisco'
import { analisarRisco, capacidadePorNivel } from '@/features/risco/risco'
import type { ContextoRisco } from '@/features/risco/simulacao'
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
import { useFinancas } from '@/store/financas-context'
import { resumirMeta } from './aportes'
import { capacidadeDePoupanca, periodoDaCapacidade } from './capacidade'
import { gastosGrandes } from './gastos-grandes'
import { metaPrincipal } from './marcos'
import { montarSugestoes } from './sugestoes'
import { gastoEssencial, MESES_DE_RESERVA_PADRAO, metaDeReserva, NOME_RESERVA } from './reserva'
import { CardCapacidade } from './components/CardCapacidade'
import { CardGastosGrandes } from './components/CardGastosGrandes'
import { CardMeta } from './components/CardMeta'
import { CardSobras } from './components/CardSobras'
import { DialogAportes } from './components/DialogAportes'
import { CardReserva } from './components/CardReserva'
import { CardSugestoes } from './components/CardSugestoes'
import { DialogMeta } from './components/DialogMeta'
import type { SugestaoMeta } from './components/FormularioMeta'
import type { MetaEconomia } from './meta'

/** A meta continua guardada ao fechar, para o conteúdo não mudar durante a animação de saída. */
interface Selecao {
  aberto: boolean
  meta?: MetaEconomia
  /** Valores sugeridos pelo app (reserva de emergência). */
  sugestao?: SugestaoMeta
}

const FECHADO: Selecao = { aberto: false }

export function EconomiasPage() {
  const { estado, dispatch } = useFinancas()
  const { ano, meses } = useProjecao()
  const projecoes = useProjecoes()
  const { reserva: mesesDeReserva = MESES_DE_RESERVA_PADRAO } = useSearch({ from: '/economias' })
  const navigate = useNavigate({ from: '/economias' })
  const [hoje] = useState(() => paraDataISO(new Date()))
  const [edicao, setEdicao] = useState<Selecao>(FECHADO)
  const [ajuste, setAjuste] = useState<Selecao>(FECHADO)
  const [exclusao, setExclusao] = useState<Selecao>(FECHADO)

  const resumos = useMemo(
    () => new Map(estado.metas.map((m) => [m.id, resumirMeta(m, hoje)])),
    [estado.metas, hoje],
  )
  // Independe do ano exibido: capacidade, reserva e gastos grandes olham os próximos meses a partir de hoje.
  const dias = useMemo(() => projecoes.flatMap((p) => p.dias), [projecoes])
  const capacidade = useMemo(() => capacidadeDePoupanca(dias, hoje), [dias, hoje])
  const risco = useMemo(() => analisarRisco(dias, hoje), [dias, hoje])
  const porNivel = useMemo(
    () => risco && capacidadePorNivel(dias, hoje, risco.referenciaCentavos),
    [dias, hoje, risco],
  )
  // O que dá para guardar a mais sem piorar o risco do caixa: é o valor que o app recomenda.
  const guardarSemPiorar = risco && porNivel ? porNivel[risco.nivel] : null
  const contextoRisco: ContextoRisco = useMemo(
    () => ({ config: estado.config, lancamentos: estado.lancamentos, metas: estado.metas, hoje }),
    [estado.config, estado.lancamentos, estado.metas, hoje],
  )
  const essencial = useMemo(() => gastoEssencial(dias, estado.tags, hoje), [dias, estado.tags, hoje])
  const grandes = useMemo(() => gastosGrandes(dias, estado.lancamentos, hoje), [dias, estado.lancamentos, hoje])
  const reserva = metaDeReserva(estado.metas)
  const principal = metaPrincipal(estado.metas, resumos)
  const sugestoes = useMemo(
    () =>
      montarSugestoes({
        config: estado.config,
        lancamentos: estado.lancamentos,
        metas: estado.metas,
        projecoes,
        resumos,
        hoje,
      }),
    [estado.config, estado.lancamentos, estado.metas, projecoes, resumos, hoje],
  )
  const guardado = [...resumos.values()].reduce((t, r) => t + r.guardadoCentavos, 0)
  const alvo = estado.metas.reduce((t, m) => t + m.valorAlvoCentavos, 0)
  const quantidade = estado.metas.length
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
              <span className="font-semibold text-foreground tabular-nums">{formatarBRL(guardado)}</span> guardados de{' '}
              {formatarBRL(alvo)}
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
          {estado.metas.map((meta) => (
            <CardMeta
              key={meta.id}
              meta={meta}
              principal={meta.id === principal?.id && estado.metas.length > 1}
              resumo={resumos.get(meta.id)!}
              hoje={hoje}
              onEditar={() => setEdicao({ aberto: true, meta })}
              onAjustar={() => setAjuste({ aberto: true, meta })}
              onExcluir={() => setExclusao({ aberto: true, meta })}
            />
          ))}
        </div>
      )}

      {/* O risco vem antes das sugestões: nenhuma recomendação de guardar mais sem mostrar o aperto do caixa. */}
      {risco && <CardRisco risco={risco} contexto={contextoRisco} />}

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
                // Começa pelo que cabe sem piorar o risco; o diagnóstico do formulário confere no dia do aporte.
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
