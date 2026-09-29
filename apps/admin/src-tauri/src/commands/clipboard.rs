use arboard::Clipboard;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::State;

use crate::repo::AppState;

const CLIPBOARD_HISTORY_FILE: &str = "clipboard_history.json";
const MAX_HISTORY: usize = 200;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardEntry {
    pub id: String,
    pub text: String,
    pub copied_at: String,
}

fn load_history(data_root: &Path) -> Vec<ClipboardEntry> {
    let path = data_root.join(CLIPBOARD_HISTORY_FILE);
    let content = std::fs::read_to_string(path).unwrap_or_default();
    serde_json::from_str(&content).unwrap_or_default()
}

fn save_history(data_root: &Path, history: &[ClipboardEntry]) {
    let path = data_root.join(CLIPBOARD_HISTORY_FILE);
    if let Ok(json) = serde_json::to_string_pretty(history) {
        let _ = std::fs::write(path, json);
    }
}

#[tauri::command]
pub fn clipboard_read_text() -> Result<String, String> {
    let mut ctx = Clipboard::new().map_err(|e| e.to_string())?;
    ctx.get_text().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clipboard_history_list(state: State<AppState>) -> Vec<ClipboardEntry> {
    load_history(&state.data_root)
}

#[tauri::command]
pub fn clipboard_history_push(
    text: String,
    max_history: Option<usize>,
    state: State<AppState>,
) -> Vec<ClipboardEntry> {
    let trimmed = text.trim().to_string();
    if trimmed.is_empty() {
        return load_history(&state.data_root);
    }

    let mut history = load_history(&state.data_root);
    history.retain(|e| e.text != trimmed);

    let now = Utc::now();
    history.insert(
        0,
        ClipboardEntry {
            id: format!("clip_{}", now.timestamp_millis()),
            text: trimmed,
            copied_at: now.to_rfc3339(),
        },
    );
    history.truncate(max_history.unwrap_or(MAX_HISTORY));

    save_history(&state.data_root, &history);
    history
}

#[tauri::command]
pub fn clipboard_history_prune_by_days(days: u32, state: State<AppState>) -> Vec<ClipboardEntry> {
    if days == 0 {
        return load_history(&state.data_root);
    }
    let cutoff = Utc::now() - chrono::Duration::days(days as i64);
    let mut history = load_history(&state.data_root);
    history.retain(|e| {
        e.copied_at
            .parse::<chrono::DateTime<Utc>>()
            .map(|t| t > cutoff)
            .unwrap_or(true)
    });
    save_history(&state.data_root, &history);
    history
}

#[tauri::command]
pub fn clipboard_history_delete(id: String, state: State<AppState>) -> Vec<ClipboardEntry> {
    let mut history = load_history(&state.data_root);
    history.retain(|e| e.id != id);
    save_history(&state.data_root, &history);
    history
}

#[tauri::command]
pub fn clipboard_history_clear(state: State<AppState>) {
    save_history(&state.data_root, &[]);
}

#[tauri::command]
pub fn clipboard_history_delete_within_hours(
    hours: u32,
    state: State<AppState>,
) -> Vec<ClipboardEntry> {
    let cutoff = Utc::now() - chrono::Duration::hours(hours as i64);
    let mut history = load_history(&state.data_root);
    history.retain(|e| {
        e.copied_at
            .parse::<chrono::DateTime<Utc>>()
            .map(|t| t <= cutoff)
            .unwrap_or(false)
    });
    save_history(&state.data_root, &history);
    history
}
