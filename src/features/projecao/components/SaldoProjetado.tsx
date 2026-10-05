import { useEffect, useState } from 'react'
import { Eye, EyeOff } from '@/shared/ui/icones'
import { useGuardadoSeparado } from '@/features/economias/hooks/useGuardado'
import { formatarData, paraDataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { ROTULO, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useFinancas } from '@/store/context/financas-context'
import { useAno } from '../hooks/useAno'
import { useProjecoes } from '../hooks/useProjecao'

/** Saldo de hoje e do fim do ano, com o botão que oculta todos os saldos do app (até em popovers e dialogs). */
export function SaldoProjetado() {
  const { estado, dispatch } = useFinancas()
  const { ano, intervalo } = useAno()
  const projecoes = useProjecoes()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const ocultos = estado.saldosOcultos
  const separado = useGuardadoSeparado(hoje)

  const doAnoDeHoje = projecoes[Number(hoje.slice(0, 4)) - intervalo.min]
  const saldoHoje = doAnoDeHoje?.dias.find((d) => d.data === hoje)?.saldoCentavos ?? null
  const saldoFimDoAno = projecoes[ano - intervalo.min].resumo.saldoFinalCentavos

  useEffect(() => {
    document.documentElement.toggleAttribute('data-saldos-ocultos', ocultos)
  }, [ocultos])

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Saldo
        rotulo="Hoje"
        titulo={
          separado > 0 && !ocultos
            ? `Disponível no fim de hoje, ${formatarData(hoje)}. Além dele, ${formatarBRL(separado)} separados nas metas.`
            : `Saldo no fim de hoje, ${formatarData(hoje)}`
        }
        centavos={saldoHoje}
      />
      <span aria-hidden className="h-7 w-0.5 bg-contorno" />
      <Saldo
        rotulo={`Fim de ${ano}`}
        titulo={`Saldo projetado em ${formatarData(`${ano}-12-31`)}`}
        centavos={saldoFimDoAno}
      />
      <Button
        variant="ghost"
        size="icon"
        className="-ml-1 size-8 rounded-full text-muted-foreground transition-colors hover:text-foreground sm:size-9"
        aria-label={ocultos ? 'Mostrar saldos' : 'Ocultar saldos'}
        aria-pressed={ocultos}
        onClick={() => dispatch({ tipo: 'saldos/alternarVisibilidade' })}
      >
        {ocultos ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
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
      <span className={cn(ROTULO, 'leading-tight whitespace-nowrap text-muted-foreground')}>
        {rotulo}
      </span>
      <span
        className={cn(
          'text-xs leading-tight font-semibold tracking-tight whitespace-nowrap tabular-nums sm:text-sm sm:tracking-normal',
          VALOR_SALDO,
          centavos !== null && centavos < 0 && 'text-negativo',
        )}
      >
        {centavos === null ? '—' : formatarBRL(centavos)}
      </span>
    </span>
  )
}
