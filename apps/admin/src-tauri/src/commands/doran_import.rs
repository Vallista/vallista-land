//! 생활 기록을 도란으로 한 번 옮긴다 — 계획 블록 · 기분/회고 · 주간·월간 요약 · 생각.
//!
//! Bento 는 블로그 관리만 남기고 생활 기능은 도란으로 간다(MEMORY.md 2026-10-26). 파일을 **그대로** 보내고
//! 모양 바꾸기는 도란 서버(`planBentoImport`)가 한다 — 규칙을 고쳐도 dmg 를 다시 만들 필요가 없게.
//! 서버는 새것만 더하므로(하루 기록은 빈칸만 채움) 몇 번을 눌러도 같다. 이 파일들은 지우지 않는다.
//!
//! 주소·토큰은 루틴 동기화와 같은 자리(`routine_sync::server_and_token`).

use std::fs;
use std::path::Path;
use std::time::Duration;

use serde_json::{json, Value};
use tauri::AppHandle;

use super::routine_sync;

const FILES: [(&str, &str); 3] = [
    ("blocks", "blocks.json"),
    ("moods", "mood.json"),
    ("summaries", "summaries.json"),
];

/// 파일 하나를 목록으로. 없거나 비었으면 빈 목록.
fn read_list(root: &Path, name: &str) -> Result<Vec<Value>, String> {
    let p = root.join(name);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| format!("{name}: {e}"))?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    match serde_json::from_str::<Value>(&raw).map_err(|e| format!("{name}: {e}"))? {
        Value::Array(list) => Ok(list),
        _ => Err(format!("{name}: 목록 모양이 아니에요")),
    }
}

/// 보낼 몸 — `{version: 1, blocks, moods, summaries, thoughts}`.
fn bundle(root: &Path, thoughts: Vec<Value>) -> Result<Value, String> {
    let mut body = json!({ "version": 1, "thoughts": thoughts });
    for (key, file) in FILES {
        body[key] = Value::Array(read_list(root, file)?);
    }
    Ok(body)
}

/// 생각(thoughts)은 화면 저장소에 있어서 프론트가 넘겨준다. 서버의 답(더한 수 · 있던 수 · 뺀 까닭)을 그대로 돌려준다.
#[tauri::command(async)]
pub async fn doran_import(app: AppHandle, thoughts: Vec<Value>) -> Result<Value, String> {
    let (base, token) = routine_sync::server_and_token(&app).await?;
    let body = routine_sync::on_main(&app, move |root| bundle(root, thoughts)).await??;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;
    let res = client
        .post(format!("{base}/api/sync/import/bento"))
        .bearer_auth(&token)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("도란 서버에 닿지 못했어요 — {e}"))?;
    routine_sync::read_body::<Value>(res).await
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_root() -> std::path::PathBuf {
        let p = std::env::temp_dir().join(format!("bento_doran_import_{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&p).unwrap();
        p
    }

    #[test]
    fn bundle_reads_files_as_is_and_tolerates_missing() {
        let dir = temp_root();
        let root = dir.as_path();
        fs::write(root.join("blocks.json"), r#"[{"id":"b1","title":"회의"}]"#).unwrap();
        fs::write(root.join("mood.json"), "").unwrap();
        let body = bundle(root, vec![json!({"id": "t1"})]).unwrap();
        assert_eq!(body["version"], 1);
        assert_eq!(body["blocks"][0]["title"], "회의");
        assert_eq!(body["moods"].as_array().unwrap().len(), 0);
        assert_eq!(body["summaries"].as_array().unwrap().len(), 0);
        assert_eq!(body["thoughts"][0]["id"], "t1");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn bundle_rejects_non_list_file() {
        let dir = temp_root();
        fs::write(dir.join("summaries.json"), r#"{"oops":true}"#).unwrap();
        assert!(bundle(&dir, vec![]).unwrap_err().contains("summaries.json"));
        let _ = fs::remove_dir_all(&dir);
    }
}
