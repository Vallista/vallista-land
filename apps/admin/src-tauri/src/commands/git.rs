use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::{Command, Output};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GitFile {
    pub path: String,
    pub status: String,
    pub staged: bool,
    pub unstaged: bool,
    pub untracked: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GitCommit {
    pub hash: String,
    pub subject: String,
    pub author: String,
    pub time: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitState {
    pub branch: String,
    pub upstream: Option<String>,
    pub ahead: u32,
    pub behind: u32,
    pub files: Vec<GitFile>,
    pub last_commit: Option<GitCommit>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitInput {
    pub message: String,
    pub paths: Vec<String>,
    pub push: bool,
}

#[tauri::command]
pub fn git_status(state: State<'_, AppState>) -> Result<GitState, String> {
    let root = state.vault_root.clone();
    let branch = current_branch(&root)?;
    let upstream = upstream_for(&root);
    let (ahead, behind) = match &upstream {
        Some(u) => count_ahead_behind(&root, u, &branch).unwrap_or((0, 0)),
        None => (0, 0),
    };
    let files = parse_porcelain(&root)?;
    let last = log_commits(&root, 1)?.into_iter().next();
    Ok(GitState {
        branch,
        upstream,
        ahead,
        behind,
        files,
        last_commit: last,
    })
}

#[tauri::command]
pub fn git_log(state: State<'_, AppState>, limit: u32) -> Result<Vec<GitCommit>, String> {
    let root = state.vault_root.clone();
    log_commits(&root, limit.max(1).min(200))
}

#[tauri::command]
pub fn git_commit_push(
    state: State<'_, AppState>,
    input: CommitInput,
) -> Result<GitCommit, String> {
    let root = state.vault_root.clone();
    let msg = input.message.trim().to_string();
    if msg.is_empty() {
        return Err("commit message is empty".into());
    }
    if input.paths.is_empty() {
        return Err("no files selected".into());
    }
    let mut safe_paths: Vec<String> = Vec::with_capacity(input.paths.len());
    for raw in &input.paths {
        let abs = ensure_inside(&root, Path::new(raw))?;
        let rel = abs
            .strip_prefix(&root.canonicalize().map_err(|e| e.to_string())?)
            .map_err(|_| format!("path outside root: {}", raw))?;
        safe_paths.push(rel.to_string_lossy().to_string());
    }

    let mut add = Command::new("git");
    add.arg("-C").arg(&root).arg("add").arg("--");
    for p in &safe_paths {
        add.arg(p);
    }
    run_git(&mut add)?;

    let staged = run_capture(
        Command::new("git")
            .arg("-C")
            .arg(&root)
            .arg("diff")
            .arg("--cached")
            .arg("--name-only"),
    )?;
    if staged.trim().is_empty() {
        return Err("nothing staged after add (paths matched no changes)".into());
    }

    run_git(
        Command::new("git")
            .arg("-C")
            .arg(&root)
            .arg("commit")
            .arg("-m")
            .arg(&msg),
    )?;

    if input.push {
        run_git(Command::new("git").arg("-C").arg(&root).arg("push"))?;
    }

    let last = log_commits(&root, 1)?
        .into_iter()
        .next()
        .ok_or_else(|| "commit succeeded but log is empty".to_string())?;
    Ok(last)
}

fn current_branch(root: &Path) -> Result<String, String> {
    let out = run_capture(
        Command::new("git")
            .arg("-C")
            .arg(root)
            .arg("rev-parse")
            .arg("--abbrev-ref")
            .arg("HEAD"),
    )?;
    Ok(out.trim().to_string())
}

fn upstream_for(root: &Path) -> Option<String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(root)
        .arg("rev-parse")
        .arg("--abbrev-ref")
        .arg("--symbolic-full-name")
        .arg("@{upstream}")
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

fn count_ahead_behind(root: &Path, upstream: &str, branch: &str) -> Result<(u32, u32), String> {
    let range = format!("{}...{}", upstream, branch);
    let out = run_capture(
        Command::new("git")
            .arg("-C")
            .arg(root)
            .arg("rev-list")
            .arg("--left-right")
            .arg("--count")
            .arg(&range),
    )?;
    let parts: Vec<&str> = out.split_whitespace().collect();
    if parts.len() < 2 {
        return Ok((0, 0));
    }
    let behind = parts[0].parse::<u32>().unwrap_or(0);
    let ahead = parts[1].parse::<u32>().unwrap_or(0);
    Ok((ahead, behind))
}

fn parse_porcelain(root: &Path) -> Result<Vec<GitFile>, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(root)
        .arg("status")
        .arg("--porcelain=v1")
        .arg("-z")
        .output()
        .map_err(|e| format!("git status failed: {}", e))?;
    if !out.status.success() {
        return Err(format!(
            "git status: {}",
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }
    let raw = out.stdout;
    let mut files: Vec<GitFile> = Vec::new();
    let mut i = 0;
    while i < raw.len() {
        if raw.len() < i + 3 {
            break;
        }
        let x = raw[i] as char;
        let y = raw[i + 1] as char;
        i += 3;
        let mut end = i;
        while end < raw.len() && raw[end] != 0 {
            end += 1;
        }
        let path = String::from_utf8_lossy(&raw[i..end]).to_string();
        i = end + 1;
        if (x == 'R' || x == 'C') && i < raw.len() {
            let mut end2 = i;
            while end2 < raw.len() && raw[end2] != 0 {
                end2 += 1;
            }
            i = end2 + 1;
        }
        let untracked = x == '?' && y == '?';
        let staged = !untracked && x != ' ' && x != '?';
        let unstaged = !untracked && y != ' ' && y != '?';
        let status = if untracked {
            "??".to_string()
        } else {
            let s = format!("{}{}", x, y);
            s.trim().to_string()
        };
        files.push(GitFile {
            path,
            status,
            staged,
            unstaged,
            untracked,
        });
    }
    Ok(files)
}

fn log_commits(root: &Path, limit: u32) -> Result<Vec<GitCommit>, String> {
    let format = "%h%x00%s%x00%an%x00%aI";
    let out = run_capture(
        Command::new("git")
            .arg("-C")
            .arg(root)
            .arg("log")
            .arg(format!("-n{}", limit))
            .arg(format!("--pretty=format:{}", format))
            .arg("-z"),
    )?;
    let mut commits: Vec<GitCommit> = Vec::new();
    let parts: Vec<&str> = out.split('\0').collect();
    for chunk in parts.chunks(4) {
        if chunk.len() < 4 {
            continue;
        }
        let hash = chunk[0].trim();
        if hash.is_empty() {
            continue;
        }
        commits.push(GitCommit {
            hash: hash.to_string(),
            subject: chunk[1].to_string(),
            author: chunk[2].to_string(),
            time: chunk[3].to_string(),
        });
    }
    Ok(commits)
}

fn run_git(cmd: &mut Command) -> Result<Output, String> {
    let out = cmd
        .output()
        .map_err(|e| format!("git invocation failed: {}", e))?;
    if !out.status.success() {
        return Err(format!(
            "git failed: {}",
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }
    Ok(out)
}

fn run_capture(cmd: &mut Command) -> Result<String, String> {
    let out = cmd
        .output()
        .map_err(|e| format!("git invocation failed: {}", e))?;
    if !out.status.success() {
        return Err(format!(
            "git failed: {}",
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}
