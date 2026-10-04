//! Assistente com modelo de IA local: o llama.cpp (llama-server) vai dentro do app, o modelo é baixado
//! pela pessoa e tudo roda no computador dela. O front conversa só por estes comandos.

mod catalogo;
mod download;
mod resposta;
mod servidor;

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, State};

use download::Progresso;
use resposta::{EventoResposta, Pedido};
use servidor::Servidor;

/// Sem uso por esse tempo, o motor desliga e devolve a memória. Liga de novo na próxima pergunta.
const OCIOSO: Duration = Duration::from_secs(10 * 60);

pub struct Assistente {
    servidor: tokio::sync::Mutex<Option<Servidor>>,
    /// Número da resposta em andamento; trocar o número cancela a anterior.
    resposta: AtomicU64,
    respondendo: AtomicBool,
    download: AtomicU64,
    ultimo_uso: Mutex<Instant>,
    /// Conversa com o motor no 127.0.0.1, sem proxy.
    local: reqwest::Client,
    /// Download do modelo, respeitando o proxy do sistema.
    internet: reqwest::Client,
}

impl Assistente {
    pub fn new() -> Self {
        Self {
            servidor: tokio::sync::Mutex::new(None),
            resposta: AtomicU64::new(0),
            respondendo: AtomicBool::new(false),
            download: AtomicU64::new(0),
            ultimo_uso: Mutex::new(Instant::now()),
            local: reqwest::Client::builder().no_proxy().build().expect("cliente HTTP local"),
            internet: reqwest::Client::builder()
                .read_timeout(Duration::from_secs(60))
                .build()
                .expect("cliente HTTP"),
        }
    }

    fn usar(&self) {
        if let Ok(mut ultimo) = self.ultimo_uso.lock() {
            *ultimo = Instant::now();
        }
    }

    /// Chamado de minuto em minuto por uma thread própria.
    fn desligar_se_ocioso(&self) {
        let ocioso = self.ultimo_uso.lock().map(|u| u.elapsed() > OCIOSO).unwrap_or(false);
        if ocioso && !self.respondendo.load(Ordering::SeqCst) {
            if let Ok(mut servidor) = self.servidor.try_lock() {
                servidor.take();
            }
        }
    }

    /// Ao fechar o app. No Windows o Job já garante, mesmo se o app travar.
    pub fn encerrar(&self) {
        if let Ok(mut servidor) = self.servidor.try_lock() {
            servidor.take();
        }
    }
}

/// Liga a thread que desliga o motor parado.
pub fn vigiar_ociosidade(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(60));
        app.state::<Assistente>().desligar_se_ocioso();
    });
}

fn pasta_modelos(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("modelos"))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModeloInstalavel {
    id: &'static str,
    bytes: u64,
    baixado: bool,
    /// Pedaço de um download interrompido, para continuar.
    parcial: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlacaDeVideo {
    nome: String,
    memoria_mb: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EstadoAssistente {
    motor: bool,
    modelos: Vec<ModeloInstalavel>,
    /// Modelo carregado agora, se o motor estiver ligado.
    ligado: Option<&'static str>,
}

#[tauri::command]
pub async fn assistente_estado(app: AppHandle, estado: State<'_, Assistente>) -> Result<EstadoAssistente, String> {
    let pasta = pasta_modelos(&app)?;
    let modelos = catalogo::CATALOGO
        .iter()
        .map(|m| ModeloInstalavel {
            id: m.id,
            bytes: m.bytes,
            baixado: pasta.join(m.arquivo).exists(),
            parcial: std::fs::metadata(download::caminho_parcial(&pasta, m)).map(|d| d.len()).unwrap_or(0),
        })
        .collect();
    let ligado = match estado.servidor.try_lock() {
        Ok(mut servidor) => servidor.as_mut().and_then(|atual| atual.vivo().then_some(atual.modelo.id)),
        Err(_) => None,
    };
    Ok(EstadoAssistente { motor: servidor::motor_instalado(&app), modelos, ligado })
}

#[tauri::command]
pub async fn assistente_placa_de_video(app: AppHandle) -> Option<PlacaDeVideo> {
    tauri::async_runtime::spawn_blocking(move || servidor::placa_de_video(&app))
        .await
        .ok()
        .flatten()
        .map(|(nome, memoria_mb)| PlacaDeVideo { nome, memoria_mb })
}

#[tauri::command]
pub async fn assistente_baixar(
    app: AppHandle,
    estado: State<'_, Assistente>,
    id: String,
    canal: Channel<Progresso>,
) -> Result<bool, String> {
    let modelo = catalogo::modelo(&id)?;
    download::baixar(&estado.internet, &pasta_modelos(&app)?, modelo, &estado.download, &canal).await
}

#[tauri::command]
pub fn assistente_cancelar_download(estado: State<'_, Assistente>) {
    estado.download.fetch_add(1, Ordering::SeqCst);
}

/// Apaga o modelo (e o pedaço de download) para liberar espaço.
#[tauri::command]
pub async fn assistente_excluir_modelo(app: AppHandle, estado: State<'_, Assistente>, id: String) -> Result<(), String> {
    let modelo = catalogo::modelo(&id)?;
    {
        let mut servidor = estado.servidor.lock().await;
        if servidor.as_ref().is_some_and(|s| s.modelo.id == modelo.id) {
            servidor.take();
        }
    }
    let pasta = pasta_modelos(&app)?;
    for caminho in [pasta.join(modelo.arquivo), download::caminho_parcial(&pasta, modelo)] {
        if caminho.exists() {
            std::fs::remove_file(&caminho).map_err(|e| format!("Não foi possível apagar o modelo: {e}"))?;
        }
    }
    Ok(())
}

/// Liga o motor com o modelo pedido e espera carregar. Se já estiver ligado com ele, só confirma.
#[tauri::command]
pub async fn assistente_ligar(app: AppHandle, estado: State<'_, Assistente>, id: String) -> Result<(), String> {
    let modelo = catalogo::modelo(&id)?;
    let mut servidor = estado.servidor.lock().await;
    if let Some(atual) = servidor.as_mut() {
        if atual.modelo.id == modelo.id && atual.vivo() {
            estado.usar();
            return Ok(());
        }
    }
    servidor.take();

    let caminho = pasta_modelos(&app)?.join(modelo.arquivo);
    if !caminho.exists() {
        return Err("O modelo ainda não foi baixado.".into());
    }
    let mut novo = Servidor::iniciar(&app, modelo, &caminho)?;
    novo.esperar_pronto(&app, &estado.local).await?;
    *servidor = Some(novo);
    estado.usar();
    Ok(())
}

#[tauri::command]
pub async fn assistente_desligar(estado: State<'_, Assistente>) -> Result<(), String> {
    estado.servidor.lock().await.take();
    Ok(())
}

#[tauri::command]
pub async fn assistente_responder(
    estado: State<'_, Assistente>,
    mensagens: Vec<serde_json::Value>,
    ferramentas: Option<serde_json::Value>,
    max_tokens: u32,
    canal: Channel<EventoResposta>,
) -> Result<(), String> {
    let (porta, chave, amostragem) = {
        let mut servidor = estado.servidor.lock().await;
        servidor
            .as_mut()
            .and_then(|atual| atual.vivo().then(|| (atual.porta, atual.chave.clone(), atual.modelo.amostragem)))
            .ok_or("O assistente está desligado.")?
    };
    let minha = estado.resposta.fetch_add(1, Ordering::SeqCst) + 1;
    estado.respondendo.store(true, Ordering::SeqCst);
    estado.usar();
    let pedido = Pedido { porta, chave: &chave, amostragem, mensagens, ferramentas, max_tokens };
    let resultado = resposta::responder(&estado.local, pedido, &estado.resposta, minha, &canal).await;
    if estado.resposta.load(Ordering::SeqCst) == minha {
        estado.respondendo.store(false, Ordering::SeqCst);
    }
    estado.usar();
    resultado
}

/// Para a resposta em andamento (botão "Parar").
#[tauri::command]
pub fn assistente_parar_resposta(estado: State<'_, Assistente>) {
    estado.resposta.fetch_add(1, Ordering::SeqCst);
    estado.respondendo.store(false, Ordering::SeqCst);
}
