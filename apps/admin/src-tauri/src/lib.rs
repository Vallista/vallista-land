mod commands;
mod repo;

use std::fs;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

#[cfg(target_os = "macos")]
use tauri_nspanel::{ManagerExt, WebviewWindowExt};

use commands::llm::LlmState;

#[cfg(target_os = "macos")]
const NS_WINDOW_STYLE_MASK_NONACTIVATING_PANEL: i32 = 1 << 7;

fn show_main(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
}

#[tauri::command]
fn close_quick_window(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        if let Ok(panel) = app.get_webview_panel("quick") {
            panel.order_out(None);
            return Ok(());
        }
    }
    if let Some(win) = app.get_webview_window("quick") {
        let _ = win.hide();
    }
    Ok(())
}

#[tauri::command]
fn show_quick_window(app: tauri::AppHandle, kind: String) -> Result<(), String> {
    show_quick(&app, &kind);
    Ok(())
}

fn show_quick(app: &tauri::AppHandle, kind: &str) {
    #[cfg(target_os = "macos")]
    {
        if let Ok(panel) = app.get_webview_panel("quick") {
            panel.show();
            let _ = app.emit_to("quick", "bento:quick-shortcut", kind);
            return;
        }
    }

    if let Some(win) = app.get_webview_window("quick") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
        let _ = app.emit_to("quick", "bento:quick-shortcut", kind);
        return;
    }

    let url = format!("index.html#quick={}", kind);
    let builder = WebviewWindowBuilder::new(app, "quick", WebviewUrl::App(url.into()))
        .title("Bento Quick")
        .inner_size(720.0, 640.0)
        .resizable(false)
        .decorations(false)
        .transparent(true)
        .shadow(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .center()
        .focused(true);
    let win = match builder.build() {
        Ok(w) => w,
        Err(err) => {
            eprintln!("failed to build quick window: {err}");
            return;
        }
    };

    #[cfg(target_os = "macos")]
    {
        match win.to_panel() {
            Ok(panel) => {
                panel.set_style_mask(NS_WINDOW_STYLE_MASK_NONACTIVATING_PANEL);
                panel.set_floating_panel(true);
                panel.set_becomes_key_only_if_needed(false);
                panel.set_hides_on_deactivate(false);
                panel.set_released_when_closed(false);
                panel.show();
            }
            Err(err) => {
                eprintln!("failed to convert quick window to panel: {err}");
            }
        }
    }

    let _ = app.emit_to("quick", "bento:quick-shortcut", kind);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(target_os = "macos")]
    let builder = builder.plugin(tauri_nspanel::init());

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_dialog::init());

    builder
        .setup(|app| {
            let data_dir = match app.path().app_data_dir() {
                Ok(d) => d,
                Err(err) => {
                    eprintln!("could not resolve app data dir: {err}");
                    return Ok(());
                }
            };
            let _ = fs::create_dir_all(&data_dir);
            let _ = fs::create_dir_all(data_dir.join("models"));

            let initial_content_root = repo::resolve_content_root(&data_dir);
            app.manage(repo::AppState::new(
                data_dir.clone(),
                initial_content_root,
            ));
            app.manage(LlmState::new(data_dir));

            let open_item = MenuItemBuilder::with_id("tray.open", "Bento 열기").build(app)?;
            let quit_item = MenuItemBuilder::with_id("tray.quit", "종료").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&open_item, &quit_item])
                .build()?;
            let mut tray_builder = TrayIconBuilder::with_id("bento-main")
                .tooltip("Bento")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "tray.open" => show_main(app),
                    "tray.quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main(tray.app_handle());
                    }
                });
            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }
            let _tray = tray_builder.build(app)?;

            if let Some(win) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                win.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(w) = app_handle.get_webview_window("main") {
                            let _ = w.hide();
                        }
                    }
                });
            }

            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};

                if let Err(err) = app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_shortcuts(["control+n", "control+t"])?
                        .with_handler(|app, shortcut, event| {
                            if event.state() != ShortcutState::Pressed {
                                return;
                            }
                            let kind = if shortcut.matches(Modifiers::CONTROL, Code::KeyN) {
                                Some("thought")
                            } else if shortcut.matches(Modifiers::CONTROL, Code::KeyT) {
                                Some("task")
                            } else {
                                None
                            };
                            if let Some(k) = kind {
                                show_quick(app, k);
                            }
                        })
                        .build(),
                ) {
                    eprintln!("global shortcut plugin failed: {err}");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // === life: tasks ===
            commands::tasks::list_tasks,
            commands::tasks::add_task,
            commands::tasks::update_task,
            commands::tasks::delete_task,
            // === life: blocks (calendar) ===
            commands::blocks::list_blocks,
            commands::blocks::list_blocks_by_date,
            commands::blocks::list_blocks_in_range,
            commands::blocks::add_block,
            commands::blocks::update_block,
            commands::blocks::delete_block,
            commands::blocks::import_ical_url,
            commands::blocks::list_ical_feeds,
            commands::blocks::add_ical_feed,
            commands::blocks::remove_ical_feed,
            commands::blocks::sync_ical_feeds,
            commands::macos_cal::macos_cal_status,
            commands::macos_cal::macos_cal_request_access,
            commands::macos_cal::macos_cal_list,
            commands::macos_cal::macos_cal_import,
            commands::macos_cal::macos_cal_open_privacy,
            // === life: mood ===
            commands::mood::list_mood,
            commands::mood::list_mood_in_range,
            commands::mood::get_mood,
            commands::mood::set_mood,
            commands::mood::set_retrospective,
            commands::mood::delete_mood,
            // === life: glean (data_root 저장) ===
            commands::glean::list_glean,
            commands::glean::read_glean,
            commands::glean::add_glean,
            commands::glean::update_glean_status,
            commands::glean::update_glean_highlights,
            commands::glean::update_glean_digest,
            commands::glean::delete_glean,
            commands::glean::fetch_url,
            // === life: reports ===
            commands::reports::list_reports,
            commands::reports::read_report,
            commands::reports::migrate_reports,
            // === life: LLM ===
            commands::llm::llm_status,
            commands::llm::llm_start,
            commands::llm::llm_stop,
            commands::llm::llm_health,
            commands::llm::llm_chat,
            commands::llm::llm_download_model,
            commands::llm::llm_download_server,
            commands::llm::llm_delete_model,
            commands::llm::llm_install_binary,
            commands::llm::llm_open_data_dir,
            // === blog: docs (vault 콘텐츠) ===
            commands::docs::list_docs,
            commands::docs::read_doc,
            commands::docs::write_doc,
            commands::docs::read_asset,
            commands::insights::compute_insights,
            // === blog: git 워크스페이스 (require_blog_enabled 가드) ===
            commands::git::git_status,
            commands::git::git_log,
            commands::git::git_commit_push,
            commands::git::blog_setup_workspace,
            commands::git::blog_pull,
            // === setup / config ===
            commands::meta::vault_info,
            commands::meta::content_root_status,
            commands::meta::pick_content_root,
            commands::meta::set_content_root,
            commands::meta::app_setup_status,
            commands::meta::set_blog_config,
            commands::keychain::keychain_set_token,
            commands::keychain::keychain_has_token,
            commands::keychain::keychain_delete_token,
            // === window / quick ===
            close_quick_window,
            show_quick_window,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|err| {
            eprintln!("error while running tauri application: {err}");
        });
}
