import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as api from '../api/motor'
import { AssistenteContext, type AssistenteContexto, type Fase, type MensagemChat, type SituacaoMotor } from './assistente-context'
import { DEFINICOES_FERRAMENTAS, executarFerramenta, type DadosFerramentas } from '../utils/ferramentas'
import { infoModelo } from '../constants/modelos'
import { MAX_TOKENS_RESPOSTA, montarConversa } from '../utils/prompt'

/** Rodadas de ferramentas por pergunta; depois disso o modelo responde com o que já consultou. */
const MAX_RODADAS = 3

const textoDoErro = (e: unknown) => (e instanceof Error ? e.message : String(e))

/**
 * Desktop: modelo, motor e conversa do assistente (a conversa fica só na memória).
 * Abrir o painel já liga o motor; baixar um modelo apaga o anterior, para não ocupar o dobro do disco.
 */
export function AssistenteProvider({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const [fase, setFase] = useState<Fase>({ tipo: 'carregando' })
  const [modelos, setModelos] = useState<api.ModeloInstalavel[]>([])
  const [placa, setPlaca] = useState<api.PlacaDeVideo | null | undefined>(undefined)
  const [motor, setMotor] = useState<SituacaoMotor>('desligado')
  const [erro, setErro] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<MensagemChat[]>([])
  const [respondendo, setRespondendo] = useState(false)

  const historico = useRef<MensagemChat[]>([])
  useEffect(() => {
    historico.current = mensagens
  }, [mensagens])
  const parada = useRef(false)
  const retrato = useRef('')
  const dados = useRef<DadosFerramentas | null>(null)

  /** Lê o que está instalado e devolve o modelo baixado, se houver (um por vez). */
  const atualizar = useCallback(async (): Promise<{ id?: string; ligado: boolean }> => {
    const estado = await api.lerEstado()
    setModelos(estado.modelos)
    setMotor(estado.ligado ? 'ligado' : 'desligado')
    if (!estado.motor) {
      setFase({ tipo: 'semMotor' })
      return { ligado: false }
    }
    const baixado = estado.modelos.find((m) => m.baixado)
    setFase(baixado ? { tipo: 'pronto', id: baixado.id } : { tipo: 'escolher' })
    return { id: baixado?.id, ligado: estado.ligado === baixado?.id }
  }, [])

  const ligarMotor = useCallback(async (id: string) => {
    setMotor((m) => (m === 'ligado' ? m : 'ligando'))
    try {
      await api.ligar(id)
      setMotor('ligado')
    } catch (e) {
      setMotor('desligado')
      throw e
    }
  }, [])

  /** Liga o motor e processa o manual de antemão, para a primeira resposta não demorar. */
  const preaquecer = useCallback(
    async (id: string) => {
      try {
        await ligarMotor(id)
        const { ferramentas } = infoModelo(id)
        const conversa = montarConversa([{ papel: 'usuario', texto: 'Oi' }], retrato.current, ferramentas)
        await api.responder(conversa, ferramentas ? DEFINICOES_FERRAMENTAS : null, 1, () => {})
      } catch (e) {
        setErro(textoDoErro(e))
      }
    },
    [ligarMotor],
  )

  const mudarAberto = useCallback(
    (abrir: boolean) => {
      setAberto(abrir)
      if (!abrir || fase.tipo === 'baixando') return
      atualizar()
        .then(({ id, ligado }) => {
          if (id && !ligado) void preaquecer(id)
        })
        .catch((e) => setErro(textoDoErro(e)))
    },
    [fase.tipo, atualizar, preaquecer],
  )

  useEffect(() => {
    if (fase.tipo !== 'escolher' || placa !== undefined) return
    api
      .lerPlacaDeVideo()
      .then(setPlaca)
      .catch(() => setPlaca(null))
  }, [fase.tipo, placa])

  const baixar = useCallback(
    async (id: string) => {
      setErro(null)
      const anterior = modelos.find((m) => m.id === id)
      const progresso = { baixados: anterior?.parcial ?? 0, total: anterior?.bytes ?? 0 }
      setFase({ tipo: 'baixando', id, progresso, inicio: Date.now(), baixadosNoInicio: progresso.baixados })
      try {
        const concluido = await api.baixarModelo(id, (p) =>
          setFase((f) => (f.tipo === 'baixando' && f.id === id ? { ...f, progresso: p } : f)),
        )
        if (concluido) {
          for (const outro of modelos.filter((m) => m.baixado && m.id !== id)) await api.excluirModelo(outro.id)
        }
        const { id: pronto } = await atualizar()
        if (concluido && pronto) void preaquecer(pronto)
      } catch (e) {
        setErro(textoDoErro(e))
        await atualizar().catch(() => {})
      }
    },
    [modelos, atualizar, preaquecer],
  )

  const enviar = useCallback(
    async (texto: string) => {
      const pergunta = texto.trim()
      if (!pergunta || respondendo || fase.tipo !== 'pronto') return
      const anteriores = historico.current.filter((m) => m.situacao !== 'erro' && m.texto)
      const nova: MensagemChat = { id: crypto.randomUUID(), papel: 'usuario', texto: pergunta }
      const idResposta = crypto.randomUUID()
      const mudarResposta = (mudar: (m: MensagemChat) => MensagemChat) =>
        setMensagens((ms) => ms.map((m) => (m.id === idResposta ? mudar(m) : m)))

      setMensagens((ms) => [...ms, nova, { id: idResposta, papel: 'assistente', texto: '', situacao: 'escrevendo' }])
      setRespondendo(true)
      setErro(null)
      parada.current = false
      try {
        await ligarMotor(fase.id)
        const { ferramentas } = infoModelo(fase.id)
        const conversa = montarConversa(
          [...anteriores, nova].map(({ papel, texto }) => ({ papel, texto })),
          retrato.current,
          ferramentas,
        )
        const extras: api.MensagemApi[] = []
        for (let rodada = 0; ; rodada++) {
          let textoDaRodada = ''
          const usarFerramentas = ferramentas && dados.current !== null && rodada < MAX_RODADAS
          const fim = await api.responder(
            [...conversa, ...extras],
            usarFerramentas ? DEFINICOES_FERRAMENTAS : null,
            MAX_TOKENS_RESPOSTA,
            (trecho) => {
              textoDaRodada += trecho
              mudarResposta((m) => ({ ...m, texto: m.texto + trecho }))
            },
          )
          if (parada.current || !fim.chamadas.length || !dados.current) {
            mudarResposta((m) => ({ ...m, situacao: parada.current ? 'parada' : fim.cortada ? 'cortada' : undefined }))
            break
          }
          const chamadas = fim.chamadas.map((c, i) => ({ ...c, id: c.id || `chamada-${rodada}-${i}` }))
          extras.push({
            role: 'assistant',
            content: textoDaRodada || null,
            tool_calls: chamadas.map((c) => ({ id: c.id, type: 'function', function: { name: c.nome, arguments: c.argumentos } })),
          })
          const consultas: string[] = []
          for (const c of chamadas) {
            const { resumo, resultado } = executarFerramenta(c.nome, c.argumentos, dados.current)
            consultas.push(resumo)
            extras.push({ role: 'tool', tool_call_id: c.id, content: resultado })
          }
          mudarResposta((m) => ({ ...m, texto: '', consultas: [...(m.consultas ?? []), ...consultas] }))
        }
      } catch (e) {
        mudarResposta((m) => ({ ...m, texto: textoDoErro(e), situacao: 'erro' }))
      } finally {
        setRespondendo(false)
      }
    },
    [respondendo, fase, ligarMotor],
  )

  const definirContexto = useCallback((texto: string, novos: DadosFerramentas) => {
    retrato.current = texto
    dados.current = novos
  }, [])

  const parar = useCallback(() => {
    parada.current = true
    void api.pararResposta()
  }, [])

  const contexto = useMemo<AssistenteContexto>(
    () => ({
      aberto,
      setAberto: mudarAberto,
      fase,
      motor,
      modelos,
      placa,
      erro,
      mensagens,
      respondendo,
      baixar: (id) => void baixar(id),
      cancelarDownload: () => void api.cancelarDownload(),
      trocarModelo: () => {
        setErro(null)
        setFase({ tipo: 'escolher' })
        api
          .lerEstado()
          .then((estado) => setModelos(estado.modelos))
          .catch((e) => setErro(textoDoErro(e)))
      },
      voltarDaEscolha: () => void atualizar().catch((e) => setErro(textoDoErro(e))),
      excluir: async (id) => {
        try {
          await api.excluirModelo(id)
          setMensagens([])
          await atualizar()
        } catch (e) {
          setErro(textoDoErro(e))
        }
      },
      enviar: (texto) => void enviar(texto),
      parar,
      definirContexto,
      novaConversa: () => {
        if (respondendo) parar()
        setMensagens([])
      },
    }),
    [aberto, mudarAberto, fase, motor, modelos, placa, erro, mensagens, respondendo, baixar, atualizar, enviar, parar, definirContexto],
  )

  return <AssistenteContext.Provider value={contexto}>{children}</AssistenteContext.Provider>
}
