import { CampoCaixa } from '@/features/caixas/components/CampoCaixa'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import type { AlterarRascunho, ErrosLancamento, RascunhoLancamento } from '../utils/formulario'
import { SugestaoConhecido } from './SugestaoConhecido'

interface PassoValorProps {
  rascunho: RascunhoLancamento
  erros: ErrosLancamento
  alterar: AlterarRascunho
  /** "Usar" na sugestão de um lugar conhecido: o rascunho já preenchido como da última vez. */
  onUsarConhecido: (rascunho: RascunhoLancamento) => void
}

/** Quanto e o quê. O valor vem primeiro e grande; a conta só aparece com duas ou mais (a transferência pergunta depois). */
export function PassoValor({ rascunho, erros, alterar, onUsarConhecido }: PassoValorProps) {
  const transferencia = rascunho.tipo === 'transferencia'

  return (
    <div className="flex flex-col gap-4">
      <Field data-invalid={!!erros.valorCentavos || undefined}>
        <FieldLabel htmlFor="passo-valor">Valor</FieldLabel>
        <CampoDinheiro
          id="passo-valor"
          autoFocus
          centavos={rascunho.valorCentavos}
          onChange={(c) => alterar('valorCentavos', c)}
          aria-invalid={!!erros.valorCentavos || undefined}
          className="h-14 text-2xl font-semibold tabular-nums md:text-2xl"
        />
        <FieldError>{erros.valorCentavos}</FieldError>
      </Field>

      <Field data-invalid={!!erros.descricao || undefined}>
        <FieldLabel htmlFor="passo-descricao">{transferencia ? 'Para quê?' : 'O que foi?'}</FieldLabel>
        <Input
          id="passo-descricao"
          value={rascunho.descricao}
          onChange={(e) => alterar('descricao', e.target.value)}
          placeholder={transferencia ? 'Ex.: Guardar na poupança' : rascunho.tipo === 'entrada' ? 'Ex.: Salário' : 'Ex.: Mercado'}
          aria-invalid={!!erros.descricao || undefined}
          className={cn(CAMPO, 'h-12 text-base')}
        />
        <FieldError>{erros.descricao}</FieldError>
      </Field>

      <SugestaoConhecido rascunho={rascunho} onUsar={onUsarConhecido} />

      {!transferencia && (
        <CampoCaixa
          id="passo-caixa"
          rotulo={rascunho.tipo === 'entrada' ? 'Entrou em qual conta?' : 'Saiu de qual conta?'}
          valor={rascunho.caixaId}
          onChange={(id) => alterar('caixaId', id)}
        />
      )}
    </div>
  )
}
