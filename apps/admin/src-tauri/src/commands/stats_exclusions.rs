use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::State;

use crate::repo::AppState;

const FILE_NAME: &str = "stats_exclusions.json";

#[derive(Serialize, Deserialize, Default)]
struct StatsExclusionsFile {
    keys: Vec<String>,
}

fn file_path(root: &Path) -> std::path::PathBuf {
    root.join(FILE_NAME)
}

fn read_file(root: &Path) -> StatsExclusionsFile {
    let p = file_path(root);
    if !p.exists() {
        return StatsExclusionsFile::default();
    }
    let raw = fs::read_to_string(&p).unwrap_or_default();
    serde_json::from_str(&raw).unwrap_or_default()
}

#[tauri::command]
pub fn list_stats_excluded(state: State<AppState>) -> Result<Vec<String>, String> {
    Ok(read_file(&state.data_root).keys)
}

#[tauri::command]
pub fn set_stats_exclusions(
    keys: Vec<String>,
    state: State<AppState>,
) -> Result<(), String> {
    let data = StatsExclusionsFile { keys };
    let json = serde_json::to_string(&data).map_err(|e| e.to_string())?;
    fs::write(file_path(&state.data_root), json).map_err(|e| e.to_string())
}
