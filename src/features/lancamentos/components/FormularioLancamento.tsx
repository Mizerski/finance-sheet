import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { PontoCor } from '@/shared/components/PontoCor'
import { SeletorData } from '@/shared/components/SeletorData'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { BOTAO, CAMPO, CAMPO_SELECT, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useFinancas } from '@/store/financas-context'
import {
  paraLancamento,
  rascunhoDe,
  rascunhoVazio,
  validarLancamento,
  type RascunhoLancamento,
} from '../formulario'
import type { Lancamento, TipoMovimento } from '../lancamento'
import { ROTULO_NATUREZA, ROTULO_TIPO } from '../textos'

interface FormularioLancamentoProps {
  /** Ausente = novo lançamento. */
  lancamento?: Lancamento
  /** Data sugerida para um lançamento novo. Sem ela, vale hoje. */
  dataInicial?: DataISO
  onConcluir: () => void
}

const OPCOES_TIPO = (['saida', 'entrada'] as const).map((valor) => ({ valor, rotulo: ROTULO_TIPO[valor] }))
const OPCOES_NATUREZA = (['fixa', 'variavel'] as const).map((valor) => ({ valor, rotulo: ROTULO_NATUREZA[valor] }))
const OPCOES_RECORRENCIA = [
  { valor: 'unica' as const, rotulo: 'Única' },
  { valor: 'mensal' as const, rotulo: 'Mensal' },
  { valor: 'diaria' as const, rotulo: 'Diária' },
]
/** O Select do Radix não aceita valor vazio, então "sem tag" e "sem pasta" usam um valor sentinela. */
const NENHUMA = '__nenhuma__'

const OPCOES_DIAS = [
  { valor: 'todos' as const, rotulo: 'Todos os dias' },
  { valor: 'uteis' as const, rotulo: 'Dias úteis' },
]

export function FormularioLancamento({ lancamento, dataInicial, onConcluir }: FormularioLancamentoProps) {
  const { estado, dispatch } = useFinancas()
  const [rascunho, setRascunho] = useState<RascunhoLancamento>(() => {
    const hoje = paraDataISO(new Date())
    return lancamento ? rascunhoDe(lancamento, hoje) : rascunhoVazio(dataInicial ?? hoje)
  })
  const [tentouSalvar, setTentouSalvar] = useState(false)

  const saida = rascunho.tipo === 'saida'
  const categoriasDoTipo = estado.categorias.filter((c) => c.tipo === rascunho.tipo)
  const idsValidos = new Set(categoriasDoTipo.map((c) => c.id))
  const erros = tentouSalvar ? validarLancamento(rascunho, idsValidos) : {}

  function alterar<K extends keyof RascunhoLancamento>(campo: K, valor: RascunhoLancamento[K]) {
    setRascunho((r) => ({ ...r, [campo]: valor }))
  }

  function alterarTipo(tipo: TipoMovimento) {
    // A categoria precisa ser do mesmo tipo do lançamento.
    const categoria = estado.categorias.find((c) => c.id === rascunho.categoriaId)
    setRascunho((r) => ({ ...r, tipo, categoriaId: categoria?.tipo === tipo ? r.categoriaId : '' }))
  }

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (Object.keys(validarLancamento(rascunho, idsValidos)).length > 0) {
      setTentouSalvar(true)
      return
    }
    const id = lancamento?.id ?? crypto.randomUUID()
    dispatch({ tipo: 'lancamento/salvar', lancamento: paraLancamento(rascunho, id) })
    onConcluir()
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <ControleSegmentado rotulo="Tipo" valor={rascunho.tipo} opcoes={OPCOES_TIPO} onChange={alterarTipo} />

      <Field data-invalid={!!erros.descricao || undefined}>
        <FieldLabel htmlFor="lanc-descricao">Descrição</FieldLabel>
        <Input
          id="lanc-descricao"
          autoFocus
          value={rascunho.descricao}
          onChange={(e) => alterar('descricao', e.target.value)}
          placeholder="Ex.: Mercado"
          aria-invalid={!!erros.descricao || undefined}
          className={CAMPO}
        />
        <FieldError>{erros.descricao}</FieldError>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!erros.valorCentavos || undefined}>
          <FieldLabel htmlFor="lanc-valor">Valor</FieldLabel>
          <CampoDinheiro
            id="lanc-valor"
            centavos={rascunho.valorCentavos}
            onChange={(c) => alterar('valorCentavos', c)}
            aria-invalid={!!erros.valorCentavos || undefined}
          />
          <FieldError>{erros.valorCentavos}</FieldError>
        </Field>

        <Field data-invalid={!!erros.categoriaId || undefined}>
          <FieldLabel htmlFor="lanc-categoria">Categoria</FieldLabel>
          <Select value={rascunho.categoriaId} onValueChange={(v) => alterar('categoriaId', v)}>
            <SelectTrigger
              id="lanc-categoria"
              aria-invalid={!!erros.categoriaId || undefined}
              className={CAMPO_SELECT}
            >
              <SelectValue placeholder="Escolher" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-2xl">
              {categoriasDoTipo.map((c) => (
                <SelectItem key={c.id} value={c.id} className="rounded-full">
                  <PontoCor cor={c.cor} />
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categoriasDoTipo.length === 0 ? (
            <FieldDescription>
              Nenhuma categoria de {ROTULO_TIPO[rascunho.tipo].toLowerCase()}.{' '}
              <Link to="/organizacao">Criar categoria</Link>
            </FieldDescription>
          ) : (
            <FieldError>{erros.categoriaId}</FieldError>
          )}
        </Field>
      </div>

      <div className={cn('grid gap-4', saida && 'sm:grid-cols-2')}>
        <Field>
          <FieldLabel htmlFor="lanc-natureza">Natureza</FieldLabel>
          <ControleSegmentado
            id="lanc-natureza"
            rotulo="Natureza"
            valor={rascunho.natureza}
            opcoes={OPCOES_NATUREZA}
            onChange={(v) => alterar('natureza', v)}
          />
        </Field>

        {/* Tag só existe em saídas: diz se o gasto era necessário ou evitável. */}
        {saida && (
          <Field>
            <FieldLabel htmlFor="lanc-tag">
              Tag <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <Select
              value={rascunho.tagId || NENHUMA}
              onValueChange={(v) => alterar('tagId', v === NENHUMA ? '' : v)}
            >
              <SelectTrigger id="lanc-tag" className={CAMPO_SELECT}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-2xl">
                <SelectItem value={NENHUMA} className="rounded-full">
                  Sem tag
                </SelectItem>
                {estado.tags.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="rounded-full">
                    <PontoCor cor={t.cor} />
                    {t.nome}
                    {t.evitavel && <span className="text-muted-foreground">· evitável</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {estado.tags.length === 0 && (
              <FieldDescription>
                Nenhuma tag ainda.{' '}
                <Link to="/organizacao" search={{ aba: 'tags' }}>
                  Criar tags
                </Link>
              </FieldDescription>
            )}
          </Field>
        )}
      </div>

      <Field>
        <FieldLabel htmlFor="lanc-pasta">
          Pasta <span className="font-normal text-muted-foreground">(opcional)</span>
        </FieldLabel>
        <Select
          value={rascunho.pastaId || NENHUMA}
          onValueChange={(v) => alterar('pastaId', v === NENHUMA ? '' : v)}
        >
          <SelectTrigger id="lanc-pasta" className={CAMPO_SELECT}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="rounded-2xl">
            <SelectItem value={NENHUMA} className="rounded-full">
              Sem pasta
            </SelectItem>
            {estado.pastas.map((p) => (
              <SelectItem key={p.id} value={p.id} className="rounded-full">
                <PontoCor cor={p.cor} />
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {estado.pastas.length === 0 && (
          <FieldDescription>
            Pastas agrupam a lista de lançamentos.{' '}
            <Link to="/organizacao" search={{ aba: 'pastas' }}>
              Criar pastas
            </Link>
          </FieldDescription>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="lanc-recorrencia">Recorrência</FieldLabel>
        <ControleSegmentado
          id="lanc-recorrencia"
          rotulo="Recorrência"
          valor={rascunho.recorrencia}
          opcoes={OPCOES_RECORRENCIA}
          onChange={(v) => alterar('recorrencia', v)}
        />
      </Field>

      {rascunho.recorrencia === 'unica' && (
        <Field data-invalid={!!erros.data || undefined}>
          <FieldLabel htmlFor="lanc-data">Data</FieldLabel>
          <SeletorData
            id="lanc-data"
            valor={rascunho.data}
            onChange={(v) => alterar('data', v)}
            invalido={!!erros.data}
          />
          <FieldError>{erros.data}</FieldError>
        </Field>
      )}

      {rascunho.recorrencia === 'mensal' && (
        <Field data-invalid={!!erros.diaDoMes || undefined}>
          <FieldLabel htmlFor="lanc-dia">Dia do mês</FieldLabel>
          <Input
            id="lanc-dia"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={rascunho.diaDoMes}
            onChange={(e) => alterar('diaDoMes', e.target.value)}
            aria-invalid={!!erros.diaDoMes || undefined}
            className={cn(CAMPO, 'tabular-nums sm:w-32')}
          />
          {erros.diaDoMes ? (
            <FieldError>{erros.diaDoMes}</FieldError>
          ) : (
            <FieldDescription>Se o mês não tiver esse dia, usa o último dia do mês.</FieldDescription>
          )}
        </Field>
      )}

      {rascunho.recorrencia === 'diaria' && (
        <Field>
          <FieldLabel htmlFor="lanc-dias">Quais dias</FieldLabel>
          <ControleSegmentado
            id="lanc-dias"
            rotulo="Quais dias"
            valor={rascunho.apenasDiasUteis ? 'uteis' : 'todos'}
            opcoes={OPCOES_DIAS}
            onChange={(v) => alterar('apenasDiasUteis', v === 'uteis')}
          />
          <FieldDescription>Dias úteis são de segunda a sexta, sem contar feriados.</FieldDescription>
        </Field>
      )}

      {rascunho.recorrencia !== 'unica' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="lanc-inicio">
              Início <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <SeletorData
              id="lanc-inicio"
              valor={rascunho.inicio}
              onChange={(v) => alterar('inicio', v)}
              placeholder="Desde sempre"
              opcional
            />
          </Field>
          <Field data-invalid={!!erros.fim || undefined}>
            <FieldLabel htmlFor="lanc-fim">
              Fim <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <SeletorData
              id="lanc-fim"
              valor={rascunho.fim}
              onChange={(v) => alterar('fim', v)}
              placeholder="Sem fim"
              mesInicial={rascunho.inicio}
              opcional
              invalido={!!erros.fim}
            />
            <FieldError>{erros.fim}</FieldError>
          </Field>
        </div>
      )}

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={cn(BOTAO, 'bg-card')}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO}>
          {lancamento ? 'Salvar alterações' : 'Adicionar lançamento'}
        </Button>
      </DialogFooter>
    </form>
  )
}
