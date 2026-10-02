import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { Categoria } from '@/features/categorias/categoria'
import { useAno } from '@/features/projecao/useAno'
import { SEM_TAG, type Tag } from '@/features/tags/tag'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { PontoCor } from '@/shared/components/PontoCor'
import { SeletorPeriodo } from '@/shared/components/SeletorPeriodo'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { BOTAO, CAMADA, CAMPO, CAMPO_SELECT } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { COR_ATIVA_TIPO } from '../cores'
import { paraDataISO } from '@/shared/lib/datas'
import { contarFiltros, FILTRO_SEM_TAG, ID_BUSCA, periodoDoFiltro, temFiltro, type FiltrosLancamento } from '../filtros'

interface FiltrosLancamentosProps {
  filtros: FiltrosLancamento
  categorias: Categoria[]
  tags: Tag[]
  onChange: (filtros: FiltrosLancamento) => void
}

/** O Select do Radix não aceita valor vazio, então "todas" é um valor sentinela. */
const TODAS = '__todas__'

const OPCOES_TIPO = [
  { valor: 'todos' as const, rotulo: 'Todos' },
  { valor: 'entrada' as const, rotulo: 'Entradas', corAtiva: COR_ATIVA_TIPO.entrada },
  { valor: 'saida' as const, rotulo: 'Saídas', corAtiva: COR_ATIVA_TIPO.saida },
]
const OPCOES_NATUREZA = [
  { valor: 'todas' as const, rotulo: 'Todas' },
  { valor: 'fixa' as const, rotulo: 'Fixas' },
  { valor: 'variavel' as const, rotulo: 'Variáveis' },
]

/** Busca sempre à vista; os outros filtros ficam na linha a partir de sm e num popover no celular. */
export function FiltrosLancamentos(props: FiltrosLancamentosProps) {
  const { filtros, onChange } = props
  const telaLarga = useMediaQuery('(min-width: 40rem)')
  const busca = <CampoBusca valor={filtros.q ?? ''} onChange={(q) => onChange({ ...filtros, q: q || undefined })} />

  if (telaLarga) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {busca}
        <Controles {...props} />
        {temFiltro(filtros) && <BotaoLimpar onClick={() => onChange({})} />}
      </div>
    )
  }

  const quantidade = contarFiltros(filtros)
  return (
    <div className="flex items-center gap-2">
      {busca}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn(BOTAO, 'shrink-0')}>
            <SlidersHorizontal />
            Filtros
            {quantidade > 0 && <span className="text-muted-foreground tabular-nums">({quantidade})</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className={cn(CAMADA, 'flex w-[calc(100vw-2rem)] flex-col gap-3')}>
          <Controles {...props} />
          {quantidade > 0 && (
            <div className="border-t-2 border-contorno pt-3">
              <BotaoLimpar onClick={() => onChange({ q: filtros.q })} />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * O texto fica num estado local para não perder letras enquanto a URL atualiza.
 * Quando a busca é limpa por fora (ex.: "Limpar filtros"), o campo esvazia junto.
 */
function CampoBusca({ valor, onChange }: { valor: string; onChange: (q: string) => void }) {
  const [texto, setTexto] = useState(valor)
  const [anterior, setAnterior] = useState(valor)
  if (valor !== anterior) {
    setAnterior(valor)
    if (!valor) setTexto('')
  }

  const alterar = (q: string) => {
    setTexto(q)
    onChange(q)
  }

  return (
    <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={ID_BUSCA}
        type="search"
        aria-label="Buscar lançamento pela descrição"
        placeholder="Buscar lançamento"
        value={texto}
        onChange={(e) => alterar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && texto) {
            e.preventDefault()
            alterar('')
          }
        }}
        className={cn(CAMPO, 'pl-10 [&::-webkit-search-cancel-button]:hidden', texto && 'pr-10')}
      />
      {texto && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 size-8 -translate-y-1/2 text-muted-foreground"
          aria-label="Limpar busca"
          onClick={() => alterar('')}
        >
          <X />
        </Button>
      )}
    </div>
  )
}

function Controles({ filtros, categorias, tags, onChange }: FiltrosLancamentosProps) {
  const { intervalo } = useAno()
  const [hoje] = useState(() => paraDataISO(new Date()))
  // Com um tipo escolhido, só faz sentido listar categorias desse tipo.
  const categoriasVisiveis = filtros.tipo ? categorias.filter((c) => c.tipo === filtros.tipo) : categorias

  return (
    <>
      {/* Data como no Dashboard: Dia, Semana, Mês, Ano ou um intervalo; mostra só o que acontece nele. */}
      <SeletorPeriodo
        rotulo="Filtrar por data"
        periodo={periodoDoFiltro(filtros)}
        intervalo={intervalo}
        hoje={hoje}
        onChange={({ de, ate }) => onChange({ ...filtros, de, ate })}
        onLimpar={() => onChange({ ...filtros, de: undefined, ate: undefined })}
        className="w-full sm:w-auto"
      />

      <ControleSegmentado
        rotulo="Filtrar por tipo"
        valor={filtros.tipo ?? 'todos'}
        opcoes={OPCOES_TIPO}
        onChange={(v) => {
          const tipo = v === 'todos' ? undefined : v
          const categoria = categorias.find((c) => c.id === filtros.categoria)
          onChange({
            ...filtros,
            tipo,
            categoria: tipo && categoria && categoria.tipo !== tipo ? undefined : filtros.categoria,
            // Só saídas têm tag.
            tag: tipo === 'entrada' ? undefined : filtros.tag,
          })
        }}
        className="w-full sm:w-auto"
      />

      <ControleSegmentado
        rotulo="Filtrar por natureza"
        valor={filtros.natureza ?? 'todas'}
        opcoes={OPCOES_NATUREZA}
        onChange={(v) => onChange({ ...filtros, natureza: v === 'todas' ? undefined : v })}
        className="w-full sm:w-auto"
      />

      <Select
        value={filtros.categoria ?? TODAS}
        onValueChange={(v) => onChange({ ...filtros, categoria: v === TODAS ? undefined : v })}
      >
        <SelectTrigger aria-label="Filtrar por categoria" className={cn(CAMPO_SELECT, 'sm:w-56')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={TODAS}>
            Todas as categorias
          </SelectItem>
          {categoriasVisiveis.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <PontoCor cor={c.cor} />
              {c.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtros.tipo !== 'entrada' && (
        <Select
          value={filtros.tag ?? TODAS}
          onValueChange={(v) => onChange({ ...filtros, tag: v === TODAS ? undefined : v })}
        >
          <SelectTrigger aria-label="Filtrar por tag" className={cn(CAMPO_SELECT, 'sm:w-48')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={TODAS}>
              Todas as tags
            </SelectItem>
            <SelectItem value={FILTRO_SEM_TAG}>
              <PontoCor cor={SEM_TAG.cor} />
              Saídas sem tag
            </SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <PontoCor cor={t.cor} />
                {t.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  )
}

function BotaoLimpar({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" className={cn(BOTAO, 'text-muted-foreground')} onClick={onClick}>
      <X />
      Limpar filtros
    </Button>
  )
}
