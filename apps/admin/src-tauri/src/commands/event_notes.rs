use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

const EVENT_NOTES_DIR: &str = "event_notes";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EventNote {
    pub id: String,
    pub event_key: String,
    pub series_key: String,
    pub event_title_snapshot: String,
    pub event_date_snapshot: String,
    pub body: String,
    #[serde(default)]
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

fn notes_dir(root: &Path) -> std::path::PathBuf {
    root.join(EVENT_NOTES_DIR)
}

fn note_path(root: &Path, id: &str) -> Result<std::path::PathBuf, String> {
    if id.is_empty() || id.contains('/') || id.contains('\\') || id.contains("..") {
        return Err(format!("invalid id: {}", id));
    }
    Ok(notes_dir(root).join(format!("{}.json", id)))
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

fn rand_suffix() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0);
    format!("{:08x}", nanos)
}

fn new_id() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("note_{:x}_{}", secs, rand_suffix())
}

fn read_all(root: &Path) -> Result<Vec<EventNote>, String> {
    let dir = notes_dir(root);
    if !dir.is_dir() {
        return Ok(Vec::new());
    }
    let mut items: Vec<EventNote> = Vec::new();
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
        match serde_json::from_str::<EventNote>(&raw) {
            Ok(item) => items.push(item),
            Err(_) => continue,
        }
    }
    items.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(items)
}

fn read_note(root: &Path, id: &str) -> Result<EventNote, String> {
    let p = note_path(root, id)?;
    let safe = ensure_inside(root, &p)?;
    let raw = fs::read_to_string(&safe).map_err(|e| e.to_string())?;
    serde_json::from_str::<EventNote>(&raw).map_err(|e| e.to_string())
}

fn write_note(root: &Path, note: &EventNote) -> Result<(), String> {
    let dir = notes_dir(root);
    if !dir.is_dir() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    let p = note_path(root, &note.id)?;
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(note).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_event_notes(state: State<'_, AppState>) -> Result<Vec<EventNote>, String> {
    read_all(&state.data_root)
}

#[tauri::command]
pub fn list_event_notes_by_event(
    event_key: String,
    state: State<'_, AppState>,
) -> Result<Vec<EventNote>, String> {
    let all = read_all(&state.data_root)?;
    Ok(all.into_iter().filter(|n| n.event_key == event_key).collect())
}

#[tauri::command]
pub fn list_event_notes_by_series(
    series_key: String,
    state: State<'_, AppState>,
) -> Result<Vec<EventNote>, String> {
    let all = read_all(&state.data_root)?;
    let mut filtered: Vec<EventNote> = all
        .into_iter()
        .filter(|n| n.series_key == series_key)
        .collect();
    filtered.sort_by(|a, b| b.event_date_snapshot.cmp(&a.event_date_snapshot));
    Ok(filtered)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventNoteUpsertInput {
    #[serde(default)]
    pub id: Option<String>,
    pub event_key: String,
    pub series_key: String,
    pub event_title_snapshot: String,
    pub event_date_snapshot: String,
    pub body: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[tauri::command]
pub fn upsert_event_note(
    input: EventNoteUpsertInput,
    state: State<'_, AppState>,
) -> Result<EventNote, String> {
    if input.event_key.trim().is_empty() {
        return Err("eventKey is required".into());
    }
    if input.series_key.trim().is_empty() {
        return Err("seriesKey is required".into());
    }
    let now = now_iso();
    let note = match input.id.as_deref().filter(|s| !s.is_empty()) {
        Some(existing_id) => {
            let mut prev = read_note(&state.data_root, existing_id)?;
            prev.event_key = input.event_key;
            prev.series_key = input.series_key;
            prev.event_title_snapshot = input.event_title_snapshot;
            prev.event_date_snapshot = input.event_date_snapshot;
            prev.body = input.body;
            prev.tags = input.tags;
            prev.updated_at = now;
            prev
        }
        None => EventNote {
            id: new_id(),
            event_key: input.event_key,
            series_key: input.series_key,
            event_title_snapshot: input.event_title_snapshot,
            event_date_snapshot: input.event_date_snapshot,
            body: input.body,
            tags: input.tags,
            created_at: now.clone(),
            updated_at: now,
        },
    };
    write_note(&state.data_root, &note)?;
    Ok(note)
}

#[tauri::command]
pub fn delete_event_note(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let p = note_path(&state.data_root, &id)?;
    let safe = ensure_inside(&state.data_root, &p)?;
    if safe.is_file() {
        fs::remove_file(&safe).map_err(|e| e.to_string())?;
    }
    Ok(())
}
