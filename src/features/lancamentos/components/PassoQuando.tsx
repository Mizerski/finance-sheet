import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { EscolhaGrande } from '@/shared/components/EscolhaGrande'
import { MaisDetalhes } from '@/shared/components/MaisDetalhes'
import { SeletorData } from '@/shared/components/SeletorData'
import type { DataISO } from '@/shared/lib/datas'
import { CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { ROTULO_NATUREZA } from '../constants/textos'
import type { Natureza } from '../model/lancamento'
import { type AlterarRascunho, type ErrosLancamento, type RascunhoLancamento } from '../utils/formulario'
import { CampoPasta } from './CampoPasta'
import { CampoDuracao } from './CampoDuracao'
import { SeletorDiasSemana } from './SeletorDiasSemana'

interface PassoQuandoProps {
  rotuloId: string
  rascunho: RascunhoLancamento
  erros: ErrosLancamento
  hoje: DataISO
  alterar: AlterarRascunho
  onRecorrencia: (recorrencia: RascunhoLancamento['recorrencia']) => void
  /** Muda o começo (no mensal, o dia do mês vai junto). */
  onInicio: (inicio: DataISO | undefined) => void
  onNatureza: (natureza: Natureza) => void
}

const OPCOES_RECORRENCIA = [
  { valor: 'unica' as const, rotulo: 'Uma vez só' },
  { valor: 'mensal' as const, rotulo: 'Todo mês' },
  { valor: 'semanal' as const, rotulo: 'Toda semana' },
  { valor: 'diaria' as const, rotulo: 'Todo dia' },
]
const OPCOES_NATUREZA = (['fixa', 'variavel'] as const).map((valor) => ({ valor, rotulo: ROTULO_NATUREZA[valor] }))
const OPCOES_DIAS = [
  { valor: 'todos' as const, rotulo: 'Todos os dias' },
  { valor: 'uteis' as const, rotulo: 'Dias úteis' },
]

/**
 * Quando acontece: a repetição em cartões e, embaixo, só o campo que ela pede (data, dia do mês, dias da semana).
 * No recorrente, quando começa e até quando (vezes ou data); pasta e fixo/variável ficam em "Mais opções".
 */
export function PassoQuando({ rotuloId, rascunho, erros, hoje, alterar, onRecorrencia, onNatureza, onInicio }: PassoQuandoProps) {
  const r = rascunho
  const recorrente = r.recorrencia !== 'unica'
  const transferencia = r.tipo === 'transferencia'

  return (
    <div className="flex flex-col gap-4">
      <EscolhaGrande
        rotuloId={rotuloId}
        valor={r.recorrencia}
        opcoes={OPCOES_RECORRENCIA}
        onChange={onRecorrencia}
        className="grid-cols-2"
      />

      {r.recorrencia === 'unica' && (
        <Field data-invalid={!!erros.data || undefined}>
          <FieldLabel htmlFor="passo-data">Em que dia?</FieldLabel>
          <SeletorData id="passo-data" valor={r.data} onChange={(v) => alterar('data', v)} invalido={!!erros.data} />
          <FieldError>{erros.data}</FieldError>
        </Field>
      )}

      {r.recorrencia === 'mensal' && !r.inicio && (
        <Field data-invalid={!!erros.diaDoMes || undefined}>
          <FieldLabel htmlFor="passo-dia">Em que dia do mês?</FieldLabel>
          <Input
            id="passo-dia"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={r.diaDoMes}
            onChange={(e) => alterar('diaDoMes', e.target.value)}
            aria-invalid={!!erros.diaDoMes || undefined}
            className={cn(CAMPO, 'h-12 w-32 text-base tabular-nums')}
          />
          {erros.diaDoMes ? (
            <FieldError>{erros.diaDoMes}</FieldError>
          ) : (
            <FieldDescription>Se o mês não tiver esse dia, usa o último.</FieldDescription>
          )}
        </Field>
      )}

      {r.recorrencia === 'semanal' && (
        <Field data-invalid={!!erros.diasDaSemana || undefined}>
          <FieldLabel id="passo-dias-semana">Em quais dias?</FieldLabel>
          <SeletorDiasSemana
            rotuloId="passo-dias-semana"
            valor={r.diasDaSemana}
            onChange={(v) => alterar('diasDaSemana', v)}
            invalido={!!erros.diasDaSemana}
          />
          <FieldError>{erros.diasDaSemana}</FieldError>
        </Field>
      )}

      {r.recorrencia === 'diaria' && (
        <Field>
          <FieldLabel htmlFor="passo-dias">Quais dias?</FieldLabel>
          <ControleSegmentado
            id="passo-dias"
            rotulo="Quais dias"
            valor={r.apenasDiasUteis ? 'uteis' : 'todos'}
            opcoes={OPCOES_DIAS}
            onChange={(v) => alterar('apenasDiasUteis', v === 'uteis')}
          />
          <FieldDescription>Dias úteis são de segunda a sexta, sem contar feriados.</FieldDescription>
        </Field>
      )}

      {recorrente && (
        <CampoDuracao id="passo" rascunho={r} erros={erros} hoje={hoje} alterar={alterar} onInicio={onInicio} />
      )}

      <MaisDetalhes rotulo="Mais opções" rotuloAberto="Esconder opções" className="border-t-2 border-contorno pt-3">
        {!transferencia && (
          <Field>
            <FieldLabel htmlFor="passo-natureza">Fixo ou variável?</FieldLabel>
            <ControleSegmentado
              id="passo-natureza"
              rotulo="Fixo ou variável"
              valor={r.natureza}
              opcoes={OPCOES_NATUREZA}
              onChange={onNatureza}
            />
            <FieldDescription>Fixo é o que se repete igual, como o aluguel; variável muda, como o mercado.</FieldDescription>
          </Field>
        )}

        <CampoPasta id="passo-pasta" valor={r.pastaId} onChange={(id) => alterar('pastaId', id)} />

      </MaisDetalhes>
    </div>
  )
}
