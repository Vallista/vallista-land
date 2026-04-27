use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

const BLOCKS_FILE: &str = "blocks.json";
const ICAL_FEEDS_FILE: &str = "ical_feeds.json";

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

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IcalImportResult {
    pub added: usize,
    pub updated: usize,
    pub skipped: usize,
    pub total: usize,
}

#[tauri::command]
pub async fn import_ical_url(
    url: String,
    state: State<'_, AppState>,
) -> Result<IcalImportResult, String> {
    let root = state.vault_root.clone();
    import_ical_url_inner(&root, &url).await
}

#[derive(Default)]
struct IcalEvent {
    uid: String,
    summary: String,
    dtstart: Option<String>,
    dtend: Option<String>,
    attendees: Vec<String>,
}

impl IcalEvent {
    fn to_local_block_time(&self) -> Option<(String, String, String)> {
        let s = self.dtstart.as_ref()?;
        let e = self.dtend.as_ref()?;
        let (date, start) = parse_ical_dt(s)?;
        let (_, end) = parse_ical_dt(e)?;
        Some((date, start, end))
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
            "DTSTART" => ev.dtstart = Some(value.to_string()),
            "DTEND" => ev.dtend = Some(value.to_string()),
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
    load_feeds(&state.vault_root)
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
    let mut feeds = load_feeds(&state.vault_root)?;
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
    save_feeds(&state.vault_root, &feeds)?;
    Ok(feed)
}

#[tauri::command]
pub fn remove_ical_feed(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut feeds = load_feeds(&state.vault_root)?;
    let before = feeds.len();
    feeds.retain(|f| f.id != id);
    if feeds.len() == before {
        return Err(format!("feed not found: {}", id));
    }
    save_feeds(&state.vault_root, &feeds)
}

#[tauri::command]
pub async fn sync_ical_feeds(
    state: State<'_, AppState>,
) -> Result<Vec<IcalFeed>, String> {
    let mut feeds = load_feeds(&state.vault_root)?;
    let urls: Vec<(String, String)> =
        feeds.iter().map(|f| (f.id.clone(), f.url.clone())).collect();
    for (id, url) in urls {
        let result = import_ical_url_inner(&state.vault_root, &url).await;
        if let Some(idx) = feeds.iter().position(|f| f.id == id) {
            feeds[idx].last_synced_at = Some(now_iso());
            feeds[idx].last_result = result.ok();
        }
    }
    save_feeds(&state.vault_root, &feeds)?;
    Ok(feeds)
}

async fn import_ical_url_inner(
    root: &Path,
    url: &str,
) -> Result<IcalImportResult, String> {
    let normalized = url.trim().trim_start_matches("webcal://").to_string();
    let target = if normalized.starts_with("http://") || normalized.starts_with("https://") {
        normalized
    } else {
        format!("https://{}", normalized)
    };
    let client = reqwest::Client::builder()
        .user_agent("Bento/0.1 ical-importer")
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("client build: {}", e))?;
    let res = client
        .get(&target)
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
    for ev in events {
        let Some((date, start, end)) = ev.to_local_block_time() else {
            skipped += 1;
            continue;
        };
        let title = if ev.summary.trim().is_empty() {
            "(제목 없음)".to_string()
        } else {
            ev.summary.clone()
        };
        let attendees = ev.attendees.clone();
        let external = ev.uid.clone();
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
            if prev.title != title {
                prev.title = title.clone();
                changed = true;
            }
            if prev.attendees != attendees {
                prev.attendees = attendees.clone();
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
                kind: BlockKind::Meet,
                src: None,
                attendees,
                done: false,
                source: BlockSource::Gcal,
                external_id: Some(external),
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

fn parse_ical_dt(s: &str) -> Option<(String, String)> {
    let raw = s.trim().trim_end_matches('Z');
    if raw.contains('T') {
        let mut parts = raw.splitn(2, 'T');
        let d = parts.next()?;
        let t = parts.next()?;
        if d.len() < 8 || t.len() < 4 {
            return None;
        }
        let date = format!("{}-{}-{}", &d[0..4], &d[4..6], &d[6..8]);
        let time = format!("{}:{}", &t[0..2], &t[2..4]);
        Some((date, time))
    } else if raw.len() == 8 {
        let date = format!("{}-{}-{}", &raw[0..4], &raw[4..6], &raw[6..8]);
        Some((date, "00:00".to_string()))
    } else {
        None
    }
}
