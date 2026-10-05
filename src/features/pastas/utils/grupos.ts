import type { Lancamento } from '@/features/lancamentos/model/lancamento'
import { SEM_PASTA, type Pasta } from '../model/pasta'

/** Chave do grupo de lançamentos sem pasta (ou com pasta já excluída). */
export const CHAVE_SEM_PASTA = 'sem'

export interface GrupoPasta {
  /** Id da pasta ou CHAVE_SEM_PASTA. */
  chave: string
  nome: string
  cor: string
  lancamentos: Lancamento[]
  /** Projetado no ano (ou no período do filtro de data) para os lançamentos do grupo. */
  entradasCentavos: number
  saidasCentavos: number
}

/**
 * Separa os lançamentos por pasta, na ordem de cadastro das pastas, com "Sem pasta" no fim.
 * Pastas sem nenhum dos lançamentos ficam de fora. `totais` é o projetado por lançamento (no ano ou no período).
 */
export function agruparPorPasta(
  lancamentos: Lancamento[],
  pastas: Pasta[],
  totais: Map<string, number>,
): GrupoPasta[] {
  const ids = new Set(pastas.map((p) => p.id))
  const porChave = new Map<string, Lancamento[]>()
  for (const l of lancamentos) {
    const chave = l.pastaId && ids.has(l.pastaId) ? l.pastaId : CHAVE_SEM_PASTA
    porChave.set(chave, [...(porChave.get(chave) ?? []), l])
  }

  const ordem = [...pastas.map((p) => ({ chave: p.id, nome: p.nome, cor: p.cor })), { chave: CHAVE_SEM_PASTA, ...SEM_PASTA }]
  return ordem.flatMap(({ chave, nome, cor }) => {
    const doGrupo = porChave.get(chave)
    if (!doGrupo) return []
    const somar = (tipo: Lancamento['tipo']) =>
      doGrupo.reduce((t, l) => (l.tipo === tipo ? t + (totais.get(l.id) ?? 0) : t), 0)
    return [{ chave, nome, cor, lancamentos: doGrupo, entradasCentavos: somar('entrada'), saidasCentavos: somar('saida') }]
  })
}
