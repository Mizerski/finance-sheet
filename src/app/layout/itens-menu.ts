import { FORMA_PAGINA, type FormaDaPagina } from '@/shared/lib/formas'

export type RotaMenu = '/' | '/lancamentos' | '/organizacao' | '/economias' | '/dashboard'

/** Abas do menu, na ordem dos atalhos 1 a 5. A forma é a mesma do título de cada página. */
export const ITENS_MENU: { to: RotaMenu; rotulo: string; forma: FormaDaPagina }[] = [
  { to: '/', rotulo: 'Planilha', forma: FORMA_PAGINA.planilha },
  { to: '/lancamentos', rotulo: 'Lançamentos', forma: FORMA_PAGINA.lancamentos },
  { to: '/organizacao', rotulo: 'Organização', forma: FORMA_PAGINA.organizacao },
  { to: '/economias', rotulo: 'Economias', forma: FORMA_PAGINA.economias },
  { to: '/dashboard', rotulo: 'Dashboard', forma: FORMA_PAGINA.dashboard },
]
