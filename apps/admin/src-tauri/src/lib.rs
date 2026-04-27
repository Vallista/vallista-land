mod commands;
mod repo;

use std::fs;
use tauri::Manager;

use commands::llm::LlmState;

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
