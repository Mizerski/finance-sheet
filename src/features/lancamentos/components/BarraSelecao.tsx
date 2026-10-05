import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Check, FolderInput, Shapes, Tag as IconeTag, Trash2, Undo2, Wallet, X } from '@/shared/ui/icones'
import type { Caixa } from '@/features/caixas/model/caixa'
import type { Categoria } from '@/features/categorias/model/categoria'
import { SEM_PASTA, type Pasta } from '@/features/pastas/model/pasta'
import { SEM_TAG, type Tag } from '@/features/tags/model/tag'
import { PontoCor } from '@/shared/components/PontoCor'
import { BOTAO, CAMADA, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import type { Lancamento } from '../model/lancamento'
import type { AlteracaoLote } from '../utils/lote'

/** Aviso depois de uma ação em lote, com o "Desfazer" quando algo mudou. */
export interface AvisoLote {
  /** Muda a cada ação, para o aviso reiniciar o tempo e ser anunciado de novo. */
  id: number
  mensagem: string
  onDesfazer?: () => void
}

interface BarraSelecaoProps {
  selecionados: Lancamento[]
  categorias: Categoria[]
  tags: Tag[]
  pastas: Pasta[]
  /** Caixas ativos; o "Mover para caixa" só aparece com 2 ou mais. */
  caixas: Caixa[]
  aviso: AvisoLote | null
  onAplicar: (alteracao: AlteracaoLote) => void
  onExcluir: () => void
  onLimpar: () => void
  onFecharAviso: () => void
  /** Mouse ou foco na barra: o aviso não some enquanto a pessoa vai até o "Desfazer". */
  onPausarAviso: (pausado: boolean) => void
}

/** Ações em lote para os lançamentos marcados, com o aviso do que mudou e "Desfazer". */
export function BarraSelecao({
  selecionados,
  categorias,
  tags,
  pastas,
  caixas,
  aviso,
  onAplicar,
  onExcluir,
  onLimpar,
  onFecharAviso,
  onPausarAviso,
}: BarraSelecaoProps) {
  const quantidade = selecionados.length
  const visivel = quantidade > 0 || !!aviso
  useEffect(() => {
    if (!visivel) onPausarAviso(false)
  }, [visivel, onPausarAviso])
  if (!visivel) return null

  const tipos = new Set(selecionados.map((l) => l.tipo))
  const temSaidas = tipos.has('saida')
  const gruposCategoria = (['saida', 'entrada'] as const)
    .filter((t) => tipos.has(t))
    .map((t) => ({
      titulo: tipos.size > 1 ? (t === 'saida' ? 'Para as saídas' : 'Para as entradas') : undefined,
      opcoes: categorias.filter((c) => c.tipo === t).map((c) => ({ id: c.id, nome: c.nome, cor: c.cor })),
    }))
    .filter((g) => g.opcoes.length > 0)

  return (
    <div
      role="region"
      aria-label="Ações nos lançamentos selecionados"
      className="fixed inset-x-4 bottom-4 z-40 flex flex-col border-2 border-contorno bg-card shadow-bloco-lg"
      onMouseEnter={() => onPausarAviso(true)}
      onMouseLeave={() => onPausarAviso(false)}
      onFocus={() => onPausarAviso(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && onPausarAviso(false)}
    >
      {aviso && (
        <div
          key={aviso.id}
          role="status"
          className={cn(
            'flex items-center gap-3 px-4 py-2 text-sm',
            quantidade > 0 && 'border-b-2 border-contorno',
          )}
        >
          <Check aria-hidden strokeWidth={3} className="size-6 shrink-0" />
          <p className="min-w-0 flex-1">{aviso.mensagem}</p>
          {aviso.onDesfazer && (
            <Button variant="outline" className={cn(BOTAO, 'h-8 px-3')} onClick={aviso.onDesfazer}>
              <Undo2 />
              Desfazer
            </Button>
          )}
          {quantidade === 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 rounded-full text-muted-foreground"
              aria-label="Fechar aviso"
              onClick={onFecharAviso}
            >
              <X />
            </Button>
          )}
        </div>
      )}

      {quantidade > 0 && (
        <div className="flex items-stretch">
          <div className="flex shrink-0 items-center gap-2 border-r-2 border-contorno bg-amarelo px-4 py-2 text-tinta">
            <span className="font-heading text-2xl leading-none font-bold tabular-nums">{quantidade}</span>
            <span className={cn(ROTULO, 'font-semibold')}>{quantidade === 1 ? 'selecionado' : 'selecionados'}</span>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 px-3 py-2">
            <span className={cn(ROTULO, 'mr-1 text-muted-foreground')}>Mudar</span>
            <MenuLote
              icone={Shapes}
              rotulo="Categoria"
              titulo="Categoria para todos"
              grupos={gruposCategoria}
              vazio="Nenhuma categoria desse tipo cadastrada."
              onEscolher={(id) => id && onAplicar({ campo: 'categoria', id })}
            />
            <MenuLote
              icone={IconeTag}
              rotulo="Tag"
              titulo="Tag para as saídas"
              desabilitado={!temSaidas}
              dica={!temSaidas ? 'Só saídas têm tag' : undefined}
              grupos={[
                {
                  opcoes: [
                    ...tags.map((t) => ({ id: t.id as string | undefined, nome: t.nome, cor: t.cor })),
                    { id: undefined, ...SEM_TAG },
                  ],
                },
              ]}
              onEscolher={(id) => onAplicar({ campo: 'tag', id })}
            />
            {pastas.length > 0 && (
              <MenuLote
                icone={FolderInput}
                rotulo="Pasta"
                titulo="Mover para a pasta"
                grupos={[
                  {
                    opcoes: [
                      ...pastas.map((p) => ({ id: p.id as string | undefined, nome: p.nome, cor: p.cor })),
                      { id: undefined, ...SEM_PASTA },
                    ],
                  },
                ]}
                onEscolher={(id) => onAplicar({ campo: 'pasta', id })}
              />
            )}
            {caixas.length > 1 && (
              <MenuLote
                icone={Wallet}
                rotulo="Caixa"
                titulo="Mover para o caixa"
                redondo
                grupos={[{ opcoes: caixas.map((c) => ({ id: c.id as string | undefined, nome: c.nome, cor: c.cor })) }]}
                onEscolher={(id) => id && onAplicar({ campo: 'caixa', id })}
              />
            )}
            <span aria-hidden className="mx-1 h-6 w-0.5 bg-border" />
            <Button variant="ghost" className={cn(BOTAO, 'px-3 hover:text-destructive')} onClick={onExcluir}>
              <Trash2 />
              Excluir
            </Button>
          </div>

          <div className="flex items-center border-l-2 border-contorno px-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Desmarcar todos (Esc)"
              title="Desmarcar todos (Esc)"
              onClick={onLimpar}
            >
              <X />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface OpcaoMenu {
  /** undefined = tirar (sem tag, sem pasta). */
  id: string | undefined
  nome: string
  cor: string
}

interface MenuLoteProps {
  icone: ComponentType<{ className?: string }>
  rotulo: string
  titulo: string
  grupos: { titulo?: string; opcoes: OpcaoMenu[] }[]
  onEscolher: (id: string | undefined) => void
  vazio?: string
  desabilitado?: boolean
  /** Motivo de estar desabilitado. */
  dica?: string
  /** Bolinha (caixa) em vez do quadradinho (categoria, tag, pasta). */
  redondo?: boolean
}

/** Botão da barra que abre a lista de opções (para cima, sobre a tabela). */
function MenuLote({ icone: Icone, rotulo, titulo, grupos, onEscolher, vazio, desabilitado, dica, redondo }: MenuLoteProps) {
  const [aberto, setAberto] = useState(false)
  const temOpcoes = grupos.some((g) => g.opcoes.length > 0)

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn(BOTAO, 'px-3')} disabled={desabilitado} title={dica}>
          <Icone />
          {rotulo}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className={cn(CAMADA, 'w-64 gap-2')}>
        <p className={cn(ROTULO, 'border-b-2 border-contorno pb-1.5 font-semibold')}>{titulo}</p>
        {!temOpcoes && <p className="text-sm text-muted-foreground">{vazio}</p>}
        {grupos.map((g, i) => (
          <GrupoOpcoes key={i} titulo={g.titulo}>
            {g.opcoes.map((o) => (
              <li key={o.id ?? 'nenhuma'}>
                <button
                  type="button"
                  onClick={() => {
                    onEscolher(o.id)
                    setAberto(false)
                  }}
                  className="flex w-full items-center gap-2 px-2 py-2 text-left text-[0.8125rem] transition-colors outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <PontoCor cor={o.cor} className={cn(redondo && 'rounded-full')} />
                  <span className="min-w-0 flex-1 truncate">{o.nome}</span>
                </button>
              </li>
            ))}
          </GrupoOpcoes>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function GrupoOpcoes({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      {titulo && <p className={cn(ROTULO, 'px-2 pt-1 pb-0.5 text-muted-foreground')}>{titulo}</p>}
      <ul className="-mx-1 flex flex-col">{children}</ul>
    </div>
  )
}
