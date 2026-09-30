/** Legenda das séries: a cor fica na marca ao lado, o texto em tinta neutra. */
export function Legenda({ itens }: { itens: { rotulo: string; cor: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 px-2 text-[0.68rem] font-medium tracking-[0.06em] text-foreground uppercase">
      {itens.map((item) => (
        <li key={item.rotulo} className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 border-[1.5px] border-foreground" style={{ backgroundColor: item.cor }} />
          {item.rotulo}
        </li>
      ))}
    </ul>
  )
}
