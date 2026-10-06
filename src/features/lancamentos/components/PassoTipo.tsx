import { EscolhaGrande, type OpcaoGrande } from '@/shared/components/EscolhaGrande'
import { Forma } from '@/shared/components/Forma'
import { ArrowLeftRight } from '@/shared/ui/icones'
import { COR_ATIVA_TIPO } from '../constants/cores'
import type { TipoLancamento } from '../model/lancamento'
import type { Conhecido } from '../utils/conhecidos'
import { ResumoConhecido } from './SugestaoConhecido'

interface PassoTipoProps {
  rotuloId: string
  /** '' = ainda não respondeu (nada aparece escolhido). */
  valor: TipoLancamento | ''
  /** Com duas contas ou mais, o dinheiro também pode mudar de conta. */
  comTransferencia: boolean
  onEscolher: (tipo: TipoLancamento) => void
  /** Os lançamentos mais repetidos, para lançar de novo com tudo preenchido. */
  frequentes: Conhecido[]
  onRepetir: (conhecido: Conhecido) => void
}

/** Primeira pergunta: saiu, entrou ou mudou de conta. A cor já diz o tipo (vermelho saída, azul entrada). */
export function PassoTipo({ rotuloId, valor, comTransferencia, onEscolher, frequentes, onRepetir }: PassoTipoProps) {
  const forma = (tipo: TipoLancamento, desenho: 'quadrado' | 'circulo', cor: 'vermelho' | 'azul') => (
    <Forma forma={desenho} cor={valor === tipo ? 'papel' : cor} className="size-4" />
  )
  const opcoes: OpcaoGrande<TipoLancamento>[] = [
    {
      valor: 'saida',
      rotulo: 'Saiu dinheiro',
      descricao: 'Um gasto, uma conta paga, uma compra.',
      marca: forma('saida', 'quadrado', 'vermelho'),
      corAtiva: COR_ATIVA_TIPO.saida,
    },
    {
      valor: 'entrada',
      rotulo: 'Entrou dinheiro',
      descricao: 'Salário, um pagamento recebido, um presente.',
      marca: forma('entrada', 'circulo', 'azul'),
      corAtiva: COR_ATIVA_TIPO.entrada,
    },
    ...(comTransferencia
      ? [
          {
            valor: 'transferencia' as const,
            rotulo: 'Passou de uma conta para outra',
            descricao: 'Não é gasto nem ganho: o dinheiro só muda de lugar.',
            marca: <ArrowLeftRight className="size-6" />,
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-4">
      <EscolhaGrande rotuloId={rotuloId} valor={valor} opcoes={opcoes} onChange={onEscolher} />
      {frequentes.length > 0 && (
        <div className="flex flex-col gap-2 border-t-2 border-contorno pt-3">
          <span id={`${rotuloId}-repetir`} className="text-sm font-semibold">
            Ou repita um que você sempre lança:
          </span>
          <EscolhaGrande
            rotuloId={`${rotuloId}-repetir`}
            valor=""
            opcoes={frequentes.map((c) => ({
              valor: c.chave,
              rotulo: c.descricao,
              descricao: <ResumoConhecido conhecido={c} semNome />,
            }))}
            onChange={(chave) => {
              const c = frequentes.find((f) => f.chave === chave)
              if (c) onRepetir(c)
            }}
            className="sm:grid-cols-2"
          />
        </div>
      )}
    </div>
  )
}
