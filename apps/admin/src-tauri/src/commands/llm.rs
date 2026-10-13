use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tauri::State;

use crate::repo::{build_user_agent, load_config, AppState};

/// 키체인에 Claude API 키를 저장하는 remote 이름. 프론트 `keychainHasToken`과 같은 값.
pub const CLAUDE_KEY_REMOTE: &str = "llm-apikey-claude";

const ANTHROPIC_MESSAGES_URL: &str = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION: &str = "2023-06-01";
const DEFAULT_MAX_TOKENS: u32 = 1024;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(120);
const RETRY_DELAY: Duration = Duration::from_millis(1500);

pub fn default_claude_model() -> String {
    "claude-sonnet-5".to_string()
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LlmSettings {
    #[serde(default = "default_claude_model")]
    pub claude_model: String,
}

impl Default for LlmSettings {
    fn default() -> Self {
        Self {
            claude_model: default_claude_model(),
        }
    }
}

fn llm_settings_path(data_dir: &Path) -> PathBuf {
    data_dir.join("llm_settings.json")
}

fn read_settings(data_dir: &Path) -> LlmSettings {
    let path = llm_settings_path(data_dir);
    fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str::<LlmSettings>(&s).ok())
        .unwrap_or_default()
}

#[tauri::command]
pub fn llm_get_settings(state: State<'_, AppState>) -> LlmSettings {
    read_settings(&state.data_root)
}

#[tauri::command]
pub fn llm_save_settings(settings: LlmSettings, state: State<'_, AppState>) -> Result<(), String> {
    let path = llm_settings_path(&state.data_root);
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("serialize settings: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("write settings: {}", e))
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

/// Messages API 요청 본문. system 역할은 최상위 `system` 필드로 옮기고 나머지는 순서대로 둔다.
fn build_request_body(model: &str, input: &ChatInput) -> Result<serde_json::Value, String> {
    let mut system: Vec<&str> = Vec::new();
    let mut messages: Vec<serde_json::Value> = Vec::new();
    for m in &input.messages {
        match m.role.as_str() {
            "system" => system.push(m.content.as_str()),
            "user" | "assistant" => {
                messages.push(serde_json::json!({ "role": m.role, "content": m.content }))
            }
            other => return Err(format!("unsupported message role: {}", other)),
        }
    }
    if messages.is_empty() {
        return Err("메시지가 비어 있습니다".to_string());
    }
    let mut body = serde_json::json!({
        "model": model,
        "max_tokens": input.max_tokens.unwrap_or(DEFAULT_MAX_TOKENS),
        "messages": messages,
    });
    if !system.is_empty() {
        body["system"] = serde_json::json!(system.join("\n\n"));
    }
    if let Some(t) = input.temperature {
        body["temperature"] = serde_json::json!(t.clamp(0.0, 1.0));
    }
    Ok(body)
}

/// 응답의 text 블록을 이어 붙인다.
fn extract_text(response: &serde_json::Value) -> Option<String> {
    let blocks = response.get("content")?.as_array()?;
    let text: Vec<&str> = blocks
        .iter()
        .filter(|b| b.get("type").and_then(|t| t.as_str()) == Some("text"))
        .filter_map(|b| b.get("text").and_then(|t| t.as_str()))
        .collect();
    if text.is_empty() {
        None
    } else {
        Some(text.join(""))
    }
}

fn describe_api_error(status: u16, body: &str) -> String {
    let detail = serde_json::from_str::<serde_json::Value>(body)
        .ok()
        .and_then(|v| {
            v.pointer("/error/message")
                .and_then(|m| m.as_str())
                .map(|s| s.to_string())
        })
        .unwrap_or_else(|| body.chars().take(300).collect());
    match status {
        401 => format!("Claude API 키가 유효하지 않습니다: {}", detail),
        402 | 403 => format!("Claude API 크레딧 또는 권한 문제입니다: {}", detail),
        404 => format!(
            "모델을 찾을 수 없습니다. 설정에서 모델을 확인하세요: {}",
            detail
        ),
        429 => format!("Claude API 요청 한도를 넘었습니다: {}", detail),
        529 => format!(
            "Claude API가 혼잡합니다. 잠시 후 다시 시도하세요: {}",
            detail
        ),
        _ => format!("Claude API 오류 {}: {}", status, detail),
    }
}

fn is_retryable(status: u16) -> bool {
    matches!(status, 429 | 500 | 502 | 503 | 529)
}

/// Claude Messages API를 호출한다. 키는 키체인에서만 읽고 WebView로 내보내지 않는다.
#[tauri::command]
pub async fn llm_chat(input: ChatInput, state: State<'_, AppState>) -> Result<String, String> {
    let data_root = state.data_root.clone();
    let key =
        crate::commands::keychain::read_token(CLAUDE_KEY_REMOTE, &data_root)?.ok_or_else(|| {
            "Claude API 키가 설정되지 않았습니다. 설정 › 연동에서 등록하세요.".to_string()
        })?;
    let settings = read_settings(&data_root);
    let body = build_request_body(&settings.claude_model, &input)?;
    let ua = build_user_agent(&load_config(&data_root).app);

    let client = reqwest::Client::builder()
        .user_agent(ua)
        .timeout(REQUEST_TIMEOUT)
        .build()
        .map_err(|e| e.to_string())?;

    let mut last_err = String::new();
    for attempt in 0..3 {
        if attempt > 0 {
            tokio::time::sleep(RETRY_DELAY * attempt).await;
        }
        let resp = client
            .post(ANTHROPIC_MESSAGES_URL)
            .header("x-api-key", &key)
            .header("anthropic-version", ANTHROPIC_VERSION)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Claude API 요청 실패: {}", e))?;
        let status = resp.status().as_u16();
        let text = resp.text().await.map_err(|e| e.to_string())?;
        if (200..300).contains(&status) {
            let parsed: serde_json::Value =
                serde_json::from_str(&text).map_err(|e| format!("응답 파싱 실패: {}", e))?;
            return extract_text(&parsed).ok_or_else(|| {
                format!(
                    "unexpected response: {}",
                    text.chars().take(300).collect::<String>()
                )
            });
        }
        last_err = describe_api_error(status, &text);
        if !is_retryable(status) {
            break;
        }
    }
    Err(last_err)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn msg(role: &str, content: &str) -> ChatMessage {
        ChatMessage {
            role: role.to_string(),
            content: content.to_string(),
        }
    }

    #[test]
    fn system_messages_move_to_top_level_field() {
        let input = ChatInput {
            messages: vec![msg("system", "코치"), msg("user", "회고해줘")],
            temperature: Some(0.7),
            max_tokens: Some(480),
        };
        let body = build_request_body("claude-sonnet-5", &input).unwrap();
        assert_eq!(body["model"], "claude-sonnet-5");
        assert_eq!(body["system"], "코치");
        assert_eq!(body["max_tokens"], 480);
        assert_eq!(body["messages"].as_array().unwrap().len(), 1);
        assert_eq!(body["messages"][0]["role"], "user");
    }

    #[test]
    fn user_only_input_has_no_system_and_default_max_tokens() {
        let input = ChatInput {
            messages: vec![msg("user", "안녕")],
            temperature: None,
            max_tokens: None,
        };
        let body = build_request_body("m", &input).unwrap();
        assert!(body.get("system").is_none());
        assert!(body.get("temperature").is_none());
        assert_eq!(body["max_tokens"], DEFAULT_MAX_TOKENS);
    }

    #[test]
    fn rejects_empty_and_unknown_roles() {
        let empty = ChatInput {
            messages: vec![msg("system", "only system")],
            temperature: None,
            max_tokens: None,
        };
        assert!(build_request_body("m", &empty).is_err());
        let unknown = ChatInput {
            messages: vec![msg("tool", "x")],
            temperature: None,
            max_tokens: None,
        };
        assert!(build_request_body("m", &unknown).is_err());
    }

    #[test]
    fn extracts_and_joins_text_blocks() {
        let v = serde_json::json!({
            "content": [
                { "type": "text", "text": "앞" },
                { "type": "tool_use", "id": "x" },
                { "type": "text", "text": "뒤" }
            ]
        });
        assert_eq!(extract_text(&v).as_deref(), Some("앞뒤"));
        assert!(extract_text(&serde_json::json!({ "content": [] })).is_none());
    }

    #[test]
    fn api_error_prefers_message_field() {
        let body = r#"{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}"#;
        let s = describe_api_error(401, body);
        assert!(s.contains("유효하지 않습니다"));
        assert!(s.contains("invalid x-api-key"));
        assert!(describe_api_error(500, "oops").contains("oops"));
    }

    #[test]
    fn settings_default_when_file_missing_or_legacy() {
        let legacy: LlmSettings = serde_json::from_str(
            r#"{"provider":"local","localModel":null,"claudeModel":"claude-sonnet-4-6","openaiModel":"gpt-4o"}"#,
        )
        .unwrap();
        assert_eq!(legacy.claude_model, "claude-sonnet-4-6");
        let empty: LlmSettings = serde_json::from_str("{}").unwrap();
        assert_eq!(empty.claude_model, default_claude_model());
    }
}
