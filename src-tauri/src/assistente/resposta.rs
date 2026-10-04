//! Conversa com o llama-server pela API compatível com a OpenAI, repassando a resposta ao front aos pedaços.

use std::sync::atomic::{AtomicU64, Ordering};

use futures_util::StreamExt;
use serde::Serialize;
use serde_json::{json, Value};
use tauri::ipc::Channel;

use super::catalogo::Amostragem;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChamadaFerramenta {
    pub id: String,
    pub nome: String,
    /// JSON com os argumentos, como o modelo escreveu.
    pub argumentos: String,
}

#[derive(Clone, Serialize)]
#[serde(tag = "tipo", rename_all = "camelCase")]
pub enum EventoResposta {
    Trecho { texto: String },
    /// O modelo pediu ferramentas: o front executa e manda uma nova rodada com os resultados.
    Ferramentas { chamadas: Vec<ChamadaFerramenta> },
    /// `cortada`: a resposta parou no limite de tamanho.
    Fim { cortada: bool },
}

pub struct Pedido<'a> {
    pub porta: u16,
    pub chave: &'a str,
    pub amostragem: Amostragem,
    /// Mensagens no formato da API (role, content, tool_calls, tool_call_id), montadas pelo front.
    pub mensagens: Vec<Value>,
    /// Definições das ferramentas (formato da API); `None` para responder sem elas.
    pub ferramentas: Option<Value>,
    pub max_tokens: u32,
}

pub async fn responder(
    cliente: &reqwest::Client,
    pedido: Pedido<'_>,
    cancelamento: &AtomicU64,
    minha: u64,
    canal: &Channel<EventoResposta>,
) -> Result<(), String> {
    let mut corpo = json!({
        "messages": pedido.mensagens,
        "stream": true,
        "max_tokens": pedido.max_tokens,
        "temperature": pedido.amostragem.temperatura,
        "top_p": pedido.amostragem.top_p,
        "top_k": pedido.amostragem.top_k,
        // Reaproveita o começo da conversa (manual) já processado.
        "cache_prompt": true,
    });
    if let Some(ferramentas) = pedido.ferramentas {
        corpo["tools"] = ferramentas;
    }

    let resposta = cliente
        .post(format!("http://127.0.0.1:{}/v1/chat/completions", pedido.porta))
        .bearer_auth(pedido.chave)
        .json(&corpo)
        .send()
        .await
        .map_err(|e| format!("O assistente não respondeu. ({e})"))?;
    if !resposta.status().is_success() {
        let detalhe = resposta.text().await.unwrap_or_default();
        return Err(format!("O assistente não conseguiu responder. {}", mensagem_de_erro(&detalhe)));
    }

    // Eventos SSE: linhas "data: {json}", terminando em "data: [DONE]".
    let mut fluxo = resposta.bytes_stream();
    let mut pendente: Vec<u8> = Vec::new();
    let mut cortada = false;
    // As chamadas chegam aos pedaços (nome e argumentos), pelo índice.
    let mut chamadas: Vec<ChamadaFerramenta> = Vec::new();
    'leitura: while let Some(pedaco) = fluxo.next().await {
        // Cancelada: largar o fluxo fecha a conexão e o motor para de gerar.
        if cancelamento.load(Ordering::SeqCst) != minha {
            break;
        }
        pendente.extend_from_slice(&pedaco.map_err(|e| format!("A resposta foi interrompida. ({e})"))?);
        while let Some(fim) = pendente.iter().position(|&b| b == b'\n') {
            let linha: Vec<u8> = pendente.drain(..=fim).collect();
            let linha = String::from_utf8_lossy(&linha);
            let Some(dados) = linha.trim().strip_prefix("data:") else { continue };
            let dados = dados.trim();
            if dados == "[DONE]" {
                break 'leitura;
            }
            let Ok(evento) = serde_json::from_str::<Value>(dados) else { continue };
            if let Some(erro) = evento.get("error") {
                return Err(format!("O assistente não conseguiu responder. {}", mensagem_de_erro(&erro.to_string())));
            }
            let escolha = &evento["choices"][0];
            if let Some(texto) = escolha["delta"]["content"].as_str() {
                if !texto.is_empty() {
                    let _ = canal.send(EventoResposta::Trecho { texto: texto.to_string() });
                }
            }
            for parte in escolha["delta"]["tool_calls"].as_array().into_iter().flatten() {
                let indice = parte["index"].as_u64().unwrap_or(0) as usize;
                while chamadas.len() <= indice {
                    chamadas.push(ChamadaFerramenta { id: String::new(), nome: String::new(), argumentos: String::new() });
                }
                let chamada = &mut chamadas[indice];
                if let Some(id) = parte["id"].as_str() {
                    chamada.id = id.to_string();
                }
                if let Some(nome) = parte["function"]["name"].as_str() {
                    chamada.nome.push_str(nome);
                }
                if let Some(argumentos) = parte["function"]["arguments"].as_str() {
                    chamada.argumentos.push_str(argumentos);
                }
            }
            if escolha["finish_reason"].as_str() == Some("length") {
                cortada = true;
            }
        }
    }
    if !chamadas.is_empty() && cancelamento.load(Ordering::SeqCst) == minha {
        let _ = canal.send(EventoResposta::Ferramentas { chamadas });
    }
    let _ = canal.send(EventoResposta::Fim { cortada });
    Ok(())
}

fn mensagem_de_erro(corpo: &str) -> String {
    serde_json::from_str::<Value>(corpo)
        .ok()
        .and_then(|v| v["error"]["message"].as_str().or(v["message"].as_str()).map(str::to_string))
        .unwrap_or_else(|| corpo.chars().take(200).collect())
}
