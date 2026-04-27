mod commands;
mod repo;

use std::fs;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, WindowEvent};

use commands::llm::LlmState;

fn show_main(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let root = repo::resolve_vault_root().expect("could not resolve vault root");
            app.manage(repo::AppState { vault_root: root });
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("could not resolve app data dir");
            let _ = fs::create_dir_all(&data_dir);
            let _ = fs::create_dir_all(data_dir.join("models"));
            app.manage(LlmState::new(data_dir));

            let open_item = MenuItemBuilder::with_id("tray.open", "Bento 열기").build(app)?;
            let quit_item = MenuItemBuilder::with_id("tray.quit", "종료").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&open_item, &quit_item])
                .build()?;
            let _tray = TrayIconBuilder::with_id("bento-main")
                .tooltip("Bento")
                .icon(app.default_window_icon().unwrap().clone())
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
                })
                .build(app)?;

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

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::docs::list_docs,
            commands::docs::read_doc,
            commands::docs::write_doc,
            commands::docs::read_asset,
            commands::glean::list_glean,
            commands::glean::read_glean,
            commands::glean::add_glean,
            commands::glean::update_glean_status,
            commands::glean::update_glean_highlights,
            commands::glean::delete_glean,
            commands::glean::fetch_url,
            commands::tasks::list_tasks,
            commands::tasks::add_task,
            commands::tasks::update_task,
            commands::tasks::delete_task,
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
            commands::mood::list_mood,
            commands::mood::list_mood_in_range,
            commands::mood::get_mood,
            commands::mood::set_mood,
            commands::mood::delete_mood,
            commands::reports::list_reports,
            commands::reports::read_report,
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
            commands::git::git_status,
            commands::git::git_log,
            commands::git::git_commit_push,
            commands::insights::compute_insights,
            commands::meta::vault_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
