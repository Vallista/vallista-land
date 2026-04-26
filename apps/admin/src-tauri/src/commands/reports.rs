use gray_matter::Pod;
use serde::Serialize;
use serde_json::{Map, Number, Value};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use walkdir::WalkDir;

use crate::repo::{ensure_inside, AppState};

const REPORTS_DIR: &str = "contents/reports";
const PREVIEW_CHARS: usize = 160;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReportSummary {
    pub id: String,
    pub period: String,
    pub generated_at: String,
    pub model: String,
    pub path: String,
    pub preview: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Report {
    pub id: String,
    pub period: String,
    pub generated_at: String,
    pub model: String,
    pub path: String,
    pub preview: String,
    pub body: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metrics: Option<Value>,
}

fn reports_dir(root: &Path) -> PathBuf {
    root.join(REPORTS_DIR)
}

#[tauri::command]
pub fn list_reports(state: State<'_, AppState>) -> Result<Vec<ReportSummary>, String> {
    let root = &state.vault_root;
    let dir = reports_dir(root);
    if !dir.is_dir() {
        return Ok(Vec::new());
    }
    let mut out: Vec<ReportSummary> = Vec::new();
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
        let parsed = parse_report(&raw, path, root);
        out.push(ReportSummary {
            id: parsed.id,
            period: parsed.period,
            generated_at: parsed.generated_at,
            model: parsed.model,
            path: parsed.path,
            preview: parsed.preview,
        });
    }
    out.sort_by(|a, b| b.generated_at.cmp(&a.generated_at));
    Ok(out)
}

#[tauri::command]
pub fn read_report(path: String, state: State<'_, AppState>) -> Result<Report, String> {
    let safe = ensure_inside(&state.vault_root, Path::new(&path))?;
    if !safe.is_file() {
        return Err(format!("report not found: {}", path));
    }
    let raw = fs::read_to_string(&safe).map_err(|e| e.to_string())?;
    Ok(parse_report(&raw, &safe, &state.vault_root))
}

fn parse_report(raw: &str, path: &Path, root: &Path) -> Report {
    let parsed = gray_matter::Matter::<gray_matter::engine::YAML>::new().parse(raw);
    let body = parsed.content.clone();

    let mut id = String::new();
    let mut period = String::from("day");
    let mut generated_at = String::new();
    let mut model = String::new();
    let mut metrics: Option<Value> = None;

    if let Some(data) = parsed.data {
        if let Ok(map) = data.as_hashmap() {
            if let Some(v) = map.get("id").and_then(|p| p.as_string().ok()) {
                id = v;
            }
            if let Some(v) = map.get("period").and_then(|p| p.as_string().ok()) {
                period = v;
            }
            if let Some(v) = map
                .get("generatedAt")
                .or_else(|| map.get("generated_at"))
                .and_then(|p| p.as_string().ok())
            {
                generated_at = v;
            }
            if let Some(v) = map.get("model").and_then(|p| p.as_string().ok()) {
                model = v;
            }
            if let Some(v) = map.get("metrics") {
                let json = pod_to_json(v);
                if !json.is_null() {
                    metrics = Some(json);
                }
            }
        }
    }

    if generated_at.is_empty() {
        if let Ok(meta) = fs::metadata(path) {
            if let Ok(modified) = meta.modified() {
                generated_at = format_systime(modified);
            }
        }
    }

    if id.is_empty() {
        if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
            id = stem.to_string();
        }
    }

    let rel = path.strip_prefix(root).unwrap_or(path);
    let rel_path = rel.to_string_lossy().replace('\\', "/");
    let preview = build_preview(&body);

    Report {
        id,
        period,
        generated_at,
        model,
        path: rel_path,
        preview,
        body,
        metrics,
    }
}

fn build_preview(body: &str) -> String {
    let mut buf = String::new();
    for line in body.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let cleaned = strip_md_prefix(trimmed);
        if cleaned.is_empty() {
            continue;
        }
        if !buf.is_empty() {
            buf.push(' ');
        }
        buf.push_str(cleaned);
        if buf.chars().count() >= PREVIEW_CHARS {
            break;
        }
    }
    if buf.chars().count() > PREVIEW_CHARS {
        let trimmed: String = buf.chars().take(PREVIEW_CHARS).collect();
        format!("{}…", trimmed)
    } else {
        buf
    }
}

fn pod_to_json(pod: &Pod) -> Value {
    if let Ok(b) = pod.as_bool() {
        return Value::Bool(b);
    }
    if let Ok(i) = pod.as_i64() {
        return Value::Number(Number::from(i));
    }
    if let Ok(f) = pod.as_f64() {
        if let Some(n) = Number::from_f64(f) {
            return Value::Number(n);
        }
    }
    if let Ok(s) = pod.as_string() {
        return Value::String(s);
    }
    if let Ok(arr) = pod.as_vec() {
        return Value::Array(arr.iter().map(pod_to_json).collect());
    }
    if let Ok(map) = pod.as_hashmap() {
        let mut obj = Map::new();
        for (k, v) in map.iter() {
            obj.insert(k.clone(), pod_to_json(v));
        }
        return Value::Object(obj);
    }
    Value::Null
}

fn strip_md_prefix(line: &str) -> &str {
    let mut s = line;
    while s.starts_with('#') {
        s = &s[1..];
    }
    s = s.trim_start();
    if let Some(rest) = s.strip_prefix("- ") {
        s = rest;
    } else if let Some(rest) = s.strip_prefix("* ") {
        s = rest;
    } else if let Some(rest) = s.strip_prefix("> ") {
        s = rest;
    }
    s.trim()
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
