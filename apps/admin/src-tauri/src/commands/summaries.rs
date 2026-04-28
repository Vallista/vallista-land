use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

const SUMMARIES_FILE: &str = "summaries.json";

#[derive(Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SummaryKind {
    Weekly,
    Monthly,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Summary {
    pub id: String,
    pub kind: SummaryKind,
    pub period: String,
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub metrics_json: Option<String>,
    pub generated_at: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub read_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub model: Option<String>,
}

fn summaries_path(root: &Path) -> std::path::PathBuf {
    root.join(SUMMARIES_FILE)
}

fn load_all(root: &Path) -> Result<Vec<Summary>, String> {
    let p = summaries_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<Summary>>(&raw).map_err(|e| e.to_string())
}

fn save_all(root: &Path, entries: &[Summary]) -> Result<(), String> {
    let p = summaries_path(root);
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

fn make_id(kind: &SummaryKind, period: &str) -> String {
    let kind_s = match kind {
        SummaryKind::Weekly => "weekly",
        SummaryKind::Monthly => "monthly",
    };
    format!("{}-{}", kind_s, period)
}

#[tauri::command]
pub fn list_summaries(state: State<'_, AppState>) -> Result<Vec<Summary>, String> {
    let mut all = load_all(&state.data_root)?;
    all.sort_by(|a, b| b.generated_at.cmp(&a.generated_at));
    Ok(all)
}

#[tauri::command]
pub fn get_summary(
    kind: SummaryKind,
    period: String,
    state: State<'_, AppState>,
) -> Result<Option<Summary>, String> {
    let all = load_all(&state.data_root)?;
    Ok(all
        .into_iter()
        .find(|s| s.kind == kind && s.period == period))
}

#[tauri::command]
pub fn latest_unread_summary(state: State<'_, AppState>) -> Result<Option<Summary>, String> {
    let mut all = load_all(&state.data_root)?;
    all.retain(|s| s.read_at.is_none());
    all.sort_by(|a, b| b.generated_at.cmp(&a.generated_at));
    Ok(all.into_iter().next())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SummaryUpsertInput {
    pub kind: SummaryKind,
    pub period: String,
    pub text: String,
    #[serde(default)]
    pub metrics_json: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
}

#[tauri::command]
pub fn upsert_summary(
    input: SummaryUpsertInput,
    state: State<'_, AppState>,
) -> Result<Summary, String> {
    let mut all = load_all(&state.data_root)?;
    let now = now_iso();
    let id = make_id(&input.kind, &input.period);
    let entry = if let Some(idx) = all.iter().position(|s| s.id == id) {
        let existing = &all[idx];
        let updated = Summary {
            id: existing.id.clone(),
            kind: input.kind,
            period: input.period,
            text: input.text,
            metrics_json: input.metrics_json,
            generated_at: now,
            read_at: existing.read_at.clone(),
            model: input.model,
        };
        all[idx] = updated.clone();
        updated
    } else {
        let entry = Summary {
            id,
            kind: input.kind,
            period: input.period,
            text: input.text,
            metrics_json: input.metrics_json,
            generated_at: now,
            read_at: None,
            model: input.model,
        };
        all.push(entry.clone());
        entry
    };
    save_all(&state.data_root, &all)?;
    Ok(entry)
}

#[tauri::command]
pub fn mark_summary_read(id: String, state: State<'_, AppState>) -> Result<Summary, String> {
    let mut all = load_all(&state.data_root)?;
    let idx = all
        .iter()
        .position(|s| s.id == id)
        .ok_or_else(|| format!("summary not found: {}", id))?;
    let now = now_iso();
    let updated = Summary {
        read_at: Some(now),
        ..all[idx].clone()
    };
    all[idx] = updated.clone();
    save_all(&state.data_root, &all)?;
    Ok(updated)
}
