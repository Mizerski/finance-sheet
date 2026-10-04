// Baixa o llama.cpp (llama-server) que vai dentro do app desktop, em src-tauri/llama/ (fora do git).
// Roda sozinho antes de `npm run desktop` e `npm run desktop:build`; se a versão já estiver lá, não faz nada.
// Para trocar de versão: atualize VERSAO e os sha256 (campo "digest" dos assets da release no GitHub).

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const VERSAO = 'b11391'

/** Build por sistema: Vulkan no Windows e no Linux (qualquer placa de vídeo), Metal no macOS. */
const PACOTES = {
  'win32-x64': { arquivo: `llama-${VERSAO}-bin-win-vulkan-x64.zip`, sha256: '66f88c5e455baf67e3f71827eead3d8de32a992e58bdcc0442cc1d844aa6450c' },
  'linux-x64': { arquivo: `llama-${VERSAO}-bin-ubuntu-vulkan-x64.tar.gz`, sha256: '089d785cc856088c3ac1122b83c562cd4289e87b41bc4dc9a432dff02ca770f1' },
  'darwin-arm64': { arquivo: `llama-${VERSAO}-bin-macos-arm64.tar.gz`, sha256: '25d2bb54a394de7c75d11d4b4a678f600704349c5e5a5366443f746d862df27a' },
  'darwin-x64': { arquivo: `llama-${VERSAO}-bin-macos-x64.tar.gz`, sha256: '6c6b671a6e54fc50b84ea361e9b2861dd98a542784cca4152ad0c6549931917b' },
}

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = join(RAIZ, 'src-tauri', 'llama')
const MARCA = join(DESTINO, 'versao.txt')

// LLAMA_ALVO permite gerar para outra arquitetura (ex.: darwin-x64 num Mac com Apple Silicon).
const alvo = process.env.LLAMA_ALVO ?? `${process.platform}-${process.arch}`
const pacote = PACOTES[alvo]
if (!pacote) {
  console.error(`[llama] Sem build do llama.cpp configurado para ${alvo}.`)
  process.exit(1)
}

const marca = `${VERSAO} ${alvo}`
if (existsSync(MARCA) && (await readFile(MARCA, 'utf8')).trim() === marca) process.exit(0)

console.log(`[llama] Baixando ${pacote.arquivo}…`)
const url = `https://github.com/ggml-org/llama.cpp/releases/download/${VERSAO}/${pacote.arquivo}`
const resposta = await fetch(url)
if (!resposta.ok) throw new Error(`[llama] Falha ao baixar ${url}: ${resposta.status}`)
const conteudo = Buffer.from(await resposta.arrayBuffer())
const hash = createHash('sha256').update(conteudo).digest('hex')
if (hash !== pacote.sha256) throw new Error(`[llama] sha256 diferente do esperado em ${pacote.arquivo}: ${hash}`)

const temporaria = await mkdtemp(join(tmpdir(), 'llama-'))
try {
  const compactado = join(temporaria, pacote.arquivo)
  await writeFile(compactado, conteudo)
  const extraido = join(temporaria, 'extraido')
  await mkdir(extraido)
  // O tar do Windows (bsdtar) abre .zip; o do Git Bash não, por isso o caminho completo.
  const tar = process.platform === 'win32' ? join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe') : 'tar'
  const resultado = spawnSync(tar, ['-xf', compactado, '-C', extraido], { stdio: 'inherit' })
  if (resultado.status !== 0) throw new Error('[llama] Falha ao extrair o pacote.')

  const origem = await pastaDoServidor(extraido)
  await rm(DESTINO, { recursive: true, force: true })
  await mkdir(DESTINO, { recursive: true })
  let copiados = 0
  for (const nome of await readdir(origem)) {
    if (!necessario(nome)) continue
    await cp(join(origem, nome), join(DESTINO, nome), { verbatimSymlinks: true })
    copiados++
  }
  const licenca = await fetch(`https://raw.githubusercontent.com/ggml-org/llama.cpp/${VERSAO}/LICENSE`)
  if (licenca.ok) await writeFile(join(DESTINO, 'LICENSE-llama.cpp'), await licenca.text())
  await writeFile(MARCA, marca)
  console.log(`[llama] ${copiados} arquivos em src-tauri/llama/.`)
} finally {
  await rm(temporaria, { recursive: true, force: true })
}

/** Só o servidor e as bibliotecas; os outros programas do pacote (cli, bench, quantize…) ficam de fora. */
function necessario(nome) {
  if (/^llama-server(\.exe)?$/.test(nome) || /^llama-server-impl\./.test(nome)) return true
  if (/^LICENSE/.test(nome)) return true
  const biblioteca = /\.(dll|dylib)$/.test(nome) || /\.so(\.\d+)*$/.test(nome)
  return biblioteca && !/-impl\./.test(nome) && !/rpc/.test(nome)
}

/** Os pacotes de macOS e Linux têm uma pasta por dentro; o do Windows, não. */
async function pastaDoServidor(pasta) {
  const itens = await readdir(pasta, { withFileTypes: true })
  if (itens.some((i) => /^llama-server(\.exe)?$/.test(i.name))) return pasta
  for (const item of itens) {
    if (!item.isDirectory()) continue
    const achada = await pastaDoServidor(join(pasta, item.name)).catch(() => undefined)
    if (achada) return achada
  }
  throw new Error('[llama] llama-server não encontrado no pacote.')
}
