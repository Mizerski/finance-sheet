import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarData, somarDias } from '@/shared/lib/datas'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import type { VigenciaEstado } from '../hooks/useVigencia'

const OPCOES_VIGENCIA = [
  { valor: 'daqui' as const, rotulo: 'Daqui para frente' },
  { valor: 'sempre' as const, rotulo: 'Desde o início' },
]

interface CampoVigenciaProps {
  id: string
  v: VigenciaEstado
  /** Mostra o erro da data (depois de tentar salvar). */
  mostrarErro: boolean
}

/** "Este lançamento já aconteceu. A mudança vale…": só aparece quando `v.perguntar`. */
export function CampoVigencia({ id, v, mostrarErro }: CampoVigenciaProps) {
  if (!v.perguntar) return null
  const erro = mostrarErro ? v.erro : undefined

  return (
    <Field data-invalid={!!erro || undefined} className="border-2 border-l-8 border-contorno border-l-amarelo p-4">
      <FieldLabel htmlFor={id}>Este lançamento já aconteceu. A mudança vale</FieldLabel>
      <ControleSegmentado id={id} rotulo="A mudança vale" valor={v.vigencia} opcoes={OPCOES_VIGENCIA} onChange={v.setVigencia} />
      {v.vigencia === 'daqui' ? (
        <>
          <SeletorData id={`${id}-a-partir-de`} valor={v.aPartirDe} onChange={(d) => d && v.setAPartirDe(d)} invalido={!!erro} />
          {erro ? (
            <FieldError>{erro}</FieldError>
          ) : (
            <FieldDescription>
              Até {formatarData(somarDias(v.aPartirDe, -1))} continua como antes; o lançamento vira dois na lista.
            </FieldDescription>
          )}
        </>
      ) : (
        <FieldDescription>Os meses que já passaram também mudam, e o saldo deles é recalculado.</FieldDescription>
      )}
    </Field>
  )
}
