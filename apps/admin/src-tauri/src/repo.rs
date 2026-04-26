use std::path::{Path, PathBuf};

pub struct AppState {
    pub vault_root: PathBuf,
}

pub fn resolve_vault_root() -> Result<PathBuf, String> {
    if let Ok(env_root) = std::env::var("VALLISTA_REPO_ROOT") {
        let p = PathBuf::from(env_root);
        if p.join("contents").is_dir() {
            return Ok(p);
        }
    }
    let cwd = std::env::current_dir().map_err(|e| e.to_string())?;
    for ancestor in cwd.ancestors() {
        if ancestor.join("pnpm-workspace.yaml").is_file() && ancestor.join("contents").is_dir() {
            return Ok(ancestor.to_path_buf());
        }
    }
    Err(format!(
        "could not find repo root with contents/ from {}",
        cwd.display()
    ))
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
            "path escapes vault root: {}",
            canonical_abs.display()
        ));
    }
    Ok(canonical_abs)
}
