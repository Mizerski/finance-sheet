import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { SeletorCor } from '@/features/categorias/components/SeletorCor'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { Forma } from '@/shared/components/Forma'
import { MaisDetalhes } from '@/shared/components/MaisDetalhes'
import { SeletorData } from '@/shared/components/SeletorData'
import { BOTAO, CAMPO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { ehContaCorrente } from '../model/caixa'
import { ESCOLHAS, FORMA_ESCOLHA, PLACEHOLDER_NOME, ROTULO_ESCOLHA } from '../constants/escolha'
import { EXPLICACAO_TIPO } from '../constants/textos'
import type { Escolha, FormularioCaixaEstado } from '../hooks/useFormularioCaixa'
import { CampoCaixa } from './CampoCaixa'
import { CampoDia } from './CampoDia'

interface FormularioCaixaProps {
  /** Estado de `useFormularioCaixa`, guardado pelo dialog (o mesmo dos passos do modo simples). */
  f: FormularioCaixaEstado
  onConcluir: () => void
}

const OPCOES_SIM_NAO = [
  { valor: 'sim' as const, rotulo: 'Sim' },
  { valor: 'nao' as const, rotulo: 'Não' },
]
const OPCOES_SINAL = [
  { valor: 'positivo' as const, rotulo: 'Positivo' },
  { valor: 'negativo' as const, rotulo: 'Negativo' },
]

/** Todos os campos do caixa de uma vez. A lógica fica em `useFormularioCaixa`, a mesma dos passos. */
export function FormularioCaixa({ f, onConcluir }: FormularioCaixaProps) {
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const erros = tentouSalvar ? f.validar() : {}
  const { caixa, nome, setNome, escolha, setEscolha, tipo, investimento, cartao, cor, setCor } = f
  const { centavos, setCentavos, sinal, setSinal, data, setData, contaNoTotal, setContaNoTotal } = f
  const { fechamento, setFechamento, vencimento, setVencimento, pagadora, setPagadora, limite, setLimite } = f

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (!f.salvar()) {
      setTentouSalvar(true)
      return
    }
    onConcluir()
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <Field data-invalid={!!erros.nome || undefined}>
        <FieldLabel htmlFor="caixa-nome">Nome</FieldLabel>
        <Input
          id="caixa-nome"
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={PLACEHOLDER_NOME[escolha]}
          aria-invalid={!!erros.nome || undefined}
          className={CAMPO}
        />
        <FieldError>{erros.nome}</FieldError>
      </Field>

      <Field data-invalid={!!erros.tipo || undefined}>
        <FieldLabel id="caixa-tipo-rotulo">Que dinheiro é esse?</FieldLabel>
        <EscolhaTipo valor={escolha} onChange={setEscolha} />
        <FieldError>{erros.tipo}</FieldError>
      </Field>

      {cartao && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoDia id="caixa-fechamento" rotulo="Fecha no dia" valor={fechamento} onChange={setFechamento} erro={erros.fechamento} />
            <CampoDia id="caixa-vencimento" rotulo="Vence no dia" valor={vencimento} onChange={setVencimento} erro={erros.vencimento} />
          </div>
          <CampoCaixa
            id="caixa-pagadora"
            rotulo="Paga com"
            valor={pagadora}
            onChange={setPagadora}
            filtro={(c) => ehContaCorrente(c) && c.id !== caixa?.id}
            placeholder="Escolher"
            descricao="A fatura sai desta conta no dia do vencimento."
            erro={erros.pagadora}
            sempre
          />
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="caixa-saldo">{cartao ? 'Quanto deve hoje' : 'Saldo inicial'}</FieldLabel>
          <CampoDinheiro id="caixa-saldo" centavos={centavos} onChange={setCentavos} />
          {cartao && <FieldDescription>A fatura fechada mais a aberta, sem as parcelas que ainda vão vir.</FieldDescription>}
        </Field>
        <Field>
          <FieldLabel htmlFor="caixa-data">No começo do dia</FieldLabel>
          <SeletorData id="caixa-data" valor={data} onChange={(d) => d && setData(d)} />
        </Field>
      </div>

      {escolha === 'conta' && (
        <Field>
          <FieldLabel htmlFor="caixa-sinal">Situação da conta</FieldLabel>
          <ControleSegmentado
            id="caixa-sinal"
            rotulo="Situação da conta"
            valor={sinal}
            opcoes={OPCOES_SINAL}
            onChange={setSinal}
          />
          <FieldDescription>Negativo se a conta estava no cheque especial.</FieldDescription>
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor="caixa-cor">Cor</FieldLabel>
        <SeletorCor id="caixa-cor" valor={cor} onChange={setCor} />
      </Field>

      {tipo !== 'beneficio' && (
        <MaisDetalhes rotulo="Mais opções" rotuloAberto="Menos opções">
          {cartao && (
            <Field>
              <FieldLabel htmlFor="caixa-limite">
                Limite <span className="font-normal text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <CampoDinheiro id="caixa-limite" centavos={limite} onChange={setLimite} />
              <FieldDescription>Só para mostrar quanto ainda dá para gastar no cartão.</FieldDescription>
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="caixa-total">Soma no total</FieldLabel>
            <ControleSegmentado
              id="caixa-total"
              rotulo="Soma no total"
              valor={contaNoTotal ? 'sim' : 'nao'}
              opcoes={OPCOES_SIM_NAO}
              onChange={(v) => setContaNoTotal(v === 'sim')}
              className="sm:w-60"
            />
            <FieldDescription>
              {cartao
                ? 'Com "Sim", o Total desconta o que você deve no cartão já no dia da compra. Com "Não", o Total só muda quando a fatura sai da conta.'
                : investimento
                  ? 'Com "Sim", o dinheiro aplicado entra no saldo do Total. O risco do caixa nunca conta com ele.'
                  : 'Escolha "Não" para uma conta que fica de lado, como investimento ou poupança: ela continua com saldo e risco próprios, mas não entra no saldo do Total.'}
            </FieldDescription>
          </Field>
        </MaisDetalhes>
      )}

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO}>
          {caixa ? 'Salvar alterações' : 'Adicionar caixa'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Conta ou benefício em dois cartões com a explicação à vista: a diferença muda o que o app calcula
 * (total, risco e metas na conta; quanto dá por dia até a recarga no benefício). O escolhido fica em bloco preto.
 */
function EscolhaTipo({ valor, onChange }: { valor: Escolha; onChange: (escolha: Escolha) => void }) {
  const tipos = ESCOLHAS

  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const passo = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1
    const proximo = tipos[(tipos.indexOf(valor) + passo + tipos.length) % tipos.length]
    onChange(proximo)
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')[tipos.indexOf(proximo)]?.focus()
  }

  return (
    <div role="radiogroup" aria-labelledby="caixa-tipo-rotulo" onKeyDown={aoTeclar} className="grid gap-2 sm:grid-cols-2">
      {tipos.map((t) => {
        const ativo = t === valor
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={ativo}
            tabIndex={ativo ? 0 : -1}
            onClick={() => onChange(t)}
            className={cn(
              'group flex flex-col gap-1.5 border-2 border-contorno p-3 text-left transition-[background-color,box-shadow,translate] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              ativo
                ? 'bg-foreground text-background motion-safe:translate-x-[2px] motion-safe:translate-y-[2px]'
                : 'bg-card shadow-bloco-sm hover:bg-amarelo hover:text-tinta active:shadow-none motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px]',
            )}
          >
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.06em] uppercase">
              <Forma {...FORMA_ESCOLHA[t]} cor={ativo ? 'papel' : 'tinta'} className="size-3.5" />
              {ROTULO_ESCOLHA[t]}
            </span>
            <span className={cn('text-[0.8125rem] leading-snug', ativo ? 'text-background/85' : 'text-muted-foreground dark:group-hover:text-tinta/80')}>
              {EXPLICACAO_TIPO[t]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
