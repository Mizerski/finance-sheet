import { useState } from 'react'
import { caixasAtivos } from '@/features/caixas/model/caixa'
import { EfeitoNoCaixa } from '@/features/risco/components/EfeitoNoCaixa'
import { LinhaConferir, ListaConferir } from '@/shared/components/Passos'
import { PontoCor } from '@/shared/components/PontoCor'
import { paraDataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { cn } from '@/shared/lib/utils'
import { useFinancas } from '@/store/context/financas-context'
import { descreverPeriodo, descreverRecorrencia, ROTULO_NATUREZA, ROTULO_TIPO } from '../constants/textos'
import type { Lancamento } from '../model/lancamento'
import { parcelasDe } from '../utils/parcelas'
import type { Passo } from '../utils/passos'

interface PassoConferirProps {
  /** O lançamento como vai ser salvo. */
  lancamento: Lancamento
  /** O que vai ser salvo de fato (na edição, pode virar dois); sem ele, só o `lancamento`. */
  simulados?: Lancamento[] | null
  /** Na edição, o id do original, que sai da simulação do caixa. */
  substitui?: string
  onMudar: (passo: Passo) => void
}

const COR_VALOR = { saida: 'text-saida', entrada: 'text-entrada', transferencia: 'text-foreground' }

/** Tudo o que foi respondido numa lista, cada linha com "Mudar", e o efeito no caixa antes de salvar. */
export function PassoConferir({ lancamento: l, simulados, substitui, onMudar }: PassoConferirProps) {
  const { estado } = useFinancas()
  const nomeDoCaixa = (id: string | undefined) => estado.caixas.find((c) => c.id === id)?.nome ?? '—'
  const categoria = estado.categorias.find((c) => c.id === l.categoriaId)
  const tag = estado.tags.find((t) => t.id === l.tagId)
  const pasta = estado.pastas.find((p) => p.id === l.pastaId)
  const variosCaixas = caixasAtivos(estado.caixas).length >= 2
  const periodo = descreverPeriodo(l)
  const [hoje] = useState(() => paraDataISO(new Date()))
  const parcelas = parcelasDe(l, hoje)
  const transferencia = l.tipo === 'transferencia'

  return (
    <div className="flex flex-col gap-4">
      <ListaConferir>
        <LinhaConferir rotulo="Tipo" onMudar={() => onMudar('tipo')}>
          {ROTULO_TIPO[l.tipo]}
        </LinhaConferir>
        <LinhaConferir rotulo="Valor" onMudar={() => onMudar('valor')}>
          <span className={cn('font-semibold tabular-nums', COR_VALOR[l.tipo])}>{formatarBRL(l.valorCentavos)}</span>
        </LinhaConferir>
        <LinhaConferir rotulo="Descrição" onMudar={() => onMudar('valor')}>
          {l.descricao}
        </LinhaConferir>
        {transferencia ? (
          <LinhaConferir rotulo="Contas" onMudar={() => onMudar('contas')}>
            De {nomeDoCaixa(l.caixaId)} para {nomeDoCaixa(l.caixaDestinoId)}
          </LinhaConferir>
        ) : (
          <>
            {variosCaixas && (
              <LinhaConferir rotulo="Conta" onMudar={() => onMudar('valor')}>
                {nomeDoCaixa(l.caixaId)}
              </LinhaConferir>
            )}
            <LinhaConferir rotulo="Categoria" onMudar={() => onMudar('categoria')}>
              <span className="flex items-center gap-2">
                {categoria && <PontoCor cor={categoria.cor} />}
                {categoria?.nome ?? '—'}
              </span>
            </LinhaConferir>
          </>
        )}
        {l.tipo === 'saida' && (
          <LinhaConferir rotulo="Necessário?" onMudar={() => onMudar('tag')}>
            {tag ? (
              <span className="flex items-center gap-2">
                <PontoCor cor={tag.cor} />
                {tag.nome}
              </span>
            ) : (
              <span className="text-muted-foreground">Sem tag</span>
            )}
          </LinhaConferir>
        )}
        <LinhaConferir rotulo="Quando" onMudar={() => onMudar('quando')}>
          {descreverRecorrencia(l)}
          {periodo && <span className="text-muted-foreground">, {periodo}</span>}
          {parcelas && (
            <span className="font-semibold tabular-nums">
              {' '}
              · {parcelas.total}× de {formatarBRL(l.valorCentavos)}
            </span>
          )}
          {!transferencia && <span className="text-muted-foreground"> · {ROTULO_NATUREZA[l.natureza].toLowerCase()}</span>}
        </LinhaConferir>
        {pasta && (
          <LinhaConferir rotulo="Pasta" onMudar={() => onMudar('quando')}>
            <span className="flex items-center gap-2">
              <PontoCor cor={pasta.cor} />
              {pasta.nome}
            </span>
          </LinhaConferir>
        )}
      </ListaConferir>

      <EfeitoNoCaixa simulados={simulados === undefined ? [l] : simulados} substitui={substitui} tipo={l.tipo} caixaId={l.caixaId} />
    </div>
  )
}
