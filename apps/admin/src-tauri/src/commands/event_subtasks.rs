use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

const SUBTASKS_DIR: &str = "event_subtasks";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EventSubtask {
    pub id: String,
    pub title: String,
    pub done: bool,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct EventSubtaskFile {
    pub event_key: String,
    pub series_key: String,
    pub event_title_snapshot: String,
    pub event_date_snapshot: String,
    pub items: Vec<EventSubtask>,
    pub updated_at: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EventSubtaskCount {
    pub event_key: String,
    pub total: u32,
    pub done: u32,
}

fn hex_encode(s: &str) -> String {
    s.bytes().map(|b| format!("{:02x}", b)).collect()
}

fn subtasks_dir(root: &Path) -> std::path::PathBuf {
    root.join(SUBTASKS_DIR)
}

fn subtask_file_path(root: &Path, event_key: &str) -> Result<std::path::PathBuf, String> {
    if event_key.is_empty() {
        return Err("eventKey is required".into());
    }
    let name = format!("{}.json", hex_encode(event_key));
    Ok(subtasks_dir(root).join(name))
}

fn now_iso() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0);
    let days = (secs as i64).div_euclid(86_400);
    let mut s = (secs as i64).rem_euclid(86_400);
    let hour = (s / 3600) as u32;
    s %= 3600;
    let minute = (s / 60) as u32;
    let second = (s % 60) as u32;
    let (year, month, day) = civil_from_days(days);
    let _ = nanos;
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", year, month, day, hour, minute, second)
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

fn new_sub_id() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0);
    format!("sub_{:x}_{:08x}", secs, nanos)
}

fn read_file(root: &Path, event_key: &str) -> Result<Option<EventSubtaskFile>, String> {
    let dir = subtasks_dir(root);
    if !dir.is_dir() {
        return Ok(None);
    }
    let p = subtask_file_path(root, event_key)?;
    let safe = ensure_inside(root, &p)?;
    if !safe.is_file() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&safe).map_err(|e| e.to_string())?;
    serde_json::from_str::<EventSubtaskFile>(&raw)
        .map(Some)
        .map_err(|e| e.to_string())
}

fn write_file(root: &Path, file: &EventSubtaskFile) -> Result<(), String> {
    let dir = subtasks_dir(root);
    if !dir.is_dir() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    let p = subtask_file_path(root, &file.event_key)?;
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(file).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_event_subtasks(
    event_key: String,
    state: State<'_, AppState>,
) -> Result<Vec<EventSubtask>, String> {
    Ok(read_file(&state.data_root, &event_key)?
        .map(|f| f.items)
        .unwrap_or_default())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddEventSubtaskInput {
    pub event_key: String,
    pub series_key: String,
    pub event_title_snapshot: String,
    pub event_date_snapshot: String,
    pub title: String,
}

#[tauri::command]
pub fn add_event_subtask(
    input: AddEventSubtaskInput,
    state: State<'_, AppState>,
) -> Result<EventSubtask, String> {
    if input.title.trim().is_empty() {
        return Err("title is required".into());
    }
    let now = now_iso();
    let subtask = EventSubtask {
        id: new_sub_id(),
        title: input.title.trim().to_string(),
        done: false,
        created_at: now.clone(),
    };
    let mut file = read_file(&state.data_root, &input.event_key)?.unwrap_or(EventSubtaskFile {
        event_key: input.event_key.clone(),
        series_key: input.series_key,
        event_title_snapshot: input.event_title_snapshot,
        event_date_snapshot: input.event_date_snapshot,
        items: vec![],
        updated_at: now.clone(),
    });
    file.items.push(subtask.clone());
    file.updated_at = now;
    write_file(&state.data_root, &file)?;
    Ok(subtask)
}

#[tauri::command]
pub fn toggle_event_subtask(
    event_key: String,
    id: String,
    done: bool,
    state: State<'_, AppState>,
) -> Result<EventSubtask, String> {
    let mut file = read_file(&state.data_root, &event_key)?
        .ok_or_else(|| "subtask file not found".to_string())?;
    let item = file
        .items
        .iter_mut()
        .find(|s| s.id == id)
        .ok_or_else(|| format!("subtask {} not found", id))?;
    item.done = done;
    let result = item.clone();
    file.updated_at = now_iso();
    write_file(&state.data_root, &file)?;
    Ok(result)
}

#[tauri::command]
pub fn delete_event_subtask(
    event_key: String,
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut file = match read_file(&state.data_root, &event_key)? {
        Some(f) => f,
        None => return Ok(()),
    };
    file.items.retain(|s| s.id != id);
    file.updated_at = now_iso();
    write_file(&state.data_root, &file)
}

#[tauri::command]
pub fn list_all_event_subtask_counts(
    state: State<'_, AppState>,
) -> Result<Vec<EventSubtaskCount>, String> {
    let dir = subtasks_dir(&state.data_root);
    if !dir.is_dir() {
        return Ok(vec![]);
    }
    let mut counts = vec![];
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        let path = entry.path();
        if path.extension().map_or(true, |e| e != "json") {
            continue;
        }
        let raw = match fs::read_to_string(&path) {
            Ok(s) => s,
            Err(_) => continue,
        };
        let file: EventSubtaskFile = match serde_json::from_str(&raw) {
            Ok(f) => f,
            Err(_) => continue,
        };
        if file.items.is_empty() {
            continue;
        }
        let total = file.items.len() as u32;
        let done = file.items.iter().filter(|s| s.done).count() as u32;
        counts.push(EventSubtaskCount {
            event_key: file.event_key,
            total,
            done,
        });
    }
    Ok(counts)
}
