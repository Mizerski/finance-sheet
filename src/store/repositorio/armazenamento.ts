import type { DadosFinancas } from '../model/dados'
import type { AcaoFinancas, EstadoFinancas } from '../reducer/financas-reducer'

/** Onde os dados ficam salvos: no Supabase (web) ou num arquivo no computador (desktop). */
export interface Armazenamento {
  carregar: () => Promise<DadosFinancas>
  /**
   * Gravação do efeito de uma ação já aplicada na tela, para rodar na fila.
   * `antes` é o estado anterior à ação. Devolve null para ações que não são salvas.
   */
  gravacao: (acao: AcaoFinancas, antes: EstadoFinancas) => (() => Promise<void>) | null
}
