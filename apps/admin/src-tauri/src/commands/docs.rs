use base64::{engine::general_purpose, Engine as _};
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use walkdir::WalkDir;

use crate::commands::tasks;
use crate::repo::{ensure_inside, AppState};

const COLLECTIONS: [(&str, &str); 2] = [
    ("articles", "contents/articles"),
    ("notes", "contents/notes"),
];

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
    let root = state.content_root()?;
    let root = root.as_path();
    let mut out = Vec::new();
    for (collection, sub) in COLLECTIONS {
        let dir = root.join(sub);
        if !dir.is_dir() {
            continue;
        }
        for entry in WalkDir::new(&dir).into_iter().filter_map(|e| e.ok()) {
            if !entry.file_type().is_file() {
                continue;
            }
            let path = entry.path();
            if path
                .extension()
                .and_then(|e| e.to_str())
                .map_or(true, |ext| ext != "md" && ext != "mdx")
            {
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
    let fs_modified = metadata
        .as_ref()
        .and_then(|m| m.modified().ok())
        .map(format_systime)
        .unwrap_or_default();
    let fs_created = metadata
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
    let mut fm_date: Option<String> = None;
    let mut fm_updated: Option<String> = None;
    let mut fm_created: Option<String> = None;

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
            for key in ["date", "pubDate", "publishedAt", "published"] {
                if let Some(v) = map.get(key).and_then(|p| p.as_string().ok()) {
                    fm_date = Some(normalize_iso(&v));
                    break;
                }
            }
            for key in ["updated", "updatedAt"] {
                if let Some(v) = map.get(key).and_then(|p| p.as_string().ok()) {
                    fm_updated = Some(normalize_iso(&v));
                    break;
                }
            }
            for key in ["createdAt", "created"] {
                if let Some(v) = map.get(key).and_then(|p| p.as_string().ok()) {
                    fm_created = Some(normalize_iso(&v));
                    break;
                }
            }
        }
    }

    let created_at = fm_created
        .clone()
        .or_else(|| fm_date.clone())
        .unwrap_or(fs_created);
    let updated_at = fm_updated
        .or_else(|| fm_date.clone())
        .unwrap_or(fs_modified);

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

fn normalize_iso(s: &str) -> String {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    if trimmed.len() == 10 && trimmed.chars().nth(4) == Some('-') {
        return format!("{}T00:00:00Z", trimmed);
    }
    trimmed.to_string()
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
    let root = state.content_root()?;
    let safe = ensure_inside(&root, Path::new(&path))?;
    let exists = safe.exists();
    let raw = if exists {
        fs::read_to_string(&safe).map_err(|e| e.to_string())?
    } else {
        String::new()
    };
    let rel = safe.strip_prefix(&root).unwrap_or(&safe);
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
    let root = state.content_root()?;
    let safe = ensure_inside(&root, Path::new(&path))?;
    if let Some(parent) = safe.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&safe, content).map_err(|e| e.to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetData {
    pub mime: String,
    pub base64: String,
}

#[tauri::command]
pub fn read_asset(path: String, state: State<'_, AppState>) -> Result<AssetData, String> {
    let root = state.content_root()?;
    let safe = ensure_inside(&root, Path::new(&path))?;
    if !safe.is_file() {
        return Err(format!("not a file: {}", safe.display()));
    }
    let bytes = fs::read(&safe).map_err(|e| e.to_string())?;
    Ok(AssetData {
        mime: guess_mime(&safe),
        base64: general_purpose::STANDARD.encode(&bytes),
    })
}

#[tauri::command]
pub fn write_asset(
    path: String,
    base64: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let root = state.content_root()?;
    let safe = ensure_inside(&root, Path::new(&path))?;
    let bytes = general_purpose::STANDARD
        .decode(base64.trim())
        .map_err(|e| format!("base64 decode: {}", e))?;
    if let Some(parent) = safe.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&safe, bytes).map_err(|e| e.to_string())
}

fn guess_mime(path: &Path) -> String {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    match ext.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "avif" => "image/avif",
        "bmp" => "image/bmp",
        "ico" => "image/x-icon",
        _ => "application/octet-stream",
    }
    .to_string()
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeletedDoc {
    pub removed: String,
    pub unit: String,
    pub files: u64,
    pub backup_path: String,
}

/// 글 하나를 지운다. 폴더형 글(`<slug>/index.md`)이고 그 폴더 안에 다른 글이 없으면 assets까지 폴더째,
/// 아니면 파일만 지운다. 지우기 전에 `data_root/backups/docs-<ts>/<상대경로>`로 복사하고 파일마다
/// 크기를 대조하며, 복사가 하나라도 실패하면 아무것도 지우지 않는다.
#[tauri::command(async)]
pub fn delete_doc(path: String, state: State<'_, AppState>) -> Result<DeletedDoc, String> {
    let root = state.content_root()?;
    delete_doc_in(&root, &state.data_root, &path)
}

fn delete_doc_in(root: &Path, data_root: &Path, path: &str) -> Result<DeletedDoc, String> {
    let safe = ensure_inside(root, Path::new(path))?;
    if !safe.is_file() {
        return Err(format!("not a file: {}", safe.display()));
    }
    if !is_doc_file(&safe) {
        return Err(format!("not a document: {}", safe.display()));
    }
    let canonical_root = root
        .canonicalize()
        .map_err(|e| format!("canonicalize root: {}", e))?;
    let rel = safe
        .strip_prefix(&canonical_root)
        .map_err(|_| format!("path escapes content root: {}", safe.display()))?;
    let parent = safe
        .parent()
        .ok_or_else(|| "invalid path".to_string())?
        .to_path_buf();
    let collection_dir = COLLECTIONS
        .iter()
        .map(|(_, sub)| canonical_root.join(sub))
        .find(|dir| parent.starts_with(dir))
        .ok_or_else(|| format!("not in a collection: {}", rel.display()))?;

    let is_index = safe.file_stem().and_then(|s| s.to_str()) == Some("index");
    let folder_unit = is_index && parent != collection_dir && !has_other_doc(&parent, &safe);
    let (target, unit) = if folder_unit {
        (parent, "folder")
    } else {
        (safe.clone(), "file")
    };
    let target_rel = target
        .strip_prefix(&canonical_root)
        .map_err(|_| format!("path escapes content root: {}", target.display()))?
        .to_path_buf();

    let backup_target = fresh_backup_dir(data_root)?.join(&target_rel);
    let files = copy_tree(&target, &backup_target)?;

    let removal = if folder_unit {
        fs::remove_dir_all(&target)
    } else {
        fs::remove_file(&target)
    };
    removal.map_err(|e| {
        format!(
            "remove {}: {} (backup: {})",
            unit,
            e,
            backup_target.display()
        )
    })?;

    let mut removed = target_rel.to_string_lossy().replace('\\', "/");
    if folder_unit {
        removed.push('/');
    }
    Ok(DeletedDoc {
        removed,
        unit: unit.to_string(),
        files,
        backup_path: backup_target.to_string_lossy().into_owned(),
    })
}

fn is_doc_file(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map_or(false, |ext| ext == "md" || ext == "mdx")
}

fn has_other_doc(dir: &Path, except: &Path) -> bool {
    WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .any(|e| e.file_type().is_file() && is_doc_file(e.path()) && e.path() != except)
}

fn backup_timestamp() -> String {
    tasks::now_iso().replace(['-', ':'], "")
}

/// `data_root/backups/docs-<ts>`를 돌려준다. 같은 초에 이미 쓰인 폴더가 있으면 `-2`, `-3`… 접미사를 붙여
/// 앞선 백업을 덮어쓰지 않는다.
fn fresh_backup_dir(data_root: &Path) -> Result<PathBuf, String> {
    let base = format!("docs-{}", backup_timestamp());
    let backups = data_root.join("backups");
    let mut n = 1u32;
    loop {
        let name = if n == 1 {
            base.clone()
        } else {
            format!("{}-{}", base, n)
        };
        let dir = backups.join(name);
        if !dir.exists() {
            return Ok(dir);
        }
        n += 1;
        if n > 1000 {
            return Err(format!("backup dir: too many backups at {}", base));
        }
    }
}

/// 파일 하나 또는 디렉터리 전체를 `dst`로 복사한다. 파일마다 복사된 바이트 수를 원본 크기와 대조하고,
/// 심볼릭 링크는 거부한다. 복사한 파일 수를 돌려준다.
fn copy_tree(src: &Path, dst: &Path) -> Result<u64, String> {
    let mut files = 0u64;
    for entry in WalkDir::new(src) {
        let entry = entry.map_err(|e| format!("backup walk: {}", e))?;
        let rel = entry
            .path()
            .strip_prefix(src)
            .map_err(|e| format!("backup walk: {}", e))?;
        let out: PathBuf = if rel.as_os_str().is_empty() {
            dst.to_path_buf()
        } else {
            dst.join(rel)
        };
        let kind = entry.file_type();
        if kind.is_symlink() {
            return Err(format!(
                "backup: symlink not supported: {}",
                entry.path().display()
            ));
        }
        if kind.is_dir() {
            fs::create_dir_all(&out).map_err(|e| format!("backup dir: {}", e))?;
            continue;
        }
        if let Some(parent) = out.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("backup dir: {}", e))?;
        }
        let original_len = fs::metadata(entry.path())
            .map_err(|e| format!("backup stat: {}", e))?
            .len();
        let copied = fs::copy(entry.path(), &out).map_err(|e| format!("backup copy: {}", e))?;
        if copied != original_len {
            return Err(format!(
                "backup size mismatch for {} ({} vs {})",
                entry.path().display(),
                copied,
                original_len
            ));
        }
        files += 1;
    }
    Ok(files)
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Fixture {
        root: PathBuf,
        data_root: PathBuf,
    }

    impl Fixture {
        fn new() -> Self {
            let base = std::env::temp_dir().join(format!("bento_docs_{}", uuid::Uuid::new_v4()));
            let root = base.join("content");
            let data_root = base.join("data");
            fs::create_dir_all(root.join("contents/articles")).expect("articles");
            fs::create_dir_all(root.join("contents/notes")).expect("notes");
            fs::create_dir_all(&data_root).expect("data");
            Self { root, data_root }
        }

        fn write(&self, rel: &str, body: &[u8]) {
            let p = self.root.join(rel);
            fs::create_dir_all(p.parent().expect("parent")).expect("mkdir");
            fs::write(p, body).expect("write");
        }

        fn delete(&self, rel: &str) -> Result<DeletedDoc, String> {
            delete_doc_in(&self.root, &self.data_root, rel)
        }

        fn exists(&self, rel: &str) -> bool {
            self.root.join(rel).exists()
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            if let Some(base) = self.root.parent() {
                let _ = fs::remove_dir_all(base);
            }
        }
    }

    #[test]
    fn folder_doc_is_removed_with_assets_and_backed_up() {
        let f = Fixture::new();
        f.write("contents/notes/slug/index.md", b"---\ntitle: a\n---\nbody");
        f.write("contents/notes/slug/assets/1.png", b"png-bytes");
        f.write("contents/notes/slug/assets/nested/2.txt", b"two");
        f.write("contents/notes/other/index.md", b"other");

        let r = f.delete("contents/notes/slug/index.md").expect("delete");
        assert_eq!(r.unit, "folder");
        assert_eq!(r.removed, "contents/notes/slug/");
        assert_eq!(r.files, 3);
        assert!(!f.exists("contents/notes/slug"));
        assert!(f.exists("contents/notes/other/index.md"));
        assert!(f.exists("contents/notes"));

        let backup = Path::new(&r.backup_path);
        assert!(backup.starts_with(f.data_root.join("backups")));
        assert!(backup.ends_with("contents/notes/slug"));
        assert_eq!(
            fs::read(backup.join("index.md")).expect("index"),
            b"---\ntitle: a\n---\nbody"
        );
        assert_eq!(
            fs::read(backup.join("assets/1.png")).expect("png"),
            b"png-bytes"
        );
        assert_eq!(
            fs::read(backup.join("assets/nested/2.txt")).expect("txt"),
            b"two"
        );
    }

    #[test]
    fn index_with_another_doc_in_the_folder_removes_only_the_file() {
        let f = Fixture::new();
        f.write("contents/notes/reports/index.md", b"index");
        f.write("contents/notes/reports/2026/weekly.md", b"weekly");

        let r = f.delete("contents/notes/reports/index.md").expect("delete");
        assert_eq!(r.unit, "file");
        assert_eq!(r.removed, "contents/notes/reports/index.md");
        assert_eq!(r.files, 1);
        assert!(!f.exists("contents/notes/reports/index.md"));
        assert!(f.exists("contents/notes/reports/2026/weekly.md"));
        assert_eq!(fs::read(&r.backup_path).expect("backup"), b"index");
    }

    #[test]
    fn loose_file_removes_only_itself() {
        let f = Fixture::new();
        f.write("contents/articles/foo.md", b"foo");
        f.write("contents/articles/bar.mdx", b"bar");

        let r = f.delete("contents/articles/foo.md").expect("delete");
        assert_eq!(r.unit, "file");
        assert_eq!(r.removed, "contents/articles/foo.md");
        assert!(!f.exists("contents/articles/foo.md"));
        assert!(f.exists("contents/articles/bar.mdx"));
    }

    #[test]
    fn index_at_collection_root_keeps_the_collection_dir() {
        let f = Fixture::new();
        f.write("contents/notes/index.md", b"root index");

        let r = f.delete("contents/notes/index.md").expect("delete");
        assert_eq!(r.unit, "file");
        assert!(!f.exists("contents/notes/index.md"));
        assert!(f.exists("contents/notes"));
    }

    #[test]
    fn same_second_backups_do_not_overwrite_each_other() {
        let f = Fixture::new();
        f.write("contents/notes/slug/index.md", b"first");
        let first = f.delete("contents/notes/slug/index.md").expect("first");
        f.write("contents/notes/slug/index.md", b"second");
        let second = f.delete("contents/notes/slug/index.md").expect("second");

        assert_ne!(first.backup_path, second.backup_path);
        assert_eq!(
            fs::read(Path::new(&first.backup_path).join("index.md")).expect("first"),
            b"first"
        );
        assert_eq!(
            fs::read(Path::new(&second.backup_path).join("index.md")).expect("second"),
            b"second"
        );
    }

    #[test]
    fn refuses_paths_outside_collections_non_docs_missing_and_escapes() {
        let f = Fixture::new();
        f.write("README.md", b"readme");
        f.write("contents/notes-archive/old.md", b"old");
        f.write("contents/notes/img.png", b"png");
        f.write("contents/notes/dir/index.md", b"doc");
        let outside = f.root.parent().expect("base").join("outside.md");
        fs::write(&outside, b"outside").expect("outside");

        assert!(f.delete("README.md").is_err());
        assert!(f.delete("contents/notes-archive/old.md").is_err());
        assert!(f.delete("contents/notes/img.png").is_err());
        assert!(f.delete("contents/notes/missing.md").is_err());
        assert!(f.delete("contents/notes/dir").is_err());
        assert!(f.delete("../outside.md").is_err());

        assert!(f.exists("README.md"));
        assert!(f.exists("contents/notes-archive/old.md"));
        assert!(f.exists("contents/notes/img.png"));
        assert!(f.exists("contents/notes/dir/index.md"));
        assert!(outside.exists());
        assert!(!f.data_root.join("backups").exists());
    }

    #[test]
    fn backup_failure_leaves_the_doc_in_place() {
        let f = Fixture::new();
        f.write("contents/notes/slug/index.md", b"doc");
        f.write("contents/notes/slug/assets/1.png", b"png");
        let blocked = f.data_root.join("not-a-dir");
        fs::write(&blocked, b"file").expect("blocker");

        let err = delete_doc_in(&f.root, &blocked, "contents/notes/slug/index.md")
            .expect_err("backup must fail");
        assert!(err.contains("backup"), "{}", err);
        assert!(f.exists("contents/notes/slug/index.md"));
        assert!(f.exists("contents/notes/slug/assets/1.png"));
    }
}
