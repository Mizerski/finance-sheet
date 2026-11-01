import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { CabecalhoOrganizacao } from '@/features/organizacao/components/CabecalhoOrganizacao'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { paraDataISO } from '@/shared/lib/datas'
import { BOTAO, CAMPO_SELECT, CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useFinancas } from '@/store/context/financas-context'
import { CardEspacoHistorico } from './components/CardEspacoHistorico'
import { ListaAtividades } from './components/ListaAtividades'
import { ROTULO_FILTRO } from './constants/textos'
import { LIMITE_ATIVIDADES } from './model/atividade'
import { ehFiltroHistorico, FILTROS_HISTORICO, filtrarAtividades, type FiltroHistorico } from './utils/filtro'

/** Quantas aparecem de cada vez; "Ver mais" mostra outras tantas. */
const POR_PAGINA = 50

/**
 * Aba Histórico da tela Organização: o que a pessoa fez no app, do mais novo para o mais antigo, para lembrar.
 * O filtro por assunto fica em `?tipo=`; trocar o filtro volta a mostrar só a primeira página.
 */
export function SecaoHistorico() {
  const { estado } = useFinancas()
  const { tipo } = useSearch({ from: '/organizacao' })
  const navigate = useNavigate({ from: '/organizacao' })
  const filtro: FiltroHistorico = tipo ?? 'tudo'
  const [hoje] = useState(() => paraDataISO(new Date()))
  const [visiveis, setVisiveis] = useState({ filtro, quantidade: POR_PAGINA })
  const quantidade = visiveis.filtro === filtro ? visiveis.quantidade : POR_PAGINA

  const lista = useMemo(() => filtrarAtividades(estado.atividades, filtro), [estado.atividades, filtro])
  const vazio = estado.atividades.length === 0

  const filtrar = (novo: string) => {
    if (!ehFiltroHistorico(novo)) return
    navigate({ search: (s) => ({ ...s, tipo: novo === 'tudo' ? undefined : novo }), replace: true, resetScroll: false })
  }

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoOrganizacao descricao="O que você fez no app, para lembrar quando esquecer" />

      <CardEspacoHistorico />

      <Card className={cn(CARD, 'overflow-hidden')}>
        <CabecalhoCard
          titulo="Histórico"
          contagem={vazio ? undefined : lista.length}
          faixa="bg-tinta"
          forma={{ forma: 'circulo', cor: 'vermelho' }}
          descricao="Do mais novo para o mais antigo"
          ajuda={
            <Ajuda titulo="Histórico">
              <p>
                Cada coisa que você salva, muda ou exclui vira uma linha aqui, com o dia e a hora. Clique numa linha
                para ver o extrato: o que foi lançado, o que mudou e como ficou. Ficam guardadas as últimas{' '}
                {LIMITE_ATIVIDADES.toLocaleString('pt-BR')} (ou menos, no prazo que você escolher em “Apagar sozinho”).
              </p>
              <p>O histórico só lembra: ele não muda suas contas nem a projeção.</p>
            </Ajuda>
          }
          acoes={
            !vazio && (
              <Select value={filtro} onValueChange={filtrar}>
                <SelectTrigger aria-label="Mostrar" className={cn(CAMPO_SELECT, 'w-60 max-w-full')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {FILTROS_HISTORICO.map((f) => (
                    <SelectItem key={f} value={f}>
                      {ROTULO_FILTRO[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }
        />

        {vazio ? (
          <EstadoVazio
            titulo="Nada por aqui ainda"
            descricao="Quando você lançar, mudar ou excluir alguma coisa, ela aparece aqui, com o dia e a hora."
          />
        ) : lista.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-5">
            Nada em “{ROTULO_FILTRO[filtro]}” por enquanto.
          </p>
        ) : (
          <>
            <ListaAtividades atividades={lista.slice(0, quantidade)} hoje={hoje} />
            {lista.length > quantidade && (
              <div className="flex justify-center border-t-2 border-contorno px-4 py-3">
                <Button
                  variant="outline"
                  className={BOTAO}
                  onClick={() => setVisiveis({ filtro, quantidade: quantidade + POR_PAGINA })}
                >
                  Ver mais ({lista.length - quantidade})
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
