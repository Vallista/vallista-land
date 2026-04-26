use serde::Serialize;
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use walkdir::WalkDir;

use crate::repo::{ensure_inside, AppState};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocSummary {
    pub id: String,
    pub state: String,
    pub title: String,
    pub slug: Option<String>,
    pub path: String,
    pub collection: String,
    pub tags: Vec<String>,
    pub updated_at: String,
    pub created_at: String,
    pub words: u64,
}

#[derive(Serialize)]
pub struct DocFile {
    pub path: String,
    pub raw: String,
    pub exists: bool,
}

#[tauri::command]
pub fn list_docs(state: State<'_, AppState>) -> Result<Vec<DocSummary>, String> {
    let root = &state.vault_root;
    let collections = [
        ("articles", "contents/articles"),
        ("notes", "contents/notes"),
    ];
    let mut out = Vec::new();
    for (collection, sub) in collections {
        let dir = root.join(sub);
        if !dir.is_dir() {
            continue;
        }
        for entry in WalkDir::new(&dir).into_iter().filter_map(|e| e.ok()) {
            if !entry.file_type().is_file() {
                continue;
            }
            let path = entry.path();
            if path.extension().map_or(true, |e| e != "md") {
                continue;
            }
            let raw = match fs::read_to_string(path) {
                Ok(s) => s,
                Err(_) => continue,
            };
            out.push(parse_summary(&raw, path, root, collection));
        }
    }
    Ok(out)
}

fn parse_summary(raw: &str, path: &Path, root: &Path, collection: &str) -> DocSummary {
    let metadata = fs::metadata(path).ok();
    let updated_at = metadata
        .as_ref()
        .and_then(|m| m.modified().ok())
        .map(format_systime)
        .unwrap_or_default();
    let created_at = metadata
        .as_ref()
        .and_then(|m| m.created().ok())
        .map(format_systime)
        .unwrap_or_default();

    let parsed = gray_matter::Matter::<gray_matter::engine::YAML>::new().parse(raw);
    let body = parsed.content.clone();
    let words = count_words(&body);

    let mut id = String::new();
    let mut state_val = String::from(if collection == "articles" {
        "published"
    } else {
        "sprout"
    });
    let mut title = String::new();
    let mut slug: Option<String> = None;
    let mut tags: Vec<String> = Vec::new();

    if let Some(data) = parsed.data {
        if let Ok(map) = data.as_hashmap() {
            if let Some(v) = map.get("id").and_then(|p| p.as_string().ok()) {
                id = v;
            }
            if let Some(v) = map.get("state").and_then(|p| p.as_string().ok()) {
                state_val = v;
            }
            if let Some(v) = map.get("title").and_then(|p| p.as_string().ok()) {
                title = v;
            }
            if let Some(v) = map.get("slug").and_then(|p| p.as_string().ok()) {
                slug = Some(v);
            }
            if let Some(v) = map.get("tags") {
                if let Ok(arr) = v.as_vec() {
                    tags = arr.into_iter().filter_map(|p| p.as_string().ok()).collect();
                } else if let Ok(s) = v.as_string() {
                    tags = vec![s];
                }
            }
        }
    }

    if title.is_empty() {
        if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
            if stem == "index" {
                title = path
                    .parent()
                    .and_then(|p| p.file_name())
                    .and_then(|s| s.to_str())
                    .unwrap_or("")
                    .to_string();
            } else {
                title = stem.to_string();
            }
        }
    }

    let rel = path.strip_prefix(root).unwrap_or(path);
    DocSummary {
        id,
        state: state_val,
        title,
        slug,
        path: rel.to_string_lossy().replace('\\', "/"),
        collection: collection.to_string(),
        tags,
        updated_at,
        created_at,
        words,
    }
}

fn format_systime(t: SystemTime) -> String {
    let dur = t.duration_since(UNIX_EPOCH).unwrap_or_default();
    iso_from_unix(dur.as_secs() as i64)
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

fn count_words(body: &str) -> u64 {
    let mut in_fence = false;
    let mut count: u64 = 0;
    for line in body.lines() {
        if line.trim_start().starts_with("```") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence {
            continue;
        }
        count += line.split_whitespace().count() as u64;
    }
    count
}

#[tauri::command]
pub fn read_doc(path: String, state: State<'_, AppState>) -> Result<DocFile, String> {
    let safe = ensure_inside(&state.vault_root, Path::new(&path))?;
    let exists = safe.exists();
    let raw = if exists {
        fs::read_to_string(&safe).map_err(|e| e.to_string())?
    } else {
        String::new()
    };
    let rel = safe.strip_prefix(&state.vault_root).unwrap_or(&safe);
    Ok(DocFile {
        path: rel.to_string_lossy().replace('\\', "/"),
        raw,
        exists,
    })
}

#[tauri::command]
pub fn write_doc(
    path: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let safe = ensure_inside(&state.vault_root, Path::new(&path))?;
    if let Some(parent) = safe.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&safe, content).map_err(|e| e.to_string())
}
