import { useMemo } from 'react'
import type { Lancamento, TipoMovimento } from '@/features/lancamentos/lancamento'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { ROTULO } from '@/shared/lib/estilos'
import { COR_RISCO } from '../cores'
import { naoPiora, riscoCom } from '../simulacao'
import { useRiscoDaConta } from '../useRisco'
import { DataForte, Forte, NomeNivel, SaldoForte } from './Destaques'
import { DesdeQuando, FraseFalta } from './MensagemRisco'
import { SeloRisco } from './SeloRisco'

interface EfeitoNoCaixaProps {
  /** Os lançamentos que o formulário salvaria; null enquanto faltam dados que mudam a conta (valor, data…). */
  simulados: Lancamento[] | null
  /** O lançamento em edição, que os simulados substituem. */
  substitui?: string
  tipo: TipoMovimento
  /** Caixa do lançamento: o efeito é no risco dele (benefício não tem risco). */
  caixaId: string
}

/**
 * O que o lançamento do formulário faz com o risco do caixa nos próximos 12 meses, antes de salvar.
 * Saídas sempre mostram o efeito; entradas, só quando melhoram o nível.
 */
export function EfeitoNoCaixa({ simulados, substitui, tipo, caixaId }: EfeitoNoCaixaProps) {
  const daConta = useRiscoDaConta(caixaId)
  const contexto = daConta?.contexto
  // O formulário recria os lançamentos a cada tecla; em texto, só recalcula quando a conta muda.
  const chave = simulados && JSON.stringify(simulados)

  const depois = useMemo(() => {
    if (!chave || !contexto) return null
    const novos: Lancamento[] = JSON.parse(chave)
    const lista = [...contexto.lancamentos.filter((l) => l.id !== substitui), ...novos]
    return riscoCom(contexto, lista)
  }, [chave, substitui, contexto])

  const atual = daConta?.atual
  if (!atual || !depois) return null
  const saldo = depois.menorSaldo
  const falta = saldo.valorCentavos < 0
  const piora = !naoPiora(depois, atual.nivel)
  const melhora = depois.nivel < atual.nivel
  if (tipo === 'entrada' && !melhora) return null
  const cores = COR_RISCO[depois.nivel]

  return (
    <CaixaDestaque fundo={cores.suave} faixa={cores.faixa}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={ROTULO}>Efeito no caixa · próximos 12 meses</span>
        <SeloRisco nivel={depois.nivel} />
      </div>
      <p aria-live="polite">
        {falta ? (
          <>
            <Forte className="text-negativo">Vai faltar dinheiro:</Forte> com este lançamento,{' '}
            <FraseFalta risco={depois} />.
          </>
        ) : piora ? (
          <>
            <Forte>O caixa aperta:</Forte> passa de <NomeNivel nivel={atual.nivel} /> para{' '}
            <NomeNivel nivel={depois.nivel} />
            <DesdeQuando risco={depois} />. Em <DataForte data={saldo.data} /> sobram{depois.nivel >= 4 && ' só'}{' '}
            <SaldoForte centavos={saldo.valorCentavos} />.
          </>
        ) : melhora ? (
          <>
            <Forte>O caixa melhora:</Forte> passa de <NomeNivel nivel={atual.nivel} /> para{' '}
            <NomeNivel nivel={depois.nivel} />.
          </>
        ) : (
          <>
            <Forte>O risco não muda:</Forte> seu caixa continua <NomeNivel nivel={depois.nivel} />. No dia mais apertado,{' '}
            <DataForte data={saldo.data} />, sobram <SaldoForte centavos={saldo.valorCentavos} />.
          </>
        )}
      </p>
      {piora && depois.nivel >= 4 && (
        <p className="text-foreground/85">
          Antes de assumir, veja se dá para adiar, dividir em mais parcelas ou cortar outro gasto.
        </p>
      )}
    </CaixaDestaque>
  )
}
