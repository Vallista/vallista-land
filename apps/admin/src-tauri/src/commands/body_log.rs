use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

const BODY_LOG_FILE: &str = "body_log.json";
const BODY_SPEC_FILE: &str = "body_spec.json";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExerciseEntry {
    pub name: String,
    pub category: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub duration: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub sets: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub reps: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub weight: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub distance: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub memo: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MealEntry {
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub time: Option<String>,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub calories: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub protein: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub carbs: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub fat: Option<f32>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BodyLog {
    pub date: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub weight: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub body_fat: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub sleep_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub wake_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub exercises: Option<Vec<ExerciseEntry>>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub meals: Option<Vec<MealEntry>>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BodySpec {
    pub height: f32,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub birth_year: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub gender: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub target_weight: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub activity_level: Option<String>,
}

fn body_log_path(root: &Path) -> std::path::PathBuf {
    root.join(BODY_LOG_FILE)
}

fn body_spec_path(root: &Path) -> std::path::PathBuf {
    root.join(BODY_SPEC_FILE)
}

fn load_all(root: &Path) -> Result<Vec<BodyLog>, String> {
    let p = body_log_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<BodyLog>>(&raw).map_err(|e| e.to_string())
}

fn save_all(root: &Path, entries: &[BodyLog]) -> Result<(), String> {
    let p = body_log_path(root);
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

#[tauri::command]
pub fn list_body_log(state: State<'_, AppState>) -> Result<Vec<BodyLog>, String> {
    let mut all = load_all(&state.data_root)?;
    all.sort_by(|a, b| a.date.cmp(&b.date));
    Ok(all)
}

#[tauri::command]
pub fn list_body_log_in_range(
    start_date: String,
    end_date: String,
    state: State<'_, AppState>,
) -> Result<Vec<BodyLog>, String> {
    let all = load_all(&state.data_root)?;
    let mut filtered: Vec<BodyLog> = all
        .into_iter()
        .filter(|m| m.date >= start_date && m.date <= end_date)
        .collect();
    filtered.sort_by(|a, b| a.date.cmp(&b.date));
    Ok(filtered)
}

#[tauri::command]
pub fn get_body_log(date: String, state: State<'_, AppState>) -> Result<Option<BodyLog>, String> {
    let all = load_all(&state.data_root)?;
    Ok(all.into_iter().find(|m| m.date == date))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BodyLogInput {
    pub date: String,
    #[serde(default)]
    pub weight: Option<f32>,
    #[serde(default)]
    pub body_fat: Option<f32>,
    #[serde(default)]
    pub sleep_at: Option<String>,
    #[serde(default)]
    pub wake_at: Option<String>,
    #[serde(default)]
    pub exercises: Option<Vec<ExerciseEntry>>,
    #[serde(default)]
    pub meals: Option<Vec<MealEntry>>,
}

#[tauri::command]
pub fn set_body_log(input: BodyLogInput, state: State<'_, AppState>) -> Result<BodyLog, String> {
    if let Some(w) = input.weight {
        if w <= 0.0 || w > 500.0 {
            return Err(format!("weight must be in (0, 500], got {}", w));
        }
    }
    if let Some(bf) = input.body_fat {
        if !(0.0..=100.0).contains(&bf) {
            return Err(format!("bodyFat must be in [0, 100], got {}", bf));
        }
    }

    let mut all = load_all(&state.data_root)?;
    let now = now_iso();

    let entry = if let Some(idx) = all.iter().position(|m| m.date == input.date) {
        let existing = &all[idx];
        let updated = BodyLog {
            date: input.date,
            weight: input.weight.or(existing.weight),
            body_fat: input.body_fat.or(existing.body_fat),
            sleep_at: input.sleep_at.or_else(|| existing.sleep_at.clone()),
            wake_at: input.wake_at.or_else(|| existing.wake_at.clone()),
            exercises: input.exercises.or_else(|| existing.exercises.clone()),
            meals: input.meals.or_else(|| existing.meals.clone()),
            created_at: existing.created_at.clone(),
            updated_at: now,
        };
        all[idx] = updated.clone();
        updated
    } else {
        let entry = BodyLog {
            date: input.date,
            weight: input.weight,
            body_fat: input.body_fat,
            sleep_at: input.sleep_at,
            wake_at: input.wake_at,
            exercises: input.exercises,
            meals: input.meals,
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
pub fn delete_body_log(date: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut all = load_all(&state.data_root)?;
    let before = all.len();
    all.retain(|m| m.date != date);
    if all.len() == before {
        return Err(format!("body log entry not found: {}", date));
    }
    save_all(&state.data_root, &all)
}

#[tauri::command]
pub fn get_body_spec(state: State<'_, AppState>) -> Result<Option<BodySpec>, String> {
    let p = body_spec_path(&state.data_root);
    if !p.is_file() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(None);
    }
    let spec: BodySpec = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
    Ok(Some(spec))
}

#[tauri::command]
pub fn set_body_spec(spec: BodySpec, state: State<'_, AppState>) -> Result<BodySpec, String> {
    if spec.height <= 0.0 || spec.height > 300.0 {
        return Err(format!("height must be in (0, 300], got {}", spec.height));
    }
    let p = body_spec_path(&state.data_root);
    let safe = ensure_inside(&state.data_root, &p)?;
    let json = serde_json::to_string_pretty(&spec).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())?;
    Ok(spec)
}
