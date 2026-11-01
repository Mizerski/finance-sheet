import { useState } from 'react'
import { Forma } from '@/shared/components/Forma'
import type { DataISO } from '@/shared/lib/datas'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import type { Atividade } from '../model/atividade'
import { FORMA_ATIVIDADE, ROTULO_ATIVIDADE } from '../constants/textos'
import { agruparPorDia, horaDaAtividade, rotuloDoDia } from '../utils/grupos'
import { DialogExtratoAtividade } from './DialogExtratoAtividade'
import { TextoAtividade } from './TextoAtividade'

interface ListaAtividadesProps {
  /** Já na ordem de exibição (a mais nova primeiro). */
  atividades: Atividade[]
  hoje: DataISO
}

/**
 * Atividades agrupadas por dia ("Hoje", "Ontem", "sábado, 31/10/2026"), cada linha com hora, forma e a frase.
 * A linha toda é um botão que abre o extrato do registro.
 */
export function ListaAtividades({ atividades, hoje }: ListaAtividadesProps) {
  const [aberta, setAberta] = useState<{ atividade?: Atividade; aberto: boolean }>({ aberto: false })

  return (
    <div className="flex flex-col">
      {agruparPorDia(atividades).map((dia) => (
        <section key={dia.data} aria-label={rotuloDoDia(dia.data, hoje)}>
          <h3 className={cn(ROTULO, 'border-b-2 border-contorno bg-muted px-4 py-2 font-semibold sm:px-5')}>
            {rotuloDoDia(dia.data, hoje)}
          </h3>
          <ol className="flex flex-col">
            {dia.atividades.map((a) => (
              <li key={a.id} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => setAberta({ atividade: a, aberto: true })}
                  className="flex w-full cursor-pointer items-baseline gap-3 px-4 py-2.5 text-left transition-colors duration-100 hover:bg-foreground/6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-5"
                >
                  <time dateTime={a.em} className="w-10 shrink-0 text-xs text-muted-foreground tabular-nums">
                    {horaDaAtividade(a)}
                  </time>
                  <Forma {...FORMA_ATIVIDADE[a.tipo]} className="size-2.5" />
                  <span className="sr-only">{ROTULO_ATIVIDADE[a.tipo]}:</span>
                  <TextoAtividade atividade={a} />
                </button>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <DialogExtratoAtividade
        atividade={aberta.atividade}
        hoje={hoje}
        aberto={aberta.aberto}
        onOpenChange={(aberto) => setAberta((atual) => ({ ...atual, aberto }))}
      />
    </div>
  )
}
