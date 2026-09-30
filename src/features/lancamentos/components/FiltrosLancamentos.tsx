import { X } from 'lucide-react'
import type { Categoria } from '@/features/categorias/categoria'
import { SEM_TAG, type Tag } from '@/features/tags/tag'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { PontoCor } from '@/shared/components/PontoCor'
import { CAMPO_SELECT } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { FILTRO_SEM_TAG, temFiltro, type FiltrosLancamento } from '../filtros'

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
  { valor: 'entrada' as const, rotulo: 'Entradas' },
  { valor: 'saida' as const, rotulo: 'Saídas' },
]
const OPCOES_NATUREZA = [
  { valor: 'todas' as const, rotulo: 'Todas' },
  { valor: 'fixa' as const, rotulo: 'Fixas' },
  { valor: 'variavel' as const, rotulo: 'Variáveis' },
]

export function FiltrosLancamentos({ filtros, categorias, tags, onChange }: FiltrosLancamentosProps) {
  // Com um tipo escolhido, só faz sentido listar categorias desse tipo.
  const categoriasVisiveis = filtros.tipo ? categorias.filter((c) => c.tipo === filtros.tipo) : categorias

  return (
    <div className="flex flex-wrap items-center gap-2">
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
        <SelectContent position="popper" className="rounded-2xl">
          <SelectItem value={TODAS} className="rounded-full">
            Todas as categorias
          </SelectItem>
          {categoriasVisiveis.map((c) => (
            <SelectItem key={c.id} value={c.id} className="rounded-full">
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
          <SelectContent position="popper" className="rounded-2xl">
            <SelectItem value={TODAS} className="rounded-full">
              Todas as tags
            </SelectItem>
            <SelectItem value={FILTRO_SEM_TAG} className="rounded-full">
              <PontoCor cor={SEM_TAG.cor} />
              Saídas sem tag
            </SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.id} className="rounded-full">
                <PontoCor cor={t.cor} />
                {t.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {temFiltro(filtros) && (
        <Button variant="ghost" className="h-10 rounded-full px-4 text-muted-foreground" onClick={() => onChange({})}>
          <X />
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
