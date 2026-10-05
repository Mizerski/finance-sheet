import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { metasComContas } from '@/features/economias/utils/na-conta'
import { paraDataISO } from '@/shared/lib/datas'
import { traduzirErro } from '@/shared/lib/erros'
import { AvisoErro } from '@/shared/components/AvisoErro'
import { TelaCentralizada } from '@/shared/components/TelaCentralizada'
import { BOTAO } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import type { Armazenamento } from '../repositorio/armazenamento'
import { estadoVazio, financasReducer, type AcaoFinancas } from '../reducer/financas-reducer'
import { FinancasContext } from './financas-context'

type Carga = { situacao: 'carregando' } | { situacao: 'erro'; mensagem: string } | { situacao: 'pronto' }

/**
 * Estado do app em memória. Cada ação aparece na tela na hora e é gravada em seguida, numa fila;
 * se a gravação falhar, os dados são recarregados. As metas recebem `naContaCentavos` aqui.
 */
export function FinancasProvider({ armazenamento, children }: { armazenamento: Armazenamento; children: ReactNode }) {
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
    armazenamento.carregar().then(
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
  }, [armazenamento, tentativa])

  const dispatch = useCallback(
    (acao: AcaoFinancas) => {
      const gravar = armazenamento.gravacao(acao, estadoAtual.current)
      aplicar(acao)
      if (!gravar) return
      fila.current = fila.current.then(gravar).catch(async (erro) => {
        setErroAoSalvar(traduzirErro(erro))
        try {
          aplicar({ tipo: 'dados/carregar', dados: await armazenamento.carregar() })
        } catch {}
      })
    },
    [armazenamento],
  )

  const [hoje] = useState(() => paraDataISO(new Date()))
  const valor = useMemo(() => {
    const metas = metasComContas(estado.metas, estado.caixas, estado.lancamentos, hoje)
    return { estado: metas === estado.metas ? estado : { ...estado, metas }, dispatch }
  }, [estado, dispatch, hoje])

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
