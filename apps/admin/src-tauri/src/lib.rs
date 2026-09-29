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

#[cfg(desktop)]
#[tauri::command]
fn set_global_shortcuts(
    app: tauri::AppHandle,
    shortcuts: Vec<(String, String)>,
) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

    app.global_shortcut()
        .unregister_all()
        .map_err(|e| e.to_string())?;

    for (shortcut_str, kind) in shortcuts {
        let kind_owned = kind.clone();
        app.global_shortcut()
            .on_shortcut(shortcut_str.as_str(), move |app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    show_quick(app, &kind_owned);
                }
            })
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg(not(desktop))]
#[tauri::command]
fn set_global_shortcuts(_app: tauri::AppHandle, _shortcuts: Vec<(String, String)>) -> Result<(), String> {
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
        .inner_size(900.0, 700.0)
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
            app.manage(LlmState::new(data_dir.clone()));

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
                    match event {
                        WindowEvent::CloseRequested { api, .. } => {
                            api.prevent_close();
                            if let Some(w) = app_handle.get_webview_window("main") {
                                let _ = w.hide();
                            }
                        }
                        WindowEvent::Focused(true) => {
                            // 메인 창이 실제로 보이는 상태에서 포커스를 받은 경우만 닫음
                            // (숨겨진 채로 앱이 활성화되는 이벤트는 무시)
                            let visible = app_handle
                                .get_webview_window("main")
                                .and_then(|w| w.is_visible().ok())
                                .unwrap_or(false);
                            if !visible {
                                return;
                            }
                            #[cfg(target_os = "macos")]
                            if let Ok(panel) = app_handle.get_webview_panel("quick") {
                                panel.order_out(None);
                                return;
                            }
                            if let Some(qwin) = app_handle.get_webview_window("quick") {
                                let _ = qwin.hide();
                            }
                        }
                        _ => {}
                    }
                });
            }

            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

                let settings = commands::settings::load_settings(&data_dir);
                let kb = settings.global_keybindings;
                let action_shortcuts = vec![
                    (commands::settings::binding_to_shortcut(&kb.global_thought), "thought".to_string()),
                    (commands::settings::binding_to_shortcut(&kb.global_task), "task".to_string()),
                    (commands::settings::binding_to_shortcut(&kb.global_clipboard), "clipboard".to_string()),
                ];

                match app.handle().plugin(tauri_plugin_global_shortcut::Builder::new().build()) {
                    Err(err) => eprintln!("global shortcut plugin failed: {err}"),
                    Ok(()) => {
                        for (shortcut_str, kind) in action_shortcuts {
                            let kind_owned = kind.clone();
                            if let Err(err) = app.handle().global_shortcut().on_shortcut(
                                shortcut_str.as_str(),
                                move |app, _shortcut, event| {
                                    if event.state() == ShortcutState::Pressed {
                                        show_quick(app, &kind_owned);
                                    }
                                },
                            ) {
                                eprintln!("failed to register shortcut {shortcut_str}: {err}");
                            }
                        }
                    }
                }
            }

            {
                let app_handle = app.handle().clone();
                tauri::async_runtime::spawn(commands::rss::start_poller(app_handle));
            }
            {
                let app_handle = app.handle().clone();
                tauri::async_runtime::spawn(commands::headless::start_threads_poller(app_handle));
            }
            {
                let app_handle = app.handle().clone();
                tauri::async_runtime::spawn(commands::radar_poller::start_poller(app_handle));
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // === life: tasks ===
            commands::tasks::list_tasks,
            commands::tasks::add_task,
            commands::tasks::update_task,
            commands::tasks::delete_task,
            // === radar ===
            commands::radar::list_goals,
            commands::radar::add_goal,
            commands::radar::update_goal,
            commands::radar::delete_goal,
            commands::radar::list_radar_tasks,
            commands::radar::add_radar_task,
            commands::radar::update_radar_task,
            commands::radar::delete_radar_task,
            commands::radar::list_radar_activities,
            commands::radar::add_radar_activity,
            commands::radar::dismiss_radar_alert,
            commands::radar::radar_save_token,
            commands::radar::radar_has_token,
            commands::radar::trigger_radar_poll_goal,
            // === life: blocks (calendar) ===
            commands::blocks::list_blocks,
            commands::blocks::list_blocks_by_date,
            commands::blocks::list_blocks_in_range,
            commands::blocks::add_block,
            commands::blocks::update_block,
            commands::blocks::delete_block,
            commands::blocks::purge_stale_blocks,
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
            commands::macos_cal::open_privacy_security,
            // === life: event notes (캘린더 일정 메모 사이드카) ===
            commands::event_notes::list_event_notes,
            commands::event_notes::list_event_notes_by_event,
            commands::event_notes::list_event_notes_by_series,
            commands::event_notes::upsert_event_note,
            commands::event_notes::delete_event_note,
            commands::event_notes::migrate_task_notes_to_event_notes,
            commands::event_notes::migrate_block_notes_to_event_notes,
            // === life: event subtasks ===
            commands::event_subtasks::list_event_subtasks,
            commands::event_subtasks::add_event_subtask,
            commands::event_subtasks::toggle_event_subtask,
            commands::event_subtasks::delete_event_subtask,
            commands::event_subtasks::list_all_event_subtask_counts,
            // === life: mood ===
            commands::mood::list_mood,
            commands::mood::list_mood_in_range,
            commands::mood::get_mood,
            commands::mood::set_mood,
            commands::mood::set_retrospective,
            commands::mood::delete_mood,
            // === life: body log ===
            commands::body_log::list_body_log,
            commands::body_log::list_body_log_in_range,
            commands::body_log::get_body_log,
            commands::body_log::set_body_log,
            commands::body_log::delete_body_log,
            commands::body_log::get_body_spec,
            commands::body_log::set_body_spec,
            // === life: glean (data_root 저장) ===
            commands::glean::list_glean,
            commands::glean::glean_counts,
            commands::glean::read_glean,
            commands::glean::add_glean,
            commands::glean::update_glean_status,
            commands::glean::update_glean_highlights,
            commands::glean::update_glean_digest,
            commands::glean::delete_glean,
            commands::glean::fetch_url,
            // === life: reports / summaries ===
            commands::reports::list_reports,
            commands::reports::read_report,
            commands::reports::migrate_reports,
            commands::summaries::list_summaries,
            commands::summaries::get_summary,
            commands::summaries::latest_unread_summary,
            commands::summaries::upsert_summary,
            commands::summaries::mark_summary_read,
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
            commands::llm::llm_get_settings,
            commands::llm::llm_save_settings,
            commands::llm::llm_get_api_key,
            // === blog: docs (vault 콘텐츠) ===
            commands::docs::list_docs,
            commands::docs::read_doc,
            commands::docs::write_doc,
            commands::docs::read_asset,
            commands::docs::write_asset,
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
            commands::meta::get_app_personalization,
            commands::meta::set_app_personalization,
            commands::meta::open_url,
            commands::meta::get_memory_info,
            commands::keychain::keychain_set_token,
            commands::keychain::keychain_has_token,
            commands::keychain::keychain_delete_token,
            // === life: rss feeds ===
            commands::rss::list_rss_feeds,
            commands::rss::add_rss_feed,
            commands::rss::remove_rss_feed,
            commands::rss::update_rss_feed,
            commands::rss::get_rss_config,
            commands::rss::set_rss_config,
            commands::rss::sync_rss_feed,
            commands::rss::sync_rss_feeds,
            commands::headless::check_chrome,
            commands::headless::fetch_threads_profile,
            commands::headless::debug_threads_page,
            commands::headless::list_threads_profiles,
            commands::headless::add_threads_profile,
            commands::headless::remove_threads_profile,
            commands::headless::set_threads_autosync,
            commands::headless::sync_threads_profile,
            // === clipboard history ===
            commands::clipboard::clipboard_read_text,
            commands::clipboard::clipboard_history_list,
            commands::clipboard::clipboard_history_push,
            commands::clipboard::clipboard_history_delete,
            commands::clipboard::clipboard_history_clear,
            commands::clipboard::clipboard_history_prune_by_days,
            commands::clipboard::clipboard_history_delete_within_hours,
            // === mail (IMAP) ===
            commands::mail::mail_list_accounts,
            commands::mail::mail_add_account,
            commands::mail::mail_update_account,
            commands::mail::mail_delete_account,
            commands::mail::mail_test_connection,
            commands::mail::mail_list_folders,
            commands::mail::mail_list_messages,
            commands::mail::mail_get_message,
            commands::mail::mail_set_seen,
            commands::mail::mail_set_seen_bulk,
            commands::mail::mail_set_flagged,
            commands::mail::mail_delete_message,
            commands::mail::mail_oauth_start,
            commands::mail::mail_list_all_messages,
            commands::mail::mail_list_all_accounts_messages,
            commands::mail::mail_fetch_all_accounts_full,
            commands::mail::mail_list_unread_messages,
            commands::mail::mail_list_all_accounts_unread_messages,
            commands::mail::mail_check_new,
            commands::mail::mail_unread_count_all,
            commands::mail::mail_folder_unread_counts,
            // === stats exclusions ===
            commands::stats_exclusions::list_stats_excluded,
            commands::stats_exclusions::set_stats_exclusions,
            // === settings ===
            commands::settings::read_global_keybindings,
            commands::settings::write_global_keybindings,
            // === window / quick ===
            close_quick_window,
            show_quick_window,
            set_global_shortcuts,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|err| {
            eprintln!("error while running tauri application: {err}");
        });
}
