import { ArrowLeftRight, LayoutDashboard, PiggyBank, Sheet, Tags, type LucideIcon } from 'lucide-react'

export type RotaMenu = '/' | '/lancamentos' | '/organizacao' | '/economias' | '/dashboard'

/** Abas do menu, na ordem dos atalhos 1 a 5. */
export const ITENS_MENU: { to: RotaMenu; rotulo: string; icone: LucideIcon }[] = [
  { to: '/', rotulo: 'Planilha', icone: Sheet },
  { to: '/lancamentos', rotulo: 'Lançamentos', icone: ArrowLeftRight },
  { to: '/organizacao', rotulo: 'Organização', icone: Tags },
  { to: '/economias', rotulo: 'Economias', icone: PiggyBank },
  { to: '/dashboard', rotulo: 'Dashboard', icone: LayoutDashboard },
]
