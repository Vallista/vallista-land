use serde::Serialize;
use std::path::Path;
use tauri::State;
use walkdir::WalkDir;

use crate::repo::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultInfo {
    pub root: String,
    pub article_count: u64,
    pub note_count: u64,
}

#[tauri::command]
pub fn vault_info(state: State<'_, AppState>) -> Result<VaultInfo, String> {
    let root = &state.vault_root;
    let article_count = count_md(&root.join("contents/articles"));
    let note_count = count_md(&root.join("contents/notes"));
    Ok(VaultInfo {
        root: root.to_string_lossy().to_string(),
        article_count,
        note_count,
    })
}

fn count_md(dir: &Path) -> u64 {
    if !dir.is_dir() {
        return 0;
    }
    WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "md"))
        .count() as u64
}
