import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { formatarData, paraDataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useFinancas } from '@/store/financas-context'
import { useAno } from '../useAno'
import { useProjecoes } from '../useProjecao'

/**
 * Saldo de hoje e saldo projetado no fim do ano selecionado, com o botão que oculta todos os saldos do app.
 * Os dois têm rótulo explícito para o saldo do fim do ano não ser lido como o saldo atual.
 */
export function SaldoProjetado() {
  const { estado, dispatch } = useFinancas()
  const { ano, intervalo } = useAno()
  const projecoes = useProjecoes()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const ocultos = estado.saldosOcultos

  const doAnoDeHoje = projecoes[Number(hoje.slice(0, 4)) - intervalo.min]
  const saldoHoje = doAnoDeHoje?.dias.find((d) => d.data === hoje)?.saldoCentavos ?? null
  const saldoFimDoAno = projecoes[ano - intervalo.min].resumo.saldoFinalCentavos

  // No <html>, para valer também em popovers e dialogs (renderizados em portal).
  useEffect(() => {
    document.documentElement.toggleAttribute('data-saldos-ocultos', ocultos)
  }, [ocultos])

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Saldo rotulo="Hoje" titulo={`Saldo no fim de hoje, ${formatarData(hoje)}`} centavos={saldoHoje} />
      <Saldo
        rotulo={`Fim de ${ano}`}
        titulo={`Saldo projetado em ${formatarData(`${ano}-12-31`)}`}
        centavos={saldoFimDoAno}
      />
      <Button
        variant="ghost"
        size="icon"
        className="-ml-1 rounded-full text-muted-foreground transition-colors hover:text-foreground"
        aria-label={ocultos ? 'Mostrar saldos' : 'Ocultar saldos'}
        aria-pressed={ocultos}
        onClick={() => dispatch({ tipo: 'saldos/alternarVisibilidade' })}
      >
        {ocultos ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  )
}

interface SaldoProps {
  rotulo: string
  titulo: string
  centavos: number | null
}

function Saldo({ rotulo, titulo, centavos }: SaldoProps) {
  return (
    <span className="flex flex-col" title={titulo}>
      <span className="text-[0.68rem] leading-tight tracking-wide whitespace-nowrap text-muted-foreground uppercase">
        {rotulo}
      </span>
      <span
        className={cn(
          'text-xs leading-tight font-medium tracking-tight whitespace-nowrap tabular-nums sm:text-[0.8125rem] sm:tracking-normal',
          VALOR_SALDO,
          centavos !== null && centavos < 0 && 'text-negativo',
        )}
      >
        {centavos === null ? '—' : formatarBRL(centavos)}
      </span>
    </span>
  )
}
