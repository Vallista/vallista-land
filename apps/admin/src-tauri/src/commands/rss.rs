use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::sync::OnceLock;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::State;
use tokio::sync::Mutex;

use crate::commands::glean::{self, GleanItem};
use crate::repo::{ensure_inside, load_config, save_config, AppState, RssConfig};

const RSS_FEEDS_FILE: &str = "rss_feeds.json";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RssSyncResult {
    pub added: u32,
    pub updated: u32,
    pub skipped: u32,
    pub total: u32,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RssFeed {
    pub id: String,
    pub label: String,
    pub url: String,
    #[serde(default = "default_source_kind")]
    pub source_kind: String,
    #[serde(default)]
    pub interval_min: u32,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default)]
    pub last_synced_at: Option<String>,
    #[serde(default)]
    pub last_result: Option<RssSyncResult>,
    #[serde(default)]
    pub last_etag: Option<String>,
    #[serde(default)]
    pub last_modified: Option<String>,
}

fn default_source_kind() -> String {
    "rss".to_string()
}

fn default_true() -> bool {
    true
}

pub fn rss_feeds_path(root: &Path) -> std::path::PathBuf {
    root.join(RSS_FEEDS_FILE)
}

pub fn load_feeds(root: &Path) -> Result<Vec<RssFeed>, String> {
    let p = rss_feeds_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<RssFeed>>(&raw).map_err(|e| e.to_string())
}

pub fn save_feeds(root: &Path, feeds: &[RssFeed]) -> Result<(), String> {
    let p = rss_feeds_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(feeds).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_rss_feeds(state: State<'_, AppState>) -> Result<Vec<RssFeed>, String> {
    load_feeds(&state.data_root)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RssFeedInput {
    pub label: String,
    pub url: String,
    #[serde(default)]
    pub source_kind: Option<String>,
    #[serde(default)]
    pub interval_min: Option<u32>,
}

#[tauri::command]
pub fn add_rss_feed(
    input: RssFeedInput,
    state: State<'_, AppState>,
) -> Result<RssFeed, String> {
    let mut feeds = load_feeds(&state.data_root)?;
    let url = input.url.trim().to_string();
    if url.is_empty() {
        return Err("URL이 비어 있습니다".into());
    }
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("URL은 http:// 또는 https:// 로 시작해야 합니다".into());
    }
    if feeds.iter().any(|f| f.url == url) {
        return Err("이미 등록된 URL입니다".into());
    }
    let label = if input.label.trim().is_empty() {
        "RSS".into()
    } else {
        input.label.trim().to_string()
    };
    let source_kind = input
        .source_kind
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(default_source_kind);
    let unix_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let id = format!("rss_{}", unix_ms);
    let feed = RssFeed {
        id,
        label,
        url,
        source_kind,
        interval_min: input.interval_min.unwrap_or(0),
        enabled: true,
        last_synced_at: None,
        last_result: None,
        last_etag: None,
        last_modified: None,
    };
    feeds.push(feed.clone());
    save_feeds(&state.data_root, &feeds)?;
    Ok(feed)
}

#[tauri::command]
pub fn remove_rss_feed(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut feeds = load_feeds(&state.data_root)?;
    let before = feeds.len();
    feeds.retain(|f| f.id != id);
    if feeds.len() == before {
        return Err(format!("feed not found: {}", id));
    }
    save_feeds(&state.data_root, &feeds)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RssFeedPatch {
    #[serde(default)]
    pub label: Option<String>,
    #[serde(default)]
    pub interval_min: Option<u32>,
    #[serde(default)]
    pub enabled: Option<bool>,
    #[serde(default)]
    pub source_kind: Option<String>,
}

#[tauri::command]
pub fn update_rss_feed(
    id: String,
    patch: RssFeedPatch,
    state: State<'_, AppState>,
) -> Result<RssFeed, String> {
    let mut feeds = load_feeds(&state.data_root)?;
    let idx = feeds
        .iter()
        .position(|f| f.id == id)
        .ok_or_else(|| format!("feed not found: {}", id))?;
    if let Some(label) = patch.label {
        let trimmed = label.trim().to_string();
        if !trimmed.is_empty() {
            feeds[idx].label = trimmed;
        }
    }
    if let Some(interval) = patch.interval_min {
        feeds[idx].interval_min = interval;
    }
    if let Some(enabled) = patch.enabled {
        feeds[idx].enabled = enabled;
    }
    if let Some(kind) = patch.source_kind {
        let trimmed = kind.trim().to_string();
        if !trimmed.is_empty() {
            feeds[idx].source_kind = trimmed;
        }
    }
    save_feeds(&state.data_root, &feeds)?;
    Ok(feeds[idx].clone())
}

#[tauri::command]
pub fn get_rss_config(state: State<'_, AppState>) -> Result<RssConfig, String> {
    let cfg = load_config(&state.data_root);
    Ok(cfg.rss)
}

#[tauri::command]
pub fn set_rss_config(
    input: RssConfig,
    state: State<'_, AppState>,
) -> Result<RssConfig, String> {
    let mut cfg = load_config(&state.data_root);
    cfg.rss = input;
    save_config(&state.data_root, &cfg)?;
    Ok(cfg.rss)
}

// ============================================================
// === Sync (PR2) =============================================
// ============================================================

static RSS_SYNC_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub fn sync_lock() -> &'static Mutex<()> {
    RSS_SYNC_LOCK.get_or_init(|| Mutex::new(()))
}

pub fn build_dedup_set(items: &[GleanItem]) -> HashSet<(String, String)> {
    let mut set = HashSet::new();
    for item in items {
        if let (Some(fid), Some(eid)) = (item.feed_id.as_ref(), item.external_id.as_ref()) {
            set.insert((fid.clone(), eid.clone()));
        }
    }
    set
}

struct ParsedEntry {
    id: String,
    title: String,
    summary: String,
    body: String,
    url: String,
}

enum FetchOutcome {
    NotModified,
    Parsed {
        entries: Vec<ParsedEntry>,
        etag: Option<String>,
        last_modified: Option<String>,
    },
}

pub struct SyncOutcome {
    pub summary: RssSyncResult,
    pub new_etag: Option<String>,
    pub new_last_modified: Option<String>,
    pub added_keys: Vec<(String, String)>,
}

async fn fetch_and_parse_feed(feed: &RssFeed, cfg: &RssConfig) -> Result<FetchOutcome, String> {
    let timeout_sec = cfg.timeout_sec.max(1) as u64;
    let client = reqwest::Client::builder()
        .user_agent("Bento/0.1 (+https://vallista.kr)")
        .timeout(Duration::from_secs(timeout_sec))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|e| e.to_string())?;
    let mut req = client.get(&feed.url);
    if cfg.respect_etag {
        if let Some(etag) = &feed.last_etag {
            req = req.header("If-None-Match", etag.as_str());
        }
        if let Some(lm) = &feed.last_modified {
            req = req.header("If-Modified-Since", lm.as_str());
        }
    }
    let resp = req.send().await.map_err(|e| e.to_string())?;
    if resp.status().as_u16() == 304 {
        return Ok(FetchOutcome::NotModified);
    }
    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }
    let etag = resp
        .headers()
        .get("etag")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let last_modified = resp
        .headers()
        .get("last-modified")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    let parsed = feed_rs::parser::parse(&bytes[..]).map_err(|e| format!("parse: {}", e))?;
    let mut entries = Vec::new();
    for e in parsed.entries {
        let title = e.title.map(|t| t.content).unwrap_or_default();
        let url = e
            .links
            .first()
            .map(|l| l.href.clone())
            .unwrap_or_default();
        let summary = e.summary.map(|s| s.content).unwrap_or_default();
        let body_text = e
            .content
            .as_ref()
            .and_then(|c| c.body.clone())
            .unwrap_or_else(|| summary.clone());
        let id = if e.id.is_empty() {
            if !url.is_empty() {
                url.clone()
            } else {
                format!("{}#{}", feed.id, title)
            }
        } else {
            e.id.clone()
        };
        entries.push(ParsedEntry {
            id,
            title,
            summary,
            body: body_text,
            url,
        });
    }
    Ok(FetchOutcome::Parsed {
        entries,
        etag,
        last_modified,
    })
}

fn entry_to_glean_item(feed: &RssFeed, entry: &ParsedEntry, seq: u64) -> GleanItem {
    let unix_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let item_id = format!("rss_{}_{}_{}", feed.id, unix_ms, seq);
    GleanItem {
        id: item_id,
        url: entry.url.clone(),
        source: "rss".into(),
        title: entry.title.clone(),
        excerpt: truncate(&entry.summary, 280),
        body: entry.body.clone(),
        fetched_at: now_iso(),
        status: "unread".into(),
        promoted_doc_id: None,
        highlights: Vec::new(),
        digest: None,
        feed_id: Some(feed.id.clone()),
        external_id: Some(entry.id.clone()),
    }
}

fn truncate(s: &str, max: usize) -> String {
    let s = s.trim();
    if s.chars().count() <= max {
        return s.to_string();
    }
    let mut out: String = s.chars().take(max).collect();
    out.push('…');
    out
}

pub async fn sync_one(
    data_root: &Path,
    feed: &RssFeed,
    cfg: &RssConfig,
    dedup: &HashSet<(String, String)>,
) -> SyncOutcome {
    match fetch_and_parse_feed(feed, cfg).await {
        Ok(FetchOutcome::NotModified) => SyncOutcome {
            summary: RssSyncResult {
                added: 0,
                updated: 0,
                skipped: 0,
                total: 0,
                error: None,
            },
            new_etag: feed.last_etag.clone(),
            new_last_modified: feed.last_modified.clone(),
            added_keys: Vec::new(),
        },
        Ok(FetchOutcome::Parsed {
            entries,
            etag,
            last_modified,
        }) => {
            let total = entries.len() as u32;
            let mut added = 0u32;
            let mut skipped = 0u32;
            let mut added_keys: Vec<(String, String)> = Vec::new();
            for (i, entry) in entries.iter().enumerate() {
                let key = (feed.id.clone(), entry.id.clone());
                if dedup.contains(&key) || added_keys.iter().any(|k| k == &key) {
                    skipped += 1;
                    continue;
                }
                let item = entry_to_glean_item(feed, entry, i as u64);
                if let Err(e) = glean::write_item(data_root, &item) {
                    eprintln!("rss: failed to save glean item {}: {}", item.id, e);
                    continue;
                }
                added += 1;
                added_keys.push(key);
            }
            SyncOutcome {
                summary: RssSyncResult {
                    added,
                    updated: 0,
                    skipped,
                    total,
                    error: None,
                },
                new_etag: etag,
                new_last_modified: last_modified,
                added_keys,
            }
        }
        Err(err) => SyncOutcome {
            summary: RssSyncResult {
                added: 0,
                updated: 0,
                skipped: 0,
                total: 0,
                error: Some(err),
            },
            new_etag: feed.last_etag.clone(),
            new_last_modified: feed.last_modified.clone(),
            added_keys: Vec::new(),
        },
    }
}

pub fn persist_feed_result(
    data_root: &Path,
    feed_id: &str,
    outcome: &SyncOutcome,
) -> Result<(), String> {
    let mut feeds = load_feeds(data_root)?;
    if let Some(idx) = feeds.iter().position(|f| f.id == feed_id) {
        feeds[idx].last_synced_at = Some(now_iso());
        feeds[idx].last_result = Some(outcome.summary.clone());
        feeds[idx].last_etag = outcome.new_etag.clone();
        feeds[idx].last_modified = outcome.new_last_modified.clone();
        save_feeds(data_root, &feeds)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn sync_rss_feed(
    id: String,
    state: State<'_, AppState>,
) -> Result<RssSyncResult, String> {
    let _guard = sync_lock().lock().await;
    let cfg = load_config(&state.data_root).rss;
    let feeds = load_feeds(&state.data_root)?;
    let feed = feeds
        .into_iter()
        .find(|f| f.id == id)
        .ok_or_else(|| format!("feed not found: {}", id))?;
    let existing = glean::list_items(&state.data_root)?;
    let dedup = build_dedup_set(&existing);
    let outcome = sync_one(&state.data_root, &feed, &cfg, &dedup).await;
    persist_feed_result(&state.data_root, &feed.id, &outcome)?;
    Ok(outcome.summary)
}

#[tauri::command]
pub async fn sync_rss_feeds(
    state: State<'_, AppState>,
) -> Result<Vec<(String, RssSyncResult)>, String> {
    let _guard = sync_lock().lock().await;
    let cfg = load_config(&state.data_root).rss;
    let feeds = load_feeds(&state.data_root)?;
    let existing = glean::list_items(&state.data_root)?;
    let mut dedup = build_dedup_set(&existing);
    let mut summaries: Vec<(String, RssSyncResult)> = Vec::new();
    for feed in feeds.iter().filter(|f| f.enabled) {
        let outcome = sync_one(&state.data_root, feed, &cfg, &dedup).await;
        for k in &outcome.added_keys {
            dedup.insert(k.clone());
        }
        persist_feed_result(&state.data_root, &feed.id, &outcome)?;
        summaries.push((feed.id.clone(), outcome.summary));
    }
    Ok(summaries)
}

// ============================================================
// === Background poller (PR3) ================================
// ============================================================

async fn run_due_sync(
    data_root: std::path::PathBuf,
    cfg: RssConfig,
) -> Vec<(String, RssSyncResult)> {
    let _guard = sync_lock().lock().await;
    let feeds = match load_feeds(&data_root) {
        Ok(v) => v,
        Err(_) => return Vec::new(),
    };
    let now_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let due: Vec<RssFeed> = feeds
        .into_iter()
        .filter(|f| {
            if !f.enabled {
                return false;
            }
            let interval_min = if f.interval_min == 0 {
                cfg.default_interval_min as u64
            } else {
                f.interval_min as u64
            };
            match f.last_synced_at.as_deref().and_then(parse_iso_seconds) {
                Some(last) => now_secs >= last.saturating_add(interval_min.saturating_mul(60)),
                None => true,
            }
        })
        .collect();
    if due.is_empty() {
        return Vec::new();
    }
    let max = cfg.max_concurrent.max(1) as usize;
    let semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(max));
    let existing = glean::list_items(&data_root).unwrap_or_default();
    let dedup = std::sync::Arc::new(Mutex::new(build_dedup_set(&existing)));
    let mut handles = Vec::new();
    for feed in due {
        let permit = semaphore.clone();
        let dedup = dedup.clone();
        let data_root = data_root.clone();
        let cfg = cfg.clone();
        let handle = tauri::async_runtime::spawn(async move {
            let _p = match permit.acquire().await {
                Ok(p) => p,
                Err(_) => return None,
            };
            let snap = dedup.lock().await.clone();
            let outcome = sync_one(&data_root, &feed, &cfg, &snap).await;
            {
                let mut d = dedup.lock().await;
                for k in &outcome.added_keys {
                    d.insert(k.clone());
                }
            }
            let _ = persist_feed_result(&data_root, &feed.id, &outcome);
            Some((feed.id.clone(), outcome.summary))
        });
        handles.push(handle);
    }
    let mut results = Vec::new();
    for h in handles {
        if let Ok(Some(r)) = h.await {
            results.push(r);
        }
    }
    results
}

pub async fn start_poller(app: tauri::AppHandle) {
    use tauri::{Emitter, Manager};

    // first-run jitter (0~30s) to stagger startup
    let now_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let initial_delay = now_secs % 30;
    tokio::time::sleep(Duration::from_secs(initial_delay)).await;

    let mut tick = tokio::time::interval(Duration::from_secs(60));
    tick.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);

    loop {
        tick.tick().await;

        let (data_root, cfg) = {
            let state = match app.try_state::<AppState>() {
                Some(s) => s,
                None => continue,
            };
            let cfg = load_config(&state.data_root).rss;
            (state.data_root.clone(), cfg)
        };
        if !cfg.auto_sync_enabled {
            continue;
        }

        let summaries = run_due_sync(data_root, cfg).await;
        if !summaries.is_empty() {
            let _ = app.emit("bento:rss-synced", &summaries);
        }
    }
}

fn parse_iso_seconds(s: &str) -> Option<u64> {
    chrono::DateTime::parse_from_rfc3339(s)
        .ok()
        .and_then(|dt| {
            let ts = dt.timestamp();
            if ts < 0 {
                None
            } else {
                Some(ts as u64)
            }
        })
}

// === time helpers (복제 from glean.rs; 추후 commands/util.rs로 통합) ===

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
