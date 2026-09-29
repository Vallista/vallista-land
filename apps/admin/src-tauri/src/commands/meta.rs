use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_dialog::DialogExt;
use walkdir::WalkDir;

use crate::repo::{
    load_config, persist_content_root, save_config, validate_content_root, AppConfig,
    AppPersonalization, AppState, BlogConfig,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultInfo {
    pub root: String,
    pub article_count: u64,
    pub note_count: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentRootStatus {
    pub configured: bool,
    pub path: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSetupStatus {
    pub blog_enabled: bool,
    pub blog_ready: bool,
    pub content_path: Option<String>,
    pub git_remote: Option<String>,
    pub git_branch: Option<String>,
    pub git_email: Option<String>,
    pub git_name: Option<String>,
    pub reports_migrated: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlogConfigInput {
    pub enabled: bool,
    #[serde(default)]
    pub content_path: Option<String>,
    #[serde(default)]
    pub git_remote: Option<String>,
    #[serde(default)]
    pub git_branch: Option<String>,
    #[serde(default)]
    pub git_email: Option<String>,
    #[serde(default)]
    pub git_name: Option<String>,
}

#[tauri::command]
pub fn vault_info(state: State<'_, AppState>) -> Result<VaultInfo, String> {
    let cfg = load_config(&state.data_root);
    let root = state.content_root()?;
    let article_count = count_md(&root.join(&cfg.app.articles_dir));
    let note_count = count_md(&root.join(&cfg.app.notes_dir));
    Ok(VaultInfo {
        root: root.to_string_lossy().to_string(),
        article_count,
        note_count,
    })
}

#[tauri::command]
pub fn content_root_status(state: State<'_, AppState>) -> ContentRootStatus {
    match state.try_content_root() {
        Some(p) => ContentRootStatus {
            configured: true,
            path: Some(p.to_string_lossy().to_string()),
        },
        None => ContentRootStatus {
            configured: false,
            path: None,
        },
    }
}

#[tauri::command]
pub fn app_setup_status(state: State<'_, AppState>) -> AppSetupStatus {
    let cfg = load_config(&state.data_root);
    status_from_config(&cfg)
}

#[tauri::command]
pub async fn pick_content_root(app: AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = std::sync::mpsc::channel::<Option<PathBuf>>();
    app.dialog().file().pick_folder(move |path| {
        let _ = tx.send(path.and_then(|p| p.into_path().ok()));
    });
    let picked = rx.recv().map_err(|e| e.to_string())?;
    Ok(picked.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn set_content_root(
    app: AppHandle,
    state: State<'_, AppState>,
    path: String,
) -> Result<(), String> {
    let buf = PathBuf::from(&path);
    if !validate_content_root(&buf) {
        return Err(format!("유효하지 않은 디렉토리입니다: {}", buf.display()));
    }
    persist_content_root(&state.data_root, &buf)?;
    state.set_content_root(buf);
    let _ = app.emit("bento:content-root-changed", ());
    Ok(())
}

#[tauri::command]
pub fn set_blog_config(
    app: AppHandle,
    state: State<'_, AppState>,
    input: BlogConfigInput,
) -> Result<AppSetupStatus, String> {
    let mut cfg = load_config(&state.data_root);
    let trimmed_path = nz(input.content_path);
    cfg.blog = BlogConfig {
        enabled: input.enabled,
        content_path: trimmed_path.clone(),
        git_remote: nz(input.git_remote),
        git_branch: nz(input.git_branch),
        git_email: nz(input.git_email),
        git_name: nz(input.git_name),
    };
    if let Some(s) = trimmed_path.as_deref() {
        let p = PathBuf::from(s);
        if validate_content_root(&p) {
            state.set_content_root(p);
            cfg.content_root = Some(s.to_string());
        }
    } else {
        cfg.content_root = None;
    }
    save_config(&state.data_root, &cfg)?;
    let _ = app.emit("bento:content-root-changed", ());
    Ok(status_from_config(&cfg))
}

fn status_from_config(cfg: &AppConfig) -> AppSetupStatus {
    let content_path = cfg.blog.content_path.clone();
    let blog_ready = cfg.blog.enabled
        && content_path
            .as_ref()
            .map(|p| validate_content_root(Path::new(p)))
            .unwrap_or(false);
    AppSetupStatus {
        blog_enabled: cfg.blog.enabled,
        blog_ready,
        content_path,
        git_remote: cfg.blog.git_remote.clone(),
        git_branch: cfg.blog.git_branch.clone(),
        git_email: cfg.blog.git_email.clone(),
        git_name: cfg.blog.git_name.clone(),
        reports_migrated: cfg.reports_migrated,
    }
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPersonalizationInput {
    pub app_name: String,
    pub app_url: String,
    pub keychain_service: String,
    pub articles_dir: String,
    pub notes_dir: String,
}

#[tauri::command]
pub fn get_app_personalization(state: State<'_, AppState>) -> AppPersonalization {
    load_config(&state.data_root).app
}

#[tauri::command]
pub fn set_app_personalization(
    state: State<'_, AppState>,
    input: AppPersonalizationInput,
) -> Result<(), String> {
    let mut cfg = load_config(&state.data_root);
    cfg.app = AppPersonalization {
        app_name: input.app_name.trim().to_string(),
        app_url: input.app_url.trim().to_string(),
        keychain_service: input.keychain_service.trim().to_string(),
        articles_dir: input.articles_dir.trim().to_string(),
        notes_dir: input.notes_dir.trim().to_string(),
    };
    save_config(&state.data_root, &cfg)
}

fn nz(v: Option<String>) -> Option<String> {
    v.and_then(|s| {
        let t = s.trim().to_string();
        if t.is_empty() {
            None
        } else {
            Some(t)
        }
    })
}

#[tauri::command]
pub async fn open_url(url: String) -> Result<(), String> {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("http/https URL만 열 수 있습니다".to_string());
    }
    std::process::Command::new("open")
        .arg(&url)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn count_md(dir: &Path) -> u64 {
    if !dir.is_dir() {
        return 0;
    }
    WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "md"))
        .count() as u64
}

// ── memory info ─────────────────────────────────────────────────────────────

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryInfo {
    pub process_rss_bytes: u64,
    pub blocks_bytes: u64,
    pub tasks_bytes: u64,
    pub event_notes_bytes: u64,
    pub glean_bytes: u64,
    pub other_bytes: u64,
}

#[tauri::command]
pub fn get_memory_info(state: State<'_, AppState>) -> MemoryInfo {
    let root = &state.data_root;
    let blocks_bytes = file_bytes(&root.join("blocks.json"));
    let tasks_bytes = dir_bytes(&root.join("tasks"));
    let event_notes_bytes = dir_bytes(&root.join("event_notes"));
    let glean_bytes = dir_bytes(&root.join("glean"));
    let total_data = dir_bytes(root);
    let other_bytes = total_data.saturating_sub(blocks_bytes + tasks_bytes + event_notes_bytes + glean_bytes);
    MemoryInfo {
        process_rss_bytes: process_rss(),
        blocks_bytes,
        tasks_bytes,
        event_notes_bytes,
        glean_bytes,
        other_bytes,
    }
}

fn file_bytes(path: &PathBuf) -> u64 {
    std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
}

fn dir_bytes(path: &Path) -> u64 {
    if !path.exists() {
        return 0;
    }
    WalkDir::new(path)
        .max_depth(4)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter_map(|e| e.metadata().ok())
        .filter(|m| m.is_file())
        .map(|m| m.len())
        .sum()
}

#[cfg(target_os = "macos")]
fn process_rss() -> u64 {
    unsafe {
        let mut ru: libc::rusage = std::mem::zeroed();
        libc::getrusage(libc::RUSAGE_SELF, &mut ru);
        // macOS: ru_maxrss is in bytes (unlike Linux which uses KB)
        ru.ru_maxrss as u64
    }
}

#[cfg(not(target_os = "macos"))]
fn process_rss() -> u64 {
    0
}
