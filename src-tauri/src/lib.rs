mod assistente;

use std::sync::atomic::{AtomicBool, Ordering};

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, RunEvent, WindowEvent};

/// Argumento do início automático com o sistema: o app abre direto na bandeja.
const ARG_MINIMIZADO: &str = "--minimized";

/// Fechar a janela só a esconde na bandeja (o lembrete continua). O front define pela preferência do usuário.
struct Bandeja(AtomicBool);

#[tauri::command]
fn definir_bandeja(bandeja: tauri::State<Bandeja>, ativa: bool) {
    bandeja.0.store(ativa, Ordering::Relaxed);
}

fn mostrar_janela(app: &AppHandle) {
    if let Some(janela) = app.get_webview_window("main") {
        let _ = janela.show();
        let _ = janela.unminimize();
        let _ = janela.set_focus();
    }
}

fn criar_bandeja(app: &AppHandle) -> tauri::Result<()> {
    let abrir = MenuItem::with_id(app, "abrir", "Abrir", true, None::<&str>)?;
    let sair = MenuItem::with_id(app, "sair", "Sair", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&abrir, &sair])?;

    let mut bandeja = TrayIconBuilder::with_id("principal")
        .tooltip("Projeção Financeira")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, evento| match evento.id.as_ref() {
            "abrir" => mostrar_janela(app),
            "sair" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|icone, evento| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = evento {
                mostrar_janela(icone.app_handle());
            }
        });
    if let Some(icone) = app.default_window_icon() {
        bandeja = bandeja.icon(icone.clone());
    }
    bandeja.build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // reqwest usa rustls sem provedor embutido (o mesmo do updater): instala o ring antes de criar os clientes.
    let _ = rustls::crypto::ring::default_provider().install_default();

    tauri::Builder::default()
        // Uma instância só: abrir o app de novo traz a janela que está na bandeja. Precisa ser o primeiro plugin.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| mostrar_janela(app)))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![ARG_MINIMIZADO]),
        ))
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        // Lembrete diário de registrar os gastos.
        .plugin(tauri_plugin_notification::init())
        // Dados do app num arquivo JSON na pasta de dados do usuário.
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(Bandeja(AtomicBool::new(true)))
        .manage(assistente::Assistente::new())
        .invoke_handler(tauri::generate_handler![
            definir_bandeja,
            assistente::assistente_estado,
            assistente::assistente_placa_de_video,
            assistente::assistente_baixar,
            assistente::assistente_cancelar_download,
            assistente::assistente_excluir_modelo,
            assistente::assistente_ligar,
            assistente::assistente_desligar,
            assistente::assistente_responder,
            assistente::assistente_parar_resposta,
        ])
        .on_window_event(|janela, evento| {
            if let WindowEvent::CloseRequested { api, .. } = evento {
                if janela.state::<Bandeja>().0.load(Ordering::Relaxed) {
                    api.prevent_close();
                    let _ = janela.hide();
                }
            }
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            criar_bandeja(app.handle())?;
            assistente::vigiar_ociosidade(app.handle().clone());
            // A janela nasce escondida (tauri.conf.json); só aparece se o app não abriu com o sistema.
            if !std::env::args().any(|arg| arg == ARG_MINIMIZADO) {
                mostrar_janela(app.handle());
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, evento| {
            if let RunEvent::Exit = evento {
                app.state::<assistente::Assistente>().encerrar();
            }
        });
}
