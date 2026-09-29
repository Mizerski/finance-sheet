import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { useSessao } from '@/features/autenticacao/sessao-context'
import { traduzirErro } from '@/shared/lib/erros'
import { AvisoErro } from '@/shared/components/AvisoErro'
import { TelaCentralizada } from '@/shared/components/TelaCentralizada'
import { BOTAO } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { estadoVazio, financasReducer, type AcaoFinancas } from './estado'
import { FinancasContext } from './financas-context'
import { carregarDados, persistir } from './persistencia'

type Carga = { situacao: 'carregando' } | { situacao: 'erro'; mensagem: string } | { situacao: 'pronto' }

/**
 * Estado do app em memória, carregado do Supabase ao entrar.
 * Cada ação aparece na tela na hora e é gravada no banco em seguida, numa fila (na ordem em que aconteceu).
 * Se uma gravação falhar, os dados são recarregados do banco para a tela não mostrar algo que não foi salvo.
 */
export function FinancasProvider({ children }: { children: ReactNode }) {
  const { supabase, usuario } = useSessao()
  const [estado, aplicar] = useReducer(financasReducer, undefined, estadoVazio)
  const [carga, setCarga] = useState<Carga>({ situacao: 'carregando' })
  const [tentativa, setTentativa] = useState(0)
  const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null)

  const estadoAtual = useRef(estado)
  useEffect(() => {
    estadoAtual.current = estado
  }, [estado])
  const fila = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let ativo = true
    carregarDados(supabase).then(
      (dados) => {
        if (!ativo) return
        aplicar({ tipo: 'dados/carregar', dados })
        setCarga({ situacao: 'pronto' })
      },
      (erro) => ativo && setCarga({ situacao: 'erro', mensagem: traduzirErro(erro) }),
    )
    return () => {
      ativo = false
    }
  }, [supabase, usuario.id, tentativa])

  const dispatch = useCallback(
    (acao: AcaoFinancas) => {
      const gravar = persistir(supabase, usuario.id, acao, estadoAtual.current)
      aplicar(acao)
      if (!gravar) return
      fila.current = fila.current.then(gravar).catch(async (erro) => {
        setErroAoSalvar(traduzirErro(erro))
        try {
          aplicar({ tipo: 'dados/carregar', dados: await carregarDados(supabase) })
        } catch {
          // Sem conexão: a tela fica como está e o aviso continua visível.
        }
      })
    },
    [supabase, usuario.id],
  )

  const valor = useMemo(() => ({ estado, dispatch }), [estado, dispatch])

  if (carga.situacao === 'carregando') return <TelaCentralizada titulo="Carregando seus dados…" />
  if (carga.situacao === 'erro') {
    return (
      <TelaCentralizada titulo="Não foi possível carregar seus dados" descricao={carga.mensagem}>
        <Button
          className={BOTAO}
          onClick={() => {
            setCarga({ situacao: 'carregando' })
            setTentativa((t) => t + 1)
          }}
        >
          Tentar de novo
        </Button>
      </TelaCentralizada>
    )
  }

  return (
    <FinancasContext value={valor}>
      {children}
      {erroAoSalvar && (
        <AvisoErro
          titulo="Não foi possível salvar a última alteração"
          mensagem={`${erroAoSalvar} A tela foi atualizada com o que está salvo.`}
          onFechar={() => setErroAoSalvar(null)}
        />
      )}
    </FinancasContext>
  )
}
