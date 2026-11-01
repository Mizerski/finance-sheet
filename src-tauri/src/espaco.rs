//! Quanto os dados do app ocupam e quanto sobra no disco, para o card "Espaço usado" do histórico.

use std::path::Path;

use serde::Serialize;
use tauri::{AppHandle, Manager};

/// Arquivo dos dados (o mesmo de `ARQUIVO_DADOS` no front), na pasta de dados do app.
const ARQUIVO_DADOS: &str = "financas.json";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EspacoDosDados {
    /// Tamanho do `financas.json`; None se ainda não existir.
    arquivo_bytes: Option<u64>,
    /// Espaço livre no disco da pasta de dados; None se o sistema não disser.
    livre_bytes: Option<u64>,
    /// Tamanho do disco da pasta de dados.
    total_bytes: Option<u64>,
}

#[cfg(windows)]
fn espaco_do_disco(pasta: &Path) -> Option<(u64, u64)> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;

    let caminho: Vec<u16> = pasta.as_os_str().encode_wide().chain(std::iter::once(0)).collect();
    let (mut livre, mut total, mut livre_total) = (0u64, 0u64, 0u64);
    // SAFETY: caminho termina em 0 e os ponteiros apontam para u64 válidos durante a chamada.
    let ok = unsafe { GetDiskFreeSpaceExW(caminho.as_ptr(), &mut livre, &mut total, &mut livre_total) };
    (ok != 0).then_some((livre, total))
}

#[cfg(not(windows))]
fn espaco_do_disco(_pasta: &Path) -> Option<(u64, u64)> {
    None
}

/// Tamanho do arquivo de dados e espaço livre e total do disco onde ele fica.
#[tauri::command]
pub fn espaco_dos_dados(app: AppHandle) -> EspacoDosDados {
    let pasta = app.path().app_data_dir().ok();
    let arquivo_bytes = pasta
        .as_ref()
        .and_then(|p| std::fs::metadata(p.join(ARQUIVO_DADOS)).ok())
        .map(|m| m.len());
    let disco = pasta.as_deref().filter(|p| p.exists()).and_then(espaco_do_disco);
    EspacoDosDados {
        arquivo_bytes,
        livre_bytes: disco.map(|(livre, _)| livre),
        total_bytes: disco.map(|(_, total)| total),
    }
}
