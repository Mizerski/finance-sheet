import { useEffect, useRef, useState } from 'react'

/**
 * Navegação de um formulário em passos (modo simples): o passo atual, o que já foi respondido e a volta direta para a
 * conferência quando a pessoa veio do "Mudar". A cada troca, o foco vai para a pergunta (menos quando um campo já pegou
 * o foco sozinho, com `autoFocus`). Com `editando`, abre na conferência.
 */
export function usePassos<P extends string>(lista: readonly P[], conferir: P, { editando = false } = {}) {
  const [passo, setPasso] = useState<P>(editando ? conferir : lista[0])
  const [tentou, setTentou] = useState(false)
  /** Editando, tudo já está respondido e a pessoa começa na conferência, mudando só o que quiser. */
  const [respondidos, setRespondidos] = useState<ReadonlySet<P>>(() => new Set(editando ? lista : []))
  const [voltarAConferir, setVoltarAConferir] = useState(false)
  const titulo = useRef<HTMLHeadingElement>(null)
  const primeiraTela = useRef(true)

  useEffect(() => {
    if (primeiraTela.current) {
      primeiraTela.current = false
      return
    }
    if (!document.activeElement?.closest('input, [role=combobox]')) titulo.current?.focus()
  }, [passo])

  const indice = Math.max(0, lista.indexOf(passo))

  function irPara(p: P) {
    setTentou(false)
    setPasso(p)
  }

  /**
   * Marca o passo como respondido e segue. `novaLista` vale quando a resposta muda os passos seguintes; `emFrente`
   * ignora a volta à conferência (a resposta mudou as perguntas que vêm depois).
   */
  function seguir(novaLista: readonly P[] = lista, emFrente = false) {
    setRespondidos((s) => new Set(s).add(passo))
    if (emFrente) setVoltarAConferir(false)
    irPara(voltarAConferir && !emFrente ? conferir : novaLista[novaLista.indexOf(passo) + 1])
  }

  function voltar() {
    setVoltarAConferir(false)
    irPara(lista[indice - 1])
  }

  /** Dá passos como respondidos de uma vez (ex.: um modelo que já preencheu tudo). */
  function marcar(...ps: P[]) {
    setRespondidos((s) => new Set([...s, ...ps]))
  }

  /** "Mudar" na conferência: abre o passo e, ao continuar, volta direto para ela. */
  function mudar(p: P) {
    setVoltarAConferir(true)
    irPara(p)
  }

  /** Mostra os erros; com `p`, abre esse passo antes (ao salvar com algo faltando). */
  function mostrarErros(p?: P) {
    if (p) {
      setVoltarAConferir(true)
      setPasso(p)
    }
    setTentou(true)
  }

  return {
    passo,
    indice,
    total: lista.length,
    tentou,
    respondidos,
    titulo,
    noFim: passo === conferir,
    seguir,
    voltar,
    marcar,
    mudar,
    mostrarErros,
  }
}
