import type { FormaDaPagina } from '@/shared/lib/formas'
import type { TipoAtividade, TomAtividade } from '../model/atividade'
import type { FiltroHistorico } from '../utils/filtro'
import type { PrazoHistorico } from '../utils/limpeza'

/** Forma pequena de cada assunto na lista, a mesma da tela ou do card de onde ele vem. */
export const FORMA_ATIVIDADE: Record<TipoAtividade, FormaDaPagina> = {
  lancamento: { forma: 'circulo', cor: 'azul' },
  meta: { forma: 'semicirculo', cor: 'amarelo' },
  caixa: { forma: 'quadrado', cor: 'vermelho' },
  organizacao: { forma: 'triangulo', cor: 'tinta' },
  dados: { forma: 'quarto', cor: 'tinta' },
}

/** Nome acessível da forma (ela é só decorativa, então o nome vai para quem lê a tela). */
export const ROTULO_ATIVIDADE: Record<TipoAtividade, string> = {
  lancamento: 'Lançamento',
  meta: 'Meta',
  caixa: 'Caixa',
  organizacao: 'Organização',
  dados: 'Backup',
}

export const ROTULO_FILTRO: Record<FiltroHistorico, string> = {
  tudo: 'Tudo',
  lancamento: 'Lançamentos',
  meta: 'Metas',
  caixa: 'Caixas',
  organizacao: 'Categorias, tags e pastas',
}

/** Cor do dinheiro no texto, pela cor do assunto. */
export const COR_TOM: Record<TomAtividade, string> = {
  entrada: 'text-entrada',
  saida: 'text-saida',
  economia: 'text-economia',
}

/** Opções de "Apagar sozinho" (o prazo em dias; 0 = só o limite de registros). */
export const ROTULO_PRAZO: Record<PrazoHistorico, string> = {
  0: 'Nunca',
  30: 'Com mais de 30 dias',
  90: 'Com mais de 3 meses',
  365: 'Com mais de 1 ano',
}
