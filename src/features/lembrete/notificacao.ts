import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'

/** Pede permissão só se ainda não tiver; false se o sistema bloqueou as notificações do app. */
export async function garantirPermissao(): Promise<boolean> {
  if (await isPermissionGranted()) return true
  return (await requestPermission()) === 'granted'
}

/** Mostra a notificação do sistema; false se não houver permissão. */
export async function notificar(titulo: string, corpo: string): Promise<boolean> {
  if (!(await garantirPermissao())) return false
  sendNotification({ title: titulo, body: corpo })
  return true
}
