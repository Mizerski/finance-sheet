import { useState, type FormEvent } from 'react'
import { CampoCaixa } from '@/features/caixas/components/CampoCaixa'
import { ehContaCorrente, type Caixa } from '@/features/caixas/model/caixa'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { EscolhaGrande } from '@/shared/components/EscolhaGrande'
import { Forma } from '@/shared/components/Forma'
import { MaisDetalhes } from '@/shared/components/MaisDetalhes'
import { CabecalhoPassos, LinhaConferir, ListaConferir, RodapePassos } from '@/shared/components/Passos'
import { SeletorData } from '@/shared/components/SeletorData'
import { usePassos } from '@/shared/hooks/usePassos'
import { formatarData, formatarMesAno } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { useFinancas } from '@/store/context/financas-context'
import type { CampoMeta, ErrosMeta, FormularioMetaEstado, Onde } from '../hooks/useFormularioMeta'
import { DiagnosticoMeta } from './DiagnosticoMeta'

type Passo = 'nome' | 'onde' | 'alvo' | 'aporte' | 'conferir'

const PASSO_DO_CAMPO: Record<CampoMeta, Passo> = {
  nome: 'nome',
  destino: 'onde',
  jaGuardado: 'alvo',
  prazo: 'alvo',
  aporte: 'aporte',
  dia: 'aporte',
  inicio: 'aporte',
}

const PERGUNTA: Record<Passo, string> = {
  nome: 'Para que é esse dinheiro?',
  onde: 'Onde o dinheiro vai ficar?',
  alvo: 'Quanto você quer juntar?',
  aporte: 'Quanto guardar por mês?',
  conferir: 'Confira antes de salvar',
}

const IDEIAS = ['Reserva de emergência', 'Viagem', 'Comprar à vista']
const ID_PERGUNTA = 'meta-passo-pergunta'

const ehConta = (c: Caixa) => c.tipo === 'conta'

interface FormularioMetaPassosProps {
  f: FormularioMetaEstado
  /** Editando uma meta que existe: abre na conferência, com "Mudar" em cada resposta. */
  editando?: boolean
  onConcluir: () => void
  onVerTudo: () => void
}

/**
 * Meta nova no modo simples: para quê → onde fica (só com duas contas ou mais) → quanto juntar (ou cofrinho) →
 * quanto por mês, com a sugestão que não piora o risco → conferir. Usa o mesmo estado e a mesma validação do
 * formulário completo (`useFormularioMeta`).
 */
export function FormularioMetaPassos({ f, editando = false, onConcluir, onVerTudo }: FormularioMetaPassosProps) {
  const { estado } = useFinancas()
  const lista: Passo[] = ['nome', ...(f.variasContas ? (['onde'] as const) : []), 'alvo', 'aporte', 'conferir']
  const passos = usePassos(lista, 'conferir', { editando })
  const { passo } = passos
  /** "Um valor certo" ou cofrinho; null até a pessoa responder (com a sugestão da reserva, já vem respondido). */
  const [comAlvo, setComAlvo] = useState<boolean | null>(f.alvo > 0 ? true : editando ? false : null)

  function errosDe(p: Passo): ErrosMeta & { escolha?: string; alvo?: string } {
    const todos = f.validar()
    const doPasso = Object.fromEntries(Object.entries(todos).filter(([c]) => PASSO_DO_CAMPO[c as CampoMeta] === p))
    if (p === 'alvo' && comAlvo === null) return { ...doPasso, escolha: 'Escolha uma das opções.' }
    if (p === 'alvo' && comAlvo && f.alvo <= 0) return { ...doPasso, alvo: 'Informe quanto quer juntar.' }
    return doPasso
  }
  const erros = passos.tentou ? errosDe(passo) : {}

  function escolherAlvo(v: 'certo' | 'cofrinho') {
    setComAlvo(v === 'certo')
    if (v === 'cofrinho') {
      f.setAlvo(0)
      f.setPrazo(undefined)
    }
  }

  function continuar(e: FormEvent) {
    e.preventDefault()
    if (passos.noFim) {
      const comErro = lista.find((p) => Object.keys(errosDe(p)).length > 0)
      if (comErro) return passos.mostrarErros(comErro)
      if (f.salvar()) onConcluir()
      return
    }
    if (Object.keys(errosDe(passo)).length > 0) return passos.mostrarErros()
    passos.seguir()
  }

  const nomeDoCaixa = (id: string) => estado.caixas.find((c) => c.id === id)?.nome ?? 'a conta'

  return (
    <form noValidate onSubmit={continuar} className="flex flex-col gap-4">
      <CabecalhoPassos indice={passos.indice} total={passos.total} id={ID_PERGUNTA} titulo={passos.titulo}>
        {PERGUNTA[passo]}
      </CabecalhoPassos>

      {passo === 'nome' && (
        <div className="flex flex-col gap-3">
          <Field data-invalid={!!erros.nome || undefined}>
            <FieldLabel htmlFor="meta-passo-nome">Nome da meta</FieldLabel>
            <Input
              id="meta-passo-nome"
              autoFocus
              value={f.nome}
              onChange={(e) => f.setNome(e.target.value)}
              placeholder="Ex.: Reserva de emergência"
              aria-invalid={!!erros.nome || undefined}
              className={cn(CAMPO, 'h-12 text-base')}
            />
            <FieldError>{erros.nome}</FieldError>
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Ideias:</span>
            {IDEIAS.map((ideia) => (
              <Button key={ideia} type="button" variant="outline" className={cn(BOTAO, 'h-9 px-3 normal-case tracking-normal')} onClick={() => f.setNome(ideia)}>
                {ideia}
              </Button>
            ))}
          </div>
        </div>
      )}

      {passo === 'onde' && (
        <div className="flex flex-col gap-4">
          <CampoCaixa
            id="meta-passo-caixa"
            rotulo="Sai de qual conta?"
            valor={f.caixaId}
            onChange={(id) => {
              f.setCaixaId(id)
              if (id === f.destinoId) f.setDestinoId('')
            }}
            filtro={ehContaCorrente}
          />
          <EscolhaGrande<Onde>
            rotuloId={ID_PERGUNTA}
            valor={f.onde}
            onChange={f.setOnde}
            opcoes={[
              {
                valor: 'conta',
                rotulo: 'Fica separado na mesma conta',
                descricao: 'Sai do disponível, mas continua na conta.',
                marca: <Forma forma="semicirculo" cor={f.onde === 'conta' ? 'papel' : 'amarelo'} className="size-4" />,
              },
              {
                valor: 'outra',
                rotulo: 'Vai para outra conta',
                descricao: 'Todo mês vira uma transferência, por exemplo para a poupança.',
                marca: <Forma forma="quadrado" cor={f.onde === 'outra' ? 'papel' : 'azul'} className="size-4" />,
              },
            ]}
          />
          {f.onde === 'outra' && (
            <CampoCaixa
              id="meta-passo-destino"
              rotulo="Vai para"
              valor={f.destinoId}
              onChange={f.setDestinoId}
              filtro={(c) => ehConta(c) && c.id !== f.caixaId && !f.ocupado(c)}
              placeholder="Escolher"
              descricao={
                f.investimento
                  ? `O que ${f.investimento.nome} já tem (${formatarBRL(f.naConta ?? 0)} hoje) conta como guardado nesta meta.`
                  : undefined
              }
              erro={erros.destino}
              sempre
            />
          )}
        </div>
      )}

      {passo === 'alvo' && (
        <div className="flex flex-col gap-4">
          <EscolhaGrande
            rotuloId={ID_PERGUNTA}
            valor={comAlvo === null ? '' : comAlvo ? 'certo' : 'cofrinho'}
            onChange={escolherAlvo}
            opcoes={[
              { valor: 'certo' as const, rotulo: 'Um valor certo', descricao: 'Ex.: R$ 5.000 para a viagem. Para quando completar.' },
              { valor: 'cofrinho' as const, rotulo: 'Sem valor certo', descricao: 'Um cofrinho: guarda todo mês, sem fim.' },
            ]}
          />
          {erros.escolha && <FieldError>{erros.escolha}</FieldError>}
          {comAlvo && (
            <>
              <Field data-invalid={!!erros.alvo || undefined}>
                <FieldLabel htmlFor="meta-passo-alvo">Quero juntar</FieldLabel>
                <CampoDinheiro
                  id="meta-passo-alvo"
                  centavos={f.alvo}
                  onChange={f.setAlvo}
                  aria-invalid={!!erros.alvo || undefined}
                  className="h-14 text-2xl font-semibold tabular-nums md:text-2xl"
                />
                <FieldError>{erros.alvo}</FieldError>
              </Field>
              <Field data-invalid={!!erros.prazo || undefined}>
                <FieldLabel htmlFor="meta-passo-prazo">
                  Até quando? <span className="font-normal text-muted-foreground">(opcional)</span>
                </FieldLabel>
                <SeletorData
                  id="meta-passo-prazo"
                  valor={f.prazo}
                  onChange={f.setPrazo}
                  placeholder="Sem prazo"
                  opcional
                  mesInicial={f.inicio}
                  invalido={!!erros.prazo}
                />
                <FieldError>{erros.prazo}</FieldError>
              </Field>
            </>
          )}
          {f.naConta !== null ? (
            <p className="text-sm">
              <strong className="font-semibold">{f.investimento?.nome} já tem {formatarBRL(f.naConta)}</strong>, que contam
              como guardado.
            </p>
          ) : (
            comAlvo !== null && (
              <MaisDetalhes rotulo="Já tenho uma parte guardada" rotuloAberto="Esconder">
                <Field data-invalid={!!erros.jaGuardado || undefined}>
                  <FieldLabel htmlFor="meta-passo-ja">Já tenho guardado</FieldLabel>
                  <CampoDinheiro
                    id="meta-passo-ja"
                    centavos={f.jaGuardado}
                    onChange={f.setJaGuardado}
                    aria-invalid={!!erros.jaGuardado || undefined}
                  />
                  {erros.jaGuardado ? (
                    <FieldError>{erros.jaGuardado}</FieldError>
                  ) : (
                    <FieldDescription>Juntado antes, fora do app. Conta para a meta e não mexe no saldo.</FieldDescription>
                  )}
                </Field>
              </MaisDetalhes>
            )
          )}
          {erros.jaGuardado && f.naConta !== null && <FieldError>{erros.jaGuardado}</FieldError>}
        </div>
      )}

      {passo === 'aporte' && (
        <div className="flex flex-col gap-4">
          <Field data-invalid={!!erros.aporte || undefined}>
            <FieldLabel htmlFor="meta-passo-aporte">Guardar por mês</FieldLabel>
            <CampoDinheiro
              id="meta-passo-aporte"
              autoFocus
              centavos={f.aporte}
              onChange={f.setAporte}
              aria-invalid={!!erros.aporte || undefined}
              className="h-14 text-2xl font-semibold tabular-nums md:text-2xl"
            />
            <FieldError>{erros.aporte}</FieldError>
          </Field>
          {f.rascunho && (
            <DiagnosticoMeta rascunho={f.rascunho} avaliacao={f.avaliacao} hoje={f.hoje} onUsarAporte={f.setAporte} />
          )}
          <MaisDetalhes rotulo="Dia do mês e começo" rotuloAberto="Esconder" className="border-t-2 border-contorno pt-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!erros.dia || undefined}>
                <FieldLabel htmlFor="meta-passo-dia">Guardar no dia</FieldLabel>
                <Input
                  id="meta-passo-dia"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  value={f.dia}
                  onChange={(e) => f.setDia(e.target.value)}
                  aria-invalid={!!erros.dia || undefined}
                  className={cn(CAMPO, 'tabular-nums')}
                />
                <FieldError>{erros.dia}</FieldError>
              </Field>
              <Field data-invalid={!!erros.inicio || undefined}>
                <FieldLabel htmlFor="meta-passo-inicio">A partir de</FieldLabel>
                <SeletorData id="meta-passo-inicio" valor={f.inicio} onChange={f.setInicio} invalido={!!erros.inicio} />
                <FieldError>{erros.inicio}</FieldError>
              </Field>
            </div>
          </MaisDetalhes>
        </div>
      )}

      {passo === 'conferir' && (
        <div className="flex flex-col gap-3">
          <ListaConferir>
            <LinhaConferir rotulo="Meta" onMudar={() => passos.mudar('nome')}>
              {f.nome.trim()}
            </LinhaConferir>
            {f.variasContas && (
              <LinhaConferir rotulo="Onde fica" onMudar={() => passos.mudar('onde')}>
                {f.comDestino
                  ? `Sai de ${nomeDoCaixa(f.caixaId)} e vai para ${nomeDoCaixa(f.destinoId)}`
                  : `Separado em ${nomeDoCaixa(f.caixaId)}`}
              </LinhaConferir>
            )}
            <LinhaConferir rotulo="Juntar" onMudar={() => passos.mudar('alvo')}>
              {f.alvo > 0 ? (
                <>
                  <span className="font-semibold text-economia tabular-nums">{formatarBRL(f.alvo)}</span>
                  {f.prazo && <span className="text-muted-foreground"> até {formatarData(f.prazo)}</span>}
                </>
              ) : (
                'Sem valor certo (cofrinho)'
              )}
              {(f.naConta ?? f.jaGuardado) > 0 && (
                <span className="text-muted-foreground"> · já tem {formatarBRL(f.naConta ?? f.jaGuardado)}</span>
              )}
            </LinhaConferir>
            <LinhaConferir rotulo="Por mês" onMudar={() => passos.mudar('aporte')}>
              <span className="font-semibold text-economia tabular-nums">{formatarBRL(f.aporte)}</span>
              <span className="text-muted-foreground">
                {' '}
                todo dia {f.dia}
                {f.inicio && `, a partir de ${formatarData(f.inicio)}`}
              </span>
            </LinhaConferir>
          </ListaConferir>
          {f.conclusao && (
            <p className="text-sm">
              <strong className="font-semibold">Nesse plano, a meta fica completa em {formatarMesAno(f.conclusao)}.</strong>
            </p>
          )}
        </div>
      )}

      <RodapePassos
        primeiro={passos.indice === 0 || (editando && passos.noFim)}
        onVoltar={passos.voltar}
        rotuloAvancar={passos.noFim ? (editando ? 'Salvar alterações' : 'Criar meta') : 'Continuar'}
        onVerTudo={onVerTudo}
      />
    </form>
  )
}
