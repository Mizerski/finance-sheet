import { useContext, useState, type ComponentType, type ReactNode } from 'react'
import { SessaoContext } from '@/features/autenticacao/context/sessao-context'
import { DialogBackup } from '@/features/backup/components/DialogBackup'
import { DialogLembrete } from '@/features/lembrete/components/DialogLembrete'
import { useLembrete } from '@/features/lembrete/hooks/useLembrete'
import { useModoSimples } from '@/features/modo-simples/hooks/useModoSimples'
import { useSaldosOcultos } from '@/features/projecao/hooks/useSaldosOcultos'
import { useTema } from '@/features/tema/hooks/useTema'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { BLOCO_CABECALHO, BLOCO_SOLTO, CAMADA, ROTULO } from '@/shared/lib/estilos'
import { EH_DESKTOP } from '@/shared/lib/plataforma'
import { cn } from '@/shared/lib/utils'
import { Bell, BellOff, DatabaseBackup, Eye, EyeOff, Keyboard, LogOut, Menu, Moon, Sun } from '@/shared/ui/icones'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { DialogAtalhos } from '../atalhos/DialogAtalhos'

type Janela = 'lembrete' | 'backup' | 'atalhos'

const OPCOES_TEMA = [
  {
    valor: 'claro' as const,
    rotulo: (
      <>
        <Sun className="size-3" /> Claro
      </>
    ),
  },
  {
    valor: 'escuro' as const,
    rotulo: (
      <>
        <Moon className="size-3" /> Escuro
      </>
    ),
  },
]

const OPCOES_MODO = [
  { valor: 'ligado' as const, rotulo: 'Ligado' },
  { valor: 'desligado' as const, rotulo: 'Desligado' },
]

/**
 * O que não é tela do app (modo simples, tema, ocultar saldos, lembrete, backup, atalhos, sair) fica num só botão com nome, em vez de uma fila de
 * ícones soltos que empurrava o menu para fora da tela. No celular estreito, só a palavra (o texto se entende melhor
 * que o ícone, e o seletor de caixa precisa do espaço). No desktop, o lembrete roda aqui, sempre montado.
 */
export function MenuMais() {
  return EH_DESKTOP ? <MenuMaisDesktop /> : <ConteudoMenuMais />
}

function MenuMaisDesktop() {
  const lembrete = useLembrete()
  return <ConteudoMenuMais lembrete={lembrete} />
}

function ConteudoMenuMais({ lembrete }: { lembrete?: ReturnType<typeof useLembrete> }) {
  const [aberto, setAberto] = useState(false)
  const [janela, setJanela] = useState<Janela | null>(null)
  const { tema, escolherTema } = useTema()
  const modo = useModoSimples()
  const saldos = useSaldosOcultos()
  const sessao = useContext(SessaoContext)
  const comTeclado = useMediaQuery('(min-width: 64rem)')
  const prefs = lembrete?.prefs

  const abrir = (j: Janela) => {
    setAberto(false)
    setJanela(j)
  }
  const controlar = (j: Janela) => (aberta: boolean) => setJanela(aberta ? j : null)

  return (
    <>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger className={cn(BLOCO_CABECALHO, BLOCO_SOLTO, 'mb-[3px] ml-1 gap-1.5 px-2')} title="Mais opções">
          <Menu className="size-6 max-[30rem]:hidden" />
          Mais
        </PopoverTrigger>
        <PopoverContent align="end" className={cn(CAMADA, 'w-80 max-w-[calc(100vw-2rem)] gap-0 p-0')}>
          <p className={cn(ROTULO, 'border-b-2 border-contorno px-3 py-2 font-semibold')}>Mais opções</p>
          <div className="flex flex-col gap-2 px-3 py-3">
            <span className={cn(ROTULO, 'text-muted-foreground')}>
              Modo simples
            </span>
            <ControleSegmentado
              rotulo="Modo simples"
              valor={modo.ligado ? 'ligado' : 'desligado'}
              opcoes={OPCOES_MODO}
              onChange={(v) => modo.escolher(v === 'ligado')}
            />
            <p className="text-xs text-muted-foreground">Lançamento, meta e caixa novos com uma pergunta de cada vez.</p>
          </div>
          <div className="flex flex-col gap-2 border-t-2 border-contorno px-3 py-3">
            <span className={cn(ROTULO, 'text-muted-foreground')}>Cores da tela</span>
            <ControleSegmentado rotulo="Cores da tela" valor={tema} opcoes={OPCOES_TEMA} onChange={escolherTema} />
          </div>
          <ul className="flex flex-col border-t-2 border-contorno py-1">
            <ItemMais
              icone={saldos.ocultos ? EyeOff : Eye}
              detalhe={saldos.ocultos ? 'Os valores estão borrados' : 'Borra os valores, para mostrar a tela a alguém'}
              onClick={saldos.alternar}
            >
              {saldos.ocultos ? 'Mostrar saldos' : 'Ocultar saldos'}
            </ItemMais>
            {lembrete && (
              <ItemMais
                icone={prefs?.ativo ? Bell : BellOff}
                detalhe={prefs && (prefs.ativo ? `Ligado, a partir das ${prefs.horario}` : 'Desligado')}
                onClick={() => abrir('lembrete')}
              >
                Lembrete diário
              </ItemMais>
            )}
            {EH_DESKTOP && (
              <ItemMais icone={DatabaseBackup} detalhe="Exportar e importar os dados" onClick={() => abrir('backup')}>
                Backup
              </ItemMais>
            )}
            {comTeclado && (
              <ItemMais icone={Keyboard} detalhe="Tecla ?" onClick={() => abrir('atalhos')}>
                Atalhos do teclado
              </ItemMais>
            )}
            {sessao && (
              <ItemMais icone={LogOut} detalhe={sessao.usuario.email} onClick={sessao.sair}>
                Sair da conta
              </ItemMais>
            )}
          </ul>
        </PopoverContent>
      </Popover>

      {lembrete && <DialogLembrete aberto={janela === 'lembrete'} onOpenChange={controlar('lembrete')} lembrete={lembrete} />}
      {EH_DESKTOP && <DialogBackup aberto={janela === 'backup'} onOpenChange={controlar('backup')} />}
      <DialogAtalhos aberto={janela === 'atalhos'} onOpenChange={controlar('atalhos')} />
    </>
  )
}

interface ItemMaisProps {
  icone: ComponentType<{ className?: string }>
  detalhe?: ReactNode
  onClick: () => void
  children: ReactNode
}

/** Linha da lista com ícone, nome e uma linha de detalhe; alta (48px) para acertar o clique sem mira fina. */
function ItemMais({ icone: Icone, detalhe, onClick, children }: ItemMaisProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group flex min-h-12 w-full items-center gap-3 px-3 py-1.5 text-left text-sm font-medium transition-colors duration-100 outline-none hover:bg-amarelo hover:text-tinta focus-visible:bg-amarelo focus-visible:text-tinta"
      >
        <Icone className="size-6 shrink-0" />
        <span className="flex min-w-0 flex-col">
          {children}
          {detalhe && (
            <span className="truncate text-xs font-normal text-muted-foreground group-hover:text-tinta group-focus-visible:text-tinta">
              {detalhe}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}
