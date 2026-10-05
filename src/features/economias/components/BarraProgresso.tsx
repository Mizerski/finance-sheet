const MARCAS = [10, 20, 30, 40, 50, 60, 70, 80, 90]

/** Régua de quanto da meta já foi guardado (0 a 1): contorno preto, preenchimento amarelo e marcas a cada 10%. */
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
      className="relative h-5 w-full overflow-hidden border-2 border-contorno bg-card"
    >
      {percentual > 0 && (
        <div className="h-full border-r-2 border-contorno bg-amarelo" style={{ width: `${percentual * 100}%` }} />
      )}
      {MARCAS.map((m) => (
        <span key={m} aria-hidden className="absolute inset-y-0 w-px bg-contorno/35" style={{ left: `${m}%` }} />
      ))}
    </div>
  )
}
