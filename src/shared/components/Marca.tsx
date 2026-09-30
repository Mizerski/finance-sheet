import { Forma } from './Forma'

/** Nome do app com as três formas primárias: header e telas avulsas (login, carregamento). */
export function Marca() {
  return (
    <span className="flex items-center gap-2.5 whitespace-nowrap">
      <span aria-hidden className="flex items-end gap-0.5">
        <Forma forma="quadrado" cor="vermelho" className="size-4 sm:size-[1.125rem]" />
        <Forma forma="circulo" cor="azul" className="size-4 sm:size-[1.125rem]" />
        <Forma forma="triangulo" cor="amarelo" className="size-4 sm:size-[1.125rem]" />
      </span>
      <span className="flex flex-col font-heading text-[0.8125rem] leading-[0.95] font-extrabold tracking-[-0.01em] uppercase sm:text-sm">
        <span>Projeção</span>
        <span>Financeira</span>
      </span>
    </span>
  )
}
