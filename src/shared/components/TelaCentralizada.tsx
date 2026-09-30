import type { ReactNode } from 'react'
import { Marca } from '@/shared/components/Marca'
import { CARD, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'

interface TelaCentralizadaProps {
  titulo: string
  descricao?: ReactNode
  children?: ReactNode
}

/** Tela de um card só, fora do layout do app: login, carregamento, erros. */
export function TelaCentralizada({ titulo, descricao, children }: TelaCentralizadaProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className={cn(CARD, 'w-full max-w-sm gap-5 p-5 sm:p-6')}>
        <Marca />
        <div className="flex flex-col gap-1.5">
          <h1 className={cn(TITULO_DIALOG, 'text-2xl')}>{titulo}</h1>
          {descricao && <div className="text-sm text-muted-foreground">{descricao}</div>}
        </div>
        {children}
      </Card>
    </div>
  )
}
