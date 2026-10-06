import { useEffect, useState } from 'react'
import { Download, Upload } from '@/shared/ui/icones'
import { formatarData } from '@/shared/lib/datas'
import { traduzirErro } from '@/shared/lib/erros'
import { BOTAO, CAMADA, TITULO_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useFinancas } from '@/store/context/financas-context'
import { abrirBackup, caminhoDosDados, salvarBackup } from '../api/arquivos'
import { gerarBackup, lerBackup, nomeDoBackup, type Backup } from '../utils/backup'
import { ConfirmarImportacao } from './ConfirmarImportacao'

type Aviso = { tipo: 'sucesso' | 'erro'; texto: string }

interface DialogBackupProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

/** Desktop: exportar e importar os dados, que só existem neste computador. Abre pelo menu "Mais". */
export function DialogBackup({ aberto, onOpenChange }: DialogBackupProps) {
  const { estado, dispatch } = useFinancas()
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
      onOpenChange(false)
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: traduzirErro(erro) })
    }
  }

  function importar(backup: Backup) {
    dispatch({ tipo: 'dados/importar', dados: backup.dados })
    setEscolhido(null)
    setAviso({ tipo: 'sucesso', texto: `Backup de ${formatarData(backup.exportadoEm)} importado.` })
    onOpenChange(true)
  }

  return (
    <>
      <Dialog open={aberto} onOpenChange={onOpenChange}>
        <DialogContent className={cn(CAMADA, 'gap-4 sm:max-w-sm')}>
          <DialogHeader>
            <DialogTitle className={TITULO_DIALOG}>Backup</DialogTitle>
            <DialogDescription>
              Seus dados ficam só neste computador. Exporte um backup de vez em quando e guarde em outro lugar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button className={cn(BOTAO, 'w-full')} onClick={exportar}>
              <Download className="size-6" />
              Exportar backup
            </Button>
            <Button variant="outline" className={cn(BOTAO, 'w-full')} onClick={escolher}>
              <Upload className="size-6" />
              Importar backup
            </Button>
          </div>
          {aviso && (
            <p role="status" className={cn('text-xs break-all', aviso.tipo === 'erro' ? 'text-negativo' : 'text-foreground')}>
              {aviso.texto}
            </p>
          )}
          {caminho && (
            <p className="border-t-2 border-contorno pt-3 text-xs break-all text-muted-foreground">Arquivo de dados: {caminho}</p>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmarImportacao
        backup={escolhido}
        atual={estado}
        onCancelar={() => setEscolhido(null)}
        onConfirmar={importar}
      />
    </>
  )
}
