use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

const TASKS_FILE: &str = "tasks.json";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub title: String,
    pub done: bool,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub due: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub doc_id: Option<String>,
    pub created_at: String,
}

fn tasks_path(root: &Path) -> std::path::PathBuf {
    root.join(TASKS_FILE)
}

fn load_all(root: &Path) -> Result<Vec<Task>, String> {
    let p = tasks_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<Task>>(&raw).map_err(|e| e.to_string())
}

fn save_all(root: &Path, tasks: &[Task]) -> Result<(), String> {
    let p = tasks_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(tasks).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

fn now_iso() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    iso_from_unix(secs as i64)
}

fn iso_from_unix(secs: i64) -> String {
    let days = secs.div_euclid(86_400);
    let mut s = secs.rem_euclid(86_400);
    let hour = (s / 3600) as u32;
    s %= 3600;
    let minute = (s / 60) as u32;
    let second = (s % 60) as u32;
    let (year, month, day) = civil_from_days(days);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hour, minute, second
    )
}

fn civil_from_days(days: i64) -> (i32, u32, u32) {
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = y + (if m <= 2 { 1 } else { 0 });
    (year as i32, m as u32, d as u32)
}

#[tauri::command]
pub fn list_tasks(state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    load_all(&state.vault_root)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskInput {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub due: Option<String>,
    #[serde(default)]
    pub doc_id: Option<String>,
}

#[tauri::command]
pub fn add_task(input: TaskInput, state: State<'_, AppState>) -> Result<Task, String> {
    let mut all = load_all(&state.vault_root)?;
    if all.iter().any(|t| t.id == input.id) {
        return Err(format!("task already exists: {}", input.id));
    }
    let task = Task {
        id: input.id,
        title: input.title,
        done: false,
        due: input.due.filter(|s| !s.is_empty()),
        doc_id: input.doc_id.filter(|s| !s.is_empty()),
        created_at: now_iso(),
    };
    all.push(task.clone());
    save_all(&state.vault_root, &all)?;
    Ok(task)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskPatch {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub done: Option<bool>,
    #[serde(default)]
    pub due: Option<Option<String>>,
    #[serde(default)]
    pub doc_id: Option<Option<String>>,
}

#[tauri::command]
pub fn update_task(
    id: String,
    patch: TaskPatch,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    let mut all = load_all(&state.vault_root)?;
    let idx = all
        .iter()
        .position(|t| t.id == id)
        .ok_or_else(|| format!("task not found: {}", id))?;
    if let Some(t) = patch.title {
        all[idx].title = t;
    }
    if let Some(d) = patch.done {
        all[idx].done = d;
    }
    if let Some(due) = patch.due {
        all[idx].due = due.filter(|s| !s.is_empty());
    }
    if let Some(doc_id) = patch.doc_id {
        all[idx].doc_id = doc_id.filter(|s| !s.is_empty());
    }
    let updated = all[idx].clone();
    save_all(&state.vault_root, &all)?;
    Ok(updated)
}

#[tauri::command]
pub fn delete_task(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut all = load_all(&state.vault_root)?;
    let before = all.len();
    all.retain(|t| t.id != id);
    if all.len() == before {
        return Err(format!("task not found: {}", id));
    }
    save_all(&state.vault_root, &all)
}
