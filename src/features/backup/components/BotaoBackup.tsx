import { useEffect, useState } from 'react'
import { DatabaseBackup, Download, Upload } from 'lucide-react'
import { formatarData } from '@/shared/lib/datas'
import { traduzirErro } from '@/shared/lib/erros'
import { BOTAO, CAMADA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/shared/ui/popover'
import { useFinancas } from '@/store/financas-context'
import { abrirBackup, caminhoDosDados, salvarBackup } from '../arquivos'
import { gerarBackup, lerBackup, nomeDoBackup, type Backup } from '../backup'
import { ConfirmarImportacao } from './ConfirmarImportacao'

type Aviso = { tipo: 'sucesso' | 'erro'; texto: string }

/** Desktop: exportar e importar os dados, que só existem neste computador. */
export function BotaoBackup() {
  const { estado, dispatch } = useFinancas()
  const [aberto, setAberto] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [escolhido, setEscolhido] = useState<Backup | null>(null)
  const [caminho, setCaminho] = useState<string | null>(null)

  useEffect(() => {
    caminhoDosDados().then(setCaminho, () => setCaminho(null))
  }, [])

  async function exportar() {
    setAviso(null)
    try {
      const agora = new Date()
      const destino = await salvarBackup(nomeDoBackup(agora), gerarBackup(estado, agora))
      if (destino) setAviso({ tipo: 'sucesso', texto: `Backup salvo em ${destino}` })
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: traduzirErro(erro) })
    }
  }

  async function escolher() {
    setAviso(null)
    try {
      const texto = await abrirBackup()
      if (texto === null) return
      setEscolhido(lerBackup(texto))
      setAberto(false)
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: traduzirErro(erro) })
    }
  }

  function importar(backup: Backup) {
    dispatch({ tipo: 'dados/importar', dados: backup.dados })
    setEscolhido(null)
    setAviso({ tipo: 'sucesso', texto: `Backup de ${formatarData(backup.exportadoEm)} importado.` })
    setAberto(true)
  }

  return (
    <>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Backup dos dados"
            title="Backup dos dados"
          >
            <DatabaseBackup className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className={cn(CAMADA, 'w-80 gap-3')}>
          <PopoverHeader>
            <PopoverTitle>Backup</PopoverTitle>
            <PopoverDescription>
              Seus dados ficam só neste computador. Exporte um backup de vez em quando e guarde em outro lugar.
            </PopoverDescription>
          </PopoverHeader>
          <div className="flex flex-col gap-2">
            <Button className={cn(BOTAO, 'w-full')} onClick={exportar}>
              <Download className="size-4" />
              Exportar backup
            </Button>
            <Button variant="outline" className={cn(BOTAO, 'w-full')} onClick={escolher}>
              <Upload className="size-4" />
              Importar backup
            </Button>
          </div>
          {aviso && (
            <p role="status" className={cn('text-xs break-all', aviso.tipo === 'erro' ? 'text-negativo' : 'text-foreground')}>
              {aviso.texto}
            </p>
          )}
          {caminho && (
            <p className="border-t-2 border-foreground pt-3 text-xs break-all text-muted-foreground">Arquivo de dados: {caminho}</p>
          )}
        </PopoverContent>
      </Popover>

      <ConfirmarImportacao
        backup={escolhido}
        atual={estado}
        onCancelar={() => setEscolhido(null)}
        onConfirmar={importar}
      />
    </>
  )
}
