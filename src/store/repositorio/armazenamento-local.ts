import { load, type Store } from '@tauri-apps/plugin-store'
import type { Armazenamento } from './armazenamento'
import { atualizarDados, VERSAO_DADOS, type DadosFinancas, type DadosFinancasSalvos } from '../model/dados'
import { estadoVazio, financasReducer, type EstadoFinancas } from '../reducer/financas-reducer'

export const ARQUIVO_DADOS = 'financas.json'

function soDados(estado: EstadoFinancas): DadosFinancas {
  const { caixas, categorias, lancamentos, metas, tags, pastas } = estado
  return { caixas, categorias, lancamentos, metas, tags, pastas }
}

/**
 * Desktop: tudo no `financas.json` da pasta de dados do app, convertido ao carregar se for de versão anterior.
 * Cada ação é aplicada numa cópia do que está salvo, para duas ações seguidas não se perderem.
 */
export function criarArmazenamentoLocal(): Armazenamento {
  let arquivo: Promise<Store> | undefined
  const abrir = () => (arquivo ??= load(ARQUIVO_DADOS, { autoSave: false, defaults: {} }))

  let salvo = soDados(estadoVazio())

  return {
    async carregar() {
      const store = await abrir()
      const lido = await store.get<DadosFinancasSalvos>('dados')
      salvo = atualizarDados(lido ?? soDados(estadoVazio()))
      return salvo
    },
    gravacao(acao) {
      if (acao.tipo === 'dados/carregar' || acao.tipo === 'saldos/alternarVisibilidade') return null
      salvo = soDados(financasReducer({ ...estadoVazio(), ...salvo }, acao))
      const dados = salvo
      return async () => {
        const store = await abrir()
        await store.set('versao', VERSAO_DADOS)
        await store.set('dados', dados)
        await store.save()
      }
    },
  }
}
