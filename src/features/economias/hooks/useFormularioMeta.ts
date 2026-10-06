import { useState } from 'react'
import { caixasAtivos, ehInvestimento, type Caixa } from '@/features/caixas/model/caixa'
import { useVisao } from '@/features/caixas/hooks/useVisao'
import { paraDataISO, type DataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/context/financas-context'
import type { MetaEconomia } from '../model/meta'
import { aporteParaOPrazo, resumirMeta } from '../utils/aportes'
import { contaDeInvestimentoDaMeta, saldoProprioDaConta } from '../utils/na-conta'
import { useAvaliacaoMeta } from './useAvaliacaoMeta'

/** Valores que o formulário já abre preenchidos (ex.: a reserva de emergência sugerida). */
export type SugestaoMeta = Partial<Pick<MetaEconomia, 'nome' | 'valorAlvoCentavos' | 'aporteMensalCentavos'>>

export type CampoMeta = 'nome' | 'destino' | 'jaGuardado' | 'aporte' | 'dia' | 'inicio' | 'prazo'
export type ErrosMeta = Partial<Record<CampoMeta, string>>

export type Onde = 'conta' | 'outra'

const ehConta = (c: Caixa) => c.tipo === 'conta'

/**
 * Estado, validação e gravação da meta, iguais no formulário completo e nos passos do modo simples.
 * Com uma conta só, o dinheiro fica separado nela. Com uma conta de investimento como destino, o saldo dela conta
 * como guardado.
 */
export function useFormularioMeta(meta: MetaEconomia | undefined, sugestao: SugestaoMeta | undefined) {
  const { estado, dispatch } = useFinancas()
  const { contaPadrao } = useVisao()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const [caixaId, setCaixaId] = useState(meta?.caixaId ?? contaPadrao?.id ?? '')
  const [onde, setOnde] = useState<Onde>(meta?.destinoId ? 'outra' : 'conta')
  const [destinoId, setDestinoId] = useState(meta?.destinoId ?? '')
  const variasContas = caixasAtivos(estado.caixas).filter(ehConta).length >= 2 || !!meta?.destinoId
  const comDestino = onde === 'outra' && !!destinoId && destinoId !== caixaId
  const investimento = comDestino ? contaDeInvestimentoDaMeta({ destinoId }, estado.caixas) : undefined
  const naConta = investimento ? saldoProprioDaConta(investimento, estado.lancamentos, hoje) : null
  /** Investimento que já é o destino de outra meta: cada conta de investimento fica com uma meta só. */
  const ocupado = (c: Caixa) => ehInvestimento(c) && estado.metas.some((m) => m.destinoId === c.id && m.id !== meta?.id)
  const [nome, setNome] = useState(sugestao?.nome ?? meta?.nome ?? '')
  const [alvo, setAlvo] = useState(sugestao?.valorAlvoCentavos ?? meta?.valorAlvoCentavos ?? 0)
  const [aporte, setAporte] = useState(sugestao?.aporteMensalCentavos ?? meta?.aporteMensalCentavos ?? 0)
  const [jaGuardado, setJaGuardado] = useState(meta?.jaGuardadoCentavos ?? 0)
  const [dia, setDia] = useState(String(meta?.diaDoMes ?? Number(hoje.slice(8, 10))))
  const [inicio, setInicio] = useState<DataISO | undefined>(meta?.inicio ?? hoje)
  const [prazo, setPrazo] = useState<DataISO | undefined>(meta?.prazo)

  const diaDoMes = Number(dia)
  const diaValido = Number.isInteger(diaDoMes) && diaDoMes >= 1 && diaDoMes <= 31

  const rascunho: MetaEconomia | null =
    diaValido && inicio
      ? {
          id: meta?.id ?? '',
          caixaId,
          ...(comDestino && { destinoId }),
          nome: '',
          ...(alvo > 0 && { valorAlvoCentavos: alvo }),
          aporteMensalCentavos: aporte,
          ...(naConta !== null ? { naContaCentavos: naConta } : jaGuardado > 0 && { jaGuardadoCentavos: jaGuardado }),
          diaDoMes,
          inicio,
          ...(prazo && { prazo }),
          ajustes: meta?.ajustes ?? {},
          ...(meta?.resgates && { resgates: meta.resgates }),
          ...(meta?.encerradaEm && { encerradaEm: meta.encerradaEm }),
        }
      : null

  const avaliacao = useAvaliacaoMeta(rascunho, hoje)

  function validar(): ErrosMeta {
    const erros: ErrosMeta = {}
    if (!nome.trim()) erros.nome = 'Informe um nome.'
    if (onde === 'outra' && !comDestino) erros.destino = 'Escolha a conta que recebe o dinheiro.'
    if (alvo > 0 && (naConta ?? jaGuardado) >= alvo) {
      erros.jaGuardado = naConta !== null ? 'A conta já tem o valor que quer juntar.' : 'Já passa do valor que quer juntar.'
    }
    if (aporte <= 0) erros.aporte = 'Informe quanto guardar por mês.'
    if (!diaValido) erros.dia = 'Use um dia de 1 a 31.'
    if (!inicio) erros.inicio = 'Escolha a data do primeiro aporte.'
    if (prazo && alvo <= 0) erros.prazo = 'Para ter prazo, diga quanto quer juntar.'
    else if (prazo && inicio && prazo < inicio) erros.prazo = 'O prazo precisa ser depois do início.'
    else if (rascunho?.prazo && aporteParaOPrazo(rascunho) === null) erros.prazo = 'Não há dia de aporte até essa data.'
    return erros
  }

  const conclusao = rascunho && aporte > 0 ? resumirMeta(rascunho, hoje).conclusaoNoPlano : null

  /** Grava se estiver tudo certo; devolve se gravou. */
  function salvar(): boolean {
    if (Object.keys(validar()).length || !rascunho) return false
    dispatch({ tipo: 'meta/salvar', meta: { ...rascunho, id: meta?.id ?? crypto.randomUUID(), nome: nome.trim() } })
    return true
  }

  return {
    hoje,
    caixaId,
    setCaixaId,
    onde,
    setOnde,
    destinoId,
    setDestinoId,
    variasContas,
    comDestino,
    investimento,
    naConta,
    ocupado,
    nome,
    setNome,
    alvo,
    setAlvo,
    aporte,
    setAporte,
    jaGuardado,
    setJaGuardado,
    dia,
    setDia,
    inicio,
    setInicio,
    prazo,
    setPrazo,
    rascunho,
    avaliacao,
    conclusao,
    validar,
    salvar,
  }
}

export type FormularioMetaEstado = ReturnType<typeof useFormularioMeta>
