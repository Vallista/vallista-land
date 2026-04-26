use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

const GLEAN_DIR: &str = "glean";

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
}

fn glean_dir(root: &Path) -> std::path::PathBuf {
    root.join(GLEAN_DIR)
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

#[tauri::command]
pub fn list_glean(state: State<'_, AppState>) -> Result<Vec<GleanItem>, String> {
    let dir = glean_dir(&state.vault_root);
    if !dir.is_dir() {
        return Ok(Vec::new());
    }
    let mut items: Vec<GleanItem> = Vec::new();
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
        match serde_json::from_str::<GleanItem>(&raw) {
            Ok(item) => items.push(item),
            Err(_) => continue,
        }
    }
    items.sort_by(|a, b| b.fetched_at.cmp(&a.fetched_at));
    Ok(items)
}

fn read_item(root: &Path, id: &str) -> Result<GleanItem, String> {
    let p = item_path(root, id)?;
    let safe = ensure_inside(root, &p)?;
    let raw = fs::read_to_string(&safe).map_err(|e| e.to_string())?;
    serde_json::from_str::<GleanItem>(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_glean(id: String, state: State<'_, AppState>) -> Result<GleanItem, String> {
    read_item(&state.vault_root, &id)
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
}

#[tauri::command]
pub fn add_glean(input: GleanInput, state: State<'_, AppState>) -> Result<GleanItem, String> {
    let dir = glean_dir(&state.vault_root);
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
    };
    write_item(&state.vault_root, &item)?;
    Ok(item)
}

#[tauri::command]
pub fn update_glean_status(
    id: String,
    status: String,
    promoted_doc_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<GleanItem, String> {
    let mut item = read_item(&state.vault_root, &id)?;
    item.status = status;
    if let Some(pdid) = promoted_doc_id {
        item.promoted_doc_id = Some(pdid);
    }
    write_item(&state.vault_root, &item)?;
    Ok(item)
}

#[tauri::command]
pub fn update_glean_highlights(
    id: String,
    highlights: Vec<GleanHighlight>,
    state: State<'_, AppState>,
) -> Result<GleanItem, String> {
    let mut item = read_item(&state.vault_root, &id)?;
    item.highlights = highlights;
    write_item(&state.vault_root, &item)?;
    Ok(item)
}

#[tauri::command]
pub fn delete_glean(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let p = item_path(&state.vault_root, &id)?;
    let safe = ensure_inside(&state.vault_root, &p)?;
    if safe.is_file() {
        fs::remove_file(&safe).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn write_item(root: &Path, item: &GleanItem) -> Result<(), String> {
    let p = item_path(root, &item.id)?;
    let safe = ensure_inside(root, &p)?;
    if let Some(parent) = safe.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(item).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())?;
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
pub async fn fetch_url(url: String) -> Result<FetchedContent, String> {
    let trimmed = url.trim().to_string();
    if !(trimmed.starts_with("http://") || trimmed.starts_with("https://")) {
        return Err("URL은 http:// 또는 https:// 로 시작해야 합니다".into());
    }
    let client = reqwest::Client::builder()
        .user_agent("Pensmith/0.1 (+https://vallista.kr)")
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
