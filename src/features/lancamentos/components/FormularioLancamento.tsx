import { useState, type FormEvent } from 'react'
import { Plus } from '@/shared/ui/icones'
import { caixasAtivos, type Caixa } from '@/features/caixas/caixa'
import { CampoCaixa } from '@/features/caixas/components/CampoCaixa'
import { useVisao } from '@/features/caixas/useVisao'
import type { Categoria } from '@/features/categorias/categoria'
import { DialogCategoria } from '@/features/categorias/components/DialogCategoria'
import { DialogPasta } from '@/features/pastas/components/DialogPasta'
import { DialogTag } from '@/features/tags/components/DialogTag'
import { EfeitoNoCaixa } from '@/features/risco/components/EfeitoNoCaixa'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { PontoCor } from '@/shared/components/PontoCor'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarData, paraDataISO, somarDias, type DataISO } from '@/shared/lib/datas'
import { BOTAO, CAMPO, CAMPO_SELECT, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useFinancas } from '@/store/financas-context'
import {
  paraLancamento,
  rascunhoDe,
  rascunhoVazio,
  validarLancamento,
  type RascunhoLancamento,
} from '../formulario'
import { COR_ATIVA_TIPO } from '../cores'
import type { Lancamento, TipoLancamento } from '../lancamento'
import { ROTULO_NATUREZA, ROTULO_TIPO } from '../textos'
import { CampoVezes } from './CampoVezes'
import { ListaExcecoes } from './ListaExcecoes'
import { SeletorDiasSemana } from './SeletorDiasSemana'
import { dividirEm, mudaOcorrencias, recorrenteEmAndamento, validarVigencia } from '../vigencia'

interface FormularioLancamentoProps {
  /** Ausente = novo lançamento. */
  lancamento?: Lancamento
  /** Data sugerida para um lançamento novo. Sem ela, vale hoje. */
  dataInicial?: DataISO
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
/** O Select do Radix não aceita valor vazio, então "sem tag" e "sem pasta" usam um valor sentinela. */
const NENHUMA = '__nenhuma__'
/** Item dos seletores de categoria, tag e pasta que abre o cadastro em vez de escolher. */
const NOVA = '__nova__'

const OPCOES_DIAS = [
  { valor: 'todos' as const, rotulo: 'Todos os dias' },
  { valor: 'uteis' as const, rotulo: 'Dias úteis' },
]

type Vigencia = 'daqui' | 'sempre'

const OPCOES_VIGENCIA = [
  { valor: 'daqui' as const, rotulo: 'Daqui para frente' },
  { valor: 'sempre' as const, rotulo: 'Desde o início' },
]

export function FormularioLancamento({ lancamento, dataInicial, onConcluir }: FormularioLancamentoProps) {
  const { estado, dispatch } = useFinancas()
  const { caixaPadrao } = useVisao()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const [rascunho, setRascunho] = useState<RascunhoLancamento>(() =>
    lancamento ? rascunhoDe(lancamento, hoje) : rascunhoVazio(dataInicial ?? hoje, caixaPadrao?.id ?? ''),
  )
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const [vigencia, setVigencia] = useState<Vigencia>('daqui')
  const [aPartirDe, setAPartirDe] = useState<DataISO>(hoje)
  const [criandoCategoria, setCriandoCategoria] = useState(false)
  const [criandoTag, setCriandoTag] = useState(false)
  const [criandoPasta, setCriandoPasta] = useState(false)

  const saida = rascunho.tipo === 'saida'
  const transferencia = rascunho.tipo === 'transferencia'
  const contas = caixasAtivos(estado.caixas).filter(ehConta)
  const opcoesTipo = contas.length >= 2 || transferencia ? OPCOES_TIPO_COM_TRANSFERENCIA : OPCOES_TIPO
  const categoriasDoTipo = estado.categorias.filter((c) => c.tipo === rascunho.tipo)
  const idsValidos = new Set(categoriasDoTipo.map((c) => c.id))
  const erros = tentouSalvar ? validarLancamento(rascunho, idsValidos) : {}

  // Recorrente que já aconteceu: pergunta se a mudança vale para os meses que passaram.
  // Quem mexe no início ou no fim já está cuidando do período, então não pergunta.
  const editado = lancamento && paraLancamento(rascunho, lancamento.id)
  const perguntarVigencia =
    !!lancamento &&
    !!editado &&
    recorrenteEmAndamento(lancamento, hoje) &&
    rascunho.inicio === lancamento.inicio &&
    rascunho.fim === lancamento.fim &&
    mudaOcorrencias(lancamento, editado)
  /** Original que termina na véspera de `aPartirDe`, quando a mudança vale daqui para frente. */
  const dividirDe = perguntarVigencia && vigencia === 'daqui' ? lancamento : undefined
  const erroVigencia = tentouSalvar && dividirDe ? validarVigencia(dividirDe, aPartirDe) : undefined

  // O que seria salvo, para mostrar o efeito no caixa antes de salvar. Descrição e categoria não mudam a conta.
  const errosAgora = validarLancamento(rascunho, idsValidos)
  const faltaNaConta = Object.keys(errosAgora).some((campo) => campo !== 'descricao' && campo !== 'categoriaId')
  // O recorrente como ficaria, para contar as vezes (só a recorrência precisa estar certa).
  const recorrente =
    rascunho.recorrencia !== 'unica' && !errosAgora.diasDaSemana && !errosAgora.diaDoMes
      ? paraLancamento(rascunho, lancamento?.id ?? 'simulado')
      : null
  const simulados = faltaNaConta
    ? null
    : dividirDe && editado
      ? validarVigencia(dividirDe, aPartirDe)
        ? null
        : dividirEm(dividirDe, editado, aPartirDe, 'simulado')
      : [editado ?? paraLancamento(rascunho, 'simulado')]

  function alterar<K extends keyof RascunhoLancamento>(campo: K, valor: RascunhoLancamento[K]) {
    setRascunho((r) => ({ ...r, [campo]: valor }))
  }

  function alterarRecorrencia(recorrencia: RascunhoLancamento['recorrencia']) {
    // "Todo dia 10 daqui em diante": num lançamento novo, a recorrência começa na data escolhida (hoje ou o
    // dia clicado na planilha), e não desde o saldo inicial. O início continua editável logo abaixo.
    setRascunho((r) => ({
      ...r,
      recorrencia,
      ...(recorrencia !== 'unica' && !lancamento && !r.inicio && { inicio: r.data ?? hoje }),
    }))
  }

  function escolherCategoria(valor: string) {
    // Logo depois de criar uma categoria, o <select> oculto do Radix ainda não tem a opção nova e avisa
    // um valor vazio; a lista não tem opção vazia, então ignorar não perde nenhuma escolha real.
    if (!valor) return
    if (valor === NOVA) setCriandoCategoria(true)
    else alterar('categoriaId', valor)
  }

  /** Tag e pasta: "Sem" limpa, "Nova" abre o cadastro; a criada já fica escolhida. Vazio: ver `escolherCategoria`. */
  function escolherOpcional(campo: 'tagId' | 'pastaId', valor: string) {
    if (!valor) return
    if (valor === NOVA) (campo === 'tagId' ? setCriandoTag : setCriandoPasta)(true)
    else alterar(campo, valor === NENHUMA ? '' : valor)
  }

  /** A categoria criada no meio do lançamento já fica escolhida (se for do mesmo tipo). */
  function categoriaCriada(categoria: Categoria) {
    if (categoria.tipo === rascunho.tipo) alterar('categoriaId', categoria.id)
  }

  function alterarTipo(tipo: TipoLancamento) {
    // A categoria precisa ser do mesmo tipo do lançamento.
    const categoria = estado.categorias.find((c) => c.id === rascunho.categoriaId)
    setRascunho((r) => {
      const novo = { ...r, tipo, categoriaId: categoria?.tipo === tipo ? r.categoriaId : '' }
      if (tipo !== 'transferencia') return novo
      // Transferência sai de uma conta para outra: já sugere as duas.
      const origem = contas.some((c) => c.id === r.caixaId) ? r.caixaId : (contas[0]?.id ?? r.caixaId)
      const destino = r.caixaDestinoId && r.caixaDestinoId !== origem ? r.caixaDestinoId : contas.find((c) => c.id !== origem)?.id
      return { ...novo, caixaId: origem, caixaDestinoId: destino ?? '' }
    })
  }

  /** Escolher como origem a conta que era o destino troca as duas de lugar. */
  function alterarOrigem(caixaId: string) {
    setRascunho((r) => ({ ...r, caixaId, caixaDestinoId: r.caixaDestinoId === caixaId ? r.caixaId : r.caixaDestinoId }))
  }

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (
      Object.keys(validarLancamento(rascunho, idsValidos)).length > 0 ||
      (dividirDe && validarVigencia(dividirDe, aPartirDe))
    ) {
      setTentouSalvar(true)
      return
    }
    const salvos =
      dividirDe && editado
        ? dividirEm(dividirDe, editado, aPartirDe, crypto.randomUUID())
        : [editado ?? paraLancamento(rascunho, crypto.randomUUID())]
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

        {/* Transferência não é entrada nem gasto: não tem categoria, tag nem natureza. */}
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
                <button
                  type="button"
                  onClick={() => setCriandoCategoria(true)}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Criar categoria
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

          {/* Tag só existe em saídas: diz se o gasto era necessário ou evitável. */}
          {saida && (
            <Field>
              <FieldLabel htmlFor="lanc-tag">
                Tag <span className="font-normal text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <Select value={rascunho.tagId || NENHUMA} onValueChange={(v) => escolherOpcional('tagId', v)}>
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

      <Field>
        <FieldLabel htmlFor="lanc-pasta">
          Pasta <span className="font-normal text-muted-foreground">(opcional)</span>
        </FieldLabel>
        <Select value={rascunho.pastaId || NENHUMA} onValueChange={(v) => escolherOpcional('pastaId', v)}>
          <SelectTrigger id="lanc-pasta" className={CAMPO_SELECT}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={NENHUMA}>
              Sem pasta
            </SelectItem>
            {estado.pastas.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <PontoCor cor={p.cor} />
                {p.nome}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectItem value={NOVA} className="font-semibold">
              <Plus />
              Nova pasta
            </SelectItem>
          </SelectContent>
        </Select>
        {estado.pastas.length === 0 && (
          <FieldDescription>
            Pastas agrupam a lista de lançamentos.{' '}
            <button
              type="button"
              onClick={() => setCriandoPasta(true)}
              className="underline underline-offset-4 hover:text-primary"
            >
              Criar pasta
            </button>
          </FieldDescription>
        )}
        <DialogPasta aberto={criandoPasta} onOpenChange={setCriandoPasta} onSalvar={(p) => alterar('pastaId', p.id)} />
      </Field>

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
            <FieldDescription>Repete todo mês a partir do início. Se o mês não tiver esse dia, usa o último.</FieldDescription>
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

      {rascunho.recorrencia !== 'unica' && (
        <CampoVezes
          lancamento={recorrente}
          hoje={hoje}
          onAlterar={(fim) => alterar('fim', fim)}
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

      {perguntarVigencia && (
        <Field data-invalid={!!erroVigencia || undefined} className="border-2 border-l-8 border-contorno border-l-amarelo p-4">
          <FieldLabel htmlFor="lanc-vigencia">Este lançamento já aconteceu. A mudança vale</FieldLabel>
          <ControleSegmentado
            id="lanc-vigencia"
            rotulo="A mudança vale"
            valor={vigencia}
            opcoes={OPCOES_VIGENCIA}
            onChange={setVigencia}
          />
          {vigencia === 'daqui' ? (
            <>
              <SeletorData
                id="lanc-a-partir-de"
                valor={aPartirDe}
                onChange={(v) => v && setAPartirDe(v)}
                invalido={!!erroVigencia}
              />
              {erroVigencia ? (
                <FieldError>{erroVigencia}</FieldError>
              ) : (
                <FieldDescription>
                  Até {formatarData(somarDias(aPartirDe, -1))} continua como antes; o lançamento vira dois na lista.
                </FieldDescription>
              )}
            </>
          ) : (
            <FieldDescription>Os meses que já passaram também mudam, e o saldo deles é recalculado.</FieldDescription>
          )}
        </Field>
      )}

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
