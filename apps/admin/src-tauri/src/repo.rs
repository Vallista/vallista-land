use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::RwLock;

pub struct AppState {
    content_root: RwLock<Option<PathBuf>>,
    pub data_root: PathBuf,
}

impl AppState {
    pub fn new(data_root: PathBuf, initial_content_root: Option<PathBuf>) -> Self {
        Self {
            content_root: RwLock::new(initial_content_root),
            data_root,
        }
    }

    pub fn content_root(&self) -> Result<PathBuf, String> {
        self.try_content_root()
            .ok_or_else(|| "content root not configured".to_string())
    }

    pub fn try_content_root(&self) -> Option<PathBuf> {
        self.content_root.read().ok().and_then(|g| g.clone())
    }

    pub fn set_content_root(&self, path: PathBuf) {
        if let Ok(mut g) = self.content_root.write() {
            *g = Some(path);
        }
    }
}

pub fn require_blog_enabled(data_root: &Path) -> Result<(), String> {
    let cfg = load_config(data_root);
    if !cfg.blog.enabled {
        return Err("블로그 모듈이 비활성화되어 있습니다. 설정에서 활성화하세요.".to_string());
    }
    Ok(())
}

pub const CONFIG_VERSION: u32 = 4;

#[derive(Serialize, Deserialize, Default, Clone)]
pub struct AppConfig {
    #[serde(default = "default_version")]
    pub version: u32,
    #[serde(default, rename = "contentRoot")]
    pub content_root: Option<String>,
    #[serde(default)]
    pub blog: BlogConfig,
    #[serde(default)]
    pub rss: RssConfig,
    #[serde(default, rename = "reportsMigrated")]
    pub reports_migrated: bool,
    #[serde(default)]
    pub app: AppPersonalization,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppPersonalization {
    #[serde(default = "default_app_name")]
    pub app_name: String,
    #[serde(default)]
    pub app_url: String,
    #[serde(default = "default_keychain_service")]
    pub keychain_service: String,
    #[serde(default = "default_articles_dir")]
    pub articles_dir: String,
    #[serde(default = "default_notes_dir")]
    pub notes_dir: String,
}

impl Default for AppPersonalization {
    fn default() -> Self {
        Self {
            app_name: default_app_name(),
            app_url: String::new(),
            keychain_service: default_keychain_service(),
            articles_dir: default_articles_dir(),
            notes_dir: default_notes_dir(),
        }
    }
}

fn default_app_name() -> String {
    "Bento".to_string()
}
fn default_keychain_service() -> String {
    "bento.git".to_string()
}
fn default_articles_dir() -> String {
    "contents/articles".to_string()
}
fn default_notes_dir() -> String {
    "contents/notes".to_string()
}

pub fn build_user_agent(p: &AppPersonalization) -> String {
    let name = if p.app_name.is_empty() {
        "Bento"
    } else {
        p.app_name.as_str()
    };
    if p.app_url.is_empty() {
        format!("{}/1.0", name)
    } else {
        format!("{}/1.0 (+{})", name, p.app_url)
    }
}

#[derive(Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BlogConfig {
    #[serde(default)]
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

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RssConfig {
    #[serde(default = "default_rss_interval_min")]
    pub default_interval_min: u32,
    #[serde(default = "default_true")]
    pub run_on_app_start: bool,
    #[serde(default = "default_rss_max_concurrent")]
    pub max_concurrent: u32,
    #[serde(default = "default_rss_timeout_sec")]
    pub timeout_sec: u32,
    #[serde(default = "default_true")]
    pub respect_etag: bool,
    #[serde(default = "default_true")]
    pub auto_sync_enabled: bool,
}

impl Default for RssConfig {
    fn default() -> Self {
        Self {
            default_interval_min: default_rss_interval_min(),
            run_on_app_start: default_true(),
            max_concurrent: default_rss_max_concurrent(),
            timeout_sec: default_rss_timeout_sec(),
            respect_etag: default_true(),
            auto_sync_enabled: default_true(),
        }
    }
}

fn default_rss_interval_min() -> u32 {
    30
}
fn default_rss_max_concurrent() -> u32 {
    4
}
fn default_rss_timeout_sec() -> u32 {
    15
}
fn default_true() -> bool {
    true
}

fn default_version() -> u32 {
    1
}

const CONFIG_FILE: &str = "config.json";

pub fn load_config(data_root: &Path) -> AppConfig {
    let path = data_root.join(CONFIG_FILE);
    let raw: AppConfig = fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default();
    let (mut cfg, changed) = migrate_config(raw);
    if changed {
        let _ = save_config(data_root, &cfg);
    }
    cfg.version = CONFIG_VERSION;
    cfg
}

pub fn save_config(data_root: &Path, cfg: &AppConfig) -> Result<(), String> {
    let path = data_root.join(CONFIG_FILE);
    let body = serde_json::to_string_pretty(cfg).map_err(|e| e.to_string())?;
    fs::write(&path, body).map_err(|e| e.to_string())
}

fn migrate_config(mut cfg: AppConfig) -> (AppConfig, bool) {
    let mut changed = false;
    if cfg.version < 2 {
        if let Some(root) = cfg.content_root.clone() {
            if cfg.blog.content_path.is_none() {
                cfg.blog.content_path = Some(root);
            }
            cfg.blog.enabled = true;
        }
        cfg.version = 2;
        changed = true;
    }
    if cfg.version < 3 {
        cfg.version = 3;
        changed = true;
    }
    if cfg.version < 4 {
        // AppPersonalization added — defaults applied by serde
        cfg.version = 4;
        changed = true;
    }
    (cfg, changed)
}

pub fn validate_content_root(p: &Path) -> bool {
    p.is_dir()
}

fn looks_like_content_root(p: &Path) -> bool {
    p.is_dir() && p.join("contents").is_dir()
}

fn auto_detect_content_root() -> Option<PathBuf> {
    // BENTO_CONTENT_ROOT 우선, VALLISTA_REPO_ROOT 하위호환
    for var in &["BENTO_CONTENT_ROOT", "VALLISTA_REPO_ROOT"] {
        if let Ok(v) = std::env::var(var) {
            let p = PathBuf::from(v);
            if validate_content_root(&p) {
                return Some(p);
            }
        }
    }

    if let Ok(cwd) = std::env::current_dir() {
        for ancestor in cwd.ancestors() {
            if looks_like_content_root(ancestor) {
                return Some(ancestor.to_path_buf());
            }
        }
    }

    None
}

pub fn resolve_content_root(data_root: &Path) -> Option<PathBuf> {
    let cfg = load_config(data_root);
    if !cfg.blog.enabled {
        return None;
    }
    if let Some(s) = cfg.blog.content_path.as_deref() {
        let p = PathBuf::from(s);
        if validate_content_root(&p) {
            return Some(p);
        }
    }
    if let Some(s) = cfg.content_root.as_deref() {
        let p = PathBuf::from(s);
        if validate_content_root(&p) {
            return Some(p);
        }
    }
    auto_detect_content_root()
}

pub fn persist_content_root(data_root: &Path, path: &Path) -> Result<(), String> {
    if !validate_content_root(path) {
        return Err(format!("유효하지 않은 디렉토리입니다: {}", path.display()));
    }
    let mut cfg = load_config(data_root);
    let s = path.to_string_lossy().to_string();
    cfg.blog.content_path = Some(s.clone());
    cfg.blog.enabled = true;
    cfg.content_root = Some(s);
    save_config(data_root, &cfg)
}

pub fn ensure_inside(root: &Path, target: &Path) -> Result<PathBuf, String> {
    let abs = if target.is_absolute() {
        target.to_path_buf()
    } else {
        root.join(target)
    };
    let canonical_root = root
        .canonicalize()
        .map_err(|e| format!("canonicalize root: {}", e))?;
    let canonical_abs = if abs.exists() {
        abs.canonicalize()
            .map_err(|e| format!("canonicalize target: {}", e))?
    } else if let Some(parent) = abs.parent() {
        if !parent.exists() {
            return Err(format!("parent does not exist: {}", parent.display()));
        }
        let canon_parent = parent
            .canonicalize()
            .map_err(|e| format!("canonicalize parent: {}", e))?;
        let name = abs
            .file_name()
            .ok_or_else(|| "missing file name".to_string())?;
        canon_parent.join(name)
    } else {
        return Err("invalid path".into());
    };
    if !canonical_abs.starts_with(&canonical_root) {
        return Err(format!(
            "path escapes content root: {}",
            canonical_abs.display()
        ));
    }
    Ok(canonical_abs)
}
