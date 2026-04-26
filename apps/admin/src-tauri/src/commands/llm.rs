use serde::{Deserialize, Serialize};
use std::fs;
use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpListener};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
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
