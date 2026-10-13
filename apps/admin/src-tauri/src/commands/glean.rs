use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard, OnceLock};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{build_user_agent, ensure_inside, load_config, AppState};

const GLEAN_DIR: &str = "glean";
const IMG_MARKER: &str = "[img]";
const PREVIEW_CHARS: usize = 600;
const INDEX_FILE: &str = "glean_index.json";
const INDEX_VERSION: u32 = 1;
/// 쓰기 직후마다 7천 건짜리 인덱스를 다시 쓰지 않도록 flush 사이에 두는 최소 간격.
const INDEX_FLUSH_INTERVAL: Duration = Duration::from_secs(10);

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GleanHighlight {
    pub range: [u64; 2],
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GleanItem {
    pub id: String,
    pub url: String,
    pub source: String,
    pub title: String,
    pub excerpt: String,
    pub body: String,
    pub fetched_at: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub promoted_doc_id: Option<String>,
    pub highlights: Vec<GleanHighlight>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub digest: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub feed_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub external_id: Option<String>,
    /// 원본 콘텐츠의 발행일 (RSS pubDate, Atom published 등). 없으면 fetched_at 기준으로 정렬.
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub published_at: Option<String>,
}

/// 목록·검색·카운트용 요약. 본문(`body`)과 하이라이트를 뺀 필드만 담고 메모리 인덱스에 상주한다.
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GleanSummary {
    pub id: String,
    pub url: String,
    pub source: String,
    pub title: String,
    pub excerpt: String,
    pub fetched_at: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub promoted_doc_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub digest: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub feed_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub external_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub published_at: Option<String>,
    /// Threads 본문에서 이미지 마커를 뺀 앞부분 (목록 미리보기용)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview: Option<String>,
    pub has_image: bool,
}

/// 파일이 바뀌었는지 판별하는 스탬프. 길이와 수정 시각(ns)이 모두 같으면 재파싱 없이 요약을 재사용한다.
#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
struct FileStamp {
    len: u64,
    mtime: u64,
}

fn stamp_of(meta: &fs::Metadata) -> FileStamp {
    let mtime = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_nanos().min(u64::MAX as u128) as u64)
        .unwrap_or(0);
    FileStamp {
        len: meta.len(),
        mtime,
    }
}

/// 인덱스 한 항목. `file`은 glean/ 안의 파일 stem(= 보통 id)이다.
#[derive(Serialize, Deserialize, Clone)]
struct IndexEntry {
    file: String,
    stamp: FileStamp,
    summary: GleanSummary,
}

#[derive(Deserialize)]
struct PersistedIndex {
    version: u32,
    entries: Vec<IndexEntry>,
}

#[derive(Serialize)]
struct PersistedIndexRef<'a> {
    version: u32,
    entries: &'a [IndexEntry],
}

struct GleanIndex {
    root: PathBuf,
    entries: Vec<IndexEntry>,
    dirty: bool,
    last_flush: Instant,
}

#[derive(Default, Debug, PartialEq, Eq)]
struct LoadStats {
    reused: usize,
    parsed: usize,
    dropped: usize,
}

/// 프로세스 전역 요약 인덱스. 첫 조회 때 `data_root/glean_index.json`을 읽고 glean/ 파일 스탬프와 대조해
/// 바뀐 파일만 다시 파싱한다. 이후 쓰기·삭제는 `write_item`·`delete_item`이 반영하고, 변경분은 지연 flush된다.
static GLEAN_INDEX: OnceLock<Mutex<Option<GleanIndex>>> = OnceLock::new();

fn index_guard() -> MutexGuard<'static, Option<GleanIndex>> {
    let cell = GLEAN_INDEX.get_or_init(|| Mutex::new(None));
    match cell.lock() {
        Ok(guard) => guard,
        Err(poisoned) => poisoned.into_inner(),
    }
}

fn glean_dir(root: &Path) -> std::path::PathBuf {
    root.join(GLEAN_DIR)
}

fn index_path(root: &Path) -> PathBuf {
    root.join(INDEX_FILE)
}

fn item_path(root: &Path, id: &str) -> Result<std::path::PathBuf, String> {
    if id.is_empty() || id.contains('/') || id.contains('\\') || id.contains("..") {
        return Err(format!("invalid id: {}", id));
    }
    Ok(glean_dir(root).join(format!("{}.json", id)))
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

fn is_img_line(line: &str) -> bool {
    line.starts_with(IMG_MARKER)
}

fn threads_preview(body: &str) -> String {
    let text: Vec<&str> = body.lines().filter(|l| !is_img_line(l)).collect();
    text.join("\n").trim().chars().take(PREVIEW_CHARS).collect()
}

fn first_image(body: &str) -> Option<String> {
    body.lines()
        .find(|l| is_img_line(l))
        .map(|l| l[IMG_MARKER.len()..].trim().to_string())
        .filter(|s| !s.is_empty())
}

pub fn summarize(item: &GleanItem) -> GleanSummary {
    let preview = if item.source == "threads" {
        Some(threads_preview(&item.body)).filter(|p| !p.is_empty())
    } else {
        None
    };
    GleanSummary {
        id: item.id.clone(),
        url: item.url.clone(),
        source: item.source.clone(),
        title: item.title.clone(),
        excerpt: item.excerpt.clone(),
        fetched_at: item.fetched_at.clone(),
        status: item.status.clone(),
        promoted_doc_id: item.promoted_doc_id.clone(),
        digest: item.digest.clone(),
        feed_id: item.feed_id.clone(),
        external_id: item.external_id.clone(),
        published_at: item.published_at.clone(),
        preview,
        has_image: item.body.lines().any(is_img_line),
    }
}

fn sort_key(s: &GleanSummary) -> &str {
    s.published_at.as_deref().unwrap_or(s.fetched_at.as_str())
}

fn sort_entries(entries: &mut [IndexEntry]) {
    entries.sort_by(|a, b| sort_key(&b.summary).cmp(sort_key(&a.summary)));
}

fn parse_item(path: &Path) -> Option<GleanItem> {
    let raw = fs::read_to_string(path).ok()?;
    serde_json::from_str::<GleanItem>(&raw).ok()
}

/// 저장된 인덱스를 파일 stem 기준 맵으로 읽는다. 없거나 깨졌거나 버전이 다르면 None(전체 재파싱).
fn read_persisted(root: &Path) -> Option<HashMap<String, IndexEntry>> {
    let raw = fs::read_to_string(index_path(root)).ok()?;
    let persisted = serde_json::from_str::<PersistedIndex>(&raw).ok()?;
    if persisted.version != INDEX_VERSION {
        return None;
    }
    Some(
        persisted
            .entries
            .into_iter()
            .map(|e| (e.file.clone(), e))
            .collect(),
    )
}

/// glean/ 디렉터리를 stat만으로 훑어 저장된 인덱스와 대조한다. 스탬프가 같은 파일은 요약을 재사용하고,
/// 새 파일·바뀐 파일만 파싱하며, 사라진 파일은 버린다. 달라진 게 있으면 인덱스 파일을 바로 다시 쓴다.
fn load_index(root: &Path) -> Result<(GleanIndex, LoadStats), String> {
    let persisted = read_persisted(root);
    let had_persisted = persisted.is_some();
    let mut persisted = persisted.unwrap_or_default();
    let mut stats = LoadStats::default();
    let mut entries: Vec<IndexEntry> = Vec::new();
    let dir = glean_dir(root);
    if dir.is_dir() {
        for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => continue,
            };
            let path = entry.path();
            if path.extension().map_or(true, |e| e != "json") {
                continue;
            }
            let stem = match path.file_stem().and_then(|s| s.to_str()) {
                Some(s) => s.to_string(),
                None => continue,
            };
            let meta = match entry.metadata() {
                Ok(m) if m.is_file() => m,
                _ => continue,
            };
            let stamp = stamp_of(&meta);
            let was_indexed = match persisted.remove(&stem) {
                Some(prev) if prev.stamp == stamp => {
                    entries.push(prev);
                    stats.reused += 1;
                    continue;
                }
                Some(_) => true,
                None => false,
            };
            match parse_item(&path) {
                Some(item) => {
                    entries.push(IndexEntry {
                        file: stem,
                        stamp,
                        summary: summarize(&item),
                    });
                    stats.parsed += 1;
                }
                None if was_indexed => stats.dropped += 1,
                None => {}
            }
        }
    }
    stats.dropped += persisted.len();
    sort_entries(&mut entries);
    let changed = !had_persisted || stats.parsed > 0 || stats.dropped > 0;
    let mut ix = GleanIndex {
        root: root.to_path_buf(),
        entries,
        dirty: changed,
        last_flush: Instant::now(),
    };
    if changed {
        if let Err(err) = flush_now(&mut ix) {
            eprintln!("glean: failed to persist index: {}", err);
        }
    }
    Ok((ix, stats))
}

/// 임시 파일에 쓴 뒤 rename해서 읽는 쪽이 반쯤 쓰인 인덱스를 보지 않게 한다.
fn flush_now(ix: &mut GleanIndex) -> Result<(), String> {
    let json = serde_json::to_vec(&PersistedIndexRef {
        version: INDEX_VERSION,
        entries: &ix.entries,
    })
    .map_err(|e| e.to_string())?;
    ix.last_flush = Instant::now();
    let path = index_path(&ix.root);
    let tmp = ix.root.join(format!("{}.tmp", INDEX_FILE));
    fs::write(&tmp, json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
    ix.dirty = false;
    Ok(())
}

fn maybe_flush(ix: &mut GleanIndex, force: bool) {
    if ix.dirty && (force || ix.last_flush.elapsed() >= INDEX_FLUSH_INTERVAL) {
        if let Err(err) = flush_now(ix) {
            eprintln!("glean: failed to persist index: {}", err);
        }
    }
}

/// 인덱스를 보장한 뒤 클로저에 넘긴다. 첫 호출(또는 root가 바뀐 뒤)에만 디렉터리 stat 대조가 일어난다.
fn with_index<T>(root: &Path, f: impl FnOnce(&[IndexEntry]) -> T) -> Result<T, String> {
    let mut guard = index_guard();
    let stale = guard.as_ref().map_or(true, |ix| ix.root != root);
    if stale {
        if let Some(old) = guard.as_mut() {
            maybe_flush(old, true);
        }
        let (ix, _) = load_index(root)?;
        *guard = Some(ix);
    }
    match guard.as_mut() {
        Some(ix) => {
            maybe_flush(ix, false);
            Ok(f(&ix.entries))
        }
        None => Err("glean index unavailable".to_string()),
    }
}

fn index_upsert(root: &Path, item: &GleanItem, stamp: FileStamp) {
    let mut guard = index_guard();
    if let Some(ix) = guard.as_mut().filter(|ix| ix.root == root) {
        let entry = IndexEntry {
            file: item.id.clone(),
            stamp,
            summary: summarize(item),
        };
        match ix.entries.iter().position(|e| e.summary.id == item.id) {
            Some(pos) => ix.entries[pos] = entry,
            None => ix.entries.push(entry),
        }
        sort_entries(&mut ix.entries);
        ix.dirty = true;
        maybe_flush(ix, false);
    }
}

fn index_remove(root: &Path, id: &str) {
    let mut guard = index_guard();
    if let Some(ix) = guard.as_mut().filter(|ix| ix.root == root) {
        let before = ix.entries.len();
        ix.entries.retain(|e| e.summary.id != id);
        if ix.entries.len() != before {
            ix.dirty = true;
            maybe_flush(ix, false);
        }
    }
}

/// 백그라운드 동기화의 중복 판별용. 요약 전체를 복사해 돌려준다.
pub fn list_summaries(root: &Path) -> Result<Vec<GleanSummary>, String> {
    with_index(root, |entries| {
        entries.iter().map(|e| e.summary.clone()).collect()
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GleanPage {
    pub items: Vec<GleanSummary>,
    pub total: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GleanCounts {
    pub total: usize,
    pub by_source: HashMap<String, usize>,
    pub by_status: HashMap<String, usize>,
    pub today_rss_count: usize,
    pub today_rss_titles: Vec<String>,
    pub by_feed_id: HashMap<String, usize>,
}

fn list_page(
    root: &Path,
    status: Option<&str>,
    source: Option<&str>,
    exclude_status: Option<&str>,
    offset: usize,
    limit: usize,
) -> Result<GleanPage, String> {
    with_index(root, |all| {
        let mut total = 0usize;
        let mut items: Vec<GleanSummary> = Vec::new();
        let matched = all.iter().map(|e| &e.summary).filter(|it| {
            status.map_or(true, |s| it.status == s)
                && source.map_or(true, |s| it.source == s)
                && exclude_status.map_or(true, |s| it.status != s)
        });
        for it in matched {
            if total >= offset && items.len() < limit {
                items.push(it.clone());
            }
            total += 1;
        }
        GleanPage { items, total }
    })
}

fn counts(root: &Path) -> Result<GleanCounts, String> {
    let today_prefix = now_iso();
    let today = today_prefix[..10].to_string();
    with_index(root, |all| {
        let mut by_source: HashMap<String, usize> = HashMap::new();
        let mut by_status: HashMap<String, usize> = HashMap::new();
        let mut by_feed_id: HashMap<String, usize> = HashMap::new();
        let mut today_rss_count = 0usize;
        let mut today_rss_titles: Vec<String> = Vec::new();
        for it in all.iter().map(|e| &e.summary) {
            *by_source.entry(it.source.clone()).or_insert(0) += 1;
            *by_status.entry(it.status.clone()).or_insert(0) += 1;
            if let Some(fid) = &it.feed_id {
                *by_feed_id.entry(fid.clone()).or_insert(0) += 1;
            }
            if it.source == "rss" && it.fetched_at.starts_with(&today) {
                today_rss_count += 1;
                today_rss_titles.push(it.title.clone());
            }
        }
        GleanCounts {
            total: all.len(),
            by_source,
            by_status,
            today_rss_count,
            today_rss_titles,
            by_feed_id,
        }
    })
}

fn search(root: &Path, query: &str, limit: usize) -> Result<Vec<GleanSummary>, String> {
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return Ok(Vec::new());
    }
    with_index(root, |all| {
        all.iter()
            .map(|e| &e.summary)
            .filter(|it| {
                it.title.to_lowercase().contains(&q)
                    || it.url.to_lowercase().contains(&q)
                    || it.excerpt.to_lowercase().contains(&q)
            })
            .take(limit)
            .cloned()
            .collect()
    })
}

#[tauri::command(async)]
pub fn list_glean(
    status: Option<String>,
    source: Option<String>,
    exclude_status: Option<String>,
    offset: usize,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<GleanPage, String> {
    list_page(
        &state.data_root,
        status.as_deref(),
        source.as_deref(),
        exclude_status.as_deref(),
        offset,
        limit,
    )
}

#[tauri::command(async)]
pub fn search_glean(
    query: String,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<Vec<GleanSummary>, String> {
    search(&state.data_root, &query, limit)
}

#[tauri::command(async)]
pub fn glean_counts(state: State<'_, AppState>) -> Result<GleanCounts, String> {
    counts(&state.data_root)
}

fn read_item(root: &Path, id: &str) -> Result<GleanItem, String> {
    let p = item_path(root, id)?;
    let safe = ensure_inside(root, &p)?;
    let raw = fs::read_to_string(&safe).map_err(|e| e.to_string())?;
    serde_json::from_str::<GleanItem>(&raw).map_err(|e| e.to_string())
}

#[tauri::command(async)]
pub fn read_glean(id: String, state: State<'_, AppState>) -> Result<GleanItem, String> {
    read_item(&state.data_root, &id)
}

/// 목록 썸네일용. 본문의 첫 이미지 마커(data URI)만 돌려준다.
#[tauri::command(async)]
pub fn read_glean_thumb(id: String, state: State<'_, AppState>) -> Result<Option<String>, String> {
    let item = read_item(&state.data_root, &id)?;
    Ok(first_image(&item.body))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GleanInput {
    pub id: String,
    pub url: String,
    pub source: String,
    pub title: String,
    pub excerpt: String,
    pub body: String,
    #[serde(default)]
    pub feed_id: Option<String>,
    #[serde(default)]
    pub external_id: Option<String>,
}

#[tauri::command(async)]
pub fn add_glean(input: GleanInput, state: State<'_, AppState>) -> Result<GleanItem, String> {
    let dir = glean_dir(&state.data_root);
    if !dir.is_dir() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    let item = GleanItem {
        id: input.id,
        url: input.url,
        source: input.source,
        title: input.title,
        excerpt: input.excerpt,
        body: input.body,
        fetched_at: now_iso(),
        status: "unread".into(),
        promoted_doc_id: None,
        highlights: Vec::new(),
        digest: None,
        feed_id: input.feed_id,
        external_id: input.external_id,
        published_at: None,
    };
    write_item(&state.data_root, &item)?;
    Ok(item)
}

#[tauri::command(async)]
pub fn update_glean_status(
    id: String,
    status: String,
    promoted_doc_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<GleanItem, String> {
    let mut item = read_item(&state.data_root, &id)?;
    item.status = status;
    if let Some(pdid) = promoted_doc_id {
        item.promoted_doc_id = Some(pdid);
    }
    write_item(&state.data_root, &item)?;
    Ok(item)
}

#[tauri::command(async)]
pub fn update_glean_highlights(
    id: String,
    highlights: Vec<GleanHighlight>,
    state: State<'_, AppState>,
) -> Result<GleanItem, String> {
    let mut item = read_item(&state.data_root, &id)?;
    item.highlights = highlights;
    write_item(&state.data_root, &item)?;
    Ok(item)
}

#[tauri::command(async)]
pub fn update_glean_digest(
    id: String,
    digest: Option<String>,
    state: State<'_, AppState>,
) -> Result<GleanItem, String> {
    let mut item = read_item(&state.data_root, &id)?;
    item.digest = digest.filter(|s| !s.trim().is_empty());
    write_item(&state.data_root, &item)?;
    Ok(item)
}

#[tauri::command(async)]
pub fn delete_glean(id: String, state: State<'_, AppState>) -> Result<(), String> {
    delete_item(&state.data_root, &id)
}

fn delete_item(root: &Path, id: &str) -> Result<(), String> {
    let p = item_path(root, id)?;
    let safe = ensure_inside(root, &p)?;
    if safe.is_file() {
        fs::remove_file(&safe).map_err(|e| e.to_string())?;
    }
    index_remove(root, id);
    Ok(())
}

pub fn write_item(root: &Path, item: &GleanItem) -> Result<(), String> {
    let p = item_path(root, &item.id)?;
    let safe = ensure_inside(root, &p)?;
    if let Some(parent) = safe.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(item).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())?;
    let stamp = fs::metadata(&safe)
        .map(|m| stamp_of(&m))
        .unwrap_or(FileStamp { len: 0, mtime: 0 });
    index_upsert(root, item, stamp);
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchedContent {
    pub url: String,
    pub title: String,
    pub excerpt: String,
    pub body: String,
    pub source_guess: String,
}

#[tauri::command]
pub async fn fetch_url(url: String, state: State<'_, AppState>) -> Result<FetchedContent, String> {
    let trimmed = url.trim().to_string();
    if !(trimmed.starts_with("http://") || trimmed.starts_with("https://")) {
        return Err("URL은 http:// 또는 https:// 로 시작해야 합니다".into());
    }
    let ua = build_user_agent(&load_config(&state.data_root).app);
    let client = reqwest::Client::builder()
        .user_agent(ua)
        .timeout(Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client.get(&trimmed).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }
    let final_url = resp.url().to_string();
    let html = resp.text().await.map_err(|e| e.to_string())?;
    let doc = Html::parse_document(&html);
    let title = extract_title(&doc);
    let excerpt = extract_description(&doc);
    let body = extract_body(&doc);
    let source_guess = guess_source(&final_url);
    Ok(FetchedContent {
        url: final_url,
        title,
        excerpt,
        body,
        source_guess,
    })
}

fn extract_title(doc: &Html) -> String {
    let og = sel("meta[property=\"og:title\"]");
    if let Some(s) = first_attr(doc, &og, "content") {
        if !s.is_empty() {
            return s;
        }
    }
    let twitter = sel("meta[name=\"twitter:title\"]");
    if let Some(s) = first_attr(doc, &twitter, "content") {
        if !s.is_empty() {
            return s;
        }
    }
    let title_sel = sel("title");
    if let Some(node) = doc.select(&title_sel).next() {
        let t = node.text().collect::<String>().trim().to_string();
        if !t.is_empty() {
            return t;
        }
    }
    let h1 = sel("h1");
    if let Some(node) = doc.select(&h1).next() {
        return node.text().collect::<String>().trim().to_string();
    }
    String::new()
}

fn extract_description(doc: &Html) -> String {
    for selector in [
        "meta[property=\"og:description\"]",
        "meta[name=\"twitter:description\"]",
        "meta[name=\"description\"]",
    ] {
        let s = sel(selector);
        if let Some(text) = first_attr(doc, &s, "content") {
            let trimmed = text.trim().to_string();
            if !trimmed.is_empty() {
                return trimmed;
            }
        }
    }
    String::new()
}

fn extract_body(doc: &Html) -> String {
    for container in ["article", "main", "[role=\"main\"]", "body"] {
        let s = sel(container);
        if let Some(node) = doc.select(&s).next() {
            let text = collect_visible_text(node);
            let trimmed = text.trim();
            if trimmed.len() > 200 {
                return trimmed.to_string();
            }
        }
    }
    let body = sel("body");
    if let Some(node) = doc.select(&body).next() {
        return collect_visible_text(node).trim().to_string();
    }
    String::new()
}

fn collect_visible_text(root: scraper::ElementRef<'_>) -> String {
    let block_tags = [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "li",
        "blockquote",
        "pre",
    ];
    let skip_tags = [
        "script", "style", "nav", "aside", "header", "footer", "noscript", "form", "iframe",
        "svg", "button",
    ];
    let mut out = String::new();
    walk(&mut out, *root, &block_tags, &skip_tags);
    return out;

    fn walk(
        out: &mut String,
        node: ego_tree::NodeRef<'_, scraper::Node>,
        block: &[&str],
        skip: &[&str],
    ) {
        for child in node.children() {
            match child.value() {
                scraper::Node::Text(t) => {
                    let s = t.trim();
                    if !s.is_empty() {
                        out.push_str(&t);
                    }
                }
                scraper::Node::Element(el) => {
                    let name = el.name();
                    if skip.iter().any(|s| s.eq_ignore_ascii_case(name)) {
                        continue;
                    }
                    walk(out, child, block, skip);
                    if block.iter().any(|s| s.eq_ignore_ascii_case(name)) {
                        if !out.ends_with("\n\n") {
                            out.push_str("\n\n");
                        }
                    }
                }
                _ => {}
            }
        }
    }
}

fn guess_source(url: &str) -> String {
    let host = reqwest::Url::parse(url)
        .ok()
        .and_then(|u| u.host_str().map(|s| s.to_string()))
        .unwrap_or_default()
        .to_lowercase();
    if host.contains("youtube.com") || host == "youtu.be" {
        "youtube".into()
    } else {
        "web".into()
    }
}

fn sel(s: &str) -> Selector {
    Selector::parse(s).expect("static selector")
}

fn first_attr(doc: &Html, selector: &Selector, attr: &str) -> Option<String> {
    doc.select(selector).next().and_then(|n| n.value().attr(attr).map(|v| v.to_string()))
}

#[cfg(test)]
mod tests {
    use super::{
        counts, delete_item, first_image, index_guard, index_path, item_path, list_page,
        load_index, search, write_item, GleanItem, LoadStats, INDEX_FILE,
    };
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::sync::{Mutex, MutexGuard};

    /// 인덱스는 프로세스 전역이라 테스트끼리 root를 바꿔치기하면 스탬프 재사용 횟수가 흔들린다. glean 테스트는 직렬로 돈다.
    static SERIAL: Mutex<()> = Mutex::new(());

    fn serial() -> MutexGuard<'static, ()> {
        SERIAL.lock().unwrap_or_else(|e| e.into_inner())
    }

    /// 앱 재시작처럼 메모리 인덱스를 버리고 디스크에서 다시 올린다.
    fn stats_after_restart(root: &Path) -> LoadStats {
        let mut guard = index_guard();
        if let Some(ix) = guard.as_mut() {
            super::maybe_flush(ix, true);
        }
        *guard = None;
        let (ix, stats) = load_index(root).expect("load index");
        *guard = Some(ix);
        stats
    }

    fn temp_root(tag: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("bento_glean_{}_{}", tag, uuid::Uuid::new_v4()));
        fs::create_dir_all(&dir).expect("temp root");
        dir
    }

    fn item(id: &str, source: &str, title: &str, body: &str, fetched_at: &str) -> GleanItem {
        GleanItem {
            id: id.to_string(),
            url: format!("https://example.com/{}", id),
            source: source.to_string(),
            title: title.to_string(),
            excerpt: format!("{} excerpt", title),
            body: body.to_string(),
            fetched_at: fetched_at.to_string(),
            status: "unread".to_string(),
            promoted_doc_id: None,
            highlights: Vec::new(),
            digest: None,
            feed_id: None,
            external_id: None,
            published_at: None,
        }
    }

    fn ids(items: &[super::GleanSummary]) -> Vec<&str> {
        items.iter().map(|s| s.id.as_str()).collect()
    }

    #[test]
    fn index_follows_writes_updates_and_deletes() {
        let _serial = serial();
        let root = temp_root("crud");
        write_item(
            &root,
            &item("a", "rss", "First", "plain text", "2026-10-01T00:00:00Z"),
        )
        .expect("write a");
        let threads_body = "hello\n[img]data:image/png;base64,AAAA\nworld";
        write_item(
            &root,
            &item(
                "b",
                "threads",
                "Second",
                threads_body,
                "2026-10-02T00:00:00Z",
            ),
        )
        .expect("write b");

        let page = list_page(&root, None, None, None, 0, 10).expect("list");
        assert_eq!(page.total, 2);
        assert_eq!(ids(&page.items), vec!["b", "a"]);
        assert_eq!(page.items[0].preview.as_deref(), Some("hello\nworld"));
        assert!(page.items[0].has_image);
        assert!(page.items[1].preview.is_none());
        assert!(!page.items[1].has_image);

        let paged = list_page(&root, None, None, None, 1, 10).expect("offset");
        assert_eq!(paged.total, 2);
        assert_eq!(ids(&paged.items), vec!["a"]);

        let mut b = item(
            "b",
            "threads",
            "Second",
            threads_body,
            "2026-10-02T00:00:00Z",
        );
        b.status = "read".to_string();
        write_item(&root, &b).expect("update b");
        let unread = list_page(&root, Some("unread"), None, None, 0, 10).expect("unread");
        assert_eq!(ids(&unread.items), vec!["a"]);
        let not_read = list_page(&root, None, None, Some("read"), 0, 10).expect("exclude");
        assert_eq!(ids(&not_read.items), vec!["a"]);
        let threads_only = list_page(&root, None, Some("threads"), None, 0, 10).expect("source");
        assert_eq!(ids(&threads_only.items), vec!["b"]);

        delete_item(&root, "a").expect("delete a");
        let c = counts(&root).expect("counts");
        assert_eq!(c.total, 1);
        assert_eq!(c.by_status.get("read"), Some(&1));
        assert_eq!(c.by_status.get("unread"), None);
        assert_eq!(c.by_source.get("threads"), Some(&1));

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn search_matches_title_url_and_excerpt_case_insensitively() {
        let _serial = serial();
        let root = temp_root("search");
        write_item(
            &root,
            &item("x1", "web", "Rust Async", "", "2026-10-01T00:00:00Z"),
        )
        .expect("x1");
        write_item(
            &root,
            &item("x2", "web", "Other", "", "2026-10-02T00:00:00Z"),
        )
        .expect("x2");
        let mut by_url = item("x3", "web", "Nothing", "", "2026-10-03T00:00:00Z");
        by_url.url = "https://blog.rust-lang.org/post".to_string();
        write_item(&root, &by_url).expect("x3");

        let hits = search(&root, "RUST", 10).expect("search");
        assert_eq!(ids(&hits), vec!["x3", "x1"]);
        let limited = search(&root, "rust", 1).expect("limit");
        assert_eq!(ids(&limited), vec!["x3"]);
        assert!(search(&root, "   ", 10).expect("blank").is_empty());
        let by_excerpt = search(&root, "other excerpt", 10).expect("excerpt");
        assert_eq!(ids(&by_excerpt), vec!["x2"]);

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn persisted_index_reuses_unchanged_files_and_reparses_the_rest() {
        let _serial = serial();
        let root = temp_root("persist");
        for (id, title, at) in [
            ("a", "Alpha", "2026-10-01T00:00:00Z"),
            ("b", "Beta", "2026-10-02T00:00:00Z"),
            ("c", "Gamma", "2026-10-03T00:00:00Z"),
        ] {
            write_item(&root, &item(id, "web", title, "", at)).expect(id);
        }
        // 첫 로드: 저장된 인덱스가 없으니 전부 파싱하고 바로 기록한다.
        assert_eq!(
            stats_after_restart(&root),
            LoadStats {
                reused: 0,
                parsed: 3,
                dropped: 0
            }
        );
        assert!(index_path(&root).is_file());
        assert!(!root.join(format!("{}.tmp", INDEX_FILE)).exists());

        // 외부 편집 시뮬레이션: a는 내용 변경, b는 삭제, d는 새로 생김.
        let mut a = item("a", "web", "Alpha renamed", "", "2026-10-01T00:00:00Z");
        a.status = "read".to_string();
        fs::write(
            item_path(&root, "a").expect("path a"),
            serde_json::to_string(&a).expect("json a"),
        )
        .expect("rewrite a");
        fs::remove_file(item_path(&root, "b").expect("path b")).expect("remove b");
        fs::write(
            item_path(&root, "d").expect("path d"),
            serde_json::to_string(&item("d", "rss", "Delta", "", "2026-10-04T00:00:00Z"))
                .expect("json d"),
        )
        .expect("write d");

        assert_eq!(
            stats_after_restart(&root),
            LoadStats {
                reused: 1,
                parsed: 2,
                dropped: 1
            }
        );
        let page = list_page(&root, None, None, None, 0, 10).expect("list");
        assert_eq!(ids(&page.items), vec!["d", "c", "a"]);
        assert_eq!(page.items[2].title, "Alpha renamed");
        assert_eq!(page.items[2].status, "read");

        // 두 번째 재시작: 아무것도 안 바뀌었으니 전부 재사용.
        assert_eq!(
            stats_after_restart(&root),
            LoadStats {
                reused: 3,
                parsed: 0,
                dropped: 0
            }
        );

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn in_app_writes_carry_fresh_stamps_into_the_persisted_index() {
        let _serial = serial();
        let root = temp_root("stamps");
        write_item(
            &root,
            &item("s1", "web", "First", "", "2026-10-01T00:00:00Z"),
        )
        .expect("s1");
        assert_eq!(stats_after_restart(&root).parsed, 1);
        let _ = list_page(&root, None, None, None, 0, 10).expect("warm index");

        // 같은 길이의 제목으로 덮어써도(len 동일) 쓰기 경로가 새 mtime 스탬프를 넣어야 재파싱이 없다.
        write_item(
            &root,
            &item("s1", "web", "Firsx", "", "2026-10-01T00:00:00Z"),
        )
        .expect("s1 again");
        write_item(
            &root,
            &item("s2", "web", "Second", "", "2026-10-02T00:00:00Z"),
        )
        .expect("s2");
        delete_item(&root, "s2").expect("delete s2");

        assert_eq!(
            stats_after_restart(&root),
            LoadStats {
                reused: 1,
                parsed: 0,
                dropped: 0
            }
        );
        let page = list_page(&root, None, None, None, 0, 10).expect("list");
        assert_eq!(ids(&page.items), vec!["s1"]);
        assert_eq!(page.items[0].title, "Firsx");

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn corrupt_or_foreign_index_file_falls_back_to_a_full_parse() {
        let _serial = serial();
        let root = temp_root("corrupt");
        write_item(
            &root,
            &item("k1", "web", "Keep", "", "2026-10-01T00:00:00Z"),
        )
        .expect("k1");
        assert_eq!(stats_after_restart(&root).parsed, 1);

        fs::write(index_path(&root), "{not json").expect("corrupt");
        assert_eq!(
            stats_after_restart(&root),
            LoadStats {
                reused: 0,
                parsed: 1,
                dropped: 0
            }
        );

        fs::write(index_path(&root), r#"{"version":999,"entries":[]}"#).expect("foreign");
        assert_eq!(
            stats_after_restart(&root),
            LoadStats {
                reused: 0,
                parsed: 1,
                dropped: 0
            }
        );
        // 폴백 뒤에는 현재 버전으로 다시 써 둔다.
        let raw = fs::read_to_string(index_path(&root)).expect("rewritten");
        assert!(raw.starts_with(r#"{"version":1,"#));
        assert_eq!(stats_after_restart(&root).reused, 1);

        let _ = fs::remove_dir_all(&root);
    }

    /// 실데이터 사본으로 기동 경로를 재어 본다(인덱스 파일을 그 root에 만든다).
    /// `BENTO_GLEAN_ROOT=<root> cargo test -- --ignored real_root --nocapture`
    #[test]
    #[ignore]
    fn real_root_load_timing() {
        let root = match std::env::var("BENTO_GLEAN_ROOT") {
            Ok(r) => PathBuf::from(r),
            Err(_) => return,
        };
        let _serial = serial();
        for pass in 1..=2 {
            let started = std::time::Instant::now();
            let (ix, stats) = load_index(&root).expect("load");
            eprintln!(
                "pass {}: {} entries, {:?} in {:?}",
                pass,
                ix.entries.len(),
                stats,
                started.elapsed()
            );
        }
        let size = fs::metadata(index_path(&root))
            .map(|m| m.len())
            .unwrap_or(0);
        eprintln!("index file: {} bytes", size);
    }

    #[test]
    fn thumb_is_the_first_image_marker_only() {
        let _serial = serial();
        assert_eq!(
            first_image("text\n[img] data:a \n[img]data:b"),
            Some("data:a".to_string())
        );
        assert_eq!(first_image("no images"), None);
        assert_eq!(first_image("[img]   "), None);
    }
}
