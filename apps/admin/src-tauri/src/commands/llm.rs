use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpListener};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use tauri::ipc::Channel;
use tauri::State;

pub struct LlmState {
    pub data_dir: PathBuf,
    pub child: Mutex<Option<RunningChild>>,
}

pub struct RunningChild {
    pub child: Child,
    pub port: u16,
    pub model: String,
}

impl LlmState {
    pub fn new(data_dir: PathBuf) -> Self {
        Self {
            data_dir,
            child: Mutex::new(None),
        }
    }

    pub fn bin_path(&self) -> PathBuf {
        self.data_dir.join("llama-server")
    }

    pub fn models_dir(&self) -> PathBuf {
        self.data_dir.join("models")
    }
}

impl Drop for LlmState {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.child.lock() {
            if let Some(mut running) = guard.take() {
                let _ = running.child.kill();
                let _ = running.child.wait();
            }
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LlmStatus {
    pub data_dir: String,
    pub bin_path: String,
    pub bin_present: bool,
    pub models_dir: String,
    pub models: Vec<ModelInfo>,
    pub running: bool,
    pub port: Option<u16>,
    pub current_model: Option<String>,
}

fn list_models(dir: &Path) -> Vec<ModelInfo> {
    let mut out = Vec::new();
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return out,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        if ext != "gguf" {
            continue;
        }
        let name = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();
        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
        out.push(ModelInfo {
            name,
            path: path.to_string_lossy().to_string(),
            size,
        });
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    out
}

#[tauri::command]
pub fn llm_status(state: State<'_, LlmState>) -> LlmStatus {
    let bin = state.bin_path();
    let models_dir = state.models_dir();
    let models = list_models(&models_dir);
    let running_info = state
        .child
        .lock()
        .ok()
        .and_then(|g| g.as_ref().map(|r| (r.port, r.model.clone())));
    LlmStatus {
        data_dir: state.data_dir.to_string_lossy().to_string(),
        bin_path: bin.to_string_lossy().to_string(),
        bin_present: bin.is_file(),
        models_dir: models_dir.to_string_lossy().to_string(),
        models,
        running: running_info.is_some(),
        port: running_info.as_ref().map(|(p, _)| *p),
        current_model: running_info.map(|(_, m)| m),
    }
}

fn pick_free_port() -> Result<u16, String> {
    let listener = TcpListener::bind(SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 0))
        .map_err(|e| format!("bind probe: {}", e))?;
    let port = listener
        .local_addr()
        .map_err(|e| format!("local_addr: {}", e))?
        .port();
    drop(listener);
    Ok(port)
}

fn wait_until_ready(port: u16, timeout: Duration) -> bool {
    let start = Instant::now();
    while start.elapsed() < timeout {
        if std::net::TcpStream::connect_timeout(
            &SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port),
            Duration::from_millis(200),
        )
        .is_ok()
        {
            return true;
        }
        thread::sleep(Duration::from_millis(150));
    }
    false
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LlmStartInput {
    pub model_name: String,
    #[serde(default)]
    pub context_size: Option<u32>,
    #[serde(default)]
    pub threads: Option<u32>,
}

#[tauri::command]
pub fn llm_start(input: LlmStartInput, state: State<'_, LlmState>) -> Result<u16, String> {
    {
        let guard = state.child.lock().map_err(|e| e.to_string())?;
        if guard.is_some() {
            return Err("llm server already running".into());
        }
    }
    let bin = state.bin_path();
    if !bin.is_file() {
        return Err(format!("llama-server binary not found: {}", bin.display()));
    }
    let model_path = state.models_dir().join(&input.model_name);
    if !model_path.is_file() {
        return Err(format!("model not found: {}", model_path.display()));
    }
    let port = pick_free_port()?;
    let mut cmd = Command::new(&bin);
    cmd.arg("-m")
        .arg(&model_path)
        .arg("--host")
        .arg("127.0.0.1")
        .arg("--port")
        .arg(port.to_string());
    if let Some(c) = input.context_size {
        cmd.arg("-c").arg(c.to_string());
    }
    if let Some(t) = input.threads {
        cmd.arg("-t").arg(t.to_string());
    }
    cmd.stdout(Stdio::null()).stderr(Stdio::null());
    let child = cmd.spawn().map_err(|e| format!("spawn: {}", e))?;
    if !wait_until_ready(port, Duration::from_secs(30)) {
        let mut child = child;
        let _ = child.kill();
        let _ = child.wait();
        return Err("llm server did not become ready within 30s".into());
    }
    let mut guard = state.child.lock().map_err(|e| e.to_string())?;
    *guard = Some(RunningChild {
        child,
        port,
        model: input.model_name,
    });
    Ok(port)
}

#[tauri::command]
pub fn llm_stop(state: State<'_, LlmState>) -> Result<(), String> {
    let mut guard = state.child.lock().map_err(|e| e.to_string())?;
    if let Some(mut running) = guard.take() {
        let _ = running.child.kill();
        let _ = running.child.wait();
    }
    Ok(())
}

#[tauri::command]
pub async fn llm_health(state: State<'_, LlmState>) -> Result<bool, String> {
    let port = match state.child.lock().map_err(|e| e.to_string())?.as_ref() {
        Some(r) => r.port,
        None => return Ok(false),
    };
    let url = format!("http://127.0.0.1:{}/health", port);
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .map_err(|e| e.to_string())?;
    match client.get(&url).send().await {
        Ok(r) => Ok(r.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[derive(Deserialize, Serialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatInput {
    pub messages: Vec<ChatMessage>,
    #[serde(default)]
    pub temperature: Option<f32>,
    #[serde(default)]
    pub max_tokens: Option<u32>,
}

#[tauri::command]
pub async fn llm_chat(input: ChatInput, state: State<'_, LlmState>) -> Result<String, String> {
    let port = match state.child.lock().map_err(|e| e.to_string())?.as_ref() {
        Some(r) => r.port,
        None => return Err("llm server not running".into()),
    };
    let url = format!("http://127.0.0.1:{}/v1/chat/completions", port);
    let mut body = serde_json::json!({
        "messages": input.messages,
        "stream": false,
    });
    if let Some(t) = input.temperature {
        body["temperature"] = serde_json::json!(t);
    }
    if let Some(m) = input.max_tokens {
        body["max_tokens"] = serde_json::json!(m);
    }
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("request: {}", e))?;
    let status = resp.status();
    let text = resp.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(format!("llm error {}: {}", status, text));
    }
    let parsed: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    let content = parsed
        .pointer("/choices/0/message/content")
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("unexpected response: {}", text))?
        .to_string();
    Ok(content)
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase", tag = "kind", content = "data")]
pub enum DownloadEvent {
    Started { total: Option<u64> },
    Progress { downloaded: u64, total: Option<u64> },
    Finished { path: String },
    Failed { message: String },
}

fn safe_file_name(name: &str) -> Result<(), String> {
    if name.is_empty()
        || name.contains('/')
        || name.contains('\\')
        || name.contains("..")
        || name.starts_with('.')
    {
        return Err(format!("invalid file name: {}", name));
    }
    Ok(())
}

#[tauri::command]
pub async fn llm_download_model(
    url: String,
    file_name: String,
    on_event: Channel<DownloadEvent>,
    state: State<'_, LlmState>,
) -> Result<String, String> {
    safe_file_name(&file_name)?;
    let models_dir = state.models_dir();
    fs::create_dir_all(&models_dir).map_err(|e| e.to_string())?;
    let dest = models_dir.join(&file_name);
    if dest.exists() {
        return Err(format!("already exists: {}", dest.display()));
    }
    let tmp = models_dir.join(format!("{}.part", file_name));
    if tmp.exists() {
        let _ = fs::remove_file(&tmp);
    }

    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| e.to_string())?;
    let resp = match client
        .get(&url)
        .timeout(Duration::from_secs(86_400))
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            let msg = e.to_string();
            let _ = on_event.send(DownloadEvent::Failed {
                message: msg.clone(),
            });
            return Err(msg);
        }
    };
    if !resp.status().is_success() {
        let msg = format!("HTTP {}", resp.status());
        let _ = on_event.send(DownloadEvent::Failed {
            message: msg.clone(),
        });
        return Err(msg);
    }
    let total = resp.content_length();
    let _ = on_event.send(DownloadEvent::Started { total });
    let mut file = match std::fs::File::create(&tmp) {
        Ok(f) => f,
        Err(e) => {
            let msg = e.to_string();
            let _ = on_event.send(DownloadEvent::Failed {
                message: msg.clone(),
            });
            return Err(msg);
        }
    };
    let mut downloaded: u64 = 0;
    let mut last_emit = Instant::now();
    let mut stream = resp;
    loop {
        match stream.chunk().await {
            Ok(Some(chunk)) => {
                if let Err(e) = file.write_all(&chunk) {
                    let _ = fs::remove_file(&tmp);
                    let msg = e.to_string();
                    let _ = on_event.send(DownloadEvent::Failed {
                        message: msg.clone(),
                    });
                    return Err(msg);
                }
                downloaded += chunk.len() as u64;
                if last_emit.elapsed() > Duration::from_millis(150) {
                    let _ = on_event.send(DownloadEvent::Progress { downloaded, total });
                    last_emit = Instant::now();
                }
            }
            Ok(None) => break,
            Err(e) => {
                let _ = fs::remove_file(&tmp);
                let msg = e.to_string();
                let _ = on_event.send(DownloadEvent::Failed {
                    message: msg.clone(),
                });
                return Err(msg);
            }
        }
    }
    if let Err(e) = file.sync_all() {
        let msg = e.to_string();
        let _ = on_event.send(DownloadEvent::Failed {
            message: msg.clone(),
        });
        return Err(msg);
    }
    drop(file);
    if let Err(e) = fs::rename(&tmp, &dest) {
        let msg = e.to_string();
        let _ = on_event.send(DownloadEvent::Failed {
            message: msg.clone(),
        });
        return Err(msg);
    }
    let _ = on_event.send(DownloadEvent::Progress { downloaded, total });
    let path_str = dest.to_string_lossy().to_string();
    let _ = on_event.send(DownloadEvent::Finished {
        path: path_str.clone(),
    });
    Ok(path_str)
}

#[tauri::command]
pub fn llm_delete_model(file_name: String, state: State<'_, LlmState>) -> Result<(), String> {
    safe_file_name(&file_name)?;
    let path = state.models_dir().join(&file_name);
    if !path.is_file() {
        return Err(format!("not found: {}", path.display()));
    }
    if let Some(running_model) = state
        .child
        .lock()
        .map_err(|e| e.to_string())?
        .as_ref()
        .map(|r| r.model.clone())
    {
        if running_model == file_name {
            return Err("cannot delete model while server is running".into());
        }
    }
    fs::remove_file(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn llm_install_binary(
    source_path: String,
    state: State<'_, LlmState>,
) -> Result<String, String> {
    let src = Path::new(&source_path);
    if !src.is_file() {
        return Err(format!("source not found: {}", source_path));
    }
    fs::create_dir_all(&state.data_dir).map_err(|e| e.to_string())?;
    let dest = state.bin_path();
    fs::copy(src, &dest).map_err(|e| format!("copy: {}", e))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&dest)
            .map_err(|e| e.to_string())?
            .permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&dest, perms).map_err(|e| e.to_string())?;
    }
    Ok(dest.to_string_lossy().to_string())
}

fn current_release_target() -> Result<&'static str, String> {
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        return Ok("macos-arm64");
    }
    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    {
        return Ok("macos-x64");
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("자동 설치는 현재 macOS만 지원합니다".into())
    }
}

#[derive(Clone, Copy)]
enum ArchiveKind {
    #[allow(dead_code)]
    Zip,
    #[allow(dead_code)]
    TarGz,
}

fn preferred_archive() -> (ArchiveKind, &'static str) {
    #[cfg(target_os = "windows")]
    {
        return (ArchiveKind::Zip, "zip");
    }
    #[cfg(not(target_os = "windows"))]
    {
        (ArchiveKind::TarGz, "tar.gz")
    }
}

async fn resolve_latest_server_asset() -> Result<(String, ArchiveKind), String> {
    let target = current_release_target()?;
    let (kind, ext) = preferred_archive();
    let client = reqwest::Client::builder()
        .user_agent("Bento/0.1 (+https://vallista.kr)")
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .get("https://api.github.com/repos/ggml-org/llama.cpp/releases/latest")
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| format!("github api: {}", e))?;
    if !resp.status().is_success() {
        return Err(format!("github api: HTTP {}", resp.status()));
    }
    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let assets = json["assets"]
        .as_array()
        .ok_or_else(|| "릴리스 assets 없음".to_string())?;
    let exact_suffix = format!("-bin-{}.{}", target, ext);
    let dot_ext = format!(".{}", ext);
    let mut fallback: Option<String> = None;
    for asset in assets {
        let name = asset["name"].as_str().unwrap_or("");
        if !name.ends_with(&dot_ext) {
            continue;
        }
        if !name.contains(target) {
            continue;
        }
        let url = match asset["browser_download_url"].as_str() {
            Some(u) => u.to_string(),
            None => continue,
        };
        if name.ends_with(&exact_suffix) {
            return Ok((url, kind));
        }
        if fallback.is_none() {
            fallback = Some(url);
        }
    }
    fallback
        .map(|u| (u, kind))
        .ok_or_else(|| format!("최신 릴리스에서 {} {} 아카이브를 찾지 못했습니다", target, ext))
}

async fn stream_to_file(
    url: &str,
    dest: &Path,
    on_event: &Channel<DownloadEvent>,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .user_agent("Bento/0.1 (+https://vallista.kr)")
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .get(url)
        .timeout(Duration::from_secs(86_400))
        .send()
        .await
        .map_err(|e| format!("request: {}", e))?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }
    let total = resp.content_length();
    let _ = on_event.send(DownloadEvent::Started { total });
    let mut file = std::fs::File::create(dest).map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut last_emit = Instant::now();
    let mut stream = resp;
    loop {
        match stream.chunk().await {
            Ok(Some(chunk)) => {
                file.write_all(&chunk).map_err(|e| e.to_string())?;
                downloaded += chunk.len() as u64;
                if last_emit.elapsed() > Duration::from_millis(150) {
                    let _ = on_event.send(DownloadEvent::Progress { downloaded, total });
                    last_emit = Instant::now();
                }
            }
            Ok(None) => break,
            Err(e) => return Err(e.to_string()),
        }
    }
    file.sync_all().map_err(|e| e.to_string())?;
    let _ = on_event.send(DownloadEvent::Progress { downloaded, total });
    Ok(())
}

fn is_runtime_file(file_name: &str) -> (bool, bool) {
    let lower = file_name.to_lowercase();
    let is_server = file_name == "llama-server" || file_name == "llama-server.exe";
    let is_runtime = lower.ends_with(".dylib")
        || lower.ends_with(".so")
        || lower.ends_with(".metal")
        || lower.ends_with(".metallib")
        || lower.ends_with(".dll");
    (is_server, is_runtime)
}

fn write_runtime_file(
    data_dir: &Path,
    file_name: &str,
    is_server: bool,
    reader: &mut dyn std::io::Read,
) -> Result<(), String> {
    let dest = data_dir.join(file_name);
    let mut out = std::fs::File::create(&dest).map_err(|e| e.to_string())?;
    std::io::copy(reader, &mut out).map_err(|e| e.to_string())?;
    out.sync_all().ok();
    drop(out);
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = if is_server { 0o755 } else { 0o644 };
        let mut perms = fs::metadata(&dest)
            .map_err(|e| e.to_string())?
            .permissions();
        perms.set_mode(mode);
        fs::set_permissions(&dest, perms).map_err(|e| e.to_string())?;
    }
    #[cfg(not(unix))]
    {
        let _ = is_server;
    }
    Ok(())
}

fn extract_runtime_files(
    archive_path: &Path,
    kind: ArchiveKind,
    data_dir: &Path,
) -> Result<bool, String> {
    match kind {
        ArchiveKind::Zip => extract_zip(archive_path, data_dir),
        ArchiveKind::TarGz => extract_targz(archive_path, data_dir),
    }
}

fn extract_zip(archive_path: &Path, data_dir: &Path) -> Result<bool, String> {
    let zip_file = std::fs::File::open(archive_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(zip_file).map_err(|e| format!("zip: {}", e))?;
    let mut server_extracted = false;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        if entry.is_dir() {
            continue;
        }
        let name = entry.name().to_string();
        let file_name = match Path::new(&name).file_name().and_then(|s| s.to_str()) {
            Some(n) => n.to_string(),
            None => continue,
        };
        if file_name.is_empty() || file_name.starts_with('.') {
            continue;
        }
        let (is_server, is_runtime) = is_runtime_file(&file_name);
        if !is_server && !is_runtime {
            continue;
        }
        write_runtime_file(data_dir, &file_name, is_server, &mut entry)?;
        if is_server {
            server_extracted = true;
        }
    }
    Ok(server_extracted)
}

fn extract_targz(archive_path: &Path, data_dir: &Path) -> Result<bool, String> {
    let f = std::fs::File::open(archive_path).map_err(|e| e.to_string())?;
    let gz = flate2::read::GzDecoder::new(f);
    let mut tar = tar::Archive::new(gz);
    let entries = tar.entries().map_err(|e| format!("tar: {}", e))?;
    let mut server_extracted = false;
    for entry in entries {
        let mut entry = entry.map_err(|e| e.to_string())?;
        let header_kind = entry.header().entry_type();
        if !header_kind.is_file() {
            continue;
        }
        let path = entry.path().map_err(|e| e.to_string())?.into_owned();
        let file_name = match path.file_name().and_then(|s| s.to_str()) {
            Some(n) => n.to_string(),
            None => continue,
        };
        if file_name.is_empty() || file_name.starts_with('.') {
            continue;
        }
        let (is_server, is_runtime) = is_runtime_file(&file_name);
        if !is_server && !is_runtime {
            continue;
        }
        write_runtime_file(data_dir, &file_name, is_server, &mut entry)?;
        if is_server {
            server_extracted = true;
        }
    }
    Ok(server_extracted)
}

#[tauri::command]
pub async fn llm_download_server(
    on_event: Channel<DownloadEvent>,
    state: State<'_, LlmState>,
) -> Result<String, String> {
    let data_dir = state.data_dir.clone();
    fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    let bin_path = state.bin_path();

    let (url, kind) = match resolve_latest_server_asset().await {
        Ok(v) => v,
        Err(e) => {
            let _ = on_event.send(DownloadEvent::Failed {
                message: e.clone(),
            });
            return Err(e);
        }
    };

    let tmp_archive = data_dir.join("llama-server.archive.part");
    if tmp_archive.exists() {
        let _ = fs::remove_file(&tmp_archive);
    }
    if let Err(e) = stream_to_file(&url, &tmp_archive, &on_event).await {
        let _ = fs::remove_file(&tmp_archive);
        let _ = on_event.send(DownloadEvent::Failed {
            message: e.clone(),
        });
        return Err(e);
    }

    let extracted = match extract_runtime_files(&tmp_archive, kind, &data_dir) {
        Ok(v) => v,
        Err(e) => {
            let _ = fs::remove_file(&tmp_archive);
            let _ = on_event.send(DownloadEvent::Failed {
                message: e.clone(),
            });
            return Err(e);
        }
    };
    let _ = fs::remove_file(&tmp_archive);
    if !extracted {
        let msg = "zip 안에 llama-server를 찾지 못했습니다".to_string();
        let _ = on_event.send(DownloadEvent::Failed {
            message: msg.clone(),
        });
        return Err(msg);
    }

    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("xattr")
            .arg("-rd")
            .arg("com.apple.quarantine")
            .arg(&data_dir)
            .output();
    }

    let path_str = bin_path.to_string_lossy().to_string();
    let _ = on_event.send(DownloadEvent::Finished {
        path: path_str.clone(),
    });
    Ok(path_str)
}

#[tauri::command]
pub fn llm_open_data_dir(state: State<'_, LlmState>) -> Result<(), String> {
    let dir = &state.data_dir;
    fs::create_dir_all(dir).ok();
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(dir)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(dir)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(dir)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    {
        Err("unsupported platform".into())
    }
}
