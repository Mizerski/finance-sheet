import { useState, type FormEvent } from 'react'
import { proximaCorLivre } from '@/features/categorias/cores'
import { SeletorCor } from '@/features/categorias/components/SeletorCor'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { BOTAO, CAMPO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { useFinancas } from '@/store/financas-context'
import { ehUltimaConta, metasDoCaixa, ROTULO_TIPO_CAIXA, type Caixa, type TipoCaixa } from '../caixa'

interface FormularioCaixaProps {
  /** Ausente = novo caixa. */
  caixa?: Caixa
  onConcluir: () => void
}

const OPCOES_TIPO = (['conta', 'beneficio'] as const).map((valor) => ({ valor, rotulo: ROTULO_TIPO_CAIXA[valor] }))
const OPCOES_SIM_NAO = [
  { valor: 'sim' as const, rotulo: 'Sim' },
  { valor: 'nao' as const, rotulo: 'Não' },
]
const OPCOES_SINAL = [
  { valor: 'positivo' as const, rotulo: 'Positivo' },
  { valor: 'negativo' as const, rotulo: 'Negativo' },
]

type Erros = Partial<Record<'nome' | 'tipo' | 'ordem', string>>

export function FormularioCaixa({ caixa, onConcluir }: FormularioCaixaProps) {
  const { estado, dispatch } = useFinancas()
  const [nome, setNome] = useState(caixa?.nome ?? '')
  const [tipo, setTipo] = useState<TipoCaixa>(caixa?.tipo ?? 'conta')
  const [cor, setCor] = useState(() => caixa?.cor ?? proximaCorLivre(estado.caixas.map((c) => c.cor)))
  const [centavos, setCentavos] = useState(Math.abs(caixa?.saldoInicialCentavos ?? 0))
  const [sinal, setSinal] = useState<'positivo' | 'negativo'>(
    (caixa?.saldoInicialCentavos ?? 0) < 0 ? 'negativo' : 'positivo',
  )
  // Caixa novo começa hoje: os dias anteriores ficam fora do cálculo dele.
  const [data, setData] = useState<DataISO>(() => caixa?.dataSaldoInicial ?? paraDataISO(new Date()))
  // Até a pessoa mexer, "entra no total" segue o tipo (conta sim, benefício não).
  const [entraNoTotal, setEntraNoTotal] = useState<boolean | null>(caixa?.entraNoTotal ?? null)
  const [ordem, setOrdem] = useState(() =>
    String(caixa?.ordem ?? Math.max(-1, ...estado.caixas.map((c) => c.ordem)) + 1),
  )
  const [tentouSalvar, setTentouSalvar] = useState(false)

  const noTotal = entraNoTotal ?? tipo === 'conta'

  function validar(): Erros {
    const erros: Erros = {}
    const limpo = nome.trim()
    if (!limpo) erros.nome = 'Informe um nome.'
    else if (
      estado.caixas.some(
        (c) => c.id !== caixa?.id && c.nome.toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'),
      )
    ) {
      erros.nome = 'Já existe um caixa com esse nome.'
    }
    if (caixa && tipo === 'beneficio' && caixa.tipo === 'conta') {
      if (ehUltimaConta(caixa, estado.caixas)) erros.tipo = 'É a única conta: o app precisa de pelo menos uma.'
      else if (metasDoCaixa(estado.metas, caixa.id).length > 0) erros.tipo = 'Este caixa tem metas, e metas só ficam em contas.'
    }
    if (!/^-?\d+$/.test(ordem.trim())) erros.ordem = 'Use um número inteiro.'
    return erros
  }
  const erros = tentouSalvar ? validar() : {}

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (Object.keys(validar()).length > 0) {
      setTentouSalvar(true)
      return
    }
    dispatch({
      tipo: 'caixa/salvar',
      caixa: {
        id: caixa?.id ?? crypto.randomUUID(),
        nome: nome.trim(),
        cor,
        tipo,
        // Benefício não fica negativo no começo: o sinal só vale para conta.
        saldoInicialCentavos: tipo === 'conta' && sinal === 'negativo' ? -centavos : centavos,
        dataSaldoInicial: data,
        saldoDefinido: true,
        entraNoTotal: noTotal,
        ordem: Number(ordem.trim()),
        ...(caixa?.arquivado && { arquivado: true }),
      },
    })
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
          placeholder="Ex.: Vale-refeição"
          aria-invalid={!!erros.nome || undefined}
          className={CAMPO}
        />
        <FieldError>{erros.nome}</FieldError>
      </Field>

      <Field data-invalid={!!erros.tipo || undefined}>
        <FieldLabel htmlFor="caixa-tipo">Tipo</FieldLabel>
        <ControleSegmentado id="caixa-tipo" rotulo="Tipo" valor={tipo} opcoes={OPCOES_TIPO} onChange={setTipo} />
        <FieldDescription>
          {tipo === 'conta'
            ? 'Conta bancária: tem risco do caixa, metas e reserva.'
            : 'Vale: a recarga é uma entrada e os gastos são saídas, como numa conta.'}
        </FieldDescription>
        <FieldError>{erros.tipo}</FieldError>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="caixa-saldo">Saldo inicial</FieldLabel>
          <CampoDinheiro id="caixa-saldo" centavos={centavos} onChange={setCentavos} />
        </Field>
        <Field>
          <FieldLabel htmlFor="caixa-data">No começo do dia</FieldLabel>
          <SeletorData id="caixa-data" valor={data} onChange={(d) => d && setData(d)} />
        </Field>
      </div>

      {tipo === 'conta' && (
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="caixa-total">Entra no total</FieldLabel>
          <ControleSegmentado
            id="caixa-total"
            rotulo="Entra no total"
            valor={noTotal ? 'sim' : 'nao'}
            opcoes={OPCOES_SIM_NAO}
            onChange={(v) => setEntraNoTotal(v === 'sim')}
          />
        </Field>
        <Field data-invalid={!!erros.ordem || undefined}>
          <FieldLabel htmlFor="caixa-ordem">Ordem</FieldLabel>
          <Input
            id="caixa-ordem"
            inputMode="numeric"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
            aria-invalid={!!erros.ordem || undefined}
            className={CAMPO}
          />
          <FieldError>{erros.ordem}</FieldError>
        </Field>
      </div>
      <FieldDescription className="-mt-2">
        No total, o saldo deste caixa soma no de "Todos". Ordem é a posição no seletor de caixas.
      </FieldDescription>

      <Field>
        <FieldLabel htmlFor="caixa-cor">Cor</FieldLabel>
        <SeletorCor id="caixa-cor" valor={cor} onChange={setCor} />
      </Field>

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
