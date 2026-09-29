import { load, type Store } from '@tauri-apps/plugin-store'
import type { Armazenamento } from './armazenamento'
import {
  atualizarDados,
  estadoVazio,
  financasReducer,
  VERSAO_DADOS,
  type DadosFinancas,
  type DadosFinancasV1,
  type EstadoFinancas,
} from './estado'

/*
 * Desktop: tudo num arquivo JSON na pasta de dados do app
 * (no Windows, %APPDATA%\io.github.mizerski.projecaofinanceira\financas.json).
 */

export const ARQUIVO_DADOS = 'financas.json'

function soDados({ config, configDefinida, categorias, lancamentos, metas }: EstadoFinancas): DadosFinancas {
  return { config, configDefinida, categorias, lancamentos, metas }
}

export function criarArmazenamentoLocal(): Armazenamento {
  let arquivo: Promise<Store> | undefined
  const abrir = () => (arquivo ??= load(ARQUIVO_DADOS, { autoSave: false, defaults: {} }))

  // Cópia do que está salvo. Cada ação é aplicada nela na ordem do dispatch, então duas ações
  // seguidas não se perdem mesmo que a tela ainda não tenha renderizado entre elas.
  let salvo = soDados(estadoVazio())

  return {
    async carregar() {
      const store = await abrir()
      // Arquivos de versões anteriores são convertidos aqui e regravados no formato atual na próxima ação.
      const lido = await store.get<DadosFinancas | DadosFinancasV1>('dados')
      salvo = lido ? atualizarDados(lido) : soDados(estadoVazio())
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
