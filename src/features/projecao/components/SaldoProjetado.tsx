import { useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { formatarData } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useFinancas } from '@/store/financas-context'
import { useProjecao } from '../useProjecao'

/** Saldo final projetado do ano selecionado, com o botão que oculta todos os saldos do app. */
export function SaldoProjetado() {
  const { estado, dispatch } = useFinancas()
  const { ano, resumo } = useProjecao()
  const ocultos = estado.saldosOcultos
  const saldo = resumo.saldoFinalCentavos

  // No <html>, para valer também em popovers e dialogs (renderizados em portal).
  useEffect(() => {
    document.documentElement.toggleAttribute('data-saldos-ocultos', ocultos)
  }, [ocultos])

  return (
    <div className="flex items-center gap-1 text-[0.8125rem]">
      <span
        className="flex items-center gap-1.5"
        title={`Saldo projetado em ${formatarData(`${ano}-12-31`)}`}
      >
        {/* Em telas menores o ano fica só no título da página e no title, para o cabeçalho caber numa linha. */}
        <span className="whitespace-nowrap text-muted-foreground">
          Saldo<span className="hidden lg:inline"> {ano}</span>
        </span>
        <span className={cn('font-medium whitespace-nowrap tabular-nums', VALOR_SALDO, saldo !== null && saldo < 0 && 'text-negativo')}>
          {saldo === null ? '—' : formatarBRL(saldo)}
        </span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
        aria-label={ocultos ? 'Mostrar saldos' : 'Ocultar saldos'}
        aria-pressed={ocultos}
        onClick={() => dispatch({ tipo: 'saldos/alternarVisibilidade' })}
      >
        {ocultos ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  )
}
