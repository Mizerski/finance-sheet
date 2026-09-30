import { CAMADA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { ITENS_MENU } from '../layout/itens-menu'

const GRUPOS: { titulo: string; atalhos: { teclas: string[]; acao: string }[] }[] = [
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
    titulo: 'Em campos e janelas',
    atalhos: [{ teclas: ['Esc'], acao: 'Limpar a busca ou fechar a janela' }],
  },
]

interface DialogAtalhosProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

export function DialogAtalhos({ aberto, onOpenChange }: DialogAtalhosProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className={cn(CAMADA, 'max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className="text-lg font-medium tracking-tight">Atalhos de teclado</DialogTitle>
          <DialogDescription>Funcionam fora de campos de texto.</DialogDescription>
        </DialogHeader>
        {GRUPOS.map((g) => (
          <section key={g.titulo} className="flex flex-col gap-2">
            <h3 className="text-[0.68rem] tracking-wide text-muted-foreground uppercase">{g.titulo}</h3>
            <dl className="flex flex-col gap-2 text-sm">
              {g.atalhos.map((a) => (
                <div key={a.acao} className="flex items-center justify-between gap-3">
                  <dt>{a.acao}</dt>
                  <dd className="flex gap-1">
                    {a.teclas.map((t) => (
                      <kbd
                        key={t}
                        className="min-w-7 rounded-full bg-muted px-2 py-0.5 text-center font-sans text-xs ring-1 ring-border"
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
