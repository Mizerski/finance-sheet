//! Download do modelo para a pasta de dados do app. Continua de onde parou e confere o sha256 no fim.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant};

use futures_util::StreamExt;
use serde::Serialize;
use sha2::{Digest, Sha256};
use tauri::ipc::Channel;
use tokio::fs::{self, File, OpenOptions};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

use super::catalogo::Modelo;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progresso {
    pub baixados: u64,
    pub total: u64,
}

pub fn caminho_parcial(pasta: &Path, modelo: &Modelo) -> PathBuf {
    pasta.join(format!("{}.parte", modelo.arquivo))
}

/// Devolve `true` ao concluir e `false` se o download foi cancelado (o pedaço baixado fica para continuar depois).
pub async fn baixar(
    cliente: &reqwest::Client,
    pasta: &Path,
    modelo: &Modelo,
    cancelamento: &AtomicU64,
    canal: &Channel<Progresso>,
) -> Result<bool, String> {
    let destino = pasta.join(modelo.arquivo);
    if destino.exists() {
        return Ok(true);
    }
    fs::create_dir_all(pasta).await.map_err(erro_disco)?;
    let parcial = caminho_parcial(pasta, modelo);
    let meu = cancelamento.fetch_add(1, Ordering::SeqCst) + 1;

    let (mut hash, mut baixados) = retomar(&parcial, modelo.bytes).await?;
    let _ = canal.send(Progresso { baixados, total: modelo.bytes });

    let mut pedido = cliente.get(modelo.url);
    if baixados > 0 {
        pedido = pedido.header(reqwest::header::RANGE, format!("bytes={baixados}-"));
    }
    let resposta = pedido.send().await.map_err(erro_rede)?;
    let continua = resposta.status() == reqwest::StatusCode::PARTIAL_CONTENT;
    if !resposta.status().is_success() && resposta.status() != reqwest::StatusCode::RANGE_NOT_SATISFIABLE {
        return Err(format!("O servidor do modelo recusou o download ({}).", resposta.status()));
    }
    if resposta.status() == reqwest::StatusCode::RANGE_NOT_SATISFIABLE && baixados < modelo.bytes {
        let _ = fs::remove_file(&parcial).await;
        return Err("O download não pôde continuar de onde parou. Tente de novo.".into());
    }
    // O servidor ignorou o pedaço já baixado: começa do zero.
    if baixados > 0 && !continua && resposta.status() == reqwest::StatusCode::OK {
        hash = Sha256::new();
        baixados = 0;
    }

    if baixados < modelo.bytes {
        let mut arquivo = OpenOptions::new()
            .create(true)
            .write(true)
            .append(baixados > 0)
            .truncate(baixados == 0)
            .open(&parcial)
            .await
            .map_err(erro_disco)?;
        let mut fluxo = resposta.bytes_stream();
        let mut ultimo_aviso = Instant::now();
        while let Some(pedaco) = fluxo.next().await {
            if cancelamento.load(Ordering::SeqCst) != meu {
                arquivo.flush().await.map_err(erro_disco)?;
                return Ok(false);
            }
            let pedaco = pedaco.map_err(erro_rede)?;
            arquivo.write_all(&pedaco).await.map_err(erro_disco)?;
            hash.update(&pedaco);
            baixados += pedaco.len() as u64;
            if ultimo_aviso.elapsed() > Duration::from_millis(200) {
                ultimo_aviso = Instant::now();
                let _ = canal.send(Progresso { baixados, total: modelo.bytes });
            }
        }
        arquivo.flush().await.map_err(erro_disco)?;
    }
    let _ = canal.send(Progresso { baixados, total: modelo.bytes });

    let calculado = format!("{:x}", hash.finalize());
    if baixados != modelo.bytes || calculado != modelo.sha256 {
        let _ = fs::remove_file(&parcial).await;
        return Err("O arquivo do modelo chegou com defeito. Tente baixar de novo.".into());
    }
    fs::rename(&parcial, &destino).await.map_err(erro_disco)?;
    Ok(true)
}

/// Lê o pedaço já baixado para continuar o sha256 de onde parou. Pedaço maior que o modelo é descartado.
async fn retomar(parcial: &Path, total: u64) -> Result<(Sha256, u64), String> {
    let mut hash = Sha256::new();
    let Ok(mut arquivo) = File::open(parcial).await else {
        return Ok((hash, 0));
    };
    let tamanho = arquivo.metadata().await.map_err(erro_disco)?.len();
    if tamanho > total {
        drop(arquivo);
        let _ = fs::remove_file(parcial).await;
        return Ok((hash, 0));
    }
    let mut buffer = vec![0u8; 1 << 20];
    loop {
        let lidos = arquivo.read(&mut buffer).await.map_err(erro_disco)?;
        if lidos == 0 {
            break;
        }
        hash.update(&buffer[..lidos]);
    }
    Ok((hash, tamanho))
}

fn erro_rede(e: reqwest::Error) -> String {
    format!("A conexão caiu durante o download. Tente de novo para continuar de onde parou. ({e})")
}

fn erro_disco(e: std::io::Error) -> String {
    format!("Não foi possível salvar o modelo no computador. Confira se há espaço livre. ({e})")
}
