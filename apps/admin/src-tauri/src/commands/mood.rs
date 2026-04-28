use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

const MOOD_FILE: &str = "mood.json";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Mood {
    pub date: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub energy: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub mood: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub note: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub retrospective_note: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub retrospective_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

fn mood_path(root: &Path) -> std::path::PathBuf {
    root.join(MOOD_FILE)
}

fn load_all(root: &Path) -> Result<Vec<Mood>, String> {
    let p = mood_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<Mood>>(&raw).map_err(|e| e.to_string())
}

fn save_all(root: &Path, entries: &[Mood]) -> Result<(), String> {
    let p = mood_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(entries).map_err(|e| e.to_string())?;
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

fn validate_unit(name: &str, v: f32) -> Result<(), String> {
    if !v.is_finite() || !(0.0..=1.0).contains(&v) {
        return Err(format!("{} must be in [0.0, 1.0], got {}", name, v));
    }
    Ok(())
}

#[tauri::command]
pub fn list_mood(state: State<'_, AppState>) -> Result<Vec<Mood>, String> {
    let mut all = load_all(&state.data_root)?;
    all.sort_by(|a, b| a.date.cmp(&b.date));
    Ok(all)
}

#[tauri::command]
pub fn list_mood_in_range(
    start_date: String,
    end_date: String,
    state: State<'_, AppState>,
) -> Result<Vec<Mood>, String> {
    let all = load_all(&state.data_root)?;
    let mut filtered: Vec<Mood> = all
        .into_iter()
        .filter(|m| m.date >= start_date && m.date <= end_date)
        .collect();
    filtered.sort_by(|a, b| a.date.cmp(&b.date));
    Ok(filtered)
}

#[tauri::command]
pub fn get_mood(date: String, state: State<'_, AppState>) -> Result<Option<Mood>, String> {
    let all = load_all(&state.data_root)?;
    Ok(all.into_iter().find(|m| m.date == date))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoodInput {
    pub date: String,
    pub energy: f32,
    pub mood: f32,
    #[serde(default)]
    pub note: Option<String>,
}

#[tauri::command]
pub fn set_mood(input: MoodInput, state: State<'_, AppState>) -> Result<Mood, String> {
    validate_unit("energy", input.energy)?;
    validate_unit("mood", input.mood)?;
    let mut all = load_all(&state.data_root)?;
    let now = now_iso();
    let entry = if let Some(idx) = all.iter().position(|m| m.date == input.date) {
        let existing = &all[idx];
        let updated = Mood {
            date: input.date,
            energy: Some(input.energy),
            mood: Some(input.mood),
            note: input.note.filter(|s| !s.is_empty()),
            retrospective_note: existing.retrospective_note.clone(),
            retrospective_at: existing.retrospective_at.clone(),
            created_at: existing.created_at.clone(),
            updated_at: now,
        };
        all[idx] = updated.clone();
        updated
    } else {
        let entry = Mood {
            date: input.date,
            energy: Some(input.energy),
            mood: Some(input.mood),
            note: input.note.filter(|s| !s.is_empty()),
            retrospective_note: None,
            retrospective_at: None,
            created_at: now.clone(),
            updated_at: now,
        };
        all.push(entry.clone());
        entry
    };
    save_all(&state.data_root, &all)?;
    Ok(entry)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetrospectiveInput {
    pub date: String,
    pub note: String,
}

#[tauri::command]
pub fn set_retrospective(
    input: RetrospectiveInput,
    state: State<'_, AppState>,
) -> Result<Mood, String> {
    let mut all = load_all(&state.data_root)?;
    let now = now_iso();
    let trimmed = input.note.trim();
    let note_opt = if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    };
    let retro_at = if note_opt.is_some() {
        Some(now.clone())
    } else {
        None
    };

    let entry = if let Some(idx) = all.iter().position(|m| m.date == input.date) {
        let existing = &all[idx];
        let updated = Mood {
            date: input.date,
            energy: existing.energy,
            mood: existing.mood,
            note: existing.note.clone(),
            retrospective_note: note_opt,
            retrospective_at: retro_at,
            created_at: existing.created_at.clone(),
            updated_at: now,
        };
        all[idx] = updated.clone();
        updated
    } else {
        let entry = Mood {
            date: input.date,
            energy: None,
            mood: None,
            note: None,
            retrospective_note: note_opt,
            retrospective_at: retro_at,
            created_at: now.clone(),
            updated_at: now,
        };
        all.push(entry.clone());
        entry
    };
    save_all(&state.data_root, &all)?;
    Ok(entry)
}

#[tauri::command]
pub fn delete_mood(date: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut all = load_all(&state.data_root)?;
    let before = all.len();
    all.retain(|m| m.date != date);
    if all.len() == before {
        return Err(format!("mood entry not found: {}", date));
    }
    save_all(&state.data_root, &all)
}
