use sha2::{Digest, Sha256};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{build_user_agent, ensure_inside, load_config, AppState};

const BLOCKS_FILE: &str = "blocks.json";
const ICAL_FEEDS_FILE: &str = "ical_feeds.json";

pub type BlockKind = String;

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
    pub end_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub custom_label: Option<String>,
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
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub task_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub location: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub calendar_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub organizer: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub url: Option<String>,
    #[serde(default, skip_serializing_if = "is_false")]
    pub recurring: bool,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub actual_start: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub actual_end: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub done_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub tags: Vec<String>,
    pub created_at: String,
}

fn is_false(b: &bool) -> bool {
    !*b
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
    Ok(sorted(load_all(&state.data_root)?))
}

#[tauri::command]
pub fn list_blocks_by_date(
    date: String,
    state: State<'_, AppState>,
) -> Result<Vec<Block>, String> {
    let all = load_all(&state.data_root)?;
    Ok(sorted(all.into_iter().filter(|b| b.date == date).collect()))
}

#[tauri::command]
pub fn list_blocks_in_range(
    start_date: String,
    end_date: String,
    state: State<'_, AppState>,
) -> Result<Vec<Block>, String> {
    let all = load_all(&state.data_root)?;
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
    pub end_date: Option<String>,
    #[serde(default)]
    pub custom_label: Option<String>,
    #[serde(default)]
    pub src: Option<String>,
    #[serde(default)]
    pub attendees: Vec<String>,
    #[serde(default)]
    pub source: Option<BlockSource>,
    #[serde(default)]
    pub external_id: Option<String>,
    #[serde(default)]
    pub task_id: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[tauri::command]
pub fn add_block(input: BlockInput, state: State<'_, AppState>) -> Result<Block, String> {
    let mut all = load_all(&state.data_root)?;
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
        end_date: input.end_date.filter(|s| !s.is_empty()),
        custom_label: input.custom_label.filter(|s| !s.is_empty()),
        src: input.src.filter(|s| !s.is_empty()),
        attendees: input.attendees,
        done: false,
        source: input.source.unwrap_or_default(),
        external_id: input.external_id.filter(|s| !s.is_empty()),
        task_id: input.task_id.filter(|s| !s.is_empty()),
        notes: input.notes.filter(|s| !s.is_empty()),
        location: None,
        calendar_name: None,
        organizer: None,
        url: None,
        recurring: false,
        actual_start: None,
        actual_end: None,
        done_at: None,
        color: input.color.filter(|s| !s.is_empty()),
        tags: input.tags.into_iter().filter(|s| !s.is_empty()).collect(),
        created_at: now_iso(),
    };
    all.push(block.clone());
    save_all(&state.data_root, &all)?;
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
    pub end_date: Option<Option<String>>,
    #[serde(default)]
    pub custom_label: Option<Option<String>>,
    #[serde(default)]
    pub src: Option<Option<String>>,
    #[serde(default)]
    pub attendees: Option<Vec<String>>,
    #[serde(default)]
    pub done: Option<bool>,
    #[serde(default)]
    pub external_id: Option<Option<String>>,
    #[serde(default)]
    pub task_id: Option<Option<String>>,
    #[serde(default)]
    pub actual_start: Option<Option<String>>,
    #[serde(default)]
    pub actual_end: Option<Option<String>>,
    #[serde(default)]
    pub done_at: Option<Option<String>>,
    #[serde(default)]
    pub notes: Option<Option<String>>,
    #[serde(default)]
    pub color: Option<Option<String>>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
}

#[tauri::command]
pub fn update_block(
    id: String,
    patch: BlockPatch,
    state: State<'_, AppState>,
) -> Result<Block, String> {
    let mut all = load_all(&state.data_root)?;
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
    if let Some(v) = patch.end_date {
        all[idx].end_date = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.custom_label {
        all[idx].custom_label = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.src {
        all[idx].src = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.attendees {
        all[idx].attendees = v;
    }
    if let Some(v) = patch.done {
        let was_done = all[idx].done;
        all[idx].done = v;
        if v && !was_done && all[idx].done_at.is_none() {
            all[idx].done_at = Some(now_iso());
        }
        if !v {
            all[idx].done_at = None;
        }
    }
    if let Some(v) = patch.external_id {
        all[idx].external_id = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.task_id {
        all[idx].task_id = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.actual_start {
        all[idx].actual_start = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.actual_end {
        all[idx].actual_end = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.done_at {
        all[idx].done_at = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.notes {
        all[idx].notes = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.color {
        all[idx].color = v.filter(|s| !s.is_empty());
    }
    if let Some(v) = patch.tags {
        all[idx].tags = v.into_iter().filter(|s| !s.is_empty()).collect();
    }
    let updated = all[idx].clone();
    save_all(&state.data_root, &all)?;
    Ok(updated)
}

#[tauri::command]
pub fn delete_block(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut all = load_all(&state.data_root)?;
    let before = all.len();
    all.retain(|b| b.id != id);
    if all.len() == before {
        return Err(format!("block not found: {}", id));
    }
    save_all(&state.data_root, &all)
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IcalImportResult {
    pub added: usize,
    pub updated: usize,
    pub skipped: usize,
    pub total: usize,
}

struct IcalImportInnerResult {
    result: IcalImportResult,
    active_ids: std::collections::HashSet<String>,
    date_from: Option<String>,
    date_to: Option<String>,
}

#[tauri::command]
pub async fn import_ical_url(
    url: String,
    state: State<'_, AppState>,
) -> Result<IcalImportResult, String> {
    let root = state.data_root.clone();
    import_ical_url_inner(&root, &url).await.map(|r| r.result)
}

#[derive(Default, Clone)]
struct IcalRawDt {
    value: String,
    tzid: Option<String>,
    is_date: bool,
}

#[derive(Default)]
struct IcalEvent {
    uid: String,
    summary: String,
    dtstart: Option<IcalRawDt>,
    dtend: Option<IcalRawDt>,
    attendees: Vec<String>,
    organizer: Option<String>,
    description: Option<String>,
    location: Option<String>,
    url: Option<String>,
    recurring: bool,
}

enum ParsedIcalDt {
    AllDay(chrono::NaiveDate),
    Timed(chrono::DateTime<chrono::Local>),
}

impl IcalEvent {
    fn to_local_block_time(&self) -> Option<(String, String, Option<String>, String)> {
        let s = parse_ical_dt(self.dtstart.as_ref()?)?;
        let e = parse_ical_dt(self.dtend.as_ref()?)?;
        match (s, e) {
            (ParsedIcalDt::AllDay(sd), ParsedIcalDt::AllDay(ed)) => {
                let inclusive_end = ed.pred_opt().unwrap_or(ed);
                let date = sd.format("%Y-%m-%d").to_string();
                let end_date = if inclusive_end == sd {
                    None
                } else {
                    Some(inclusive_end.format("%Y-%m-%d").to_string())
                };
                Some((date, "00:00".into(), end_date, "00:00".into()))
            }
            (ParsedIcalDt::Timed(sd), ParsedIcalDt::Timed(ed)) => {
                let start_date = sd.format("%Y-%m-%d").to_string();
                let end_date_str = ed.format("%Y-%m-%d").to_string();
                let start_time = sd.format("%H:%M").to_string();
                let end_time = ed.format("%H:%M").to_string();
                let end_date = if end_date_str == start_date {
                    None
                } else {
                    Some(end_date_str)
                };
                Some((start_date, start_time, end_date, end_time))
            }
            _ => None,
        }
    }
}

fn parse_ical_events(raw: &str) -> Vec<IcalEvent> {
    let unfolded = unfold_ical(raw);
    let mut out = Vec::new();
    let mut cur: Option<IcalEvent> = None;
    for line in unfolded.lines() {
        let line = line.trim_end_matches('\r');
        if line == "BEGIN:VEVENT" {
            cur = Some(IcalEvent::default());
            continue;
        }
        if line == "END:VEVENT" {
            if let Some(ev) = cur.take() {
                out.push(ev);
            }
            continue;
        }
        let Some(ev) = cur.as_mut() else { continue };
        let (key_full, value) = match line.split_once(':') {
            Some(p) => p,
            None => continue,
        };
        let key = key_full.split(';').next().unwrap_or("");
        match key {
            "UID" => ev.uid = value.to_string(),
            "SUMMARY" => ev.summary = unescape_text(value),
            "DESCRIPTION" => {
                let v = unescape_text(value);
                if !v.trim().is_empty() {
                    ev.description = Some(v);
                }
            }
            "LOCATION" => {
                let v = unescape_text(value);
                if !v.trim().is_empty() {
                    ev.location = Some(v);
                }
            }
            "URL" => {
                let v = value.trim();
                if !v.is_empty() {
                    ev.url = Some(v.to_string());
                }
            }
            "RRULE" => {
                if !value.trim().is_empty() {
                    ev.recurring = true;
                }
            }
            "DTSTART" | "DTEND" => {
                let mut tzid = None;
                let mut is_date = false;
                for param in key_full.split(';').skip(1) {
                    if let Some(rest) = param.strip_prefix("TZID=") {
                        tzid = Some(rest.trim_matches('"').to_string());
                    } else if param.eq_ignore_ascii_case("VALUE=DATE") {
                        is_date = true;
                    }
                }
                let dt = IcalRawDt {
                    value: value.to_string(),
                    tzid,
                    is_date,
                };
                if key == "DTSTART" {
                    ev.dtstart = Some(dt);
                } else {
                    ev.dtend = Some(dt);
                }
            }
            "ATTENDEE" => {
                let mut name = None;
                for param in key_full.split(';').skip(1) {
                    if let Some(rest) = param.strip_prefix("CN=") {
                        name = Some(rest.trim_matches('"').to_string());
                    }
                }
                let resolved = name.unwrap_or_else(|| {
                    value
                        .strip_prefix("mailto:")
                        .unwrap_or(value)
                        .to_string()
                });
                if !resolved.trim().is_empty() {
                    ev.attendees.push(resolved);
                }
            }
            "ORGANIZER" => {
                let mut name = None;
                for param in key_full.split(';').skip(1) {
                    if let Some(rest) = param.strip_prefix("CN=") {
                        name = Some(rest.trim_matches('"').to_string());
                    }
                }
                let resolved = name.unwrap_or_else(|| {
                    value
                        .strip_prefix("mailto:")
                        .unwrap_or(value)
                        .to_string()
                });
                if !resolved.trim().is_empty() {
                    ev.organizer = Some(resolved);
                }
            }
            _ => {}
        }
    }
    out
}

fn unfold_ical(raw: &str) -> String {
    let mut out = String::with_capacity(raw.len());
    for line in raw.lines() {
        if line.starts_with(' ') || line.starts_with('\t') {
            out.push_str(line.trim_start_matches([' ', '\t']));
        } else {
            if !out.is_empty() {
                out.push('\n');
            }
            out.push_str(line);
        }
    }
    out
}

fn unescape_text(s: &str) -> String {
    s.replace("\\,", ",")
        .replace("\\;", ";")
        .replace("\\n", "\n")
        .replace("\\N", "\n")
        .replace("\\\\", "\\")
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IcalFeed {
    pub id: String,
    pub label: String,
    pub url: String,
    #[serde(default)]
    pub last_synced_at: Option<String>,
    #[serde(default)]
    pub last_result: Option<IcalImportResult>,
}

fn ical_feeds_path(root: &Path) -> std::path::PathBuf {
    root.join(ICAL_FEEDS_FILE)
}

fn load_feeds(root: &Path) -> Result<Vec<IcalFeed>, String> {
    let p = ical_feeds_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<IcalFeed>>(&raw).map_err(|e| e.to_string())
}

fn save_feeds(root: &Path, feeds: &[IcalFeed]) -> Result<(), String> {
    let p = ical_feeds_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(feeds).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_ical_feeds(state: State<'_, AppState>) -> Result<Vec<IcalFeed>, String> {
    load_feeds(&state.data_root)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IcalFeedInput {
    pub label: String,
    pub url: String,
}

#[tauri::command]
pub fn add_ical_feed(
    input: IcalFeedInput,
    state: State<'_, AppState>,
) -> Result<IcalFeed, String> {
    let mut feeds = load_feeds(&state.data_root)?;
    let url = input.url.trim().to_string();
    if url.is_empty() {
        return Err("URL이 비어 있습니다".into());
    }
    if feeds.iter().any(|f| f.url == url) {
        return Err("이미 등록된 URL입니다".into());
    }
    let label = if input.label.trim().is_empty() {
        "캘린더".into()
    } else {
        input.label.trim().to_string()
    };
    let id = format!("feed_{}", now_iso().replace(':', "").replace('-', ""));
    let feed = IcalFeed {
        id,
        label,
        url,
        last_synced_at: None,
        last_result: None,
    };
    feeds.push(feed.clone());
    save_feeds(&state.data_root, &feeds)?;
    Ok(feed)
}

#[tauri::command]
pub fn remove_ical_feed(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut feeds = load_feeds(&state.data_root)?;
    let before = feeds.len();
    feeds.retain(|f| f.id != id);
    if feeds.len() == before {
        return Err(format!("feed not found: {}", id));
    }
    save_feeds(&state.data_root, &feeds)
}

#[tauri::command]
pub async fn sync_ical_feeds(
    state: State<'_, AppState>,
) -> Result<Vec<IcalFeed>, String> {
    let mut feeds = load_feeds(&state.data_root)?;
    let urls: Vec<(String, String)> =
        feeds.iter().map(|f| (f.id.clone(), f.url.clone())).collect();
    let mut all_active_ids: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut global_date_from: Option<String> = None;
    let mut global_date_to: Option<String> = None;
    for (id, url) in urls {
        let inner = import_ical_url_inner(&state.data_root, &url).await;
        if let Some(idx) = feeds.iter().position(|f| f.id == id) {
            feeds[idx].last_synced_at = Some(now_iso());
            match inner {
                Ok(r) => {
                    all_active_ids.extend(r.active_ids.into_iter());
                    if let Some(from) = r.date_from {
                        global_date_from = Some(match global_date_from.take() {
                            Some(prev) => prev.min(from),
                            None => from,
                        });
                    }
                    if let Some(to) = r.date_to {
                        global_date_to = Some(match global_date_to.take() {
                            Some(prev) => prev.max(to),
                            None => to,
                        });
                    }
                    feeds[idx].last_result = Some(r.result);
                }
                Err(_) => {
                    feeds[idx].last_result = None;
                }
            }
        }
    }
    // purge gcal blocks no longer in any feed, but keep those with event_notes/subtasks
    if let (Some(from), Some(to)) = (global_date_from, global_date_to) {
        let _ = purge_stale_sourced_blocks(
            &state.data_root,
            &BlockSource::Gcal,
            &all_active_ids,
            &from,
            &to,
        );
    }
    save_feeds(&state.data_root, &feeds)?;
    Ok(feeds)
}

async fn import_ical_url_inner(
    root: &Path,
    url: &str,
) -> Result<IcalImportInnerResult, String> {
    let normalized = url.trim().trim_start_matches("webcal://").to_string();
    let target = if normalized.starts_with("http://") || normalized.starts_with("https://") {
        normalized
    } else {
        format!("https://{}", normalized)
    };
    let ua = build_user_agent(&load_config(root).app);
    let client = reqwest::Client::builder()
        .user_agent(ua)
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("client build: {}", e))?;
    let res = client
        .get(&target)
        .header("Cache-Control", "no-cache")
        .header("Pragma", "no-cache")
        .send()
        .await
        .map_err(|e| format!("fetch: {}", e))?;
    if !res.status().is_success() {
        return Err(format!("fetch failed: {}", res.status()));
    }
    let body = res.text().await.map_err(|e| format!("read body: {}", e))?;
    let events = parse_ical_events(&body);

    let mut all = load_all(root)?;
    let mut added = 0usize;
    let mut updated = 0usize;
    let mut skipped = 0usize;
    let total = events.len();
    let mut active_ids: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut date_from: Option<String> = None;
    let mut date_to: Option<String> = None;
    for ev in events {
        let Some((date, start, end_date, end)) = ev.to_local_block_time() else {
            skipped += 1;
            continue;
        };
        let title = if ev.summary.trim().is_empty() {
            "(제목 없음)".to_string()
        } else {
            ev.summary.clone()
        };
        let attendees = ev.attendees.clone();
        let organizer = ev.organizer.clone();
        let notes = ev.description.clone();
        let location = ev.location.clone();
        let url = ev.url.clone();
        let recurring = ev.recurring;
        let external = ev.uid.clone();
        active_ids.insert(external.clone());
        date_from = Some(match date_from.take() {
            Some(prev) => prev.min(date.clone()),
            None => date.clone(),
        });
        date_to = Some(match date_to.take() {
            Some(prev) => prev.max(date.clone()),
            None => date.clone(),
        });
        let existing_idx = all.iter().position(|b| {
            matches!(b.source, BlockSource::Gcal)
                && b.external_id.as_deref() == Some(external.as_str())
        });
        if let Some(idx) = existing_idx {
            let prev = &mut all[idx];
            let mut changed = false;
            if prev.date != date {
                prev.date = date.clone();
                changed = true;
            }
            if prev.start != start {
                prev.start = start.clone();
                changed = true;
            }
            if prev.end != end {
                prev.end = end.clone();
                changed = true;
            }
            if prev.end_date != end_date {
                prev.end_date = end_date.clone();
                changed = true;
            }
            if prev.title != title {
                prev.title = title.clone();
                changed = true;
            }
            if prev.attendees != attendees {
                prev.attendees = attendees.clone();
                changed = true;
            }
            if prev.notes != notes {
                prev.notes = notes.clone();
                changed = true;
            }
            if prev.location != location {
                prev.location = location.clone();
                changed = true;
            }
            if prev.url != url {
                prev.url = url.clone();
                changed = true;
            }
            if prev.organizer != organizer {
                prev.organizer = organizer.clone();
                changed = true;
            }
            if prev.recurring != recurring {
                prev.recurring = recurring;
                changed = true;
            }
            if changed {
                updated += 1;
            } else {
                skipped += 1;
            }
        } else {
            let id = format!(
                "gcal_{}",
                external
                    .chars()
                    .filter(|c| c.is_ascii_alphanumeric() || *c == '_' || *c == '-')
                    .take(40)
                    .collect::<String>()
            );
            let block = Block {
                id,
                date,
                start,
                end,
                title,
                kind: "meet".to_string(),
                end_date,
                custom_label: None,
                src: None,
                attendees,
                done: false,
                source: BlockSource::Gcal,
                external_id: Some(external),
                task_id: None,
                notes,
                location,
                calendar_name: None,
                organizer,
                url,
                recurring,
                actual_start: None,
                actual_end: None,
                done_at: None,
                color: None,
                tags: vec![],
                created_at: now_iso(),
            };
            all.push(block);
            added += 1;
        }
    }
    save_all(root, &all)?;
    Ok(IcalImportInnerResult {
        result: IcalImportResult { added, updated, skipped, total },
        active_ids,
        date_from,
        date_to,
    })
}

pub struct SourcedBlockInput {
    pub external_id: String,
    pub date: String,
    pub start: String,
    pub end: String,
    pub end_date: Option<String>,
    pub title: String,
    pub kind: BlockKind,
    pub source: BlockSource,
    pub attendees: Vec<String>,
    pub notes: Option<String>,
    pub location: Option<String>,
    pub calendar_name: Option<String>,
    pub organizer: Option<String>,
    pub url: Option<String>,
    pub recurring: bool,
}

pub fn upsert_sourced_blocks(
    root: &Path,
    records: &[SourcedBlockInput],
    id_prefix: &str,
) -> Result<IcalImportResult, String> {
    let mut all = load_all(root)?;

    // Dedup blocks with identical IDs (legacy truncation collision).
    // Keep the block whose external_id is in the incoming records; otherwise keep last created.
    {
        let incoming_ext_ids: std::collections::HashSet<&str> =
            records.iter().map(|r| r.external_id.as_str()).collect();
        let mut seen_ids: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
        let mut to_remove: Vec<usize> = Vec::new();
        for (i, b) in all.iter().enumerate() {
            if let Some(&prev_i) = seen_ids.get(&b.id) {
                let prev_in_incoming = all[prev_i].external_id.as_deref().map_or(false, |e| incoming_ext_ids.contains(e));
                let curr_in_incoming = b.external_id.as_deref().map_or(false, |e| incoming_ext_ids.contains(e));
                if curr_in_incoming && !prev_in_incoming {
                    to_remove.push(prev_i);
                    seen_ids.insert(b.id.clone(), i);
                } else {
                    to_remove.push(i);
                }
            } else {
                seen_ids.insert(b.id.clone(), i);
            }
        }
        if !to_remove.is_empty() {
            to_remove.sort_unstable();
            for i in to_remove.into_iter().rev() {
                all.remove(i);
            }
        }
    }

    let mut added = 0usize;
    let mut updated = 0usize;
    let mut skipped = 0usize;
    let total = records.len();
    for r in records {
        let existing_idx = all.iter().position(|b| {
            block_source_id(&b.source) == block_source_id(&r.source)
                && b.external_id.as_deref() == Some(r.external_id.as_str())
        });
        if let Some(idx) = existing_idx {
            let prev = &mut all[idx];
            let mut changed = false;
            if prev.date != r.date {
                prev.date = r.date.clone();
                changed = true;
            }
            if prev.start != r.start {
                prev.start = r.start.clone();
                changed = true;
            }
            if prev.end != r.end {
                prev.end = r.end.clone();
                changed = true;
            }
            if prev.end_date != r.end_date {
                prev.end_date = r.end_date.clone();
                changed = true;
            }
            if prev.title != r.title {
                prev.title = r.title.clone();
                changed = true;
            }
            if prev.attendees != r.attendees {
                prev.attendees = r.attendees.clone();
                changed = true;
            }
            if prev.notes != r.notes {
                prev.notes = r.notes.clone();
                changed = true;
            }
            if prev.location != r.location {
                prev.location = r.location.clone();
                changed = true;
            }
            if prev.calendar_name != r.calendar_name {
                prev.calendar_name = r.calendar_name.clone();
                changed = true;
            }
            if prev.url != r.url {
                prev.url = r.url.clone();
                changed = true;
            }
            if prev.organizer != r.organizer {
                prev.organizer = r.organizer.clone();
                changed = true;
            }
            if prev.recurring != r.recurring {
                prev.recurring = r.recurring;
                changed = true;
            }
            if changed {
                updated += 1;
            } else {
                skipped += 1;
            }
        } else {
            let hash = format!("{:x}", Sha256::digest(r.external_id.as_bytes()));
            let id = format!("{}_{}", id_prefix, &hash[..16]);
            let block = Block {
                id,
                date: r.date.clone(),
                start: r.start.clone(),
                end: r.end.clone(),
                title: r.title.clone(),
                kind: r.kind.clone(),
                end_date: r.end_date.clone(),
                custom_label: None,
                src: None,
                attendees: r.attendees.clone(),
                done: false,
                source: r.source,
                external_id: Some(r.external_id.clone()),
                task_id: None,
                notes: r.notes.clone(),
                location: r.location.clone(),
                calendar_name: r.calendar_name.clone(),
                organizer: r.organizer.clone(),
                url: r.url.clone(),
                recurring: r.recurring,
                actual_start: None,
                actual_end: None,
                done_at: None,
                color: None,
                tags: vec![],
                created_at: now_iso(),
            };
            all.push(block);
            added += 1;
        }
    }
    save_all(root, &all)?;
    Ok(IcalImportResult {
        added,
        updated,
        skipped,
        total,
    })
}

fn block_source_id(s: &BlockSource) -> u8 {
    match s {
        BlockSource::Local => 0,
        BlockSource::Gcal => 1,
        BlockSource::Applecal => 2,
    }
}

fn source_label(s: &BlockSource) -> &'static str {
    match s {
        BlockSource::Local => "local",
        BlockSource::Gcal => "gcal",
        BlockSource::Applecal => "applecal",
    }
}

// ── stale-block cleanup ──────────────────────────────────────────────────────

/// Collect event_keys that are referenced by at least one event_note or event_subtask.
fn remap_noted_event_key(root: &Path, old_event_key: &str, old_series_key: &str, new_key: &str) {
    for subdir in ["event_notes", "event_subtasks"] {
        let dir = root.join(subdir);
        let Ok(entries) = std::fs::read_dir(&dir) else { continue };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map_or(true, |e| e != "json") {
                continue;
            }
            let Ok(raw) = fs::read_to_string(&path) else { continue };
            let Ok(mut v) = serde_json::from_str::<serde_json::Value>(&raw) else { continue };
            let mut changed = false;
            if v.get("eventKey").and_then(|v| v.as_str()) == Some(old_event_key) {
                v["eventKey"] = serde_json::Value::String(new_key.to_string());
                changed = true;
            }
            if v.get("seriesKey").and_then(|v| v.as_str()) == Some(old_series_key) {
                v["seriesKey"] = serde_json::Value::String(new_key.to_string());
                changed = true;
            }
            if changed {
                if let Ok(json) = serde_json::to_string_pretty(&v) {
                    let _ = fs::write(&path, json);
                }
            }
        }
    }
}

fn collect_noted_event_keys(root: &Path) -> std::collections::HashSet<String> {
    let mut keys = std::collections::HashSet::new();
    for subdir in ["event_notes", "event_subtasks"] {
        let dir = root.join(subdir);
        let Ok(entries) = std::fs::read_dir(&dir) else { continue };
        for entry in entries.flatten() {
            let Ok(raw) = fs::read_to_string(entry.path()) else { continue };
            let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) else { continue };
            if let Some(k) = v.get("eventKey").and_then(|v| v.as_str()) {
                keys.insert(k.to_string());
            }
        }
    }
    keys
}

/// Remove blocks from `source` whose `external_id` is not in `active_ids`
/// and whose `date` is within [date_from, date_to], unless protected by notes.
pub fn purge_stale_sourced_blocks(
    root: &Path,
    source: &BlockSource,
    active_ids: &std::collections::HashSet<String>,
    date_from: &str,
    date_to: &str,
) -> Result<usize, String> {
    if matches!(source, BlockSource::Local) {
        return Ok(0);
    }
    let mut all = load_all(root)?;
    let protected = collect_noted_event_keys(root);
    let lbl = source_label(source);
    let src_id = block_source_id(source);

    // stale + has notes → convert to local todo instead of deleting
    let mut converted = 0usize;
    for block in all.iter_mut() {
        if block_source_id(&block.source) != src_id { continue; }
        let ext_id = match &block.external_id { Some(id) => id.clone(), None => continue };
        if active_ids.contains(ext_id.as_str()) { continue; }
        if block.date.as_str() < date_from || block.date.as_str() > date_to { continue; }
        let event_key = format!("{}:{}@{}", lbl, ext_id, block.date);
        if protected.contains(&event_key) {
            let series_key = format!("{}:{}", lbl, ext_id);
            let new_key = format!("local:{}", block.id);
            remap_noted_event_key(root, &event_key, &series_key, &new_key);
            block.source = BlockSource::Local;
            block.kind = "todo".to_string();
            block.external_id = None;
            converted += 1;
        }
    }

    // stale + no notes → delete
    let before = all.len();
    all.retain(|block| {
        if block_source_id(&block.source) != src_id { return true; }
        let ext_id = match &block.external_id { Some(id) => id, None => return true };
        if active_ids.contains(ext_id.as_str()) { return true; }
        if block.date.as_str() < date_from || block.date.as_str() > date_to { return true; }
        false
    });
    let removed = before - all.len();

    if removed > 0 || converted > 0 {
        save_all(root, &all)?;
    }
    Ok(removed)
}

/// Manual cleanup: remove all sourced (non-local) blocks older than 60 days.
/// Blocks with event-notes/subtasks are converted to local todo instead of deleted.
#[tauri::command]
pub fn purge_stale_blocks(state: State<'_, AppState>) -> Result<usize, String> {
    use chrono::{Duration, Local};
    let cutoff = (Local::now() - Duration::days(60))
        .format("%Y-%m-%d")
        .to_string();
    let root = &state.data_root;
    let mut all = load_all(root)?;
    let protected = collect_noted_event_keys(root);

    // stale + has notes → convert to local todo
    let mut converted = 0usize;
    for block in all.iter_mut() {
        if matches!(block.source, BlockSource::Local) { continue; }
        let ext_id = match &block.external_id { Some(id) => id.clone(), None => continue };
        if block.date.as_str() >= cutoff.as_str() { continue; }
        let event_key = format!("{}:{}@{}", source_label(&block.source), ext_id, block.date);
        if protected.contains(&event_key) {
            let lbl = source_label(&block.source);
            let series_key = format!("{}:{}", lbl, ext_id);
            let new_key = format!("local:{}", block.id);
            remap_noted_event_key(root, &event_key, &series_key, &new_key);
            block.source = BlockSource::Local;
            block.kind = "todo".to_string();
            block.external_id = None;
            converted += 1;
        }
    }

    // stale + no notes → delete
    let before = all.len();
    all.retain(|block| {
        if matches!(block.source, BlockSource::Local) { return true; }
        if block.external_id.is_none() { return true; }
        if block.date.as_str() >= cutoff.as_str() { return true; }
        false
    });
    let removed = before - all.len();

    if removed > 0 || converted > 0 {
        save_all(root, &all)?;
    }
    Ok(removed)
}

fn parse_ical_dt(raw: &IcalRawDt) -> Option<ParsedIcalDt> {
    use chrono::{Local, NaiveDate, NaiveTime, TimeZone, Utc};
    let v = raw.value.trim();

    if raw.is_date || (v.len() == 8 && !v.contains('T')) {
        let d = NaiveDate::parse_from_str(&v[..8.min(v.len())], "%Y%m%d").ok()?;
        return Some(ParsedIcalDt::AllDay(d));
    }

    let (date_part, time_part) = v.split_once('T')?;
    let utc_marked = time_part.ends_with('Z');
    let time_clean = time_part.trim_end_matches('Z');
    if date_part.len() < 8 || time_clean.len() < 4 {
        return None;
    }

    let d = NaiveDate::parse_from_str(&date_part[..8], "%Y%m%d").ok()?;
    let t = if time_clean.len() >= 6 {
        NaiveTime::parse_from_str(&time_clean[..6], "%H%M%S").ok()?
    } else {
        let h: u32 = time_clean[0..2].parse().ok()?;
        let m: u32 = time_clean[2..4].parse().ok()?;
        NaiveTime::from_hms_opt(h, m, 0)?
    };
    let naive = d.and_time(t);

    let local = if utc_marked {
        Utc.from_utc_datetime(&naive).with_timezone(&Local)
    } else if let Some(tzid) = &raw.tzid {
        if let Ok(tz) = tzid.parse::<chrono_tz::Tz>() {
            match tz.from_local_datetime(&naive).single() {
                Some(dt) => dt.with_timezone(&Local),
                None => Local.from_local_datetime(&naive).single()?,
            }
        } else {
            Local.from_local_datetime(&naive).single()?
        }
    } else {
        Local.from_local_datetime(&naive).single()?
    };
    Some(ParsedIcalDt::Timed(local))
}
