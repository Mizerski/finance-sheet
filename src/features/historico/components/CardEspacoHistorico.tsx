import { useMemo, useState } from 'react'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { formatarData, paraDataISO } from '@/shared/lib/datas'
import { BOTAO, CAMPO_SELECT, CARD, ROTULO, VALOR_DESTAQUE } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Trash2 } from '@/shared/ui/icones'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useFinancas } from '@/store/context/financas-context'
import type { EspacoDosDados } from '../api/espaco'
import { ROTULO_PRAZO } from '../constants/textos'
import { useEspacoDosDados } from '../hooks/useEspacoDosDados'
import { usePrazoDoHistorico } from '../hooks/useLimpezaDoHistorico'
import { LIMITE_ATIVIDADES } from '../model/atividade'
import {
  ehPrazoHistorico,
  formatarFracao,
  formatarTamanho,
  larguraNaBarra,
  PRAZOS_HISTORICO,
  quantosSaem,
  tamanhoDoHistorico,
  type PrazoHistorico,
} from '../utils/limpeza'

/** "1 registro", "1.312 registros". */
function registros(n: number): string {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? 'registro' : 'registros'}`
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className={cn(ROTULO, 'text-muted-foreground')}>{rotulo}</span>
      <span className={cn(VALOR_DESTAQUE, 'text-[1.5rem]')}>{valor}</span>
    </div>
  )
}

function Legenda({ cor, children }: { cor: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn('size-2.5 border-[1.5px] border-contorno', cor)} />
      {children}
    </span>
  )
}

/**
 * No PC: o histórico, o resto dos dados e o livre do disco numa barra só. O histórico costuma ser uma fração
 * pequena do livre, então cada fatia que existe aparece com pelo menos um fio, e o percentual vai escrito.
 */
function BarraDoDisco({ historico, espaco }: { historico: number; espaco: EspacoDosDados & { livreBytes: number } }) {
  const arquivo = Math.max(espaco.arquivoBytes ?? historico, historico)
  const outros = arquivo - historico
  const todo = espaco.livreBytes + arquivo
  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="img"
        aria-label={`O histórico ocupa ${formatarTamanho(historico)}, ${formatarFracao(historico, todo)} do espaço livre no computador (${formatarTamanho(espaco.livreBytes)})`}
        className="flex h-5 border-2 border-contorno bg-muted"
      >
        <div className="h-full bg-foreground" style={{ width: `${larguraNaBarra(historico, todo)}%` }} />
        <div className="h-full border-l-2 border-contorno bg-muted-foreground" style={{ width: `${larguraNaBarra(outros, todo)}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
        <Legenda cor="bg-foreground">{`Histórico: ${formatarTamanho(historico)} (${formatarFracao(historico, todo)} do livre)`}</Legenda>
        <Legenda cor="bg-muted-foreground">{`Seus outros dados: ${formatarTamanho(outros)}`}</Legenda>
        <Legenda cor="bg-muted">{`Livre: ${formatarTamanho(espaco.livreBytes)}`}</Legenda>
      </div>
    </div>
  )
}

/**
 * Quanto o histórico ocupa (em KB/MB, e diante do espaço livre do computador no desktop), o prazo para apagar sozinho
 * e a lixeira que apaga tudo. Apagar o histórico nunca mexe nas contas.
 */
export function CardEspacoHistorico() {
  const { estado, dispatch } = useFinancas()
  const { prazo, escolher } = usePrazoDoHistorico()
  const [confirmar, setConfirmar] = useState<{ prazo: PrazoHistorico | 'tudo'; saem: number; aberto: boolean }>({
    prazo: 'tudo',
    saem: 0,
    aberto: false,
  })

  const atividades = estado.atividades
  const total = atividades.length
  const historico = useMemo(() => (atividades.length ? tamanhoDoHistorico(atividades) : 0), [atividades])
  const espaco = useEspacoDosDados(total)
  const maisAntiga = atividades[0]
  const cheio = total >= LIMITE_ATIVIDADES

  const trocarPrazo = (valor: string) => {
    const novo = Number(valor)
    if (!ehPrazoHistorico(novo)) return
    const saem = quantosSaem(atividades, novo, new Date())
    if (saem > 0) setConfirmar({ prazo: novo, saem, aberto: true })
    else escolher(novo)
  }

  return (
    <Card className={cn(CARD, 'overflow-hidden')}>
      <CabecalhoCard
        titulo="Espaço usado"
        faixa="bg-tinta"
        descricao={espaco ? 'Neste computador' : 'Guardado na sua conta'}
        ajuda={
          <Ajuda titulo="Espaço do histórico">
            <p>
              Cada registro com extrato ocupa perto de 1 KB. O histórico guarda até{' '}
              {LIMITE_ATIVIDADES.toLocaleString('pt-BR')} registros; passando disso, os mais antigos saem sozinhos.
            </p>
            <p>
              Em “Apagar sozinho”, escolha por quanto tempo guardar: o que passar do prazo sai ao abrir o app. A
              escolha vale para este aparelho.
            </p>
            <p>Apagar o histórico não mexe nas suas contas, nos lançamentos nem na projeção.</p>
          </Ajuda>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <div className="grid grid-cols-2 gap-4 min-[40rem]:grid-cols-3">
          <Numero rotulo="Histórico" valor={total === 0 ? 'Vazio' : formatarTamanho(historico)} />
          <Numero rotulo="Registros" valor={total.toLocaleString('pt-BR')} />
          {espaco?.livreBytes != null && <Numero rotulo="Livre no computador" valor={formatarTamanho(espaco.livreBytes)} />}
        </div>

        {espaco?.livreBytes != null && <BarraDoDisco historico={historico} espaco={{ ...espaco, livreBytes: espaco.livreBytes }} />}

        {maisAntiga && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {cheio
              ? `Chegou a ${LIMITE_ATIVIDADES.toLocaleString('pt-BR')} registros: os mais antigos já estão saindo.`
              : `Mais antigo: ${formatarData(paraDataISO(new Date(maisAntiga.em)))}`}
          </p>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3 border-t-2 border-contorno pt-3">
          <label className="flex flex-col gap-1">
            <span className={cn(ROTULO, 'text-muted-foreground')}>Apagar sozinho</span>
            <Select value={String(prazo)} onValueChange={trocarPrazo}>
              <SelectTrigger aria-label="Apagar sozinho" className={cn(CAMPO_SELECT, 'w-56 max-w-full')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {PRAZOS_HISTORICO.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {ROTULO_PRAZO[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button
            variant="outline"
            className={cn(BOTAO, 'hover:text-destructive')}
            disabled={total === 0}
            onClick={() => setConfirmar({ prazo: 'tudo', saem: total, aberto: true })}
          >
            <Trash2 className="size-6" />
            Apagar tudo
          </Button>
        </div>
      </div>

      <ConfirmarExclusao
        aberto={confirmar.aberto}
        onOpenChange={(aberto) => setConfirmar((atual) => ({ ...atual, aberto }))}
        titulo={confirmar.prazo === 'tudo' ? 'Apagar todo o histórico?' : 'Apagar os registros antigos?'}
        rotuloConfirmar="Apagar"
        descricao={
          <>
            <span className="font-medium text-foreground">{registros(confirmar.saem)}</span>{' '}
            {confirmar.prazo === 'tudo'
              ? 'saem do histórico.'
              : `${ROTULO_PRAZO[confirmar.prazo].toLowerCase()} saem agora, e daqui para frente o que passar do prazo sai sozinho.`}{' '}
            Suas contas não mudam. Não dá para desfazer.
          </>
        }
        onConfirmar={() => {
          if (confirmar.prazo === 'tudo') dispatch({ tipo: 'atividade/limpar' })
          else escolher(confirmar.prazo)
        }}
      />
    </Card>
  )
}
