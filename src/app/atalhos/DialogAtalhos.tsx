import { caixasAtivos, NOME_TOTAL } from '@/features/caixas/caixa'
import { CAMADA, ROTULO, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useFinancas } from '@/store/financas-context'
import { ITENS_MENU } from '../layout/itens-menu'

interface Grupo {
  titulo: string
  atalhos: { teclas: string[]; acao: string }[]
}

/** Só com 2 ou mais caixas ativos, como o seletor. */
const GRUPO_CAIXAS: Grupo = {
  titulo: 'Caixas',
  atalhos: [
    { teclas: ['Alt', '0'], acao: `Ver o ${NOME_TOTAL} (soma das contas)` },
    { teclas: ['Alt', '1…9'], acao: 'Ver o caixa nessa posição' },
  ],
}

const GRUPOS: Grupo[] = [
  {
    titulo: 'Em qualquer tela',
    atalhos: [
      { teclas: ['N'], acao: 'Novo lançamento' },
      { teclas: ['/'], acao: 'Buscar lançamento' },
      ...ITENS_MENU.map(({ rotulo }, i) => ({ teclas: [String(i + 1)], acao: `Ir para ${rotulo}` })),
      { teclas: ['?'], acao: 'Mostrar os atalhos' },
    ],
  },
  {
    titulo: 'Na planilha',
    atalhos: [
      { teclas: ['←', '→'], acao: 'Mês anterior e próximo' },
      { teclas: ['T'], acao: 'Voltar para hoje' },
    ],
  },
  {
    titulo: 'Em lançamentos (tela larga)',
    atalhos: [
      { teclas: ['Shift', 'clique'], acao: 'Marcar vários seguidos' },
      { teclas: ['Esc'], acao: 'Desmarcar todos' },
    ],
  },
  {
    titulo: 'Em campos e janelas',
    atalhos: [{ teclas: ['Esc'], acao: 'Limpar a busca ou fechar a janela' }],
  },
]

interface DialogAtalhosProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

export function DialogAtalhos({ aberto, onOpenChange }: DialogAtalhosProps) {
  const { estado } = useFinancas()
  const grupos = caixasAtivos(estado.caixas).length >= 2 ? [GRUPOS[0], GRUPO_CAIXAS, ...GRUPOS.slice(1)] : GRUPOS

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className={TITULO_DIALOG}>Atalhos de teclado</DialogTitle>
          <DialogDescription>Funcionam fora de campos de texto.</DialogDescription>
        </DialogHeader>
        {grupos.map((g) => (
          <section key={g.titulo} className="flex flex-col gap-2">
            <h3 className={cn(ROTULO, 'border-b-2 border-foreground pb-1')}>{g.titulo}</h3>
            <dl className="flex flex-col gap-2 text-sm">
              {g.atalhos.map((a) => (
                <div key={a.acao} className="flex items-center justify-between gap-3">
                  <dt>{a.acao}</dt>
                  <dd className="flex gap-1">
                    {a.teclas.map((t) => (
                      <kbd
                        key={t}
                        className="min-w-7 border-2 border-foreground bg-card px-1.5 py-0.5 text-center font-sans text-xs font-semibold shadow-[2px_2px_0_0_var(--foreground)]"
                      >
                        {t}
                      </kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </DialogContent>
    </Dialog>
  )
}
