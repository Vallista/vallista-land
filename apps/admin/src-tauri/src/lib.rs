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
            commands::meta::vault_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
