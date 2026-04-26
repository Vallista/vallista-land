use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

const BLOCKS_FILE: &str = "blocks.json";

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum BlockKind {
    Routine,
    Health,
    Deep,
    People,
    Meal,
    Leisure,
    Meet,
    Write,
    Read,
    Build,
    Publish,
    Life,
}

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum BlockSource {
    Local,
    Gcal,
    Applecal,
}

impl Default for BlockSource {
    fn default() -> Self {
        BlockSource::Local
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Block {
    pub id: String,
    pub date: String,
    pub start: String,
    pub end: String,
    pub title: String,
    pub kind: BlockKind,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub src: Option<String>,
    #[serde(default)]
    pub attendees: Vec<String>,
    #[serde(default)]
    pub done: bool,
    #[serde(default)]
    pub source: BlockSource,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub external_id: Option<String>,
    pub created_at: String,
}

fn blocks_path(root: &Path) -> std::path::PathBuf {
    root.join(BLOCKS_FILE)
}

fn load_all(root: &Path) -> Result<Vec<Block>, String> {
    let p = blocks_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<Block>>(&raw).map_err(|e| e.to_string())
}

fn save_all(root: &Path, blocks: &[Block]) -> Result<(), String> {
    let p = blocks_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(blocks).map_err(|e| e.to_string())?;
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

fn sorted(mut blocks: Vec<Block>) -> Vec<Block> {
    blocks.sort_by(|a, b| {
        a.date
            .cmp(&b.date)
            .then_with(|| a.start.cmp(&b.start))
            .then_with(|| a.id.cmp(&b.id))
    });
    blocks
}

#[tauri::command]
pub fn list_blocks(state: State<'_, AppState>) -> Result<Vec<Block>, String> {
    Ok(sorted(load_all(&state.vault_root)?))
}

#[tauri::command]
pub fn list_blocks_by_date(
    date: String,
    state: State<'_, AppState>,
) -> Result<Vec<Block>, String> {
    let all = load_all(&state.vault_root)?;
    Ok(sorted(all.into_iter().filter(|b| b.date == date).collect()))
}

#[tauri::command]
pub fn list_blocks_in_range(
    start_date: String,
    end_date: String,
    state: State<'_, AppState>,
) -> Result<Vec<Block>, String> {
    let all = load_all(&state.vault_root)?;
    Ok(sorted(
        all.into_iter()
            .filter(|b| b.date >= start_date && b.date <= end_date)
            .collect(),
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockInput {
    pub id: String,
    pub date: String,
    pub start: String,
    pub end: String,
    pub title: String,
    pub kind: BlockKind,
    #[serde(default)]
    pub src: Option<String>,
    #[serde(default)]
    pub attendees: Vec<String>,
    #[serde(default)]
    pub source: Option<BlockSource>,
    #[serde(default)]
    pub external_id: Option<String>,
}

#[tauri::command]
pub fn add_block(input: BlockInput, state: State<'_, AppState>) -> Result<Block, String> {
    let mut all = load_all(&state.vault_root)?;
    if all.iter().any(|b| b.id == input.id) {
        return Err(format!("block already exists: {}", input.id));
    }
    let block = Block {
        id: input.id,
        date: input.date,
        start: input.start,
        end: input.end,
        title: input.title,
        kind: input.kind,
        src: input.src.filter(|s| !s.is_empty()),
        attendees: input.attendees,
        done: false,
        source: input.source.unwrap_or_default(),
        external_id: input.external_id.filter(|s| !s.is_empty()),
        created_at: now_iso(),
    };
    all.push(block.clone());
    save_all(&state.vault_root, &all)?;
    Ok(block)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockPatch {
    #[serde(default)]
    pub date: Option<String>,
    #[serde(default)]
    pub start: Option<String>,
    #[serde(default)]
    pub end: Option<String>,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub kind: Option<BlockKind>,
    #[serde(default)]
    pub src: Option<Option<String>>,
    #[serde(default)]
    pub attendees: Option<Vec<String>>,
    #[serde(default)]
    pub done: Option<bool>,
    #[serde(default)]
    pub external_id: Option<Option<String>>,
}

#[tauri::command]
pub fn update_block(
    id: String,
    patch: BlockPatch,
    state: State<'_, AppState>,
) -> Result<Block, String> {
    let mut all = load_all(&state.vault_root)?;
    let idx = all
        .iter()
        .position(|b| b.id == id)
        .ok_or_else(|| format!("block not found: {}", id))?;
    if let Some(v) = patch.date {
        all[idx].date = v;
    }
    if let Some(v) = patch.start {
        all[idx].start = v;
    }
    if let Some(v) = patch.end {
        all[idx].end = v;
    }
    if let Some(v) = patch.title {
        all[idx].title = v;
    }
    if let Some(v) = patch.kind {
        all[idx].kind = v;
    }
    if let Some(v) = patch.src {
        all[idx].src = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.attendees {
        all[idx].attendees = v;
    }
    if let Some(v) = patch.done {
        all[idx].done = v;
    }
    if let Some(v) = patch.external_id {
        all[idx].external_id = v.filter(|s| !s.is_empty());
    }
    let updated = all[idx].clone();
    save_all(&state.vault_root, &all)?;
    Ok(updated)
}

#[tauri::command]
pub fn delete_block(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut all = load_all(&state.vault_root)?;
    let before = all.len();
    all.retain(|b| b.id != id);
    if all.len() == before {
        return Err(format!("block not found: {}", id));
    }
    save_all(&state.vault_root, &all)
}
