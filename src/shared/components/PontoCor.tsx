import { cn } from '@/shared/lib/utils'

/** Bolinha com a cor de uma categoria (a cor é dado do usuário, por isso vem inline). */
export function PontoCor({ cor, className }: { cor: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: cor }}
    />
  )
}
