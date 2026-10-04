//! O processo do llama-server: sobe com o modelo escolhido, numa porta livre do 127.0.0.1, e morre com o app.

use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use tauri::{AppHandle, Manager};

use super::catalogo::Modelo;

/// Contexto da conversa em tokens: manual + retrato + histórico (o mesmo `CONTEXTO` de `prompt.ts`).
const CONTEXTO: &str = "12288";
/// Carregar um modelo de 3 GB num HD lento pode demorar.
const LIMITE_PARA_LIGAR: Duration = Duration::from_secs(180);

pub struct Servidor {
    processo: Child,
    pub porta: u16,
    pub chave: String,
    pub modelo: &'static Modelo,
}

impl Servidor {
    pub fn iniciar(app: &AppHandle, modelo: &'static Modelo, caminho_modelo: &Path) -> Result<Self, String> {
        let executavel = executavel(app)?;
        let porta = porta_livre()?;
        let chave = chave_aleatoria();
        let log = File::create(caminho_log(app)?).map_err(|e| format!("Não foi possível criar o log do assistente: {e}"))?;
        let log_erros = log.try_clone().map_err(|e| e.to_string())?;

        let mut comando = Command::new(&executavel);
        comando
            .arg("--model")
            .arg(caminho_modelo)
            .args(["--host", "127.0.0.1", "--port", &porta.to_string(), "--api-key", &chave])
            .args(["--ctx-size", CONTEXTO, "--parallel", "1"])
            // Usa a placa de vídeo até onde couber; o resto (ou tudo, sem placa) fica no processador.
            .args(["--fit", "on"])
            // Sem "pensar em voz alta": a resposta começa direto.
            .args(["--reasoning", "off", "--no-webui"])
            .stdin(Stdio::null())
            .stdout(log)
            .stderr(log_erros);
        if let Some(pasta) = executavel.parent() {
            comando.current_dir(pasta);
        }
        sem_janela(&mut comando);

        let processo = comando.spawn().map_err(|e| format!("Não foi possível abrir o motor do assistente: {e}"))?;
        prender_ao_app(&processo);
        Ok(Self { processo, porta, chave, modelo })
    }

    /// Espera o modelo carregar (o /health responde 200). Se o processo morrer antes, devolve o motivo do log.
    pub async fn esperar_pronto(&mut self, app: &AppHandle, cliente: &reqwest::Client) -> Result<(), String> {
        let inicio = Instant::now();
        let url = format!("http://127.0.0.1:{}/health", self.porta);
        loop {
            if let Ok(Some(_)) = self.processo.try_wait() {
                let detalhe = ultimo_erro(app).map(|e| format!(" Detalhe: {e}")).unwrap_or_default();
                return Err(format!(
                    "O assistente não conseguiu ligar. Pode faltar memória no computador.{detalhe}"
                ));
            }
            if let Ok(resposta) = cliente.get(&url).timeout(Duration::from_secs(2)).send().await {
                if resposta.status().is_success() {
                    return Ok(());
                }
            }
            if inicio.elapsed() > LIMITE_PARA_LIGAR {
                return Err("O assistente demorou demais para ligar. Tente de novo.".into());
            }
            tokio::time::sleep(Duration::from_millis(300)).await;
        }
    }

    pub fn vivo(&mut self) -> bool {
        matches!(self.processo.try_wait(), Ok(None))
    }
}

impl Drop for Servidor {
    fn drop(&mut self) {
        let _ = self.processo.kill();
        let _ = self.processo.wait();
    }
}

fn executavel(app: &AppHandle) -> Result<PathBuf, String> {
    let nome = if cfg!(windows) { "llama-server.exe" } else { "llama-server" };
    let caminho = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("llama")
        .join(nome);
    if caminho.exists() {
        Ok(caminho)
    } else {
        Err("O motor do assistente não veio com esta instalação.".into())
    }
}

pub fn motor_instalado(app: &AppHandle) -> bool {
    executavel(app).is_ok()
}

/// Placa de vídeo que o motor enxerga (Vulkan/Metal), com a memória em MiB. Sem placa, `None`.
pub fn placa_de_video(app: &AppHandle) -> Option<(String, u64)> {
    let mut comando = Command::new(executavel(app).ok()?);
    comando.arg("--list-devices").stdin(Stdio::null()).stderr(Stdio::null());
    sem_janela(&mut comando);
    let saida = comando.output().ok()?;
    // Linhas como "  Vulkan0: NVIDIA GeForce RTX 5060 Ti (16050 MiB, 15282 MiB free)". Fica a de mais memória.
    String::from_utf8_lossy(&saida.stdout)
        .lines()
        .filter_map(|linha| {
            let (_, resto) = linha.trim().split_once(": ")?;
            let (nome, memoria) = resto.rsplit_once(" (")?;
            let mib = memoria.split_whitespace().next()?.parse::<u64>().ok()?;
            Some((nome.trim().to_string(), mib))
        })
        .max_by_key(|(_, mib)| *mib)
}

fn caminho_log(app: &AppHandle) -> Result<PathBuf, String> {
    let pasta = app.path().app_log_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&pasta).map_err(|e| e.to_string())?;
    Ok(pasta.join("assistente.log"))
}

/// Última linha de erro do log do motor, para explicar por que ele não ligou.
fn ultimo_erro(app: &AppHandle) -> Option<String> {
    let mut arquivo = File::open(caminho_log(app).ok()?).ok()?;
    let tamanho = arquivo.metadata().ok()?.len();
    arquivo.seek(SeekFrom::Start(tamanho.saturating_sub(8192))).ok()?;
    let mut fim = Vec::new();
    arquivo.read_to_end(&mut fim).ok()?;
    String::from_utf8_lossy(&fim)
        .lines()
        .rev()
        .find(|l| {
            let l = l.to_lowercase();
            l.contains(" e ") || l.contains("error") || l.contains("failed")
        })
        .map(|l| l.trim().chars().take(240).collect())
}

fn porta_livre() -> Result<u16, String> {
    let ouvinte = TcpListener::bind("127.0.0.1:0").map_err(|e| format!("Sem porta livre para o assistente: {e}"))?;
    ouvinte.local_addr().map(|a| a.port()).map_err(|e| e.to_string())
}

/// Chave da API do motor: outro programa ou site aberto no computador não consegue usar o modelo.
fn chave_aleatoria() -> String {
    use std::hash::{BuildHasher, Hasher};
    let estado = std::collections::hash_map::RandomState::new();
    (0..4u64)
        .map(|i| {
            let mut h = estado.build_hasher();
            h.write_u64(i);
            h.write_u128(std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos());
            h.write_u32(std::process::id());
            format!("{:016x}", h.finish())
        })
        .collect()
}

#[cfg(windows)]
fn sem_janela(comando: &mut Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    comando.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
fn sem_janela(_comando: &mut Command) {}

/// Windows: põe o motor num Job que fecha junto com o app. Se o app travar ou for encerrado à força,
/// o llama-server morre também, em vez de ficar ocupando memória.
#[cfg(windows)]
fn prender_ao_app(processo: &Child) {
    use std::os::windows::io::AsRawHandle;
    use std::sync::OnceLock;
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation, SetInformationJobObject,
        JOBOBJECT_EXTENDED_LIMIT_INFORMATION, JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    };

    // O handle do Job nunca é fechado: quem fecha é o Windows, quando o app termina.
    static JOB: OnceLock<usize> = OnceLock::new();
    let job = *JOB.get_or_init(|| unsafe {
        let job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
        if job.is_null() {
            return 0;
        }
        let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        SetInformationJobObject(
            job,
            JobObjectExtendedLimitInformation,
            &info as *const _ as *const std::ffi::c_void,
            std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
        );
        job as usize
    });
    if job != 0 {
        unsafe {
            AssignProcessToJobObject(job as _, processo.as_raw_handle() as _);
        }
    }
}

#[cfg(not(windows))]
fn prender_ao_app(_processo: &Child) {}
