import { load, type Store } from '@tauri-apps/plugin-store'
import type { Armazenamento } from './armazenamento'
import { estadoVazio, financasReducer, type DadosFinancas, type EstadoFinancas } from './estado'

/*
 * Desktop: tudo num arquivo JSON na pasta de dados do app
 * (no Windows, %APPDATA%\io.github.mizerski.projecaofinanceira\financas.json).
 */

const ARQUIVO = 'financas.json'
/** Formato do arquivo; aumente e converta os dados antigos ao carregar se o formato mudar. */
const VERSAO = 1

function soDados({ config, configDefinida, categorias, lancamentos }: EstadoFinancas): DadosFinancas {
  return { config, configDefinida, categorias, lancamentos }
}

export function criarArmazenamentoLocal(): Armazenamento {
  let arquivo: Promise<Store> | undefined
  const abrir = () => (arquivo ??= load(ARQUIVO, { autoSave: false, defaults: {} }))

  // Cópia do que está salvo. Cada ação é aplicada nela na ordem do dispatch, então duas ações
  // seguidas não se perdem mesmo que a tela ainda não tenha renderizado entre elas.
  let salvo = soDados(estadoVazio())

  return {
    async carregar() {
      const store = await abrir()
      salvo = (await store.get<DadosFinancas>('dados')) ?? soDados(estadoVazio())
      return salvo
    },
    gravacao(acao) {
      if (acao.tipo === 'dados/carregar' || acao.tipo === 'saldos/alternarVisibilidade') return null
      salvo = soDados(financasReducer({ ...estadoVazio(), ...salvo }, acao))
      const dados = salvo
      return async () => {
        const store = await abrir()
        await store.set('versao', VERSAO)
        await store.set('dados', dados)
        await store.save()
      }
    },
  }
}
