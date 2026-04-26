mod commands;
mod repo;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let root = repo::resolve_vault_root().expect("could not resolve vault root");
            app.manage(repo::AppState { vault_root: root });
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
            commands::git::git_status,
            commands::git::git_log,
            commands::git::git_commit_push,
            commands::meta::vault_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
