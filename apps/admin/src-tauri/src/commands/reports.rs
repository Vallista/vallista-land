use gray_matter::Pod;
use serde::Serialize;
use serde_json::{Map, Number, Value};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use walkdir::WalkDir;

use crate::repo::{ensure_inside, load_config, save_config, AppState};

const PREVIEW_CHARS: usize = 160;
const LEGACY_REPORTS_SUBPATH: &str = "contents/reports";
const LEGACY_NOTES_REPORTS_SUBPATH: &str = "contents/notes/reports";

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

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MigrateReportsReport {
    pub copied: usize,
    pub skipped: usize,
    pub backup_path: String,
}

fn data_reports_dir(state: &AppState) -> PathBuf {
    state.data_root.join("reports")
}

#[tauri::command]
pub fn list_reports(state: State<'_, AppState>) -> Result<Vec<ReportSummary>, String> {
    let dir = data_reports_dir(&state);
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
        let parsed = parse_report(&raw, path, &dir);
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
    let dir = data_reports_dir(&state);
    let safe = ensure_inside(&dir, Path::new(&path))?;
    if !safe.is_file() {
        return Err(format!("report not found: {}", path));
    }
    let raw = fs::read_to_string(&safe).map_err(|e| e.to_string())?;
    Ok(parse_report(&raw, &safe, &dir))
}

#[tauri::command]
pub fn migrate_reports(state: State<'_, AppState>) -> Result<MigrateReportsReport, String> {
    let cfg_check = load_config(&state.data_root);
    if cfg_check.reports_migrated {
        return Err("이미 보고서를 이전했습니다.".to_string());
    }

    let content_root = state.try_content_root().ok_or_else(|| {
        "content root가 설정되어 있지 않아 이전할 보고서를 찾을 수 없습니다.".to_string()
    })?;

    let target_dir = data_reports_dir(&state);
    fs::create_dir_all(&target_dir).map_err(|e| format!("대상 폴더 생성 실패: {}", e))?;

    let timestamp = backup_timestamp();
    let backup_root = state
        .data_root
        .join("backups")
        .join(format!("reports-{}", timestamp));
    fs::create_dir_all(&backup_root).map_err(|e| format!("백업 폴더 생성 실패: {}", e))?;

    let legacy_paths = [
        content_root.join(LEGACY_REPORTS_SUBPATH),
        content_root.join(LEGACY_NOTES_REPORTS_SUBPATH),
    ];

    let mut copied = 0usize;
    let mut skipped = 0usize;
    let mut moved_sources: Vec<(PathBuf, PathBuf)> = Vec::new();

    for legacy_dir in legacy_paths.iter() {
        if !legacy_dir.is_dir() {
            continue;
        }
        for entry in WalkDir::new(legacy_dir).into_iter().filter_map(|e| e.ok()) {
            if !entry.file_type().is_file() {
                continue;
            }
            let path = entry.path();
            if path.extension().map_or(true, |e| e != "md") {
                continue;
            }
            let file_name = match path.file_name().and_then(|s| s.to_str()) {
                Some(name) => name.to_string(),
                None => continue,
            };
            let target_path = target_dir.join(&file_name);
            if target_path.exists() {
                skipped += 1;
                continue;
            }
            let raw = match fs::read(path) {
                Ok(b) => b,
                Err(e) => {
                    rollback_moves(&moved_sources);
                    return Err(format!("읽기 실패 {}: {}", path.display(), e));
                }
            };
            if let Err(e) = fs::write(&target_path, &raw) {
                rollback_moves(&moved_sources);
                return Err(format!("쓰기 실패 {}: {}", target_path.display(), e));
            }
            let backup_target = backup_root.join(&file_name);
            if backup_target.exists() {
                let _ = fs::remove_file(&target_path);
                rollback_moves(&moved_sources);
                return Err(format!(
                    "백업 충돌: {} (이미 존재). 작업을 중단합니다.",
                    backup_target.display()
                ));
            }
            if let Err(e) = fs::rename(path, &backup_target) {
                let _ = fs::remove_file(&target_path);
                rollback_moves(&moved_sources);
                return Err(format!("원본 이동 실패 {}: {}", path.display(), e));
            }
            moved_sources.push((backup_target.clone(), path.to_path_buf()));
            copied += 1;
        }
    }

    let mut cfg = load_config(&state.data_root);
    cfg.reports_migrated = true;
    if let Err(e) = save_config(&state.data_root, &cfg) {
        rollback_moves(&moved_sources);
        return Err(format!("설정 저장 실패: {}", e));
    }

    Ok(MigrateReportsReport {
        copied,
        skipped,
        backup_path: backup_root.to_string_lossy().to_string(),
    })
}

fn rollback_moves(moved: &[(PathBuf, PathBuf)]) {
    for (backup_target, original) in moved.iter().rev() {
        if let Some(parent) = original.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let _ = fs::rename(backup_target, original);
    }
}

fn backup_timestamp() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    iso_compact_from_unix(secs)
}

fn iso_compact_from_unix(secs: i64) -> String {
    let days = secs.div_euclid(86_400);
    let mut s = secs.rem_euclid(86_400);
    let hour = (s / 3600) as u32;
    s %= 3600;
    let minute = (s / 60) as u32;
    let second = (s % 60) as u32;
    let (year, month, day) = civil_from_days(days);
    format!(
        "{:04}{:02}{:02}-{:02}{:02}{:02}",
        year, month, day, hour, minute, second
    )
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
