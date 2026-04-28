use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_dialog::DialogExt;
use walkdir::WalkDir;

use crate::repo::{
    load_config, persist_content_root, save_config, validate_content_root, AppConfig, AppState,
    BlogConfig,
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
    let root = state.content_root()?;
    let article_count = count_md(&root.join("contents/articles"));
    let note_count = count_md(&root.join("contents/notes"));
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
        return Err(format!(
            "선택한 디렉토리에 pnpm-workspace.yaml과 contents/가 없습니다: {}",
            buf.display()
        ));
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
