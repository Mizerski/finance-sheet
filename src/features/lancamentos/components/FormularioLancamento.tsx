import { useState, type FormEvent } from 'react'
import { Plus } from '@/shared/ui/icones'
import { caixasAtivos, type Caixa } from '@/features/caixas/model/caixa'
import { CampoCaixa } from '@/features/caixas/components/CampoCaixa'
import { useVisao } from '@/features/caixas/hooks/useVisao'
import { categoriasSugeridas, type Categoria } from '@/features/categorias/model/categoria'
import { DialogCategoria } from '@/features/categorias/components/DialogCategoria'
import { DialogTag } from '@/features/tags/components/DialogTag'
import { EfeitoNoCaixa } from '@/features/risco/components/EfeitoNoCaixa'
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
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useFinancas } from '@/store/context/financas-context'
import {
  rascunhoDe,
  rascunhoVazio,
  comInicio,
  trocarRecorrencia,
  trocarTipo,
  validarLancamento,
  type RascunhoLancamento,
} from '../utils/formulario'
import { COR_ATIVA_TIPO } from '../constants/cores'
import type { Lancamento, TipoLancamento, TipoMovimento } from '../model/lancamento'
import { ROTULO_NATUREZA, ROTULO_TIPO } from '../constants/textos'
import { NENHUMA, NOVA } from '../constants/selecao'
import { CampoPasta } from './CampoPasta'
import { SugestaoConhecido } from './SugestaoConhecido'
import { CampoDuracao } from './CampoDuracao'
import { CampoVigencia } from './CampoVigencia'
import { useVigencia } from '../hooks/useVigencia'
import { ListaExcecoes } from './ListaExcecoes'
import { SeletorDiasSemana } from './SeletorDiasSemana'

interface FormularioLancamentoProps {
  /** Ausente = novo lançamento. */
  lancamento?: Lancamento
  /** Data sugerida para um lançamento novo. Sem ela, vale hoje. */
  dataInicial?: DataISO
  /** O que já foi respondido nos passos do modo simples, ao abrir todos os campos de uma vez. */
  rascunhoInicial?: RascunhoLancamento
  onConcluir: () => void
}

const opcaoTipo = (valor: TipoLancamento) => ({ valor, rotulo: ROTULO_TIPO[valor], corAtiva: COR_ATIVA_TIPO[valor] })
const OPCOES_TIPO = (['saida', 'entrada'] as const).map(opcaoTipo)
/** Com duas contas ou mais, o dinheiro também pode mudar de conta. */
const OPCOES_TIPO_COM_TRANSFERENCIA = (['saida', 'entrada', 'transferencia'] as const).map(opcaoTipo)
/** Transferência é só entre contas: o benefício é carimbado e recebe só a recarga. */
const ehConta = (c: Caixa) => c.tipo === 'conta'
const OPCOES_NATUREZA = (['fixa', 'variavel'] as const).map((valor) => ({ valor, rotulo: ROTULO_NATUREZA[valor] }))
const OPCOES_RECORRENCIA = [
  { valor: 'unica' as const, rotulo: 'Única' },
  { valor: 'semanal' as const, rotulo: 'Semanal' },
  { valor: 'mensal' as const, rotulo: 'Mensal' },
  { valor: 'diaria' as const, rotulo: 'Diária' },
]
const OPCOES_DIAS = [
  { valor: 'todos' as const, rotulo: 'Todos os dias' },
  { valor: 'uteis' as const, rotulo: 'Dias úteis' },
]

/**
 * Num recorrente que já aconteceu, pergunta se a mudança vale para os meses que passaram (menos quando o início ou o
 * fim mudou). Num lançamento novo, a recorrência começa na data escolhida.
 */
export function FormularioLancamento({ lancamento, dataInicial, rascunhoInicial, onConcluir }: FormularioLancamentoProps) {
  const { estado, dispatch } = useFinancas()
  const { caixaPadrao } = useVisao()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const [rascunho, setRascunho] = useState<RascunhoLancamento>(
    () => rascunhoInicial ?? (lancamento ? rascunhoDe(lancamento, hoje) : rascunhoVazio(dataInicial ?? hoje, caixaPadrao?.id ?? '')),
  )
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const [criandoCategoria, setCriandoCategoria] = useState(false)
  const [criandoTag, setCriandoTag] = useState(false)

  const saida = rascunho.tipo === 'saida'
  const transferencia = rascunho.tipo === 'transferencia'
  const contas = caixasAtivos(estado.caixas).filter(ehConta)
  const opcoesTipo = contas.length >= 2 || transferencia ? OPCOES_TIPO_COM_TRANSFERENCIA : OPCOES_TIPO
  const categoriasDoTipo = estado.categorias.filter((c) => c.tipo === rascunho.tipo)
  const idsValidos = new Set(categoriasDoTipo.map((c) => c.id))
  const erros = tentouSalvar ? validarLancamento(rascunho, idsValidos) : {}

  const vigencia = useVigencia(lancamento, rascunho, hoje)

  const errosAgora = validarLancamento(rascunho, idsValidos)
  const faltaNaConta = Object.keys(errosAgora).some((campo) => campo !== 'descricao' && campo !== 'categoriaId')
  const simulados = faltaNaConta ? null : vigencia.salvos('simulado')

  function alterar<K extends keyof RascunhoLancamento>(campo: K, valor: RascunhoLancamento[K]) {
    setRascunho((r) => ({ ...r, [campo]: valor }))
  }

  function alterarRecorrencia(recorrencia: RascunhoLancamento['recorrencia']) {
    setRascunho((r) => trocarRecorrencia(r, recorrencia, !lancamento, hoje))
  }

  /** Ignora o valor vazio que o select do Radix avisa logo depois de criar uma categoria. */
  function escolherCategoria(valor: string) {
    if (!valor) return
    if (valor === NOVA) setCriandoCategoria(true)
    else alterar('categoriaId', valor)
  }

  /** Tag: "Sem tag" limpa, "Nova" abre o cadastro; a criada já fica escolhida. Vazio: ver `escolherCategoria`. */
  function escolherTag(valor: string) {
    if (!valor) return
    if (valor === NOVA) setCriandoTag(true)
    else alterar('tagId', valor === NENHUMA ? '' : valor)
  }

  /** A categoria criada no meio do lançamento já fica escolhida (se for do mesmo tipo). */
  function categoriaCriada(categoria: Categoria) {
    if (categoria.tipo === rascunho.tipo) alterar('categoriaId', categoria.id)
  }

  function alterarTipo(tipo: TipoLancamento) {
    const categoria = estado.categorias.find((c) => c.id === rascunho.categoriaId)
    setRascunho((r) => trocarTipo(r, tipo, categoria?.tipo, contas.map((c) => c.id)))
  }

  /** Escolher como origem a conta que era o destino troca as duas de lugar. */
  function alterarOrigem(caixaId: string) {
    setRascunho((r) => ({ ...r, caixaId, caixaDestinoId: r.caixaDestinoId === caixaId ? r.caixaId : r.caixaDestinoId }))
  }

  function salvar(e: FormEvent) {
    e.preventDefault()
    const salvos = vigencia.salvos(crypto.randomUUID())
    if (Object.keys(validarLancamento(rascunho, idsValidos)).length > 0 || !salvos) {
      setTentouSalvar(true)
      return
    }
    for (const l of salvos) dispatch({ tipo: 'lancamento/salvar', lancamento: l })
    onConcluir()
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <ControleSegmentado rotulo="Tipo" valor={rascunho.tipo} opcoes={opcoesTipo} onChange={alterarTipo} />

      {transferencia ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoCaixa
            id="lanc-origem"
            rotulo="Sai de"
            valor={rascunho.caixaId}
            onChange={alterarOrigem}
            filtro={ehConta}
            sempre
          />
          <CampoCaixa
            id="lanc-destino"
            rotulo="Entra em"
            valor={rascunho.caixaDestinoId}
            onChange={(id) => alterar('caixaDestinoId', id)}
            filtro={(c) => ehConta(c) && c.id !== rascunho.caixaId}
            placeholder="Escolher"
            descricao="Não conta como gasto nem como entrada."
            erro={erros.caixaDestinoId}
            sempre
          />
        </div>
      ) : (
        <CampoCaixa id="lanc-caixa" valor={rascunho.caixaId} onChange={(id) => alterar('caixaId', id)} />
      )}

      <Field data-invalid={!!erros.descricao || undefined}>
        <FieldLabel htmlFor="lanc-descricao">Descrição</FieldLabel>
        <Input
          id="lanc-descricao"
          autoFocus
          value={rascunho.descricao}
          onChange={(e) => alterar('descricao', e.target.value)}
          placeholder={transferencia ? 'Ex.: Guardar na poupança' : 'Ex.: Mercado'}
          aria-invalid={!!erros.descricao || undefined}
          className={CAMPO}
        />
        <FieldError>{erros.descricao}</FieldError>
      </Field>

      {!lancamento && <SugestaoConhecido rascunho={rascunho} onUsar={setRascunho} />}

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

        {!transferencia && (
          <Field data-invalid={!!erros.categoriaId || undefined}>
            <FieldLabel htmlFor="lanc-categoria">Categoria</FieldLabel>
            <Select value={rascunho.categoriaId} onValueChange={escolherCategoria}>
              <SelectTrigger
                id="lanc-categoria"
                aria-invalid={!!erros.categoriaId || undefined}
                className={CAMPO_SELECT}
              >
                <SelectValue placeholder="Escolher" />
              </SelectTrigger>
              <SelectContent position="popper">
                {categoriasDoTipo.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <PontoCor cor={c.cor} />
                    {c.nome}
                  </SelectItem>
                ))}
                {categoriasDoTipo.length > 0 && <SelectSeparator />}
                <SelectItem value={NOVA} className="font-semibold">
                  <Plus />
                  Nova categoria
                </SelectItem>
              </SelectContent>
            </Select>
            {categoriasDoTipo.length === 0 ? (
              <FieldDescription>
                Nenhuma categoria de {ROTULO_TIPO[rascunho.tipo].toLowerCase()}.{' '}
                {rascunho.tipo !== 'transferencia' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        for (const categoria of categoriasSugeridas(rascunho.tipo as TipoMovimento, estado.categorias)) {
                          dispatch({ tipo: 'categoria/salvar', categoria })
                        }
                      }}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Usar as sugeridas
                    </button>{' '}
                    ou{' '}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setCriandoCategoria(true)}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  criar uma
                </button>
              </FieldDescription>
            ) : (
              <FieldError>{erros.categoriaId}</FieldError>
            )}
            <DialogCategoria
              aberto={criandoCategoria}
              onOpenChange={setCriandoCategoria}
              tipoInicial={rascunho.tipo === 'entrada' ? 'entrada' : 'saida'}
              onSalvar={categoriaCriada}
            />
          </Field>
        )}
      </div>

      {!transferencia && (
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

          {saida && (
            <Field>
              <FieldLabel htmlFor="lanc-tag">
                Tag <span className="font-normal text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <Select value={rascunho.tagId || NENHUMA} onValueChange={escolherTag}>
                <SelectTrigger id="lanc-tag" className={CAMPO_SELECT}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value={NENHUMA}>
                    Sem tag
                  </SelectItem>
                  {estado.tags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <PontoCor cor={t.cor} />
                      {t.nome}
                      {t.evitavel && <span className="text-muted-foreground">· evitável</span>}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={NOVA} className="font-semibold">
                    <Plus />
                    Nova tag
                  </SelectItem>
                </SelectContent>
              </Select>
              {estado.tags.length === 0 && (
                <FieldDescription>
                  Nenhuma tag ainda.{' '}
                  <button
                    type="button"
                    onClick={() => setCriandoTag(true)}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Criar tag
                  </button>
                </FieldDescription>
              )}
              <DialogTag aberto={criandoTag} onOpenChange={setCriandoTag} onSalvar={(t) => alterar('tagId', t.id)} />
            </Field>
          )}
        </div>
      )}

      <CampoPasta id="lanc-pasta" valor={rascunho.pastaId} onChange={(id) => alterar('pastaId', id)} />

      <Field>
        <FieldLabel htmlFor="lanc-recorrencia">Recorrência</FieldLabel>
        <ControleSegmentado
          id="lanc-recorrencia"
          rotulo="Recorrência"
          valor={rascunho.recorrencia}
          opcoes={OPCOES_RECORRENCIA}
          onChange={alterarRecorrencia}
        />
      </Field>

      {rascunho.recorrencia === 'semanal' && (
        <Field data-invalid={!!erros.diasDaSemana || undefined}>
          <FieldLabel id="lanc-dias-semana">Dias da semana</FieldLabel>
          <SeletorDiasSemana
            rotuloId="lanc-dias-semana"
            valor={rascunho.diasDaSemana}
            onChange={(v) => alterar('diasDaSemana', v)}
            invalido={!!erros.diasDaSemana}
          />
          {erros.diasDaSemana ? (
            <FieldError>{erros.diasDaSemana}</FieldError>
          ) : (
            <FieldDescription>Repete toda semana nos dias marcados, a partir do início.</FieldDescription>
          )}
        </Field>
      )}

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

      {rascunho.recorrencia === 'mensal' && !rascunho.inicio && (
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
            <FieldDescription>Se o mês não tiver esse dia, usa o último.</FieldDescription>
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
        <CampoDuracao
          id="lanc"
          rascunho={rascunho}
          erros={erros}
          hoje={hoje}
          alterar={alterar}
          onInicio={(inicio) => setRascunho((r) => comInicio(r, inicio))}
        />
      )}

      {rascunho.recorrencia !== 'unica' && (
        <ListaExcecoes
          excecoes={rascunho.excecoes}
          onRemover={(data) =>
            setRascunho((r) => ({ ...r, excecoes: Object.fromEntries(Object.entries(r.excecoes).filter(([d]) => d !== data)) }))
          }
        />
      )}

      <CampoVigencia id="lanc-vigencia" v={vigencia} mostrarErro={tentouSalvar} />

      <EfeitoNoCaixa simulados={simulados} substitui={lancamento?.id} tipo={rascunho.tipo} caixaId={rascunho.caixaId} />

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
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
