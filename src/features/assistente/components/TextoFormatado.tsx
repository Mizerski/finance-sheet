import { Fragment, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

type Bloco =
  | { tipo: 'paragrafo'; linhas: string[] }
  | { tipo: 'titulo'; texto: string }
  | { tipo: 'lista'; ordenada: boolean; inicio: number; itens: string[] }

const ITEM = /^\s*(?:[-*•]|(\d+)[.)])\s+(.*)$/
const TITULO = /^\s*#{1,6}\s+(.*)$/

/**
 * Divide o markdown simples que o modelo escreve em parágrafos, títulos e listas.
 * Linha em branco entre itens não quebra a lista, e linha recuada logo depois de um item continua o item.
 */
function blocos(texto: string): Bloco[] {
  const resultado: Bloco[] = []
  for (const linha of texto.split('\n')) {
    const ultimo = resultado.at(-1)
    if (!linha.trim()) {
      resultado.push({ tipo: 'paragrafo', linhas: [] })
      continue
    }
    const titulo = TITULO.exec(linha)
    if (titulo) {
      resultado.push({ tipo: 'titulo', texto: titulo[1] })
      continue
    }
    const item = ITEM.exec(linha)
    if (item) {
      const ordenada = item[1] !== undefined
      const vazio = ultimo?.tipo === 'paragrafo' && ultimo.linhas.length === 0
      const lista = vazio ? resultado.at(-2) : ultimo
      if (lista?.tipo === 'lista' && lista.ordenada === ordenada) {
        if (vazio) resultado.pop()
        lista.itens.push(item[2])
      } else {
        resultado.push({ tipo: 'lista', ordenada, inicio: Number(item[1] ?? 1), itens: [item[2]] })
      }
      continue
    }
    if (ultimo?.tipo === 'lista' && /^\s{2,}/.test(linha)) {
      ultimo.itens[ultimo.itens.length - 1] += ` ${linha.trim()}`
    } else if (ultimo?.tipo === 'paragrafo') {
      ultimo.linhas.push(linha)
    } else {
      resultado.push({ tipo: 'paragrafo', linhas: [linha] })
    }
  }
  return resultado.filter((b) => b.tipo !== 'paragrafo' || b.linhas.length > 0)
}

/** **negrito**, *itálico* e `código` dentro de uma linha. */
function emLinha(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g).map((parte, i) => {
    if (/^\*\*[^*]+\*\*$/.test(parte)) return <strong key={i} className="font-semibold">{parte.slice(2, -2)}</strong>
    if (/^`[^`]+`$/.test(parte)) return <code key={i} className="bg-muted px-1 font-mono text-[0.85em]">{parte.slice(1, -1)}</code>
    if (/^\*[^*\s][^*]*\*$/.test(parte)) return <em key={i}>{parte.slice(1, -1)}</em>
    return <Fragment key={i}>{parte}</Fragment>
  })
}

/**
 * A resposta do modelo com o markdown básico que ele usa (negrito, listas, títulos), sem HTML:
 * o texto nunca vira marcação, então não há como o modelo injetar nada na tela.
 */
export function TextoFormatado({ texto, className }: { texto: string; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 [overflow-wrap:anywhere]', className)}>
      {blocos(texto).map((b, i) => {
        if (b.tipo === 'titulo') return <p key={i} className="font-semibold">{emLinha(b.texto)}</p>
        if (b.tipo === 'lista') {
          const Lista = b.ordenada ? 'ol' : 'ul'
          return (
            <Lista key={i} start={b.ordenada ? b.inicio : undefined} className={cn('flex flex-col gap-1 pl-5', b.ordenada ? 'list-decimal' : 'list-[square]')}>
              {b.itens.map((item, j) => (
                <li key={j} className="pl-0.5 marker:font-semibold">
                  {emLinha(item)}
                </li>
              ))}
            </Lista>
          )
        }
        return (
          <p key={i}>
            {b.linhas.map((linha, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {emLinha(linha)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
