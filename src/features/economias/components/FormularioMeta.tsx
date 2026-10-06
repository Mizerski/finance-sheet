import { type FormEvent, useState } from 'react'
import { ehContaCorrente, type Caixa } from '@/features/caixas/model/caixa'
import { CampoCaixa } from '@/features/caixas/components/CampoCaixa'
import { CampoDinheiro } from '@/shared/components/CampoDinheiro'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { SeletorData } from '@/shared/components/SeletorData'
import { formatarMesAno } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { BOTAO, CAMPO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DialogClose, DialogFooter } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import type { FormularioMetaEstado } from '../hooks/useFormularioMeta'
import { DiagnosticoMeta } from './DiagnosticoMeta'

interface FormularioMetaProps {
  /** Estado de `useFormularioMeta`, guardado pelo dialog (o mesmo dos passos do modo simples). */
  f: FormularioMetaEstado
  /** Editando uma meta que já existe (muda o texto do botão). */
  editando: boolean
  onConcluir: () => void
}

const OPCOES_ONDE = [
  { valor: 'conta' as const, rotulo: 'Separado na conta' },
  { valor: 'outra' as const, rotulo: 'Em outra conta' },
]
const ehConta = (c: Caixa) => c.tipo === 'conta'

/** Todos os campos da meta de uma vez. A lógica fica em `useFormularioMeta`, a mesma dos passos. */
export function FormularioMeta({ f, editando, onConcluir }: FormularioMetaProps) {
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const erros = tentouSalvar ? f.validar() : {}
  const { caixaId, destinoId, onde, investimento, naConta, alvo, aporte, jaGuardado, dia, inicio, prazo, nome } = f
  const { comDestino, conclusao, rascunho, avaliacao, hoje, variasContas, ocupado } = f
  const { setCaixaId, setDestinoId, setOnde, setNome, setAlvo, setAporte, setJaGuardado, setDia, setInicio, setPrazo } = f

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (!f.salvar()) {
      setTentouSalvar(true)
      return
    }
    onConcluir()
  }

  return (
    <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
      <Field data-invalid={!!erros.nome || undefined}>
        <FieldLabel htmlFor="meta-nome">Nome</FieldLabel>
        <Input
          id="meta-nome"
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Reserva de emergência"
          aria-invalid={!!erros.nome || undefined}
          className={CAMPO}
        />
        <FieldError>{erros.nome}</FieldError>
      </Field>

      <CampoCaixa
        id="meta-caixa"
        valor={caixaId}
        onChange={(id) => {
          setCaixaId(id)
          if (id === destinoId) setDestinoId('')
        }}
        filtro={ehContaCorrente}
        descricao="Conta de onde sai o dinheiro guardado."
      />

      {variasContas && (
        <Field data-invalid={!!erros.destino || undefined}>
          <FieldLabel htmlFor="meta-onde">Onde fica o dinheiro</FieldLabel>
          <ControleSegmentado
            id="meta-onde"
            rotulo="Onde fica o dinheiro"
            valor={onde}
            opcoes={OPCOES_ONDE}
            onChange={setOnde}
          />
          {onde === 'conta' && <FieldDescription>Sai do disponível, mas continua na conta, separado.</FieldDescription>}
        </Field>
      )}
      {variasContas && onde === 'outra' && (
        <CampoCaixa
          id="meta-destino"
          rotulo="Vai para"
          valor={destinoId}
          onChange={setDestinoId}
          filtro={(c) => ehConta(c) && c.id !== caixaId && !ocupado(c)}
          placeholder="Escolher"
          descricao={
            investimento
              ? `Cada aporte vira uma transferência para lá, e o que ${investimento.nome} já tem (${formatarBRL(naConta ?? 0)} hoje) conta como guardado nesta meta.`
              : 'Cada aporte vira uma transferência para essa conta.'
          }
          erro={erros.destino}
          sempre
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="meta-alvo">
            Quero juntar <span className="font-normal text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <CampoDinheiro id="meta-alvo" centavos={alvo} onChange={setAlvo} />
          {alvo === 0 && <FieldDescription>Sem valor, guarda todo mês, sem fim.</FieldDescription>}
        </Field>
        {naConta !== null ? (
          <Field data-invalid={!!erros.jaGuardado || undefined}>
            <FieldLabel>Já está na conta</FieldLabel>
            <p className="flex h-10 items-center text-sm font-semibold tabular-nums">{formatarBRL(naConta)}</p>
            {erros.jaGuardado ? (
              <FieldError>{erros.jaGuardado}</FieldError>
            ) : (
              <FieldDescription>O saldo de {investimento?.nome}, com rendimentos lançados. Muda sozinho.</FieldDescription>
            )}
          </Field>
        ) : (
          <Field data-invalid={!!erros.jaGuardado || undefined}>
            <FieldLabel htmlFor="meta-ja-guardado">
              Já tenho guardado <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <CampoDinheiro
              id="meta-ja-guardado"
              centavos={jaGuardado}
              onChange={setJaGuardado}
              aria-invalid={!!erros.jaGuardado || undefined}
            />
            {erros.jaGuardado ? (
              <FieldError>{erros.jaGuardado}</FieldError>
            ) : (
              <FieldDescription>Juntado antes, fora do app. Conta para a meta e não mexe no saldo.</FieldDescription>
            )}
          </Field>
        )}
        <Field data-invalid={!!erros.prazo || undefined}>
          <FieldLabel htmlFor="meta-prazo">
            Até quando <span className="font-normal text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <SeletorData
            id="meta-prazo"
            valor={prazo}
            onChange={setPrazo}
            placeholder="Sem prazo"
            opcional
            mesInicial={inicio}
            invalido={!!erros.prazo}
          />
          <FieldError>{erros.prazo}</FieldError>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={!!erros.aporte || undefined}>
          <FieldLabel htmlFor="meta-aporte">Guardar por mês</FieldLabel>
          <CampoDinheiro
            id="meta-aporte"
            centavos={aporte}
            onChange={setAporte}
            aria-invalid={!!erros.aporte || undefined}
          />
          {erros.aporte ? (
            <FieldError>{erros.aporte}</FieldError>
          ) : (
            aporte === 0 && <FieldDescription>Em branco, o app sugere um valor.</FieldDescription>
          )}
        </Field>
        <Field data-invalid={!!erros.dia || undefined}>
          <FieldLabel htmlFor="meta-dia">Dia do aporte</FieldLabel>
          <Input
            id="meta-dia"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            aria-invalid={!!erros.dia || undefined}
            className={cn(CAMPO, 'tabular-nums')}
          />
          <FieldError>{erros.dia}</FieldError>
        </Field>
        <Field data-invalid={!!erros.inicio || undefined}>
          <FieldLabel htmlFor="meta-inicio">A partir de</FieldLabel>
          <SeletorData id="meta-inicio" valor={inicio} onChange={setInicio} invalido={!!erros.inicio} />
          <FieldError>{erros.inicio}</FieldError>
        </Field>
      </div>

      {rascunho && (
        <DiagnosticoMeta rascunho={rascunho} avaliacao={avaliacao} hoje={hoje} onUsarAporte={setAporte} />
      )}

      <FieldDescription>
        O aporte sai do {comDestino ? 'saldo' : 'disponível'} todo mês, na coluna Economia da planilha,{' '}
        {alvo > 0 ? 'e para quando a meta é atingida' : 'sem data para acabar'}. Se o mês não tiver o dia escolhido, vale
        o último dia.
        {conclusao && (
          <>
            {' '}
            Nesse plano, a meta fica completa em <span className="text-foreground">{formatarMesAno(conclusao)}</span>.
          </>
        )}
      </FieldDescription>

      <DialogFooter className={RODAPE_DIALOG}>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={BOTAO}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" className={BOTAO}>
          {editando ? 'Salvar alterações' : 'Criar meta'}
        </Button>
      </DialogFooter>
    </form>
  )
}
