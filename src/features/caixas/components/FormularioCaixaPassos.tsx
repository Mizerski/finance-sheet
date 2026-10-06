import type { FormEvent } from 'react'
import { SeletorCor } from '@/features/categorias/components/SeletorCor'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { EscolhaGrande } from '@/shared/components/EscolhaGrande'
import { Forma } from '@/shared/components/Forma'
import { MaisDetalhes } from '@/shared/components/MaisDetalhes'
import { CabecalhoPassos, LinhaConferir, ListaConferir, RodapePassos } from '@/shared/components/Passos'
import { PontoCor } from '@/shared/components/PontoCor'
import { SeletorData } from '@/shared/components/SeletorData'
import { usePassos } from '@/shared/hooks/usePassos'
import { formatarData } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { CAMPO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { useFinancas } from '@/store/context/financas-context'
import { ESCOLHAS, FORMA_ESCOLHA, PLACEHOLDER_NOME, ROTULO_ESCOLHA } from '../constants/escolha'
import { EXPLICACAO_TIPO } from '../constants/textos'
import type { CampoCaixaForm, Escolha, FormularioCaixaEstado } from '../hooks/useFormularioCaixa'
import { ehContaCorrente } from '../model/caixa'
import { CampoCaixa } from './CampoCaixa'
import { CampoDia } from './CampoDia'

type Passo = 'tipo' | 'nome' | 'cartao' | 'saldo' | 'conferir'

const PASSO_DO_CAMPO: Record<CampoCaixaForm, Passo> = {
  tipo: 'tipo',
  nome: 'nome',
  fechamento: 'cartao',
  vencimento: 'cartao',
  pagadora: 'cartao',
}

const PERGUNTA_SALDO: Record<Escolha, string> = {
  conta: 'Quanto tem nela hoje?',
  investimento: 'Quanto tem aplicado hoje?',
  beneficio: 'Quanto tem no benefício hoje?',
  cartao: 'Quanto você deve no cartão hoje?',
}

const OPCOES_SINAL = [
  { valor: 'positivo' as const, rotulo: 'No positivo' },
  { valor: 'negativo' as const, rotulo: 'No negativo' },
]
const OPCOES_SIM_NAO = [
  { valor: 'sim' as const, rotulo: 'Sim' },
  { valor: 'nao' as const, rotulo: 'Não' },
]

const ID_PERGUNTA = 'caixa-passo-pergunta'

interface FormularioCaixaPassosProps {
  f: FormularioCaixaEstado
  /** Editando um caixa que existe: abre na conferência, com "Mudar" em cada resposta. */
  editando?: boolean
  onConcluir: () => void
  onVerTudo: () => void
}

/**
 * Caixa novo no modo simples: que dinheiro é → nome e cor → fatura (só cartão) → quanto tem hoje → conferir.
 * Usa o mesmo estado e a mesma validação do formulário completo (`useFormularioCaixa`).
 */
export function FormularioCaixaPassos({ f, editando = false, onConcluir, onVerTudo }: FormularioCaixaPassosProps) {
  const { estado } = useFinancas()
  const listaDe = (e: Escolha): Passo[] => ['tipo', 'nome', ...(e === 'cartao' ? (['cartao'] as const) : []), 'saldo', 'conferir']
  const lista = listaDe(f.escolha)
  const passos = usePassos(lista, 'conferir', { editando })
  const { passo, respondidos } = passos

  function errosDe(p: Passo): Partial<Record<CampoCaixaForm | 'escolha', string>> {
    if (p === 'tipo' && !respondidos.has('tipo')) return { escolha: 'Escolha uma das opções.' }
    return Object.fromEntries(Object.entries(f.validar()).filter(([c]) => PASSO_DO_CAMPO[c as CampoCaixaForm] === p))
  }
  const erros = passos.tentou ? errosDe(passo) : {}

  /** O tipo muda as perguntas seguintes, então segue em frente mesmo vindo da conferência. */
  function escolherTipo(e: Escolha) {
    f.setEscolha(e)
    passos.seguir(listaDe(e), true)
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

  const pergunta =
    passo === 'tipo'
      ? 'Que dinheiro é esse?'
      : passo === 'nome'
        ? 'Que nome dar a ele?'
        : passo === 'cartao'
          ? 'Quando a fatura fecha e vence?'
          : passo === 'saldo'
            ? PERGUNTA_SALDO[f.escolha]
            : 'Confira antes de salvar'
  const pagadora = estado.caixas.find((c) => c.id === f.pagadora)?.nome

  return (
    <form noValidate onSubmit={continuar} className="flex flex-col gap-4">
      <CabecalhoPassos indice={passos.indice} total={passos.total} id={ID_PERGUNTA} titulo={passos.titulo}>
        {pergunta}
      </CabecalhoPassos>

      {passo === 'tipo' && (
        <>
          <EscolhaGrande
            rotuloId={ID_PERGUNTA}
            valor={respondidos.has('tipo') ? f.escolha : ''}
            onChange={escolherTipo}
            className="sm:grid-cols-2"
            opcoes={ESCOLHAS.map((e) => ({
              valor: e,
              rotulo: ROTULO_ESCOLHA[e],
              descricao: EXPLICACAO_TIPO[e],
              marca: (
                <Forma {...FORMA_ESCOLHA[e]} cor={respondidos.has('tipo') && f.escolha === e ? 'papel' : 'tinta'} className="size-4" />
              ),
            }))}
          />
          {erros.escolha && <FieldError>{erros.escolha}</FieldError>}
        </>
      )}

      {passo === 'nome' && (
        <div className="flex flex-col gap-4">
          <Field data-invalid={!!erros.nome || undefined}>
            <FieldLabel htmlFor="caixa-passo-nome">Nome</FieldLabel>
            <Input
              id="caixa-passo-nome"
              autoFocus
              value={f.nome}
              onChange={(e) => f.setNome(e.target.value)}
              placeholder={PLACEHOLDER_NOME[f.escolha]}
              aria-invalid={!!erros.nome || undefined}
              className={cn(CAMPO, 'h-12 text-base')}
            />
            <FieldError>{erros.nome}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="caixa-passo-cor">Cor</FieldLabel>
            <SeletorCor id="caixa-passo-cor" valor={f.cor} onChange={f.setCor} />
            <FieldDescription>Para reconhecer o caixa no seletor e nas listas.</FieldDescription>
          </Field>
        </div>
      )}

      {passo === 'cartao' && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoDia id="caixa-passo-fechamento" rotulo="Fecha no dia" valor={f.fechamento} onChange={f.setFechamento} erro={erros.fechamento} />
            <CampoDia id="caixa-passo-vencimento" rotulo="Vence no dia" valor={f.vencimento} onChange={f.setVencimento} erro={erros.vencimento} />
          </div>
          <CampoCaixa
            id="caixa-passo-pagadora"
            rotulo="Paga com qual conta?"
            valor={f.pagadora}
            onChange={f.setPagadora}
            filtro={ehContaCorrente}
            placeholder="Escolher"
            descricao="A fatura sai desta conta no dia do vencimento."
            erro={erros.pagadora}
            sempre
          />
          <MaisDetalhes rotulo="Limite do cartão" rotuloAberto="Esconder">
            <Field>
              <FieldLabel htmlFor="caixa-passo-limite">
                Limite <span className="font-normal text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <CampoDinheiro id="caixa-passo-limite" centavos={f.limite} onChange={f.setLimite} />
              <FieldDescription>Só para mostrar quanto ainda dá para gastar no cartão.</FieldDescription>
            </Field>
          </MaisDetalhes>
        </div>
      )}

      {passo === 'saldo' && (
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="caixa-passo-saldo">{f.cartao ? 'Quanto deve' : 'Saldo'}</FieldLabel>
            <CampoDinheiro
              id="caixa-passo-saldo"
              autoFocus
              centavos={f.centavos}
              onChange={f.setCentavos}
              className="h-14 text-2xl font-semibold tabular-nums md:text-2xl"
            />
            {f.cartao && (
              <FieldDescription>A fatura fechada mais a aberta, sem as parcelas que ainda vão vir.</FieldDescription>
            )}
          </Field>
          {f.escolha === 'conta' && (
            <Field>
              <FieldLabel htmlFor="caixa-passo-sinal">A conta está</FieldLabel>
              <ControleSegmentado id="caixa-passo-sinal" rotulo="A conta está" valor={f.sinal} opcoes={OPCOES_SINAL} onChange={f.setSinal} />
              <FieldDescription>No negativo se estiver usando o cheque especial.</FieldDescription>
            </Field>
          )}
          <MaisDetalhes rotulo="Mais opções" rotuloAberto="Esconder opções" className="border-t-2 border-contorno pt-3">
            <Field>
              <FieldLabel htmlFor="caixa-passo-data">Esse valor é do começo do dia</FieldLabel>
              <SeletorData id="caixa-passo-data" valor={f.data} onChange={(d) => d && f.setData(d)} />
            </Field>
            {f.tipo !== 'beneficio' && (
              <Field>
                <FieldLabel htmlFor="caixa-passo-total">Soma no total</FieldLabel>
                <ControleSegmentado
                  id="caixa-passo-total"
                  rotulo="Soma no total"
                  valor={f.contaNoTotal ? 'sim' : 'nao'}
                  opcoes={OPCOES_SIM_NAO}
                  onChange={(v) => f.setContaNoTotal(v === 'sim')}
                  className="sm:w-60"
                />
                <FieldDescription>
                  {f.investimento
                    ? 'Com "Sim", o dinheiro aplicado entra no saldo do Total.'
                    : 'Com "Não", o caixa tem saldo próprio, mas fica fora do saldo do Total.'}
                </FieldDescription>
              </Field>
            )}
          </MaisDetalhes>
        </div>
      )}

      {passo === 'conferir' && (
        <ListaConferir>
          <LinhaConferir rotulo="Tipo" onMudar={() => passos.mudar('tipo')}>
            {ROTULO_ESCOLHA[f.escolha]}
          </LinhaConferir>
          <LinhaConferir rotulo="Nome" onMudar={() => passos.mudar('nome')}>
            <span className="flex items-center gap-2">
              <PontoCor cor={f.cor} />
              {f.nome.trim()}
            </span>
          </LinhaConferir>
          {f.cartao && (
            <LinhaConferir rotulo="Fatura" onMudar={() => passos.mudar('cartao')}>
              Fecha dia {f.fechamento}, vence dia {f.vencimento}
              {pagadora && <>, paga com {pagadora}</>}
              {f.limite > 0 && <span className="text-muted-foreground"> · limite {formatarBRL(f.limite)}</span>}
            </LinhaConferir>
          )}
          <LinhaConferir rotulo={f.cartao ? 'Deve hoje' : 'Saldo'} onMudar={() => passos.mudar('saldo')}>
            <span className={cn('font-semibold tabular-nums', f.saldoInicialCentavos < 0 && 'text-negativo')}>
              {formatarBRL(f.cartao ? f.centavos : f.saldoInicialCentavos)}
            </span>
            <span className="text-muted-foreground"> em {formatarData(f.data)}</span>
            {f.tipo !== 'beneficio' && (
              <span className="text-muted-foreground"> · {f.contaNoTotal ? 'soma no total' : 'fora do total'}</span>
            )}
          </LinhaConferir>
        </ListaConferir>
      )}

      <RodapePassos
        primeiro={passos.indice === 0 || (editando && passos.noFim)}
        onVoltar={passos.voltar}
        rotuloAvancar={passos.noFim ? (editando ? 'Salvar alterações' : 'Criar caixa') : 'Continuar'}
        onVerTudo={onVerTudo}
      />
    </form>
  )
}
