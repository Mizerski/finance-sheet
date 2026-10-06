import { useState } from 'react'
import { proximaCorLivre } from '@/features/categorias/constants/cores'
import { ehTransferencia } from '@/features/lancamentos/model/lancamento'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/context/financas-context'
import {
  caixasAtivos,
  cartoesPagosPor,
  ehContaCorrente,
  ehUltimaConta,
  metasDoCaixa,
  type Caixa,
  type TipoCaixa,
} from '../model/caixa'

/** O que a pessoa escolhe em "Que dinheiro é esse?": o investimento é uma conta com `investimento`. */
export type Escolha = TipoCaixa | 'investimento'

export type CampoCaixaForm = 'nome' | 'tipo' | 'fechamento' | 'vencimento' | 'pagadora'
export type ErrosCaixa = Partial<Record<CampoCaixaForm, string>>

/** Dia do mês digitado (1–31) ou null. */
function lerDia(texto: string): number | null {
  const dia = Number(texto)
  return texto.trim() && Number.isInteger(dia) && dia >= 1 && dia <= 31 ? dia : null
}

/**
 * Estado, validação e gravação do caixa, iguais no formulário completo e nos passos do modo simples.
 * Caixa novo começa hoje e entra no fim do seletor. Benefício fica sempre fora do total e nunca começa negativo;
 * investimento novo começa fora do total.
 */
export function useFormularioCaixa(caixa: Caixa | undefined) {
  const { estado, dispatch } = useFinancas()
  const [nome, setNome] = useState(caixa?.nome ?? '')
  const [escolha, setEscolhaBase] = useState<Escolha>(caixa?.investimento ? 'investimento' : (caixa?.tipo ?? 'conta'))
  const tipo: TipoCaixa = escolha === 'investimento' ? 'conta' : escolha
  const investimento = escolha === 'investimento'
  const [cor, setCor] = useState(() => caixa?.cor ?? proximaCorLivre(estado.caixas.map((c) => c.cor)))
  const [centavos, setCentavos] = useState(Math.abs(caixa?.saldoInicialCentavos ?? 0))
  const [sinal, setSinal] = useState<'positivo' | 'negativo'>(
    (caixa?.saldoInicialCentavos ?? 0) < 0 ? 'negativo' : 'positivo',
  )
  const [data, setData] = useState<DataISO>(() => caixa?.dataSaldoInicial ?? paraDataISO(new Date()))
  const [contaNoTotal, setContaNoTotal] = useState(caixa && caixa.tipo !== 'beneficio' ? caixa.entraNoTotal : true)
  const contas = caixasAtivos(estado.caixas).filter((c) => ehContaCorrente(c) && c.id !== caixa?.id)
  const [fechamento, setFechamento] = useState(caixa?.cartao ? String(caixa.cartao.diaFechamento) : '')
  const [vencimento, setVencimento] = useState(caixa?.cartao ? String(caixa.cartao.diaVencimento) : '')
  const [pagadora, setPagadora] = useState(caixa?.cartao?.contaPagadoraId ?? contas[0]?.id ?? '')
  const [limite, setLimite] = useState(caixa?.cartao?.limiteCentavos ?? 0)
  const cartao = tipo === 'cartao'

  /** Num caixa novo, o investimento começa fora do total. */
  function setEscolha(e: Escolha) {
    setEscolhaBase(e)
    if (!caixa) setContaNoTotal(e !== 'investimento')
  }

  function validar(): ErrosCaixa {
    const erros: ErrosCaixa = {}
    const limpo = nome.trim()
    if (!limpo) erros.nome = 'Informe um nome.'
    else if (
      estado.caixas.some(
        (c) => c.id !== caixa?.id && c.nome.toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'),
      )
    ) {
      erros.nome = 'Já existe um caixa com esse nome.'
    }
    if (caixa && tipo !== 'conta' && caixa.tipo === 'conta') {
      if (ehUltimaConta(caixa, estado.caixas)) erros.tipo = 'É a única conta: o app precisa de pelo menos uma.'
      else if (cartoesPagosPor(estado.caixas, caixa.id).length > 0) erros.tipo = 'Esta conta paga a fatura de um cartão.'
      else if (metasDoCaixa(estado.metas, caixa.id).length > 0) erros.tipo = 'Este caixa tem metas, e metas só ficam em contas.'
      else if (estado.lancamentos.some((l) => ehTransferencia(l) && (l.caixaId === caixa.id || l.caixaDestinoId === caixa.id))) {
        erros.tipo = 'Este caixa tem transferências, e transferência é só entre contas.'
      }
    }
    if (caixa && investimento && ehContaCorrente(caixa)) {
      const outrasDoDiaADia = caixasAtivos(estado.caixas).filter((c) => ehContaCorrente(c) && c.id !== caixa.id)
      if (outrasDoDiaADia.length === 0) erros.tipo = 'É a única conta do dia a dia: o app precisa de pelo menos uma.'
      else if (cartoesPagosPor(estado.caixas, caixa.id).length > 0) erros.tipo = 'Esta conta paga a fatura de um cartão.'
      else if (estado.metas.some((m) => m.caixaId === caixa.id)) erros.tipo = 'Esta conta tem metas que guardam dinheiro dela.'
    }
    if (caixa && investimento && estado.metas.filter((m) => m.destinoId === caixa.id).length > 1) {
      erros.tipo = 'Mais de uma meta manda dinheiro para esta conta; o investimento fica com uma só.'
    }
    if (cartao) {
      if (lerDia(fechamento) === null) erros.fechamento = 'Use um dia entre 1 e 31.'
      if (lerDia(vencimento) === null) erros.vencimento = 'Use um dia entre 1 e 31.'
      else if (lerDia(vencimento) === lerDia(fechamento)) erros.vencimento = 'O vencimento precisa ser em outro dia.'
      if (!contas.some((c) => c.id === pagadora)) erros.pagadora = 'Escolha a conta que paga a fatura.'
    }
    return erros
  }

  /** O saldo inicial como fica salvo: dívida do cartão e conta no negativo viram valor negativo. */
  const saldoInicialCentavos = cartao ? -centavos : escolha === 'conta' && sinal === 'negativo' ? -centavos : centavos

  /** Grava se estiver tudo certo; devolve se gravou. */
  function salvar(): boolean {
    if (Object.keys(validar()).length > 0) return false
    dispatch({
      tipo: 'caixa/salvar',
      caixa: {
        id: caixa?.id ?? crypto.randomUUID(),
        nome: nome.trim(),
        cor,
        tipo,
        saldoInicialCentavos,
        dataSaldoInicial: data,
        saldoDefinido: true,
        entraNoTotal: tipo !== 'beneficio' && contaNoTotal,
        ...(investimento && { investimento: true }),
        ...(cartao && {
          cartao: {
            diaFechamento: lerDia(fechamento)!,
            diaVencimento: lerDia(vencimento)!,
            contaPagadoraId: pagadora,
            ...(limite > 0 && { limiteCentavos: limite }),
          },
        }),
        ordem: caixa?.ordem ?? Math.max(-1, ...estado.caixas.map((c) => c.ordem)) + 1,
        ...(caixa?.arquivado && { arquivado: true }),
      },
    })
    return true
  }

  return {
    caixa,
    nome,
    setNome,
    escolha,
    setEscolha,
    tipo,
    investimento,
    cartao,
    cor,
    setCor,
    centavos,
    setCentavos,
    sinal,
    setSinal,
    data,
    setData,
    contaNoTotal,
    setContaNoTotal,
    fechamento,
    setFechamento,
    vencimento,
    setVencimento,
    pagadora,
    setPagadora,
    limite,
    setLimite,
    saldoInicialCentavos,
    validar,
    salvar,
  }
}

export type FormularioCaixaEstado = ReturnType<typeof useFormularioCaixa>
