use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tauri::State;

use super::keychain;
use crate::repo::{
    ensure_inside, load_config, require_blog_enabled, validate_content_root, AppState,
};

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
    require_blog_enabled(&state.data_root)?;
    let root = state.content_root()?;
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
    require_blog_enabled(&state.data_root)?;
    let root = state.content_root()?;
    log_commits(&root, limit.max(1).min(200))
}

#[tauri::command]
pub fn git_commit_push(
    state: State<'_, AppState>,
    input: CommitInput,
) -> Result<GitCommit, String> {
    require_blog_enabled(&state.data_root)?;
    let root = state.content_root()?;
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
        let cfg = load_config(&state.data_root);
        let remote = cfg
            .blog
            .git_remote
            .clone()
            .ok_or_else(|| "git 원격 주소가 설정되지 않았습니다".to_string())?;
        let branch_setting = cfg.blog.git_branch.clone();
        let branch = branch_setting
            .filter(|s| !s.is_empty())
            .or_else(|| current_branch(&root).ok())
            .unwrap_or_else(|| "main".to_string());
        let token = require_token(&remote)?;
        let url = token_url(&remote, &token)?;
        let refspec = format!("HEAD:{}", branch);
        let mut push_cmd = Command::new("git");
        push_cmd
            .arg("-C")
            .arg(&root)
            .arg("push")
            .arg("--")
            .arg(&url)
            .arg(&refspec);
        run_git_token(&mut push_cmd, &token)?;
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
    cmd.env("GIT_TERMINAL_PROMPT", "0");
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
    cmd.env("GIT_TERMINAL_PROMPT", "0");
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

fn run_git_token(cmd: &mut Command, token: &str) -> Result<Output, String> {
    cmd.env("GIT_TERMINAL_PROMPT", "0");
    let out = cmd
        .output()
        .map_err(|e| sanitize(&format!("git invocation failed: {}", e), token))?;
    if !out.status.success() {
        return Err(sanitize(
            &format!(
                "git failed: {}",
                String::from_utf8_lossy(&out.stderr).trim()
            ),
            token,
        ));
    }
    Ok(out)
}

fn sanitize(msg: &str, token: &str) -> String {
    if token.is_empty() {
        msg.to_string()
    } else {
        msg.replace(token, "[REDACTED]")
    }
}

fn token_url(remote: &str, token: &str) -> Result<String, String> {
    let trimmed = remote.trim();
    if let Some(rest) = trimmed.strip_prefix("https://") {
        return Ok(format!("https://x-access-token:{}@{}", token, rest));
    }
    if let Some(rest) = trimmed.strip_prefix("http://") {
        return Ok(format!("http://x-access-token:{}@{}", token, rest));
    }
    Err(format!(
        "토큰 인증은 https 원격에서만 동작합니다 (원격: {})",
        remote
    ))
}

fn require_token(remote: &str) -> Result<String, String> {
    keychain::read_token(remote)?
        .ok_or_else(|| "키체인에 토큰이 저장되지 않았습니다".to_string())
}

struct BlogSettings {
    content_path: PathBuf,
    remote: String,
    branch: String,
    git_name: Option<String>,
    git_email: Option<String>,
}

fn require_blog_settings(state: &State<'_, AppState>) -> Result<BlogSettings, String> {
    let cfg = load_config(&state.data_root);
    if !cfg.blog.enabled {
        return Err("블로그가 활성화되지 않았습니다".to_string());
    }
    let path = cfg
        .blog
        .content_path
        .ok_or_else(|| "콘텐츠 폴더가 설정되지 않았습니다".to_string())?;
    let remote = cfg
        .blog
        .git_remote
        .ok_or_else(|| "git 원격 주소가 설정되지 않았습니다".to_string())?;
    let branch = cfg
        .blog
        .git_branch
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "main".to_string());
    Ok(BlogSettings {
        content_path: PathBuf::from(path),
        remote,
        branch,
        git_name: cfg.blog.git_name,
        git_email: cfg.blog.git_email,
    })
}

fn has_unmerged(root: &Path) -> Result<bool, String> {
    let files = parse_porcelain(root)?;
    Ok(files.iter().any(|f| {
        let s = f.status.as_str();
        s == "DD" || s == "AA" || s.contains('U')
    }))
}

fn equivalent_remote(a: &str, b: &str) -> bool {
    fn norm(u: &str) -> String {
        let mut s = u.trim().to_string();
        if let Some(idx) = s.find("://") {
            let after = &s[idx + 3..];
            if let Some(at) = after.find('@') {
                let host_path = &after[at + 1..];
                s = format!("{}://{}", &s[..idx], host_path);
            }
        }
        if let Some(stripped) = s.strip_suffix(".git") {
            s = stripped.to_string();
        }
        s
    }
    norm(a) == norm(b)
}

fn ensure_clean_origin(root: &Path, clean: &str) -> Result<(), String> {
    let mut cmd = Command::new("git");
    cmd.arg("-C")
        .arg(root)
        .arg("remote")
        .arg("set-url")
        .arg("origin")
        .arg(clean);
    run_git(&mut cmd).map(|_| ())
}

fn configure_git_user(root: &Path, s: &BlogSettings) -> Result<(), String> {
    if let Some(name) = s.git_name.as_deref().filter(|x| !x.is_empty()) {
        let mut c = Command::new("git");
        c.arg("-C")
            .arg(root)
            .arg("config")
            .arg("user.name")
            .arg(name);
        run_git(&mut c)?;
    }
    if let Some(email) = s.git_email.as_deref().filter(|x| !x.is_empty()) {
        let mut c = Command::new("git");
        c.arg("-C")
            .arg(root)
            .arg("config")
            .arg("user.email")
            .arg(email);
        run_git(&mut c)?;
    }
    Ok(())
}

#[tauri::command]
pub fn blog_setup_workspace(state: State<'_, AppState>) -> Result<String, String> {
    require_blog_enabled(&state.data_root)?;
    let s = require_blog_settings(&state)?;
    let target = s.content_path.clone();

    if let Some(parent) = target.parent() {
        if !parent.is_dir() {
            return Err(format!(
                "상위 디렉토리가 없습니다: {}",
                parent.display()
            ));
        }
    }

    if target.join(".git").exists() {
        let existing = run_capture(
            Command::new("git")
                .arg("-C")
                .arg(&target)
                .arg("remote")
                .arg("get-url")
                .arg("origin"),
        )?;
        let existing = existing.trim();
        if !equivalent_remote(existing, &s.remote) {
            return Err(format!(
                "기존 워킹트리의 origin이 다릅니다: {} (설정: {})",
                existing, s.remote
            ));
        }
        let token = require_token(&s.remote)?;
        let url = token_url(&s.remote, &token)?;
        let mut fetch_cmd = Command::new("git");
        fetch_cmd
            .arg("-C")
            .arg(&target)
            .arg("fetch")
            .arg("--")
            .arg(&url)
            .arg(&s.branch);
        run_git_token(&mut fetch_cmd, &token)?;
        ensure_clean_origin(&target, &s.remote)?;
        configure_git_user(&target, &s)?;
        if validate_content_root(&target) {
            state.set_content_root(target.clone());
        }
        return Ok("기존 워킹트리에서 fetch 완료".to_string());
    }

    if target.exists() {
        let mut iter = fs::read_dir(&target).map_err(|e| format!("폴더 읽기: {}", e))?;
        if iter.next().is_some() {
            return Err(
                "선택한 폴더가 비어있지 않으며 git 워킹트리도 아닙니다".to_string(),
            );
        }
    } else {
        fs::create_dir_all(&target).map_err(|e| format!("폴더 생성: {}", e))?;
    }

    let token = require_token(&s.remote)?;
    let url = token_url(&s.remote, &token)?;
    let mut clone_cmd = Command::new("git");
    clone_cmd
        .arg("clone")
        .arg("-b")
        .arg(&s.branch)
        .arg("--")
        .arg(&url)
        .arg(&target);
    run_git_token(&mut clone_cmd, &token)?;

    if !validate_content_root(&target) {
        return Err("clone은 성공했으나 pnpm-workspace.yaml/contents/가 없습니다".to_string());
    }

    ensure_clean_origin(&target, &s.remote)?;
    configure_git_user(&target, &s)?;
    state.set_content_root(target.clone());
    Ok("clone 완료".to_string())
}

#[tauri::command]
pub fn blog_pull(state: State<'_, AppState>) -> Result<String, String> {
    require_blog_enabled(&state.data_root)?;
    let s = require_blog_settings(&state)?;
    let root = s.content_path.clone();
    if !validate_content_root(&root) {
        return Err("워크스페이스가 준비되지 않았습니다".to_string());
    }
    if has_unmerged(&root)? {
        return Err("머지 충돌이 남아있습니다. 먼저 해결하세요.".to_string());
    }
    let token = require_token(&s.remote)?;
    let url = token_url(&s.remote, &token)?;
    let mut fetch_cmd = Command::new("git");
    fetch_cmd
        .arg("-C")
        .arg(&root)
        .arg("fetch")
        .arg("--")
        .arg(&url)
        .arg(&s.branch);
    run_git_token(&mut fetch_cmd, &token)?;

    let count_out = run_capture(
        Command::new("git")
            .arg("-C")
            .arg(&root)
            .arg("rev-list")
            .arg("--count")
            .arg("HEAD..FETCH_HEAD"),
    )?;
    let behind: u32 = count_out.trim().parse().unwrap_or(0);
    if behind == 0 {
        return Ok("이미 최신입니다".to_string());
    }
    let mut merge_cmd = Command::new("git");
    merge_cmd
        .arg("-C")
        .arg(&root)
        .arg("merge")
        .arg("--ff-only")
        .arg("FETCH_HEAD");
    run_git(&mut merge_cmd)?;
    Ok(format!("FF 머지 완료 ({}개 커밋)", behind))
}
