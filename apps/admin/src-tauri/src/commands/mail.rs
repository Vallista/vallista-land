use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::{Arc, OnceLock};
use std::time::Duration;

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use futures::TryStreamExt;
use mailparse::MailHeaderMap;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::sync::Mutex;

use crate::repo::{ensure_inside, AppState};

const ACCOUNTS_FILE: &str = "mail_accounts.json";
const KEY_FILE: &str = "mail.key";
const PAGE_SIZE: u32 = 30;
const IMAP_TIMEOUT_SECS: u64 = 25;

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum AuthKind {
    #[default]
    Password,
    OAuth2,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MailAccount {
    pub id: String,
    pub label: String,
    pub host: String,
    pub port: u16,
    pub tls: bool,
    pub username: String,
    // password auth
    #[serde(default)]
    pub password_enc: String,
    // oauth auth
    #[serde(default)]
    pub auth_kind: AuthKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub oauth_client_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub oauth_client_secret_enc: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub oauth_refresh_token_enc: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MailAccountInput {
    #[serde(default)]
    pub id: Option<String>,
    pub label: String,
    pub host: String,
    pub port: u16,
    pub tls: bool,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MailFolder {
    pub name: String,
    pub delimiter: String,
    pub flags: Vec<String>,
    pub unread: u32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MailMessage {
    pub uid: u32,
    pub subject: String,
    pub from: String,
    pub date: String,
    pub seen: bool,
    pub flagged: bool,
    pub has_attachments: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub folder: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub account_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MailMessageFull {
    pub uid: u32,
    pub subject: String,
    pub from: String,
    pub to: String,
    pub date: String,
    pub seen: bool,
    pub flagged: bool,
    pub body_text: String,
    pub body_html: String,
    pub attachments: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MailListResult {
    pub messages: Vec<MailMessage>,
    pub total: u32,
    pub unseen: u32,
}

// 헤더 페치 결과를 매크로 밖으로 들고나오기 위한 중간 구조 (concrete type 통일)
#[derive(Clone)]
struct FetchHeader {
    uid: u32,
    flags: Vec<String>,
    bodystructure_dump: String,
    header_bytes: Vec<u8>,
}

#[derive(Clone)]
struct FetchBody {
    uid: u32,
    flags: Vec<String>,
    body_bytes: Vec<u8>,
}

// ────────────────────────────────────────────────────────────
// Storage helpers
// ────────────────────────────────────────────────────────────

fn accounts_path(root: &Path) -> std::path::PathBuf {
    root.join(ACCOUNTS_FILE)
}

fn load_accounts(root: &Path) -> Result<Vec<MailAccount>, String> {
    let p = accounts_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<MailAccount>>(&raw).map_err(|e| e.to_string())
}

fn save_accounts(root: &Path, accounts: &[MailAccount]) -> Result<(), String> {
    let p = accounts_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(accounts).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

// ────────────────────────────────────────────────────────────
// Encryption (AES-256-GCM, key persisted to data_root/mail.key)
// ────────────────────────────────────────────────────────────

fn load_or_create_key(data_root: &Path) -> Result<[u8; 32], String> {
    let path = data_root.join(KEY_FILE);
    if path.is_file() {
        let bytes = fs::read(&path).map_err(|e| e.to_string())?;
        if bytes.len() != 32 {
            return Err("mail.key length is not 32 bytes".into());
        }
        let mut out = [0u8; 32];
        out.copy_from_slice(&bytes);
        return Ok(out);
    }
    let mut key = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut key);
    let safe = ensure_inside(data_root, &path)?;
    fs::write(&safe, &key).map_err(|e| e.to_string())?;
    Ok(key)
}

fn encrypt_password(key: &[u8; 32], password: &str) -> Result<String, String> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ct = cipher
        .encrypt(nonce, password.as_bytes())
        .map_err(|e| format!("encrypt: {}", e))?;
    let mut out = Vec::with_capacity(12 + ct.len());
    out.extend_from_slice(&nonce_bytes);
    out.extend_from_slice(&ct);
    Ok(B64.encode(out))
}

fn decrypt_password(key: &[u8; 32], enc: &str) -> Result<String, String> {
    let bytes = B64.decode(enc).map_err(|e| format!("base64: {}", e))?;
    if bytes.len() < 13 {
        return Err("ciphertext too short".into());
    }
    let (nonce_bytes, ct) = bytes.split_at(12);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Nonce::from_slice(nonce_bytes);
    let plain = cipher
        .decrypt(nonce, ct)
        .map_err(|e| format!("decrypt: {}", e))?;
    String::from_utf8(plain).map_err(|e| format!("utf8: {}", e))
}

// ────────────────────────────────────────────────────────────
// Sync mutex (IMAP connections are heavy; serialize per-account ops)
// ────────────────────────────────────────────────────────────

static ACCOUNT_LOCKS: OnceLock<std::sync::Mutex<HashMap<String, Arc<Mutex<()>>>>> = OnceLock::new();

fn pool_lock(key: &str) -> Arc<Mutex<()>> {
    ACCOUNT_LOCKS
        .get_or_init(|| std::sync::Mutex::new(HashMap::new()))
        .lock()
        .unwrap()
        .entry(key.to_string())
        .or_insert_with(|| Arc::new(Mutex::new(())))
        .clone()
}

// ────────────────────────────────────────────────────────────
// Session pool (세션 재사용으로 연결 지연 제거)
// ────────────────────────────────────────────────────────────

struct MailSessionPool {
    sessions: HashMap<String, ImapSession>,
}

static SESSION_POOL: OnceLock<Mutex<MailSessionPool>> = OnceLock::new();

fn session_pool() -> &'static Mutex<MailSessionPool> {
    SESSION_POOL.get_or_init(|| Mutex::new(MailSessionPool {
        sessions: HashMap::new(),
    }))
}

async fn noop_session(session: &mut ImapSession) -> bool {
    match session {
        ImapSession::Tls(s) => s.noop().await.is_ok(),
        ImapSession::Plain(s) => s.noop().await.is_ok(),
    }
}

async fn acquire_session(data_root: &Path, pool_key: &str, account_id: &str) -> Result<ImapSession, String> {
    let cached = {
        let mut pool = session_pool().lock().await;
        pool.sessions.remove(pool_key)
    };
    if let Some(mut sess) = cached {
        if noop_session(&mut sess).await {
            return Ok(sess);
        }
        // 세션 죽음 → 재연결 (아래로 fall-through)
    }
    let (sess, _) = open_session(data_root, account_id).await?;
    Ok(sess)
}

async fn release_session(pool_key: String, session: ImapSession, ok: bool) {
    if ok {
        session_pool().lock().await.sessions.insert(pool_key, session);
    } else {
        let _ = tokio::time::timeout(Duration::from_secs(3), async {
            logout(session).await;
        })
        .await;
    }
}

fn is_retryable_error(e: &str) -> bool {
    let l = e.to_ascii_lowercase();
    l.contains("bye") || l.contains("connection") || l.contains("broken pipe")
        || l.contains("eof") || l.contains("timed out") || l.contains("io error")
        || l.contains("reset")
}

// ────────────────────────────────────────────────────────────
// IMAP session abstraction (TLS / plain)
//
// `impl Stream<...>` 반환 타입이 TLS/Plain 두 갈래에서 서로 다른
// opaque type으로 추론되어 match arms type mismatch가 발생.
// 따라서 모든 IMAP 연산은 generic helper에 캡슐화하고 호출 측은
// concrete `Vec<…>`/`Result<…>` 만 다루도록 한다.
// ────────────────────────────────────────────────────────────

type TlsStream = async_native_tls::TlsStream<tokio::net::TcpStream>;
type TlsSession = async_imap::Session<TlsStream>;
type PlainSession = async_imap::Session<tokio::net::TcpStream>;

enum ImapSession {
    Tls(TlsSession),
    Plain(PlainSession),
}

enum ImapCredentials {
    Password(String),
    OAuth2 { access_token: String },
}

struct XOAuth2Auth {
    username: String,
    access_token: String,
}

impl async_imap::Authenticator for XOAuth2Auth {
    type Response = Vec<u8>;
    fn process(&mut self, _challenge: &[u8]) -> Vec<u8> {
        format!(
            "user={}\x01auth=Bearer {}\x01\x01",
            self.username, self.access_token
        )
        .into_bytes()
    }
}

async fn connect_imap(account: &MailAccount, creds: ImapCredentials) -> Result<ImapSession, String> {
    let addr = format!("{}:{}", account.host, account.port);
    let connect_fut = tokio::net::TcpStream::connect(&addr);
    let stream = tokio::time::timeout(Duration::from_secs(IMAP_TIMEOUT_SECS), connect_fut)
        .await
        .map_err(|_| format!("TCP connect timeout: {}", addr))?
        .map_err(|e| format!("TCP connect: {}", e))?;

    if account.tls {
        let connector = async_native_tls::TlsConnector::new();
        let tls_fut = connector.connect(account.host.as_str(), stream);
        let tls_stream = tokio::time::timeout(Duration::from_secs(IMAP_TIMEOUT_SECS), tls_fut)
            .await
            .map_err(|_| "TLS handshake timeout".to_string())?
            .map_err(|e| format!("TLS: {}", e))?;
        let client = async_imap::Client::new(tls_stream);
        let sess = match creds {
            ImapCredentials::Password(ref pw) => tokio::time::timeout(
                Duration::from_secs(IMAP_TIMEOUT_SECS),
                client.login(account.username.as_str(), pw.as_str()),
            )
            .await
            .map_err(|_| "IMAP login timeout".to_string())?
            .map_err(|(e, _)| format!("IMAP login: {}", e))?,
            ImapCredentials::OAuth2 { ref access_token } => {
                let auth = XOAuth2Auth {
                    username: account.username.clone(),
                    access_token: access_token.clone(),
                };
                tokio::time::timeout(
                    Duration::from_secs(IMAP_TIMEOUT_SECS),
                    client.authenticate("XOAUTH2", auth),
                )
                .await
                .map_err(|_| "XOAUTH2 auth timeout".to_string())?
                .map_err(|(e, _)| format!("XOAUTH2 auth: {}", e))?
            }
        };
        Ok(ImapSession::Tls(sess))
    } else {
        let client = async_imap::Client::new(stream);
        let sess = match creds {
            ImapCredentials::Password(ref pw) => tokio::time::timeout(
                Duration::from_secs(IMAP_TIMEOUT_SECS),
                client.login(account.username.as_str(), pw.as_str()),
            )
            .await
            .map_err(|_| "IMAP login timeout".to_string())?
            .map_err(|(e, _)| format!("IMAP login: {}", e))?,
            ImapCredentials::OAuth2 { ref access_token } => {
                let auth = XOAuth2Auth {
                    username: account.username.clone(),
                    access_token: access_token.clone(),
                };
                tokio::time::timeout(
                    Duration::from_secs(IMAP_TIMEOUT_SECS),
                    client.authenticate("XOAUTH2", auth),
                )
                .await
                .map_err(|_| "XOAUTH2 auth timeout".to_string())?
                .map_err(|(e, _)| format!("XOAUTH2 auth: {}", e))?
            }
        };
        Ok(ImapSession::Plain(sess))
    }
}

async fn logout(session: ImapSession) {
    match session {
        ImapSession::Tls(mut s) => {
            let _ = s.logout().await;
        }
        ImapSession::Plain(mut s) => {
            let _ = s.logout().await;
        }
    }
}

fn find_account(accounts: &[MailAccount], id: &str) -> Result<MailAccount, String> {
    accounts
        .iter()
        .find(|a| a.id == id)
        .cloned()
        .ok_or_else(|| format!("account not found: {}", id))
}

async fn open_session(
    data_root: &Path,
    account_id: &str,
) -> Result<(ImapSession, MailAccount), String> {
    let accounts = load_accounts(data_root)?;
    let account = find_account(&accounts, account_id)?;
    let key = load_or_create_key(data_root)?;

    let creds = match account.auth_kind {
        AuthKind::Password => {
            let password = decrypt_password(&key, &account.password_enc)?;
            ImapCredentials::Password(password)
        }
        AuthKind::OAuth2 => {
            let access_token = refresh_oauth_token(&account, &key).await?;
            ImapCredentials::OAuth2 { access_token }
        }
    };

    let session = connect_imap(&account, creds).await?;
    Ok((session, account))
}

async fn refresh_oauth_token(account: &MailAccount, key: &[u8; 32]) -> Result<String, String> {
    let client_id = account
        .oauth_client_id
        .as_deref()
        .ok_or("oauth_client_id 없음")?;
    let client_secret_enc = account
        .oauth_client_secret_enc
        .as_deref()
        .ok_or("oauth_client_secret_enc 없음")?;
    let refresh_token_enc = account
        .oauth_refresh_token_enc
        .as_deref()
        .ok_or("oauth_refresh_token_enc 없음")?;
    let client_secret = decrypt_password(key, client_secret_enc)?;
    let refresh_token = decrypt_password(key, refresh_token_enc)?;

    let http = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = http
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", client_id),
            ("client_secret", client_secret.as_str()),
            ("refresh_token", refresh_token.as_str()),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await
        .map_err(|e| format!("token refresh request: {}", e))?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("token refresh failed {}: {}", status, body));
    }
    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    json["access_token"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| format!("access_token 없음: {:?}", json))
}

// ────────────────────────────────────────────────────────────
// Generic IMAP helpers (work on concrete TlsSession / PlainSession)
//
// 이 helpers는 `S: AsyncRead + AsyncWrite + Unpin + Send` 같은 일반화 대신
// 두 concrete type을 매크로로 dispatch하는 enum 패턴을 쓴다.
// 핵심: stream을 즉시 collect해서 `Vec<...>` 으로 반환 → opaque type leak 회피.
// ────────────────────────────────────────────────────────────

fn encode_modified_utf7(s: &str) -> String {
    let mut result = String::new();
    let mut pending_utf16: Vec<u16> = Vec::new();

    let flush = |pending: &mut Vec<u16>, out: &mut String| {
        if pending.is_empty() {
            return;
        }
        let bytes: Vec<u8> = pending.iter().flat_map(|&u| u.to_be_bytes()).collect();
        // RFC 3501 §5.1.3: Modified UTF-7는 패딩 없는 base64 사용
        let b64 = B64.encode(&bytes).replace('/', ",").trim_end_matches('=').to_string();
        out.push('&');
        out.push_str(&b64);
        out.push('-');
        pending.clear();
    };

    for c in s.chars() {
        if c == '&' {
            flush(&mut pending_utf16, &mut result);
            result.push_str("&-");
        } else if c.is_ascii_graphic() || c == ' ' {
            flush(&mut pending_utf16, &mut result);
            result.push(c);
        } else {
            let mut buf = [0u16; 2];
            for unit in c.encode_utf16(&mut buf) {
                pending_utf16.push(*unit);
            }
        }
    }
    flush(&mut pending_utf16, &mut result);
    result
}

fn decode_modified_utf7(s: &str) -> String {
    let mut result = String::new();
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c != '&' {
            result.push(c);
            continue;
        }
        let mut encoded = String::new();
        let mut closed = false;
        for inner in chars.by_ref() {
            if inner == '-' {
                closed = true;
                break;
            }
            encoded.push(inner);
        }
        if !closed || encoded.is_empty() {
            // &- → literal '&', or malformed → pass through
            result.push('&');
            result.push_str(&encoded);
            continue;
        }
        // Modified base64: ',' stands in for '/'
        let b64 = encoded.replace(',', "/");
        let padded = match b64.len() % 4 {
            2 => format!("{}==", b64),
            3 => format!("{}=", b64),
            _ => b64,
        };
        match B64.decode(&padded) {
            Ok(bytes) if bytes.len() % 2 == 0 => {
                let units: Vec<u16> = bytes
                    .chunks_exact(2)
                    .map(|c| u16::from_be_bytes([c[0], c[1]]))
                    .collect();
                match String::from_utf16(&units) {
                    Ok(decoded) => result.push_str(&decoded),
                    Err(_) => {
                        result.push('&');
                        result.push_str(&encoded);
                        result.push('-');
                    }
                }
            }
            _ => {
                result.push('&');
                result.push_str(&encoded);
                result.push('-');
            }
        }
    }
    result
}

async fn imap_list(session: &mut ImapSession) -> Result<Vec<MailFolder>, String> {
    let folders = match session {
        ImapSession::Tls(s) => {
            let stream = s
                .list(Some(""), Some("*"))
                .await
                .map_err(|e| format!("LIST: {}", e))?;
            stream
                .map_ok(|name| MailFolder {
                    name: decode_modified_utf7(name.name()),
                    delimiter: name.delimiter().unwrap_or("/").to_string(),
                    flags: name
                        .attributes()
                        .iter()
                        .map(|f| format!("{:?}", f))
                        .collect(),
                    unread: 0,
                })
                .try_collect::<Vec<_>>()
                .await
                .map_err(|e: async_imap::error::Error| format!("LIST collect: {}", e))?
        }
        ImapSession::Plain(s) => {
            let stream = s
                .list(Some(""), Some("*"))
                .await
                .map_err(|e| format!("LIST: {}", e))?;
            stream
                .map_ok(|name| MailFolder {
                    name: decode_modified_utf7(name.name()),
                    delimiter: name.delimiter().unwrap_or("/").to_string(),
                    flags: name
                        .attributes()
                        .iter()
                        .map(|f| format!("{:?}", f))
                        .collect(),
                    unread: 0,
                })
                .try_collect::<Vec<_>>()
                .await
                .map_err(|e: async_imap::error::Error| format!("LIST collect: {}", e))?
        }
    };
    Ok(folders)
}

async fn imap_examine(session: &mut ImapSession, folder: &str) -> Result<(), String> {
    // async_imap의 quote! 매크로가 내부에서 따옴표를 추가하므로 추가 quoting 없이 전달
    let mailbox = encode_modified_utf7(folder);
    match session {
        ImapSession::Tls(s) => {
            s.examine(mailbox.as_str())
                .await
                .map_err(|e| format!("EXAMINE {}: {}", folder, e))?;
        }
        ImapSession::Plain(s) => {
            s.examine(mailbox.as_str())
                .await
                .map_err(|e| format!("EXAMINE {}: {}", folder, e))?;
        }
    }
    Ok(())
}

async fn imap_examine_info(session: &mut ImapSession, folder: &str) -> Result<u32, String> {
    let mailbox = encode_modified_utf7(folder);
    let mb = match session {
        ImapSession::Tls(s) => s
            .examine(mailbox.as_str())
            .await
            .map_err(|e| format!("EXAMINE {}: {}", folder, e))?,
        ImapSession::Plain(s) => s
            .examine(mailbox.as_str())
            .await
            .map_err(|e| format!("EXAMINE {}: {}", folder, e))?,
    };
    Ok(mb.exists)
}

async fn imap_select(session: &mut ImapSession, folder: &str) -> Result<(), String> {
    let mailbox = encode_modified_utf7(folder);
    match session {
        ImapSession::Tls(s) => {
            s.select(mailbox.as_str())
                .await
                .map_err(|e| format!("SELECT {}: {}", folder, e))?;
        }
        ImapSession::Plain(s) => {
            s.select(mailbox.as_str())
                .await
                .map_err(|e| format!("SELECT {}: {}", folder, e))?;
        }
    }
    Ok(())
}


async fn imap_uid_search_since(session: &mut ImapSession, days: u32) -> Result<Vec<u32>, String> {
    let d = chrono::Utc::now() - chrono::Duration::days(days as i64);
    let query = format!("{}-{}-{}", d.format("%-d"), d.format("%b"), d.format("%Y"));
    let query = format!("SINCE {}", query);
    let uids: std::collections::HashSet<u32> = match session {
        ImapSession::Tls(s) => s
            .uid_search(query.as_str())
            .await
            .map_err(|e| format!("UID SEARCH: {}", e))?,
        ImapSession::Plain(s) => s
            .uid_search(query.as_str())
            .await
            .map_err(|e| format!("UID SEARCH: {}", e))?,
    };
    Ok(uids.into_iter().collect())
}

async fn imap_uid_search_unseen(session: &mut ImapSession) -> Result<Vec<u32>, String> {
    let uids: std::collections::HashSet<u32> = match session {
        ImapSession::Tls(s) => s
            .uid_search("UNSEEN")
            .await
            .map_err(|e| format!("UID SEARCH: {}", e))?,
        ImapSession::Plain(s) => s
            .uid_search("UNSEEN")
            .await
            .map_err(|e| format!("UID SEARCH: {}", e))?,
    };
    Ok(uids.into_iter().collect())
}

async fn imap_fetch_headers(
    session: &mut ImapSession,
    uid_set: &str,
) -> Result<Vec<FetchHeader>, String> {
    let raw: Vec<async_imap::types::Fetch> = match session {
        ImapSession::Tls(s) => {
            let stream = s
                .uid_fetch(uid_set, "(UID FLAGS BODYSTRUCTURE RFC822.HEADER)")
                .await
                .map_err(|e| format!("UID FETCH: {}", e))?;
            stream
                .try_collect()
                .await
                .map_err(|e: async_imap::error::Error| format!("FETCH collect: {}", e))?
        }
        ImapSession::Plain(s) => {
            let stream = s
                .uid_fetch(uid_set, "(UID FLAGS BODYSTRUCTURE RFC822.HEADER)")
                .await
                .map_err(|e| format!("UID FETCH: {}", e))?;
            stream
                .try_collect()
                .await
                .map_err(|e: async_imap::error::Error| format!("FETCH collect: {}", e))?
        }
    };
    Ok(raw
        .into_iter()
        .map(|f| FetchHeader {
            uid: f.uid.unwrap_or(0),
            flags: f.flags().map(|fl| format!("{:?}", fl)).collect(),
            bodystructure_dump: format!("{:?}", f.bodystructure()),
            header_bytes: f.header().unwrap_or(&[]).to_vec(),
        })
        .collect())
}

async fn imap_fetch_headers_seq(
    session: &mut ImapSession,
    seq_set: &str,
) -> Result<Vec<FetchHeader>, String> {
    let raw: Vec<async_imap::types::Fetch> = match session {
        ImapSession::Tls(s) => {
            let stream = s
                .fetch(seq_set, "(UID FLAGS BODYSTRUCTURE RFC822.HEADER)")
                .await
                .map_err(|e| format!("FETCH: {}", e))?;
            tokio::time::timeout(Duration::from_secs(IMAP_TIMEOUT_SECS), stream.try_collect())
                .await
                .map_err(|_| "FETCH collect timeout".to_string())?
                .map_err(|e: async_imap::error::Error| format!("FETCH collect: {}", e))?
        }
        ImapSession::Plain(s) => {
            let stream = s
                .fetch(seq_set, "(UID FLAGS BODYSTRUCTURE RFC822.HEADER)")
                .await
                .map_err(|e| format!("FETCH: {}", e))?;
            tokio::time::timeout(Duration::from_secs(IMAP_TIMEOUT_SECS), stream.try_collect())
                .await
                .map_err(|_| "FETCH collect timeout".to_string())?
                .map_err(|e: async_imap::error::Error| format!("FETCH collect: {}", e))?
        }
    };
    Ok(raw
        .into_iter()
        .map(|f| FetchHeader {
            uid: f.uid.unwrap_or(0),
            flags: f.flags().map(|fl| format!("{:?}", fl)).collect(),
            bodystructure_dump: format!("{:?}", f.bodystructure()),
            header_bytes: f.header().unwrap_or(&[]).to_vec(),
        })
        .collect())
}

async fn imap_fetch_full(
    session: &mut ImapSession,
    uid: u32,
) -> Result<Vec<FetchBody>, String> {
    let raw: Vec<async_imap::types::Fetch> = match session {
        ImapSession::Tls(s) => {
            let stream = s
                .uid_fetch(uid.to_string(), "(UID FLAGS RFC822)")
                .await
                .map_err(|e| format!("UID FETCH: {}", e))?;
            tokio::time::timeout(Duration::from_secs(IMAP_TIMEOUT_SECS), stream.try_collect())
                .await
                .map_err(|_| "FETCH full timeout".to_string())?
                .map_err(|e: async_imap::error::Error| format!("FETCH collect: {}", e))?
        }
        ImapSession::Plain(s) => {
            let stream = s
                .uid_fetch(uid.to_string(), "(UID FLAGS RFC822)")
                .await
                .map_err(|e| format!("UID FETCH: {}", e))?;
            tokio::time::timeout(Duration::from_secs(IMAP_TIMEOUT_SECS), stream.try_collect())
                .await
                .map_err(|_| "FETCH full timeout".to_string())?
                .map_err(|e: async_imap::error::Error| format!("FETCH collect: {}", e))?
        }
    };
    Ok(raw
        .into_iter()
        .map(|f| FetchBody {
            uid: f.uid.unwrap_or(0),
            flags: f.flags().map(|fl| format!("{:?}", fl)).collect(),
            body_bytes: f.body().unwrap_or(&[]).to_vec(),
        })
        .collect())
}

async fn imap_uid_store(
    session: &mut ImapSession,
    uid: u32,
    cmd: &str,
) -> Result<(), String> {
    match session {
        ImapSession::Tls(s) => {
            let stream = s
                .uid_store(uid.to_string(), cmd)
                .await
                .map_err(|e| format!("UID STORE: {}", e))?;
            let _: Vec<async_imap::types::Fetch> = stream
                .try_collect()
                .await
                .map_err(|e: async_imap::error::Error| format!("STORE collect: {}", e))?;
        }
        ImapSession::Plain(s) => {
            let stream = s
                .uid_store(uid.to_string(), cmd)
                .await
                .map_err(|e| format!("UID STORE: {}", e))?;
            let _: Vec<async_imap::types::Fetch> = stream
                .try_collect()
                .await
                .map_err(|e: async_imap::error::Error| format!("STORE collect: {}", e))?;
        }
    }
    Ok(())
}

async fn imap_uid_store_set(session: &mut ImapSession, uid_set: &str, cmd: &str) -> Result<(), String> {
    match session {
        ImapSession::Tls(s) => {
            let stream = s
                .uid_store(uid_set, cmd)
                .await
                .map_err(|e| format!("UID STORE: {}", e))?;
            let _: Vec<async_imap::types::Fetch> = stream
                .try_collect()
                .await
                .map_err(|e: async_imap::error::Error| format!("STORE collect: {}", e))?;
        }
        ImapSession::Plain(s) => {
            let stream = s
                .uid_store(uid_set, cmd)
                .await
                .map_err(|e| format!("UID STORE: {}", e))?;
            let _: Vec<async_imap::types::Fetch> = stream
                .try_collect()
                .await
                .map_err(|e: async_imap::error::Error| format!("STORE collect: {}", e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn mail_set_seen_bulk(
    account_id: String,
    folder: String,
    uids: Vec<u32>,
    seen: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    if uids.is_empty() {
        return Ok(());
    }
    let uid_set = uids.iter().map(|u| u.to_string()).collect::<Vec<_>>().join(",");
    let pool_key = format!("{}:{}", account_id, folder);
    let _lock = pool_lock(&pool_key);
    let _guard = _lock.lock().await;
    let mut attempt = 0u8;
    loop {
        let mut session = acquire_session(&state.data_root, &pool_key, &account_id).await?;
        let result: Result<(), String> = async {
            imap_select(&mut session, &folder).await?;
            let cmd = if seen { "+FLAGS (\\Seen)" } else { "-FLAGS (\\Seen)" };
            imap_uid_store_set(&mut session, &uid_set, cmd).await
        }
        .await;
        let ok = result.is_ok();
        attempt += 1;
        let retryable = match &result { Err(e) => is_retryable_error(e), Ok(_) => false };
        if ok || attempt > 1 || !retryable {
            release_session(pool_key, session, ok).await;
            return result;
        }
    }
}

async fn imap_expunge(session: &mut ImapSession) -> Result<(), String> {
    match session {
        ImapSession::Tls(s) => {
            let stream = s.expunge().await.map_err(|e| format!("EXPUNGE: {}", e))?;
            let _: Vec<u32> = stream
                .try_collect()
                .await
                .map_err(|e: async_imap::error::Error| format!("EXPUNGE collect: {}", e))?;
        }
        ImapSession::Plain(s) => {
            let stream = s.expunge().await.map_err(|e| format!("EXPUNGE: {}", e))?;
            let _: Vec<u32> = stream
                .try_collect()
                .await
                .map_err(|e: async_imap::error::Error| format!("EXPUNGE collect: {}", e))?;
        }
    }
    Ok(())
}

fn parse_date_ts(date: &str) -> i64 {
    chrono::DateTime::parse_from_rfc2822(date.trim())
        .map(|d| d.timestamp())
        .unwrap_or(0)
}

fn parse_message_id(header_bytes: &[u8]) -> Option<String> {
    let (headers, _) = mailparse::parse_headers(header_bytes).ok()?;
    headers
        .get_first_value("Message-ID")
        .or_else(|| headers.get_first_value("Message-Id"))
        .map(|s| s.trim().to_string())
}

/// 전체 메일함 집계에서 제외할 폴더 판별.
/// RFC 6154 특수용도 플래그(`\All`, `\Drafts`, `\Junk`, `\Spam`) 및
/// `\Noselect` 폴더를 건너뛴다.
fn is_aggregation_skip_folder(folder: &MailFolder) -> bool {
    folder.flags.iter().any(|f| {
        f.contains("Noselect")
            || f.contains("All")    // \All  — Gmail "모든 메일" 등 중복 원인
            || f.contains("Draft")  // \Drafts
            || f.contains("Junk")   // \Junk
            || f.contains("Spam")   // \Spam
    })
}

// ────────────────────────────────────────────────────────────
// Tauri commands (account CRUD)
// ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn mail_list_accounts(state: State<'_, AppState>) -> Result<Vec<MailAccount>, String> {
    load_accounts(&state.data_root)
}

#[tauri::command]
pub fn mail_add_account(
    input: MailAccountInput,
    state: State<'_, AppState>,
) -> Result<MailAccount, String> {
    let label = input.label.trim();
    let host = input.host.trim();
    let username = input.username.trim();
    if label.is_empty() {
        return Err("표시 이름이 비어 있습니다".into());
    }
    if host.is_empty() {
        return Err("호스트가 비어 있습니다".into());
    }
    if username.is_empty() {
        return Err("사용자 이름이 비어 있습니다".into());
    }
    if input.password.is_empty() {
        return Err("비밀번호가 비어 있습니다".into());
    }
    let key = load_or_create_key(&state.data_root)?;
    let password_enc = encrypt_password(&key, &input.password)?;
    let id = uuid::Uuid::new_v4().to_string();
    let account = MailAccount {
        id,
        label: label.to_string(),
        host: host.to_string(),
        port: input.port,
        tls: input.tls,
        username: username.to_string(),
        password_enc,
        auth_kind: AuthKind::Password,
        oauth_client_id: None,
        oauth_client_secret_enc: None,
        oauth_refresh_token_enc: None,
    };
    let mut accounts = load_accounts(&state.data_root)?;
    accounts.push(account.clone());
    save_accounts(&state.data_root, &accounts)?;
    Ok(account)
}

#[tauri::command]
pub fn mail_update_account(
    input: MailAccountInput,
    state: State<'_, AppState>,
) -> Result<MailAccount, String> {
    let id = input
        .id
        .as_ref()
        .ok_or_else(|| "id is required for update".to_string())?
        .clone();
    let mut accounts = load_accounts(&state.data_root)?;
    let idx = accounts
        .iter()
        .position(|a| a.id == id)
        .ok_or_else(|| format!("account not found: {}", id))?;
    let label = input.label.trim();
    let host = input.host.trim();
    let username = input.username.trim();
    if label.is_empty() || host.is_empty() || username.is_empty() {
        return Err("필수 필드가 비어 있습니다".into());
    }
    accounts[idx].label = label.to_string();
    accounts[idx].host = host.to_string();
    accounts[idx].port = input.port;
    accounts[idx].tls = input.tls;
    accounts[idx].username = username.to_string();
    if !input.password.is_empty() {
        let key = load_or_create_key(&state.data_root)?;
        accounts[idx].password_enc = encrypt_password(&key, &input.password)?;
    }
    save_accounts(&state.data_root, &accounts)?;
    Ok(accounts[idx].clone())
}

#[tauri::command]
pub fn mail_delete_account(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut accounts = load_accounts(&state.data_root)?;
    let before = accounts.len();
    accounts.retain(|a| a.id != id);
    if accounts.len() == before {
        return Err(format!("account not found: {}", id));
    }
    save_accounts(&state.data_root, &accounts)
}

#[tauri::command]
pub async fn mail_oauth_start(
    client_id: String,
    client_secret: String,
    label: String,
    state: State<'_, AppState>,
) -> Result<MailAccount, String> {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("로컬 서버 바인딩 실패: {}", e))?;
    let port = listener
        .local_addr()
        .map_err(|e| e.to_string())?
        .port();

    let redirect_uri = format!("http://localhost:{}/callback", port);
    let scope = "https://mail.google.com/";
    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/auth\
         ?client_id={client_id}\
         &redirect_uri={redirect_uri_enc}\
         &response_type=code\
         &scope={scope_enc}\
         &access_type=offline\
         &prompt=consent",
        client_id = &client_id,
        redirect_uri_enc = percent_encode(&redirect_uri),
        scope_enc = percent_encode(scope),
    );
    std::process::Command::new("open")
        .arg(&auth_url)
        .spawn()
        .map_err(|e| format!("브라우저 열기 실패: {}", e))?;

    let (mut stream, _) = tokio::time::timeout(
        Duration::from_secs(300),
        listener.accept(),
    )
    .await
    .map_err(|_| "OAuth 인증 대기 시간 초과 (5분)".to_string())?
    .map_err(|e| format!("연결 수락 실패: {}", e))?;

    let mut buf = vec![0u8; 4096];
    let n = tokio::time::timeout(
        Duration::from_secs(10),
        stream.read(&mut buf),
    )
    .await
    .map_err(|_| "요청 읽기 타임아웃".to_string())?
    .map_err(|e| e.to_string())?;
    let request = String::from_utf8_lossy(&buf[..n]);

    let code = extract_query_param(&request, "code")
        .ok_or_else(|| {
            extract_query_param(&request, "error")
                .map(|e| format!("Google OAuth 오류: {}", e))
                .unwrap_or_else(|| "인증 코드를 찾을 수 없습니다".to_string())
        })?;

    let html = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n\
        <html><body style='font-family:system-ui;text-align:center;padding:60px'>\
        <h2>Authentication complete</h2>\
        <p>You may close this window and return to the app.</p>\
        </body></html>";
    let _ = stream.write_all(html.as_bytes()).await;
    drop(stream);

    let http = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let token_resp = http
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("code", code.as_str()),
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("redirect_uri", redirect_uri.as_str()),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|e| format!("토큰 교환 요청 실패: {}", e))?;
    if !token_resp.status().is_success() {
        let status = token_resp.status();
        let body = token_resp.text().await.unwrap_or_default();
        return Err(format!("토큰 교환 실패 {}: {}", status, body));
    }
    let token_json: serde_json::Value = token_resp.json().await.map_err(|e| e.to_string())?;
    let access_token = token_json["access_token"]
        .as_str()
        .ok_or("access_token 없음")?
        .to_string();
    let refresh_token = token_json["refresh_token"]
        .as_str()
        .ok_or("refresh_token 없음 (prompt=consent 없이 재인증 시 발생할 수 있음)")?
        .to_string();

    let userinfo: serde_json::Value = http
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(&access_token)
        .send()
        .await
        .map_err(|e| format!("userinfo 요청 실패: {}", e))?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let email = userinfo["email"]
        .as_str()
        .ok_or("이메일 정보를 가져올 수 없습니다")?
        .to_string();

    let key = load_or_create_key(&state.data_root)?;
    let client_secret_enc = encrypt_password(&key, &client_secret)?;
    let refresh_token_enc = encrypt_password(&key, &refresh_token)?;
    let id = uuid::Uuid::new_v4().to_string();
    let account = MailAccount {
        id,
        label: label.trim().to_string(),
        host: "imap.gmail.com".to_string(),
        port: 993,
        tls: true,
        username: email,
        password_enc: String::new(),
        auth_kind: AuthKind::OAuth2,
        oauth_client_id: Some(client_id),
        oauth_client_secret_enc: Some(client_secret_enc),
        oauth_refresh_token_enc: Some(refresh_token_enc),
    };
    let mut accounts = load_accounts(&state.data_root)?;
    accounts.push(account.clone());
    save_accounts(&state.data_root, &accounts)?;
    Ok(account)
}

fn percent_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len() * 3);
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9'
            | b'-' | b'_' | b'.' | b'~' => out.push(b as char),
            _ => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}

fn extract_query_param(request: &str, param: &str) -> Option<String> {
    let first_line = request.lines().next()?;
    let path = first_line.split_whitespace().nth(1)?;
    let query = path.split('?').nth(1)?;
    for pair in query.split('&') {
        let mut parts = pair.splitn(2, '=');
        if parts.next()? == param {
            return Some(
                parts
                    .next()
                    .unwrap_or("")
                    .replace('+', " ")
                    .split(' ')
                    .map(|s| {
                        let mut decoded = String::new();
                        let mut chars = s.chars().peekable();
                        while let Some(c) = chars.next() {
                            if c == '%' {
                                let h1 = chars.next().unwrap_or('0');
                                let h2 = chars.next().unwrap_or('0');
                                if let Ok(byte) = u8::from_str_radix(&format!("{}{}", h1, h2), 16) {
                                    decoded.push(byte as char);
                                }
                            } else {
                                decoded.push(c);
                            }
                        }
                        decoded
                    })
                    .collect::<String>(),
            );
        }
    }
    None
}

// ────────────────────────────────────────────────────────────
// Tauri commands (IMAP operations)
// ────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn mail_test_connection(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let _lock = pool_lock(&id);
    let _guard = _lock.lock().await;
    let (session, _account) = open_session(&state.data_root, &id).await?;
    release_session(id.clone(), session, true).await;
    Ok(())
}

#[tauri::command]
pub async fn mail_list_folders(
    account_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<MailFolder>, String> {
    let _lock = pool_lock(&account_id);
    let _guard = _lock.lock().await;
    let mut attempt = 0u8;
    loop {
        let mut session = acquire_session(&state.data_root, &account_id, &account_id).await?;
        let result = imap_list(&mut session).await;
        let ok = result.is_ok();
        attempt += 1;
        let retryable = match &result { Err(e) => is_retryable_error(e), Ok(_) => false };
        if ok || attempt > 1 || !retryable {
            release_session(account_id, session, ok).await;
            let mut folders = result?;
            folders.retain(|f| !f.flags.iter().any(|flag| flag.contains("NoSelect")));
            folders.sort_by(|a, b| {
                let a_inbox = a.name.eq_ignore_ascii_case("INBOX");
                let b_inbox = b.name.eq_ignore_ascii_case("INBOX");
                match (a_inbox, b_inbox) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                }
            });
            return Ok(folders);
        }
    }
}

/// 폴더별 안읽음 수를 IMAP STATUS로 조회. LIST보다 무거우므로 별도 호출·캐싱.
#[tauri::command]
pub async fn mail_folder_unread_counts(
    account_id: String,
    state: State<'_, AppState>,
) -> Result<HashMap<String, u32>, String> {
    let _lock = pool_lock(&account_id);
    let _guard = _lock.lock().await;
    let mut attempt = 0u8;
    loop {
        let mut session = acquire_session(&state.data_root, &account_id, &account_id).await?;
        let result: Result<HashMap<String, u32>, String> = async {
            let folders = imap_list(&mut session).await?;
            let mut counts: HashMap<String, u32> = HashMap::new();

            // \All 폴더가 있으면 그 하나만 사용 (Gmail "모든 메일" 등과 INBOX 중복 방지)
            if let Some(all_folder) = find_all_folder(&folders) {
                let folder_name = all_folder.name.clone();
                let encoded = encode_modified_utf7(&folder_name);
                let mbox_result = match &mut session {
                    ImapSession::Tls(s) => s.status(encoded.as_str(), "(UNSEEN)").await,
                    ImapSession::Plain(s) => s.status(encoded.as_str(), "(UNSEEN)").await,
                };
                if let Ok(mbox) = mbox_result {
                    let unread = mbox.unseen.unwrap_or(0);
                    if unread > 0 {
                        counts.insert(folder_name, unread);
                    }
                }
                return Ok(counts);
            }

            // \All 없는 서버: 집계 제외 폴더 필터링 후 합산
            for folder in &folders {
                if is_aggregation_skip_folder(folder) {
                    continue;
                }
                let encoded = encode_modified_utf7(&folder.name);
                let mbox_result = match &mut session {
                    ImapSession::Tls(s) => s.status(encoded.as_str(), "(UNSEEN)").await,
                    ImapSession::Plain(s) => s.status(encoded.as_str(), "(UNSEEN)").await,
                };
                if let Ok(mbox) = mbox_result {
                    let unread = mbox.unseen.unwrap_or(0);
                    if unread > 0 {
                        counts.insert(folder.name.clone(), unread);
                    }
                }
            }
            Ok(counts)
        }
        .await;
        let ok = result.is_ok();
        attempt += 1;
        let retryable = match &result { Err(e) => is_retryable_error(e), Ok(_) => false };
        if ok || attempt > 1 || !retryable {
            release_session(account_id, session, ok).await;
            return result;
        }
    }
}

#[tauri::command]
pub async fn mail_list_messages(
    account_id: String,
    folder: String,
    page: u32,
    state: State<'_, AppState>,
) -> Result<MailListResult, String> {
    let pool_key = format!("{}:{}", account_id, folder);
    let _lock = pool_lock(&pool_key);
    let _guard = _lock.lock().await;
    let mut attempt = 0u8;
    loop {
        let mut session = acquire_session(&state.data_root, &pool_key, &account_id).await?;

        let result: Result<MailListResult, String> = async {
            let exists = imap_examine_info(&mut session, &folder).await?;
            if exists == 0 {
                return Ok(MailListResult { messages: Vec::new(), total: 0, unseen: 0 });
            }

            let total = exists as usize;
            let page_size = PAGE_SIZE as usize;
            let page_num = page as usize;
            if page_num * page_size >= total {
                return Ok(MailListResult { messages: Vec::new(), total: exists, unseen: 0 });
            }

            // 역순 페이지: 마지막 메시지부터
            let end_seq = total - page_num * page_size;
            let start_seq = if end_seq > page_size { end_seq - page_size + 1 } else { 1 };
            let seq_range = format!("{}:{}", start_seq, end_seq);

            let fetched = imap_fetch_headers_seq(&mut session, &seq_range).await?;

            let mut messages: Vec<MailMessage> = fetched
                .into_iter()
                .map(|h| {
                    let seen = h.flags.iter().any(|f| f.contains("Seen"));
                    let flagged = h.flags.iter().any(|fl| fl.contains("Flagged"));
                    let has_attachments = h
                        .bodystructure_dump
                        .to_ascii_lowercase()
                        .contains("attachment");
                    let (subject, from, date) = parse_header_summary(&h.header_bytes);
                    MailMessage {
                        uid: h.uid,
                        subject,
                        from,
                        date,
                        seen,
                        flagged,
                        has_attachments,
                        folder: Some(folder.clone()),
                        account_id: Some(account_id.clone()),
                    }
                })
                .collect();
            messages.sort_by(|a, b| b.uid.cmp(&a.uid));

            let unseen: u32 = match &mut session {
                ImapSession::Tls(s) => s.uid_search("UNSEEN").await.map(|u| u.len() as u32).unwrap_or(0),
                ImapSession::Plain(s) => s.uid_search("UNSEEN").await.map(|u| u.len() as u32).unwrap_or(0),
            };

            Ok(MailListResult { messages, total: exists, unseen })
        }
        .await;

        let ok = result.is_ok();
        attempt += 1;
        let retryable = match &result { Err(e) => is_retryable_error(e), Ok(_) => false };
        if ok || attempt > 1 || !retryable {
            release_session(pool_key, session, ok).await;
            return result;
        }
        // 세션 버리고 재시도
    }
}

/// since_uid보다 큰 UID를 가진 새 메시지를 반환한다 (폴링용).
#[tauri::command]
pub async fn mail_check_new(
    account_id: String,
    folder: String,
    since_uid: u32,
    state: State<'_, AppState>,
) -> Result<Vec<MailMessage>, String> {
    let pool_key = format!("{}:{}", account_id, folder);
    let _lock = pool_lock(&pool_key);
    let _guard = _lock.lock().await;
    let mut attempt = 0u8;
    loop {
        let mut session = acquire_session(&state.data_root, &pool_key, &account_id).await?;

        let result: Result<Vec<MailMessage>, String> = async {
            imap_examine(&mut session, &folder).await?;

            let query = format!("UID {}:*", since_uid + 1);
            let uids: std::collections::HashSet<u32> = match &mut session {
                ImapSession::Tls(s) => s
                    .uid_search(&query)
                    .await
                    .map_err(|e| format!("UID SEARCH: {}", e))?,
                ImapSession::Plain(s) => s
                    .uid_search(&query)
                    .await
                    .map_err(|e| format!("UID SEARCH: {}", e))?,
            };
            let mut uid_vec: Vec<u32> = uids.into_iter().filter(|&u| u > since_uid).collect();
            if uid_vec.is_empty() {
                return Ok(Vec::new());
            }
            uid_vec.sort_unstable();
            uid_vec.reverse();

            let uid_set = uid_vec.iter().map(|u| u.to_string()).collect::<Vec<_>>().join(",");
            let fetched = imap_fetch_headers(&mut session, &uid_set).await?;

            let mut messages: Vec<MailMessage> = fetched
                .into_iter()
                .map(|h| {
                    let seen = h.flags.iter().any(|f| f.contains("Seen"));
                    let flagged = h.flags.iter().any(|fl| fl.contains("Flagged"));
                    let has_attachments = h
                        .bodystructure_dump
                        .to_ascii_lowercase()
                        .contains("attachment");
                    let (subject, from, date) = parse_header_summary(&h.header_bytes);
                    MailMessage {
                        uid: h.uid,
                        subject,
                        from,
                        date,
                        seen,
                        flagged,
                        has_attachments,
                        folder: Some(folder.clone()),
                        account_id: Some(account_id.clone()),
                    }
                })
                .collect();
            messages.sort_by(|a, b| b.uid.cmp(&a.uid));
            Ok(messages)
        }
        .await;

        let ok = result.is_ok();
        attempt += 1;
        let retryable = match &result { Err(e) => is_retryable_error(e), Ok(_) => false };
        if ok || attempt > 1 || !retryable {
            release_session(pool_key, session, ok).await;
            return result;
        }
        // 세션 버리고 재시도
    }
}

#[tauri::command]
pub async fn mail_get_message(
    account_id: String,
    folder: String,
    uid: u32,
    state: State<'_, AppState>,
) -> Result<MailMessageFull, String> {
    let pool_key = format!("{}:{}", account_id, folder);
    let _lock = pool_lock(&pool_key);
    let _guard = _lock.lock().await;
    let mut attempt = 0u8;
    loop {
        let mut session = acquire_session(&state.data_root, &pool_key, &account_id).await?;

        let result: Result<MailMessageFull, String> = async {
            imap_select(&mut session, &folder).await?;
            let fetched = imap_fetch_full(&mut session, uid).await?;
            let f = fetched
                .into_iter()
                .next()
                .ok_or_else(|| format!("message not found: uid {}", uid))?;

            let seen = f.flags.iter().any(|fl| fl.contains("Seen"));
            let flagged = f.flags.iter().any(|fl| fl.contains("Flagged"));

            let parsed = mailparse::parse_mail(&f.body_bytes)
                .map_err(|e| format!("parse_mail: {}", e))?;

            let subject = parsed
                .headers
                .get_first_value("Subject")
                .unwrap_or_default();
            let from = parsed.headers.get_first_value("From").unwrap_or_default();
            let to = parsed.headers.get_first_value("To").unwrap_or_default();
            let date = parsed.headers.get_first_value("Date").unwrap_or_default();

            let mut body_text = String::new();
            let mut body_html = String::new();
            let mut attachments: Vec<String> = Vec::new();
            collect_parts(&parsed, &mut body_text, &mut body_html, &mut attachments);

            Ok(MailMessageFull {
                uid: f.uid,
                subject: decode_header(&subject),
                from: decode_header(&from),
                to: decode_header(&to),
                date,
                seen,
                flagged,
                body_text,
                body_html,
                attachments,
            })
        }
        .await;

        let ok = result.is_ok();
        attempt += 1;
        let retryable = match &result { Err(e) => is_retryable_error(e), Ok(_) => false };
        if ok || attempt > 1 || !retryable {
            release_session(pool_key, session, ok).await;
            return result;
        }
        // 세션 버리고 재시도
    }
}

#[tauri::command]
pub async fn mail_set_seen(
    account_id: String,
    folder: String,
    uid: u32,
    seen: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pool_key = format!("{}:{}", account_id, folder);
    let _lock = pool_lock(&pool_key);
    let _guard = _lock.lock().await;
    let mut attempt = 0u8;
    loop {
        let mut session = acquire_session(&state.data_root, &pool_key, &account_id).await?;

        let result: Result<(), String> = async {
            imap_select(&mut session, &folder).await?;
            let cmd = if seen {
                "+FLAGS (\\Seen)"
            } else {
                "-FLAGS (\\Seen)"
            };
            imap_uid_store(&mut session, uid, cmd).await
        }
        .await;

        let ok = result.is_ok();
        attempt += 1;
        let retryable = match &result { Err(e) => is_retryable_error(e), Ok(_) => false };
        if ok || attempt > 1 || !retryable {
            release_session(pool_key, session, ok).await;
            return result;
        }
        // 세션 버리고 재시도
    }
}

#[tauri::command]
pub async fn mail_set_flagged(
    account_id: String,
    folder: String,
    uid: u32,
    flagged: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pool_key = format!("{}:{}", account_id, folder);
    let _lock = pool_lock(&pool_key);
    let _guard = _lock.lock().await;
    let mut attempt = 0u8;
    loop {
        let mut session = acquire_session(&state.data_root, &pool_key, &account_id).await?;

        let result: Result<(), String> = async {
            imap_select(&mut session, &folder).await?;
            let cmd = if flagged {
                "+FLAGS (\\Flagged)"
            } else {
                "-FLAGS (\\Flagged)"
            };
            imap_uid_store(&mut session, uid, cmd).await
        }
        .await;

        let ok = result.is_ok();
        attempt += 1;
        let retryable = match &result { Err(e) => is_retryable_error(e), Ok(_) => false };
        if ok || attempt > 1 || !retryable {
            release_session(pool_key, session, ok).await;
            return result;
        }
        // 세션 버리고 재시도
    }
}

#[tauri::command]
pub async fn mail_delete_message(
    account_id: String,
    folder: String,
    uid: u32,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pool_key = format!("{}:{}", account_id, folder);
    let _lock = pool_lock(&pool_key);
    let _guard = _lock.lock().await;
    let mut attempt = 0u8;
    loop {
        let mut session = acquire_session(&state.data_root, &pool_key, &account_id).await?;

        let result: Result<(), String> = async {
            imap_select(&mut session, &folder).await?;
            imap_uid_store(&mut session, uid, "+FLAGS (\\Deleted)").await?;
            imap_expunge(&mut session).await
        }
        .await;

        let ok = result.is_ok();
        attempt += 1;
        let retryable = match &result { Err(e) => is_retryable_error(e), Ok(_) => false };
        if ok || attempt > 1 || !retryable {
            release_session(pool_key, session, ok).await;
            return result;
        }
        // 세션 버리고 재시도
    }
}

/// RFC 6154 `\All` 플래그가 있는 폴더를 찾는다.
/// Gmail의 "모든 메일"처럼 계정의 전체 메시지를 한 폴더로 제공한다.
fn find_all_folder(folders: &[MailFolder]) -> Option<&MailFolder> {
    folders.iter().find(|f| {
        !f.flags.iter().any(|fl| fl.contains("Noselect"))
            && f.flags.iter().any(|fl| fl.contains("All"))
    })
}

fn build_mail_message(h: FetchHeader, folder_name: &str, account_id: &str) -> MailMessage {
    let seen = h.flags.iter().any(|f| f.contains("Seen"));
    let flagged = h.flags.iter().any(|fl| fl.contains("Flagged"));
    let has_attachments = h.bodystructure_dump.to_ascii_lowercase().contains("attachment");
    let (subject, from, date) = parse_header_summary(&h.header_bytes);
    MailMessage {
        uid: h.uid,
        subject,
        from,
        date,
        seen,
        flagged,
        has_attachments,
        folder: Some(folder_name.to_string()),
        account_id: Some(account_id.to_string()),
    }
}

/// 계정 하나의 최근 `days`일치 메시지를 세션 풀에서 가져온다.
/// `tokio::spawn`에서 호출되므로 owned 타입만 받는다.
async fn fetch_account_all_messages_owned(
    data_root: std::path::PathBuf,
    account_id: String,
    days: u32,
    limit: usize,
) -> Vec<MailMessage> {
    let pool_key = format!("{}:__all__", account_id);
    let lock = pool_lock(&pool_key);
    let _guard = lock.lock().await;

    let mut session = match acquire_session(&data_root, &pool_key, &account_id).await {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };

    let result: Result<Vec<MailMessage>, String> = async {
        let folders = imap_list(&mut session).await?;

        if let Some(af) = find_all_folder(&folders) {
            let folder_name = af.name.clone();
            imap_examine(&mut session, &folder_name).await?;
            let mut uid_vec = imap_uid_search_since(&mut session, days).await?;
            uid_vec.sort_unstable();
            uid_vec.reverse();
            uid_vec.truncate(limit);
            if uid_vec.is_empty() {
                return Ok(Vec::new());
            }
            let uid_set = uid_vec.iter().map(|u| u.to_string()).collect::<Vec<_>>().join(",");
            let fetched = imap_fetch_headers(&mut session, &uid_set).await?;
            let mut messages: Vec<MailMessage> = fetched
                .into_iter()
                .map(|h| build_mail_message(h, &folder_name, &account_id))
                .collect();
            messages.sort_by(|a, b| b.uid.cmp(&a.uid));
            return Ok(messages);
        }

        // fallback: \All 없는 서버 → INBOX만 집계 (폴더 전체 순회는 너무 느림)
        let inbox = folders.iter().find(|f| f.name.to_uppercase() == "INBOX");
        let Some(inbox_folder) = inbox else {
            return Ok(Vec::new());
        };
        let folder_name = inbox_folder.name.clone();
        imap_examine(&mut session, &folder_name).await?;
        let mut uid_vec = imap_uid_search_since(&mut session, days).await?;
        uid_vec.sort_unstable();
        uid_vec.reverse();
        uid_vec.truncate(limit);
        if uid_vec.is_empty() {
            return Ok(Vec::new());
        }
        let uid_set = uid_vec.iter().map(|u| u.to_string()).collect::<Vec<_>>().join(",");
        let fetched = imap_fetch_headers(&mut session, &uid_set).await?;
        let messages = fetched
            .into_iter()
            .map(|h| build_mail_message(h, &folder_name, &account_id))
            .collect();
        Ok(messages)
    }
    .await;

    let ok = result.is_ok();
    release_session(pool_key, session, ok).await;
    result.unwrap_or_default()
}

async fn fetch_account_unread_messages_owned(
    data_root: std::path::PathBuf,
    account_id: String,
) -> Vec<MailMessage> {
    let pool_key = format!("{}:__all__:unread", account_id);
    let lock = pool_lock(&pool_key);
    let _guard = lock.lock().await;

    let mut session = match acquire_session(&data_root, &pool_key, &account_id).await {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };

    let result: Result<Vec<MailMessage>, String> = async {
        let folders = imap_list(&mut session).await?;

        if let Some(af) = find_all_folder(&folders) {
            let folder_name = af.name.clone();
            imap_examine(&mut session, &folder_name).await?;
            let mut uid_vec = imap_uid_search_unseen(&mut session).await?;
            if uid_vec.is_empty() {
                return Ok(Vec::new());
            }
            uid_vec.sort_unstable();
            uid_vec.reverse();
            let uid_set = uid_vec.iter().map(|u| u.to_string()).collect::<Vec<_>>().join(",");
            let fetched = imap_fetch_headers(&mut session, &uid_set).await?;
            let mut messages: Vec<MailMessage> = fetched
                .into_iter()
                .map(|h| build_mail_message(h, &folder_name, &account_id))
                .collect();
            messages.sort_by(|a, b| b.uid.cmp(&a.uid));
            return Ok(messages);
        }

        // fallback: \All 없는 서버 → INBOX만
        let folders_up = imap_list(&mut session).await?;
        let inbox = folders_up.iter().find(|f| f.name.to_uppercase() == "INBOX");
        let Some(inbox_folder) = inbox else {
            return Ok(Vec::new());
        };
        let folder_name = inbox_folder.name.clone();
        imap_examine(&mut session, &folder_name).await?;
        let mut uid_vec = imap_uid_search_unseen(&mut session).await?;
        if uid_vec.is_empty() {
            return Ok(Vec::new());
        }
        uid_vec.sort_unstable();
        uid_vec.reverse();
        let uid_set = uid_vec.iter().map(|u| u.to_string()).collect::<Vec<_>>().join(",");
        let fetched = imap_fetch_headers(&mut session, &uid_set).await?;
        let messages = fetched
            .into_iter()
            .map(|h| build_mail_message(h, &folder_name, &account_id))
            .collect();
        Ok(messages)
    }
    .await;

    let ok = result.is_ok();
    release_session(pool_key, session, ok).await;
    result.unwrap_or_default()
}

#[tauri::command]
pub async fn mail_list_all_messages(
    account_id: String,
    page: u32,
    state: State<'_, AppState>,
) -> Result<Vec<MailMessage>, String> {
    let pool_key = format!("{}:__all__", account_id);
    let _lock = pool_lock(&pool_key);
    let _guard = _lock.lock().await;
    let mut session = acquire_session(&state.data_root, &pool_key, &account_id).await?;

    let result: Result<Vec<MailMessage>, String> = async {
        let folders = imap_list(&mut session).await?;

        // \All 폴더가 있으면 단일 폴더로 직접 페이지네이션 (빠르고 중복 없음)
        if let Some(af) = find_all_folder(&folders) {
            let folder_name = af.name.clone();
            imap_examine(&mut session, &folder_name).await?;
            let mut uid_vec = imap_uid_search_since(&mut session, 90).await?;
            uid_vec.sort_unstable();
            uid_vec.reverse();
            let start = (page as usize) * PAGE_SIZE as usize;
            if start >= uid_vec.len() {
                return Ok(Vec::new());
            }
            let end = (start + PAGE_SIZE as usize).min(uid_vec.len());
            let uid_set = uid_vec[start..end]
                .iter()
                .map(|u| u.to_string())
                .collect::<Vec<_>>()
                .join(",");
            let fetched = imap_fetch_headers(&mut session, &uid_set).await?;
            let mut messages: Vec<MailMessage> = fetched
                .into_iter()
                .map(|h| build_mail_message(h, &folder_name, &account_id))
                .collect();
            messages.sort_by(|a, b| b.uid.cmp(&a.uid));
            return Ok(messages);
        }

        // fallback: \All 없는 서버 → 폴더 전체 집계
        let mut all_messages: Vec<MailMessage> = Vec::new();
        let mut seen_ids: std::collections::HashSet<String> = std::collections::HashSet::new();
        for folder in &folders {
            if is_aggregation_skip_folder(folder) {
                continue;
            }
            if imap_examine(&mut session, &folder.name).await.is_err() {
                continue;
            }
            let mut uid_vec = match imap_uid_search_since(&mut session, 90).await {
                Ok(v) => v,
                Err(_) => continue,
            };
            uid_vec.sort_unstable();
            uid_vec.reverse();
            if uid_vec.is_empty() {
                continue;
            }
            let uid_set = uid_vec.iter().map(|u| u.to_string()).collect::<Vec<_>>().join(",");
            let fetched = match imap_fetch_headers(&mut session, &uid_set).await {
                Ok(v) => v,
                Err(_) => continue,
            };
            let folder_name = folder.name.clone();
            for h in fetched {
                if let Some(mid) = parse_message_id(&h.header_bytes) {
                    if !seen_ids.insert(mid) {
                        continue;
                    }
                }
                all_messages.push(build_mail_message(h, &folder_name, &account_id));
            }
        }
        all_messages.sort_by(|a, b| parse_date_ts(&b.date).cmp(&parse_date_ts(&a.date)));
        let start = (page as usize) * PAGE_SIZE as usize;
        if start >= all_messages.len() {
            return Ok(Vec::new());
        }
        let end = (start + PAGE_SIZE as usize).min(all_messages.len());
        Ok(all_messages[start..end].to_vec())
    }
    .await;

    release_session(pool_key, session, result.is_ok()).await;
    result
}

async fn collect_all_accounts_messages(
    data_root: &std::path::Path,
) -> Result<Vec<MailMessage>, String> {
    let accounts = load_accounts(data_root)?;
    let data_root = data_root.to_path_buf();

    let tasks: Vec<_> = accounts
        .into_iter()
        .map(|account| {
            let dr = data_root.clone();
            let id = account.id.clone();
            tokio::spawn(async move { fetch_account_all_messages_owned(dr, id, 90, 60).await })
        })
        .collect();

    let mut all_messages: Vec<MailMessage> = Vec::new();
    let mut seen_keys: std::collections::HashSet<String> = std::collections::HashSet::new();
    for task in tasks {
        if let Ok(msgs) = task.await {
            for msg in msgs {
                let k = format!(
                    "{}:{}:{}",
                    msg.account_id.as_deref().unwrap_or(""),
                    msg.folder.as_deref().unwrap_or(""),
                    msg.uid
                );
                if seen_keys.insert(k) {
                    all_messages.push(msg);
                }
            }
        }
    }

    all_messages.sort_by(|a, b| parse_date_ts(&b.date).cmp(&parse_date_ts(&a.date)));
    Ok(all_messages)
}

async fn collect_all_accounts_unread_messages(
    data_root: &std::path::Path,
) -> Result<Vec<MailMessage>, String> {
    let accounts = load_accounts(data_root)?;
    let data_root = data_root.to_path_buf();

    let tasks: Vec<_> = accounts
        .into_iter()
        .map(|account| {
            let dr = data_root.clone();
            let id = account.id.clone();
            tokio::spawn(async move { fetch_account_unread_messages_owned(dr, id).await })
        })
        .collect();

    let mut all_messages: Vec<MailMessage> = Vec::new();
    let mut seen_keys: std::collections::HashSet<String> = std::collections::HashSet::new();
    for task in tasks {
        if let Ok(msgs) = task.await {
            for msg in msgs {
                let k = format!(
                    "{}:{}:{}",
                    msg.account_id.as_deref().unwrap_or(""),
                    msg.folder.as_deref().unwrap_or(""),
                    msg.uid
                );
                if seen_keys.insert(k) {
                    all_messages.push(msg);
                }
            }
        }
    }

    all_messages.sort_by(|a, b| parse_date_ts(&b.date).cmp(&parse_date_ts(&a.date)));
    Ok(all_messages)
}

#[tauri::command]
pub async fn mail_list_all_accounts_messages(
    page: u32,
    state: State<'_, AppState>,
) -> Result<Vec<MailMessage>, String> {
    let all = collect_all_accounts_messages(&state.data_root).await?;
    let start = (page as usize) * PAGE_SIZE as usize;
    if start >= all.len() {
        return Ok(Vec::new());
    }
    let end = (start + PAGE_SIZE as usize).min(all.len());
    Ok(all[start..end].to_vec())
}

#[tauri::command]
pub async fn mail_fetch_all_accounts_full(
    state: State<'_, AppState>,
) -> Result<Vec<MailMessage>, String> {
    collect_all_accounts_messages(&state.data_root).await
}

#[tauri::command]
pub async fn mail_list_unread_messages(
    account_id: String,
    folder: String,
    state: State<'_, AppState>,
) -> Result<Vec<MailMessage>, String> {
    if folder == "__all__" {
        let pool_key = format!("{}:__all__:unread", account_id);
        let _lock = pool_lock(&pool_key);
        let _guard = _lock.lock().await;
        let mut session = acquire_session(&state.data_root, &pool_key, &account_id).await?;

        let result: Result<Vec<MailMessage>, String> = async {
            let folders = imap_list(&mut session).await?;

            if let Some(af) = find_all_folder(&folders) {
                let folder_name = af.name.clone();
                imap_examine(&mut session, &folder_name).await?;
                let mut uid_vec = imap_uid_search_unseen(&mut session).await?;
                if uid_vec.is_empty() {
                    return Ok(Vec::new());
                }
                uid_vec.sort_unstable();
                uid_vec.reverse();
                let uid_set = uid_vec.iter().map(|u| u.to_string()).collect::<Vec<_>>().join(",");
                let fetched = imap_fetch_headers(&mut session, &uid_set).await?;
                let mut messages: Vec<MailMessage> = fetched
                    .into_iter()
                    .map(|h| build_mail_message(h, &folder_name, &account_id))
                    .collect();
                messages.sort_by(|a, b| b.uid.cmp(&a.uid));
                return Ok(messages);
            }

            // fallback: 폴더 전체 순회
            let mut all_messages: Vec<MailMessage> = Vec::new();
            let mut seen_ids: std::collections::HashSet<String> = std::collections::HashSet::new();
            for f in &folders {
                if is_aggregation_skip_folder(f) {
                    continue;
                }
                if imap_examine(&mut session, &f.name).await.is_err() {
                    continue;
                }
                let uid_vec = match imap_uid_search_unseen(&mut session).await {
                    Ok(v) => v,
                    Err(_) => continue,
                };
                if uid_vec.is_empty() {
                    continue;
                }
                let uid_set = uid_vec.iter().map(|u| u.to_string()).collect::<Vec<_>>().join(",");
                let fetched = match imap_fetch_headers(&mut session, &uid_set).await {
                    Ok(v) => v,
                    Err(_) => continue,
                };
                let folder_name = f.name.clone();
                for h in fetched {
                    if let Some(mid) = parse_message_id(&h.header_bytes) {
                        if !seen_ids.insert(mid) {
                            continue;
                        }
                    }
                    all_messages.push(build_mail_message(h, &folder_name, &account_id));
                }
            }
            all_messages.sort_by(|a, b| parse_date_ts(&b.date).cmp(&parse_date_ts(&a.date)));
            Ok(all_messages)
        }
        .await;

        let ok = result.is_ok();
        release_session(pool_key, session, ok).await;
        return result;
    }

    // 단일 폴더
    let pool_key = format!("{}:{}", account_id, folder);
    let _lock = pool_lock(&pool_key);
    let _guard = _lock.lock().await;
    let mut attempt = 0u8;
    loop {
        let mut session = acquire_session(&state.data_root, &pool_key, &account_id).await?;
        let result: Result<Vec<MailMessage>, String> = async {
            imap_examine(&mut session, &folder).await?;
            let mut uid_vec = imap_uid_search_unseen(&mut session).await?;
            if uid_vec.is_empty() {
                return Ok(Vec::new());
            }
            uid_vec.sort_unstable();
            uid_vec.reverse();
            let uid_set = uid_vec.iter().map(|u| u.to_string()).collect::<Vec<_>>().join(",");
            let fetched = imap_fetch_headers(&mut session, &uid_set).await?;
            let mut messages: Vec<MailMessage> = fetched
                .into_iter()
                .map(|h| build_mail_message(h, &folder, &account_id))
                .collect();
            messages.sort_by(|a, b| b.uid.cmp(&a.uid));
            Ok(messages)
        }
        .await;

        let ok = result.is_ok();
        attempt += 1;
        let retryable = match &result {
            Err(e) => is_retryable_error(e),
            Ok(_) => false,
        };
        if ok || attempt > 1 || !retryable {
            release_session(pool_key, session, ok).await;
            return result;
        }
    }
}

#[tauri::command]
pub async fn mail_list_all_accounts_unread_messages(
    state: State<'_, AppState>,
) -> Result<Vec<MailMessage>, String> {
    collect_all_accounts_unread_messages(&state.data_root).await
}

#[tauri::command]
pub async fn mail_unread_count_all(state: State<'_, AppState>) -> Result<u32, String> {
    let accounts = load_accounts(&state.data_root)?;
    let mut total: u32 = 0;

    for account in &accounts {
        let pool_key = format!("{}:INBOX", account.id);
        let _lock = pool_lock(&pool_key);
        let _guard = _lock.lock().await;

        let mut session = match acquire_session(&state.data_root, &pool_key, &account.id).await {
            Ok(s) => s,
            Err(_) => continue,
        };
        let count = if imap_examine(&mut session, "INBOX").await.is_ok() {
            match &mut session {
                ImapSession::Tls(s) => s.uid_search("UNSEEN").await.map(|u| u.len() as u32).unwrap_or(0),
                ImapSession::Plain(s) => s.uid_search("UNSEEN").await.map(|u| u.len() as u32).unwrap_or(0),
            }
        } else {
            0
        };
        total += count;
        release_session(pool_key, session, true).await;
    }

    Ok(total)
}

// ────────────────────────────────────────────────────────────
// Header / body parsing helpers
// ────────────────────────────────────────────────────────────

fn parse_header_summary(header_bytes: &[u8]) -> (String, String, String) {
    let parsed = match mailparse::parse_headers(header_bytes) {
        Ok((headers, _)) => headers,
        Err(_) => return (String::new(), String::new(), String::new()),
    };
    let subject = parsed
        .get_first_value("Subject")
        .map(|s| decode_header(&s))
        .unwrap_or_default();
    let from = parsed
        .get_first_value("From")
        .map(|s| decode_header(&s))
        .unwrap_or_default();
    let date = parsed.get_first_value("Date").unwrap_or_default();
    (subject, from, date)
}

fn decode_header(s: &str) -> String {
    if s.is_empty() {
        return String::new();
    }
    match mailparse::parse_header(format!("X: {}\r\n\r\n", s).as_bytes()) {
        Ok((h, _)) => h.get_value(),
        Err(_) => s.to_string(),
    }
}

fn collect_parts(
    part: &mailparse::ParsedMail,
    body_text: &mut String,
    body_html: &mut String,
    attachments: &mut Vec<String>,
) {
    let ct = &part.ctype;
    let mimetype = ct.mimetype.to_ascii_lowercase();
    let disposition = part.get_content_disposition();
    let is_attachment = matches!(
        disposition.disposition,
        mailparse::DispositionType::Attachment
    ) || disposition.params.contains_key("filename");

    if is_attachment {
        let name = disposition
            .params
            .get("filename")
            .cloned()
            .or_else(|| ct.params.get("name").cloned())
            .unwrap_or_else(|| "(unnamed)".to_string());
        attachments.push(name);
        return;
    }

    if part.subparts.is_empty() {
        if mimetype.starts_with("text/plain") && body_text.is_empty() {
            if let Ok(s) = part.get_body() {
                *body_text = s;
            }
        } else if mimetype.starts_with("text/html") && body_html.is_empty() {
            if let Ok(s) = part.get_body() {
                *body_html = s;
            }
        }
    } else {
        for sub in part.subparts.iter() {
            collect_parts(sub, body_text, body_html, attachments);
        }
    }
}
