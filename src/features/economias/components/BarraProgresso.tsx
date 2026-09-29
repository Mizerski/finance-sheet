/** Barra simples de quanto da meta já foi guardado (0 a 1). */
export function BarraProgresso({ percentual, rotulo }: { percentual: number; rotulo: string }) {
  const inteiro = Math.round(percentual * 100)

  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={inteiro}
      aria-valuetext={`${inteiro}%`}
      className="h-2.5 w-full overflow-hidden rounded-full bg-economia-suave ring-1 ring-border"
    >
      <div className="h-full rounded-full bg-economia" style={{ width: `${percentual * 100}%` }} />
    </div>
  )
}
