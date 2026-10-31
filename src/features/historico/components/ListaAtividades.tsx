import { Forma } from '@/shared/components/Forma'
import type { DataISO } from '@/shared/lib/datas'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import type { Atividade } from '../model/atividade'
import { FORMA_ATIVIDADE, ROTULO_ATIVIDADE } from '../constants/textos'
import { agruparPorDia, horaDaAtividade, rotuloDoDia } from '../utils/grupos'
import { TextoAtividade } from './TextoAtividade'

interface ListaAtividadesProps {
  /** Já na ordem de exibição (a mais nova primeiro). */
  atividades: Atividade[]
  hoje: DataISO
}

/** Atividades agrupadas por dia ("Hoje", "Ontem", "sábado, 31/10/2026"), cada linha com hora, forma e a frase. */
export function ListaAtividades({ atividades, hoje }: ListaAtividadesProps) {
  return (
    <div className="flex flex-col">
      {agruparPorDia(atividades).map((dia) => (
        <section key={dia.data} aria-label={rotuloDoDia(dia.data, hoje)}>
          <h3 className={cn(ROTULO, 'border-b-2 border-contorno bg-muted px-4 py-2 font-semibold sm:px-5')}>
            {rotuloDoDia(dia.data, hoje)}
          </h3>
          <ol className="flex flex-col">
            {dia.atividades.map((a) => (
              <li key={a.id} className="flex items-baseline gap-3 border-b border-border px-4 py-2.5 last:border-b-0 sm:px-5">
                <time dateTime={a.em} className="w-10 shrink-0 text-xs text-muted-foreground tabular-nums">
                  {horaDaAtividade(a)}
                </time>
                <Forma {...FORMA_ATIVIDADE[a.tipo]} className="size-2.5" />
                <span className="sr-only">{ROTULO_ATIVIDADE[a.tipo]}:</span>
                <TextoAtividade atividade={a} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
