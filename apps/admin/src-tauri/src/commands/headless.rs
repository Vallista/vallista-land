use chromiumoxide::browser::{Browser, BrowserConfig};
use futures::StreamExt;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::Duration;
use tauri::State;

use crate::commands::glean::{self, GleanHighlight, GleanItem};
use crate::commands::rss::{FetchOutcome, ParsedEntry, RssFeed, RssSyncResult};
use crate::repo::{AppState, RssConfig};

const CHROME_DOWNLOAD_URL: &str = "https://www.google.com/chrome/";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChromeStatus {
    pub found: bool,
    pub path: Option<String>,
    pub name: Option<String>,
    pub download_url: String,
}

#[cfg(target_os = "macos")]
fn chrome_candidates() -> Vec<(&'static str, PathBuf)> {
    let home = std::env::var_os("HOME").map(PathBuf::from);
    let mut out: Vec<(&str, PathBuf)> = vec![
        (
            "Google Chrome",
            PathBuf::from("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
        ),
        (
            "Google Chrome Beta",
            PathBuf::from(
                "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
            ),
        ),
        (
            "Chromium",
            PathBuf::from("/Applications/Chromium.app/Contents/MacOS/Chromium"),
        ),
        (
            "Microsoft Edge",
            PathBuf::from("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"),
        ),
        (
            "Brave Browser",
            PathBuf::from("/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"),
        ),
        (
            "Arc",
            PathBuf::from("/Applications/Arc.app/Contents/MacOS/Arc"),
        ),
    ];
    if let Some(h) = home {
        out.extend([
            (
                "Google Chrome (User)",
                h.join("Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
            ),
            (
                "Chromium (User)",
                h.join("Applications/Chromium.app/Contents/MacOS/Chromium"),
            ),
        ]);
    }
    out
}

#[cfg(not(target_os = "macos"))]
fn chrome_candidates() -> Vec<(&'static str, PathBuf)> {
    Vec::new()
}

pub fn find_chrome() -> Option<(String, PathBuf)> {
    chrome_candidates()
        .into_iter()
        .find(|(_, p)| p.is_file())
        .map(|(name, p)| (name.to_string(), p))
}

#[tauri::command]
pub fn check_chrome() -> ChromeStatus {
    match find_chrome() {
        Some((name, path)) => ChromeStatus {
            found: true,
            name: Some(name),
            path: Some(path.display().to_string()),
            download_url: CHROME_DOWNLOAD_URL.to_string(),
        },
        None => ChromeStatus {
            found: false,
            name: None,
            path: None,
            download_url: CHROME_DOWNLOAD_URL.to_string(),
        },
    }
}

struct BrowserSession {
    browser: Browser,
    handle: tokio::task::JoinHandle<()>,
    tmp_dir: std::path::PathBuf,
}

impl BrowserSession {
    async fn launch(chrome_path: &Path, _timeout: Duration, extra_args: &[String]) -> Result<Self, String> {
        // 세션마다 고유한 임시 프로파일 → SingletonLock 충돌 원천 차단
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0);
        let tmp_dir = std::env::temp_dir()
            .join(format!("bento_chrome_{}_{}", std::process::id(), ts));
        std::fs::create_dir_all(&tmp_dir)
            .map_err(|e| format!("tmp_dir create: {}", e))?;

        // chromiumoxide default("chromiumoxide-runner")의 stale lock도 제거
        let default_lock = std::env::temp_dir()
            .join("chromiumoxide-runner")
            .join("SingletonLock");
        let _ = std::fs::remove_file(&default_lock);

        let mut builder = BrowserConfig::builder()
            .chrome_executable(chrome_path)
            .user_data_dir(&tmp_dir)  // .arg() 대신 builder API로 설정 — 이게 최종 경로
            .arg("--disable-blink-features=AutomationControlled")
            .arg("--disable-dev-shm-usage")
            .arg("--no-first-run")
            .arg("--no-default-browser-check")
            .arg("--disable-extensions")
            .arg("--mute-audio");
        for arg in extra_args {
            builder = builder.arg(arg.as_str());
        }
        let config = builder
            .build()
            .map_err(|e| format!("BrowserConfig: {}", e))?;
        let (browser, mut handler) = Browser::launch(config)
            .await
            .map_err(|e| format!("launch: {}", e))?;
        let handle = tokio::spawn(async move {
            while let Some(_) = handler.next().await {}
        });
        Ok(Self { browser, handle, tmp_dir })
    }

    async fn close(mut self) {
        let _ = self.browser.close().await;
        let _ = self.browser.wait().await;
        let _ = self.handle.await;
        let _ = std::fs::remove_dir_all(&self.tmp_dir);
    }
}

async fn render_html(
    session: &BrowserSession,
    url: &str,
    settle_ms: u64,
) -> Result<(String, String), String> {
    let page = session
        .browser
        .new_page(url)
        .await
        .map_err(|e| format!("new_page: {}", e))?;
    let _ = page.wait_for_navigation().await;
    if settle_ms > 0 {
        tokio::time::sleep(Duration::from_millis(settle_ms)).await;
    }
    let html = page
        .content()
        .await
        .map_err(|e| format!("content: {}", e))?;
    let final_url = page
        .url()
        .await
        .ok()
        .flatten()
        .unwrap_or_else(|| url.to_string());
    let _ = page.close().await;
    Ok((html, final_url))
}

fn is_threads(url: &str) -> bool {
    if let Ok(u) = reqwest::Url::parse(url) {
        if let Some(host) = u.host_str() {
            let h = host.to_lowercase();
            return h.contains("threads.net") || h.contains("threads.com");
        }
    }
    false
}

pub async fn fetch_feed(feed: &RssFeed, cfg: &RssConfig) -> Result<FetchOutcome, String> {
    let (_chrome_name, chrome_path) = find_chrome().ok_or_else(|| {
        "Chrome/Chromium을 찾지 못했습니다. 설치 후 다시 시도하세요.".to_string()
    })?;
    let timeout = Duration::from_secs(cfg.timeout_sec.max(5) as u64);
    let session = BrowserSession::launch(&chrome_path, timeout, &[]).await?;

    let result: Result<Vec<ParsedEntry>, String> = async {
        if is_threads(&feed.url) {
            let (html, _) = render_html(&session, &feed.url, 3000).await?;
            Ok(extract_threads(&html, &feed.url))
        } else {
            let (html, final_url) = render_html(&session, &feed.url, 800).await?;
            Ok(extract_generic(&html, &final_url))
        }
    }
    .await;

    session.close().await;

    result.map(|entries| FetchOutcome::Parsed {
        entries,
        etag: None,
        last_modified: None,
    })
}

fn extract_threads(html: &str, source_url: &str) -> Vec<ParsedEntry> {
    let mut seen = std::collections::HashSet::new();
    collect_thread_articles(html, source_url, &mut seen)
}

fn collect_thread_articles(
    html: &str,
    source_url: &str,
    seen: &mut std::collections::HashSet<String>,
) -> Vec<ParsedEntry> {
    let doc = Html::parse_document(html);
    let link_sel = Selector::parse("a[href*='/post/']").expect("static");

    // Strategy 1: [data-pressable-container] — original threads.net selector
    let sel1 = Selector::parse("[data-pressable-container]").expect("static");
    let out = collect_with_container(&doc, &sel1, &link_sel, source_url, seen);
    if !out.is_empty() {
        return out;
    }

    // Strategy 2: <article> elements — threads.com may use semantic HTML
    let sel2 = Selector::parse("article").expect("static");
    let out = collect_with_container(&doc, &sel2, &link_sel, source_url, seen);
    if !out.is_empty() {
        return out;
    }

    // Strategy 3: [role="article"]
    let sel3 = Selector::parse("[role=\"article\"]").expect("static");
    let out = collect_with_container(&doc, &sel3, &link_sel, source_url, seen);
    if !out.is_empty() {
        return out;
    }

    // Strategy 4: collect /post/ links directly (minimum fallback)
    collect_from_post_links(&doc, &link_sel, source_url, seen)
}

fn collect_with_container(
    doc: &Html,
    container_sel: &Selector,
    link_sel: &Selector,
    source_url: &str,
    seen: &mut std::collections::HashSet<String>,
) -> Vec<ParsedEntry> {
    let img_sel = Selector::parse("img[src]").expect("static");
    let mut out: Vec<ParsedEntry> = Vec::new();
    for article in doc.select(container_sel) {
        let post_link = article
            .select(link_sel)
            .next()
            .and_then(|a| a.value().attr("href"))
            .map(|s| s.to_string());
        let url = match post_link {
            Some(href) => normalize_url(&href, source_url),
            None => continue,
        };
        if !seen.insert(url.clone()) {
            continue;
        }
        let text = extract_post_text(&article);
        if text.is_empty() {
            continue;
        }

        // 포스트 미디어 이미지 수집 (프로필 사진 제외, lazy-load data-src 포함)
        let mut seen_imgs: std::collections::HashSet<String> = std::collections::HashSet::new();
        let imgs: Vec<String> = article
            .select(&img_sel)
            .filter_map(|img| {
                let v = img.value();
                v.attr("src")
                    .or_else(|| v.attr("data-src"))
                    .or_else(|| v.attr("data-original"))
            })
            .filter(|src| is_media_image(src))
            .filter(|src| seen_imgs.insert(src.to_string()))
            .map(|s| s.to_string())
            .collect();

        let body = if imgs.is_empty() {
            text.clone()
        } else {
            let markers = imgs
                .iter()
                .map(|u| format!("[img]{}", u))
                .collect::<Vec<_>>()
                .join("\n");
            format!("{}\n{}", text, markers)
        };

        let title = first_line(&text, 80);
        let summary = truncate(&text, 280);
        out.push(ParsedEntry {
            id: url.clone(),
            title,
            summary,
            body,
            url,
            published_at: None,
        });
    }
    out
}

fn is_media_image(src: &str) -> bool {
    if !src.contains("fbcdn.net") && !src.contains("cdninstagram.com") {
        return false;
    }
    // 작은 프로필 사진 제외
    !src.contains("s150x150")
        && !src.contains("s48x48")
        && !src.contains("s32x32")
        && !src.contains("profile_pic")
        && !src.contains("_p150x150")
}

fn collect_from_post_links(
    doc: &Html,
    link_sel: &Selector,
    source_url: &str,
    seen: &mut std::collections::HashSet<String>,
) -> Vec<ParsedEntry> {
    let mut out: Vec<ParsedEntry> = Vec::new();
    for link in doc.select(link_sel) {
        let href = match link.value().attr("href") {
            Some(h) => h,
            None => continue,
        };
        let url = normalize_url(href, source_url);
        if !seen.insert(url.clone()) {
            continue;
        }
        let text = link.text().collect::<String>().trim().to_string();
        if text.is_empty() {
            continue;
        }
        let title = first_line(&text, 80);
        let summary = truncate(&text, 280);
        out.push(ParsedEntry {
            id: url.clone(),
            title,
            summary,
            body: text,
            url,
            published_at: None,
        });
    }
    out
}

// Threads 포스트 원문만 추출: dir="auto" 요소 우선, 없으면 전체 텍스트에서 UI 노이즈 제거
fn extract_post_text(article: &scraper::ElementRef) -> String {
    let dir_sel = Selector::parse("[dir='auto']").expect("static");
    let parts: Vec<String> = article
        .select(&dir_sel)
        .map(|el| el.text().collect::<String>().trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    if !parts.is_empty() {
        // dir="auto" 결과도 동일하게 노이즈 제거 적용
        return clean_threads_noise(&parts.join("\n"));
    }
    clean_threads_noise(&article.text().collect::<String>())
}

fn clean_threads_noise(raw: &str) -> String {
    use once_cell::sync::Lazy;
    use regex::Regex;

    // 포스트 헤더: "username인증된 계정N시간|분|일[더 보기]" 또는 "username N시간"
    static RE_HEADER: Lazy<Regex> = Lazy::new(|| {
        Regex::new(
            r"(?m)^Pin\s*icon고정됨|\S+인증된 계정\d+[분시간일주]+(?:더 보기)?|^[\w._@가-힣]+\d+[분시간일주]+(?:더 보기)?"
        ).unwrap()
    });
    // 참여 수치 (한 줄 연속): "좋아요N댓글N리포스트N공유하기N"
    static RE_ENGAGE: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"좋아요\d*댓글\d*리포스트\d*공유하기\d*|좋아요댓글리포스트공유하기|리포스트\d*공유하기\d*|공유하기\d+").unwrap()
    });
    // 인용 포스트 삽입: "오디오 소리 꺼짐username인증된 계정N시간"
    static RE_EMBED_MEDIA: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"오디오 소리 [꺼켜]짐\S*인증된 계정\d+[분시간일주]+|오디오 소리 [꺼켜]짐").unwrap()
    });
    // 투표: "비개발자 (입문자)51%개발자49%" (% 2개 이상 구간) / "768표 · ... 후 종료"
    static RE_POLL: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"[^\n]*\d+%[^\n]*\d+%[^\n]*|\d+표\s*·[^·\n]+후 종료").unwrap()
    });
    // 단독 타임스탬프 (줄 전체가 "22시간" 또는 "6분" 등)
    static RE_TIMESTAMP_LINE: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"(?m)^\d+[분시간일주]+$").unwrap()
    });
    // 단독 숫자 줄 (좋아요 카운트 등)
    static RE_NUM_LINE: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"(?m)^[\d,\.]+$").unwrap()
    });

    const NOISE_EXACT: &[&str] = &[
        "답글", "리포스트", "공유", "팔로우", "팔로잉", "더 보기",
        "Reply", "Repost", "Share", "Follow", "Following", "More",
        "인증된 계정",
    ];

    let mut s = raw.to_string();
    s = RE_HEADER.replace_all(&s, "").into_owned();
    s = RE_EMBED_MEDIA.replace_all(&s, "").into_owned();
    s = RE_ENGAGE.replace_all(&s, "").into_owned();
    s = RE_POLL.replace_all(&s, "").into_owned();
    s = s.replace("더 보기", "").replace("인증된 계정", "");
    s = RE_TIMESTAMP_LINE.replace_all(&s, "").into_owned();
    s = RE_NUM_LINE.replace_all(&s, "").into_owned();

    // 잔여 NOISE_EXACT 줄 제거
    let cleaned = s
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .filter(|l| !NOISE_EXACT.contains(l))
        .collect::<Vec<_>>()
        .join("\n");

    // 연속 공백 정리
    cleaned
        .split('\n')
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

async fn fetch_threads_all(
    session: &BrowserSession,
    url: &str,
    max_scrolls: u32,
) -> Result<Vec<ParsedEntry>, String> {
    let page = session
        .browser
        .new_page(url)
        .await
        .map_err(|e| format!("new_page: {}", e))?;
    let _ = page.wait_for_navigation().await;
    tokio::time::sleep(Duration::from_millis(3000)).await;

    // Chrome 세션 쿠키 inject → 리로드하면 로그인 상태로 전환
    let injected = inject_threads_cookies(&page).await;
    if injected > 0 {
        let _ = page.evaluate("location.reload()").await;
        let _ = page.wait_for_navigation().await;
        tokio::time::sleep(Duration::from_millis(3000)).await;
    }

    // 로그인 다이얼로그/스크롤 잠금 제거
    let _ = page.evaluate(
        "document.querySelectorAll('[role=\"dialog\"],[role=\"alertdialog\"]').forEach(d=>d.remove());\
         document.documentElement.style.overflow='';\
         document.body.style.overflow='';\
         document.documentElement.style.height='';\
         document.body.style.height='';"
    ).await;

    let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut all_entries: Vec<ParsedEntry> = Vec::new();
    let mut stall = 0u32;
    let mut last_scroll_height: i64 = 0;

    for _ in 0..=max_scrolls {
        let html = page
            .content()
            .await
            .map_err(|e| format!("content: {}", e))?;
        let new_entries = collect_thread_articles(&html, url, &mut seen);
        if new_entries.is_empty() {
            stall += 1;
            if stall >= 5 {
                break;
            }
        } else {
            stall = 0;
            all_entries.extend(new_entries);
        }

        // 현재 scrollHeight 측정 → 다음 루프에서 변화 없으면 stall 가속
        let cur_height = page
            .evaluate("Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)")
            .await
            .ok()
            .and_then(|v| v.into_value::<i64>().ok())
            .unwrap_or(0);

        if cur_height > 0 && cur_height == last_scroll_height {
            // 높이 변화 없음 = 새 콘텐츠 미로드
            stall += 1;
            if stall >= 5 {
                break;
            }
        }
        last_scroll_height = cur_height;

        // Threads SPA 무한스크롤 트리거: 여러 방식 병행
        let _ = page
            .evaluate(
                "const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);\
                 window.scrollTo({top: h, behavior: 'instant'});\
                 document.documentElement.scrollTop = h;\
                 document.body.scrollTop = h;\
                 window.dispatchEvent(new Event('scroll'));"
            )
            .await;
        tokio::time::sleep(Duration::from_millis(2500)).await;
    }

    let _ = page.close().await;
    Ok(all_entries)
}

/// CDN 이미지를 reqwest로 다운로드해 data URI (base64) 반환.
/// Referer: threads.net 헤더로 CDN 제한 우회.
/// 2 MB 초과 또는 실패 시 None.
async fn download_image_b64(url: &str) -> Option<String> {
    use base64::Engine;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .ok()?;
    let resp = client
        .get(url)
        .header("Referer", "https://www.threads.net/")
        .header(
            "User-Agent",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        )
        .send()
        .await
        .ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let ct = resp
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("image/jpeg")
        .split(';')
        .next()
        .unwrap_or("image/jpeg")
        .trim()
        .to_string();
    let bytes = resp.bytes().await.ok()?;
    if bytes.len() > 2_000_000 {
        return None;
    }
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Some(format!("data:{};base64,{}", ct, b64))
}

/// entries의 body에서 `[img]CDN_URL` 마커를 찾아 data URI로 교체.
/// 포스트당 최대 2장, 다운로드 실패 시 해당 마커 제거.
async fn replace_img_urls_with_b64(entries: Vec<ParsedEntry>) -> Vec<ParsedEntry> {
    let mut result = Vec::with_capacity(entries.len());
    for entry in entries {
        if !entry.body.contains("[img]") {
            result.push(entry);
            continue;
        }
        let mut new_body_lines: Vec<String> = Vec::new();
        let mut img_count = 0usize;
        for line in entry.body.lines() {
            if let Some(url) = line.strip_prefix("[img]") {
                if img_count < 2 {
                    if let Some(data_uri) = download_image_b64(url.trim()).await {
                        new_body_lines.push(format!("[img]{}", data_uri));
                        img_count += 1;
                    }
                    // 실패하거나 초과분은 마커째 생략
                }
            } else {
                new_body_lines.push(line.to_string());
            }
        }
        result.push(ParsedEntry {
            body: new_body_lines.join("\n"),
            ..entry
        });
    }
    result
}

fn threads_feed_id(url: &str) -> String {
    if let Ok(u) = reqwest::Url::parse(url) {
        let path = u.path().trim_matches('/').replace('/', "_");
        if !path.is_empty() {
            return format!("threads_{}", path);
        }
    }
    format!("threads_{}", url.len())
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn now_ts_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn extract_username(url: &str) -> String {
    if let Ok(u) = reqwest::Url::parse(url) {
        let path = u.path().trim_matches('/');
        if let Some(seg) = path.split('/').next() {
            if !seg.is_empty() {
                return seg.trim_start_matches('@').to_string();
            }
        }
    }
    "threads".to_string()
}

// ============================================================
// === Threads 프로필 저장소 =================================
// ============================================================

const THREADS_PROFILES_FILE: &str = "threads_profiles.json";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ThreadsProfile {
    pub id: String,
    pub url: String,
    pub label: String,
    #[serde(default)]
    pub auto_sync: bool,
    #[serde(default)]
    pub last_synced_at: Option<String>,
    #[serde(default)]
    pub last_result: Option<RssSyncResult>,
}

fn profiles_path(root: &std::path::Path) -> std::path::PathBuf {
    root.join(THREADS_PROFILES_FILE)
}

fn load_profiles(root: &std::path::Path) -> Result<Vec<ThreadsProfile>, String> {
    let p = profiles_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = std::fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<ThreadsProfile>>(&raw).map_err(|e| e.to_string())
}

fn save_profiles(root: &std::path::Path, profiles: &[ThreadsProfile]) -> Result<(), String> {
    let json = serde_json::to_string_pretty(profiles).map_err(|e| e.to_string())?;
    std::fs::write(profiles_path(root), json).map_err(|e| e.to_string())
}

// ============================================================
// === 공통 동기화 (초기 전체 + 증분 재사용) ==================
// ============================================================

async fn do_threads_sync(url: &str, max_scrolls: u32, data_root: &std::path::Path) -> RssSyncResult {
    let chrome_result = find_chrome();
    let (_, chrome_path) = match chrome_result {
        Some(c) => c,
        None => {
            return RssSyncResult {
                added: 0,
                updated: 0,
                skipped: 0,
                total: 0,
                error: Some("Chrome을 찾을 수 없습니다".into()),
            }
        }
    };

    let session = match BrowserSession::launch(&chrome_path, Duration::from_secs(180), &[]).await {
        Ok(s) => s,
        Err(e) => {
            return RssSyncResult {
                added: 0,
                updated: 0,
                skipped: 0,
                total: 0,
                error: Some(e),
            }
        }
    };

    let entries_result = fetch_threads_all(&session, url, max_scrolls).await;
    session.close().await;

    let entries = match entries_result {
        Ok(e) => e,
        Err(e) => {
            return RssSyncResult {
                added: 0,
                updated: 0,
                skipped: 0,
                total: 0,
                error: Some(e),
            }
        }
    };

    // CDN 이미지를 data URI로 미리 다운로드 (최대 2장/포스트, 병렬 처리)
    let entries = replace_img_urls_with_b64(entries).await;

    let existing = glean::list_items(data_root).unwrap_or_default();
    let mut seen_ext: std::collections::HashSet<String> = existing
        .iter()
        .filter_map(|it| it.external_id.as_ref())
        .cloned()
        .collect();

    let glean_dir = data_root.join("glean");
    if let Err(e) = std::fs::create_dir_all(&glean_dir) {
        return RssSyncResult {
            added: 0,
            updated: 0,
            skipped: 0,
            total: 0,
            error: Some(format!("glean dir: {}", e)),
        };
    }

    let feed_id = threads_feed_id(url);
    let total = entries.len() as u32;
    let mut added = 0u32;
    let mut skipped = 0u32;
    let mut first_error: Option<String> = None;
    let base_ms = now_ts_ms();

    for (i, entry) in entries.iter().enumerate() {
        if seen_ext.contains(&entry.id) {
            skipped += 1;
            continue;
        }
        seen_ext.insert(entry.id.clone());
        let item = GleanItem {
            id: format!("threads_{}_{}", base_ms, i),
            url: entry.url.clone(),
            source: "threads".into(),
            title: entry.title.clone(),
            excerpt: truncate(&entry.summary, 280),
            body: entry.body.clone(),
            fetched_at: now_iso(),
            status: "unread".into(),
            promoted_doc_id: None,
            highlights: Vec::<GleanHighlight>::new(),
            digest: None,
            feed_id: Some(feed_id.clone()),
            external_id: Some(entry.id.clone()),
            published_at: entry.published_at.clone(),
        };
        match glean::write_item(data_root, &item) {
            Ok(()) => added += 1,
            Err(e) => {
                if first_error.is_none() {
                    first_error = Some(format!("save {}: {}", item.id, e));
                }
            }
        }
    }

    RssSyncResult {
        added,
        updated: 0,
        skipped,
        total,
        error: first_error,
    }
}

// ============================================================
// === Chrome 쿠키 추출 + CDP 주입 (macOS) ====================
// ============================================================

/// Keychain에서 Chrome Safe Storage 마스터 키를 꺼내 v10/v11 AES 키 각각 유도
#[cfg(target_os = "macos")]
fn chrome_cookie_keys() -> Option<([u8; 16], [u8; 32])> {
    use security_framework::passwords::get_generic_password;
    use pbkdf2::pbkdf2_hmac;
    use sha1::Sha1;
    use sha2::Sha256;

    let master = get_generic_password("Chrome Safe Storage", "Chrome").ok()?;
    let mut k10 = [0u8; 16];
    let mut k11 = [0u8; 32];
    pbkdf2_hmac::<Sha1>(&master, b"saltysalt", 1003, &mut k10);
    pbkdf2_hmac::<Sha256>(&master, b"saltysalt", 1003, &mut k11);
    Some((k10, k11))
}

/// v10 (AES-128-CBC, iv = space×16) 복호화
#[cfg(target_os = "macos")]
fn decrypt_v10(data: &[u8], key: &[u8; 16]) -> Option<String> {
    use aes::Aes128;
    use cbc::Decryptor;
    use cipher::{KeyIvInit, block_padding::Pkcs7, BlockDecryptMut};
    let iv = [b' '; 16];
    let mut buf = data.to_vec();
    let plain = Decryptor::<Aes128>::new_from_slices(key, &iv)
        .ok()?
        .decrypt_padded_mut::<Pkcs7>(&mut buf)
        .ok()?;
    String::from_utf8(plain.to_vec()).ok()
}

/// v11 (AES-256-GCM, nonce = 앞 12바이트) 복호화
#[cfg(target_os = "macos")]
fn decrypt_v11(data: &[u8], key: &[u8; 32]) -> Option<String> {
    use aes_gcm::{Aes256Gcm, KeyInit, Nonce, aead::Aead};
    if data.len() < 12 { return None; }
    let plain = Aes256Gcm::new_from_slice(key)
        .ok()?
        .decrypt(Nonce::from_slice(&data[..12]), &data[12..])
        .ok()?;
    String::from_utf8(plain).ok()
}

#[cfg(target_os = "macos")]
fn decrypt_chrome_cookie(raw: &[u8], k10: &[u8; 16], k11: &[u8; 32]) -> Option<String> {
    if raw.len() < 3 {
        return String::from_utf8(raw.to_vec()).ok();
    }
    match &raw[..3] {
        b"v10" => decrypt_v10(&raw[3..], k10),
        b"v11" => decrypt_v11(&raw[3..], k11),
        _ => String::from_utf8(raw.to_vec()).ok(),
    }
}

/// Chrome Cookies SQLite에서 threads.com/net 쿠키를 읽어 복호화 후 CookieParam 목록 반환
#[cfg(target_os = "macos")]
fn load_threads_cookies_from_chrome()
    -> Vec<chromiumoxide::cdp::browser_protocol::network::CookieParam>
{
    use rusqlite::Connection;
    use chromiumoxide::cdp::browser_protocol::network::{CookieParam, TimeSinceEpoch};

    let (k10, k11) = match chrome_cookie_keys() {
        Some(k) => k,
        None => return vec![],
    };
    let home = match std::env::var("HOME") {
        Ok(h) => h,
        Err(_) => return vec![],
    };
    let src = std::path::PathBuf::from(&home)
        .join("Library/Application Support/Google/Chrome/Default/Cookies");
    if !src.is_file() { return vec![]; }

    // 잠금 충돌 방지: 임시 복사본 사용
    let tmp = std::env::temp_dir().join("bento_chrome_cookies_tmp.db");
    if std::fs::copy(&src, &tmp).is_err() { return vec![]; }

    let result = (|| -> Option<Vec<CookieParam>> {
        let conn = Connection::open(&tmp).ok()?;
        let mut stmt = conn.prepare(
            "SELECT name, encrypted_value, host_key, path, expires_utc, is_secure, is_httponly \
             FROM cookies WHERE host_key LIKE '%threads%'"
        ).ok()?;

        let rows: Vec<(String, Vec<u8>, String, String, i64, bool, bool)> =
            stmt.query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, Vec<u8>>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, i64>(4).unwrap_or(0),
                    row.get::<_, bool>(5).unwrap_or(false),
                    row.get::<_, bool>(6).unwrap_or(false),
                ))
            }).ok()?.filter_map(|r| r.ok()).collect();

        Some(rows.into_iter().filter_map(|(name, enc, host, path, exp_utc, secure, http_only)| {
            let value = decrypt_chrome_cookie(&enc, &k10, &k11)?;
            if value.is_empty() { return None; }
            // Chrome epoch: microseconds since 1601-01-01 → Unix seconds
            let expires = if exp_utc > 0 {
                Some(TimeSinceEpoch::new((exp_utc / 1_000_000 - 11_644_473_600) as f64))
            } else {
                None
            };
            Some(CookieParam {
                name,
                value,
                url: None,
                domain: Some(host),
                path: Some(path),
                secure: Some(secure),
                http_only: Some(http_only),
                same_site: None,
                expires,
                priority: None,
                same_party: None,
                source_scheme: None,
                source_port: None,
                partition_key: None,
            })
        }).collect())
    })();

    let _ = std::fs::remove_file(&tmp);
    result.unwrap_or_default()
}

/// CDP SetCookies로 threads 쿠키 주입. 주입된 쿠키 수 반환.
#[cfg(target_os = "macos")]
async fn inject_threads_cookies(page: &chromiumoxide::Page) -> usize {
    use chromiumoxide::cdp::browser_protocol::network::SetCookiesParams;
    let cookies = load_threads_cookies_from_chrome();
    if cookies.is_empty() { return 0; }
    let count = cookies.len();
    let _ = page.execute(SetCookiesParams::new(cookies)).await;
    count
}

#[cfg(not(target_os = "macos"))]
async fn inject_threads_cookies(_page: &chromiumoxide::Page) -> usize {
    0
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ThreadsDebugResult {
    pub html_snippet: String,
    pub article_count: usize,
    pub post_link_count: usize,
    pub title: String,
    pub cookie_count: usize,
    pub article_sel_counts: Vec<(String, usize)>,
}

#[tauri::command]
pub async fn debug_threads_page(url: String) -> Result<ThreadsDebugResult, String> {
    if !is_threads(&url) {
        return Err("Threads URL이 아닙니다".into());
    }
    let (_chrome_name, chrome_path) = find_chrome().ok_or_else(|| {
        "Chrome/Chromium을 찾지 못했습니다.".to_string()
    })?;
    let session = BrowserSession::launch(&chrome_path, Duration::from_secs(60), &[]).await?;

    let page = session.browser.new_page(&*url).await
        .map_err(|e| format!("new_page: {}", e))?;
    let _ = page.wait_for_navigation().await;
    tokio::time::sleep(Duration::from_millis(2000)).await;

    let cookie_count = inject_threads_cookies(&page).await;
    if cookie_count > 0 {
        let _ = page.evaluate("location.reload()").await;
        let _ = page.wait_for_navigation().await;
        tokio::time::sleep(Duration::from_millis(2500)).await;
    }

    let html = page.content().await.map_err(|e| format!("content: {}", e))?;
    let _ = page.close().await;
    session.close().await;

    let doc = Html::parse_document(&html);
    let post_link_sel = Selector::parse("a[href*='/post/']").expect("static");
    let title_sel = Selector::parse("title").expect("static");

    let sel_candidates = [
        "[data-pressable-container]",
        "article",
        "[role=\"article\"]",
    ];
    let article_sel_counts: Vec<(String, usize)> = sel_candidates
        .iter()
        .map(|s| {
            let count = Selector::parse(s)
                .map(|sel| doc.select(&sel).count())
                .unwrap_or(0);
            (s.to_string(), count)
        })
        .collect();

    let article_count = article_sel_counts.iter().map(|(_, c)| c).copied().max().unwrap_or(0);
    let post_link_count = doc.select(&post_link_sel).count();
    let title = doc
        .select(&title_sel)
        .next()
        .map(|n| n.text().collect::<String>())
        .unwrap_or_default();
    let snippet = html.chars().take(3000).collect::<String>();

    Ok(ThreadsDebugResult {
        html_snippet: snippet,
        article_count,
        post_link_count,
        title,
        cookie_count,
        article_sel_counts,
    })
}

#[tauri::command]
pub async fn fetch_threads_profile(
    url: String,
    max_scrolls: Option<u32>,
    state: State<'_, AppState>,
) -> Result<RssSyncResult, String> {
    if !is_threads(&url) {
        return Err("Threads URL이 아닙니다 (threads.net 또는 threads.com)".into());
    }
    Ok(do_threads_sync(&url, max_scrolls.unwrap_or(50), &state.data_root).await)
}

// ============================================================
// === Threads 프로필 관리 commands ===========================
// ============================================================

#[tauri::command]
pub fn list_threads_profiles(state: State<'_, AppState>) -> Result<Vec<ThreadsProfile>, String> {
    load_profiles(&state.data_root)
}

#[tauri::command]
pub async fn add_threads_profile(
    url: String,
    label: String,
    auto_sync: bool,
    max_scrolls: Option<u32>,
    state: State<'_, AppState>,
) -> Result<ThreadsProfile, String> {
    if !is_threads(&url) {
        return Err("Threads URL이 아닙니다".into());
    }
    let url = url.trim().to_string();
    let mut profiles = load_profiles(&state.data_root)?;
    if profiles.iter().any(|p| p.url == url) {
        return Err("이미 등록된 URL입니다".into());
    }

    let result = do_threads_sync(&url, max_scrolls.unwrap_or(50), &state.data_root).await;
    let label = {
        let t = label.trim().to_string();
        if t.is_empty() { extract_username(&url) } else { t }
    };

    let profile = ThreadsProfile {
        id: format!("thr_{}", now_ts_ms()),
        url,
        label,
        auto_sync,
        last_synced_at: Some(now_iso()),
        last_result: Some(result),
    };
    profiles.push(profile.clone());
    save_profiles(&state.data_root, &profiles)?;
    Ok(profile)
}

#[tauri::command]
pub fn remove_threads_profile(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut profiles = load_profiles(&state.data_root)?;
    let before = profiles.len();
    profiles.retain(|p| p.id != id);
    if profiles.len() == before {
        return Err(format!("profile not found: {}", id));
    }
    save_profiles(&state.data_root, &profiles)
}

#[tauri::command]
pub fn set_threads_autosync(
    id: String,
    enabled: bool,
    state: State<'_, AppState>,
) -> Result<ThreadsProfile, String> {
    let mut profiles = load_profiles(&state.data_root)?;
    let idx = profiles
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| format!("profile not found: {}", id))?;
    profiles[idx].auto_sync = enabled;
    save_profiles(&state.data_root, &profiles)?;
    Ok(profiles[idx].clone())
}

#[tauri::command]
pub async fn sync_threads_profile(
    id: String,
    state: State<'_, AppState>,
) -> Result<ThreadsProfile, String> {
    let mut profiles = load_profiles(&state.data_root)?;
    let idx = profiles
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| format!("profile not found: {}", id))?;
    let url = profiles[idx].url.clone();
    let result = do_threads_sync(&url, 5, &state.data_root).await;
    profiles[idx].last_synced_at = Some(now_iso());
    profiles[idx].last_result = Some(result);
    save_profiles(&state.data_root, &profiles)?;
    Ok(profiles[idx].clone())
}

// ============================================================
// === 자동 동기화 poller =====================================
// ============================================================

pub async fn start_threads_poller(app: tauri::AppHandle) {
    use tauri::{Emitter, Manager};

    let mut tick = tokio::time::interval(Duration::from_secs(3600));
    tick.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);

    loop {
        tick.tick().await;

        let data_root = {
            let state = match app.try_state::<AppState>() {
                Some(s) => s,
                None => continue,
            };
            state.data_root.clone()
        };

        let profiles = match load_profiles(&data_root) {
            Ok(p) => p,
            Err(_) => continue,
        };

        let due: Vec<_> = profiles.into_iter().filter(|p| p.auto_sync).collect();
        if due.is_empty() {
            continue;
        }

        let _ = app.emit("bento:threads-syncing", ());

        for profile in due {
            let result = do_threads_sync(&profile.url, 5, &data_root).await;
            if let Ok(mut updated) = load_profiles(&data_root) {
                if let Some(idx) = updated.iter().position(|p| p.id == profile.id) {
                    updated[idx].last_synced_at = Some(now_iso());
                    updated[idx].last_result = Some(result);
                    let _ = save_profiles(&data_root, &updated);
                }
            }
        }

        let _ = app.emit("bento:threads-synced", ());
    }
}

fn extract_generic(html: &str, final_url: &str) -> Vec<ParsedEntry> {
    let doc = Html::parse_document(html);
    let title = extract_title(&doc).unwrap_or_default();
    let summary = extract_description(&doc).unwrap_or_default();
    let body = extract_main_text(&doc);
    vec![ParsedEntry {
        id: final_url.to_string(),
        title,
        summary,
        body,
        url: final_url.to_string(),
        published_at: None,
    }]
}

fn extract_title(doc: &Html) -> Option<String> {
    let og = Selector::parse("meta[property=\"og:title\"]").ok()?;
    if let Some(s) = doc
        .select(&og)
        .next()
        .and_then(|n| n.value().attr("content"))
    {
        if !s.trim().is_empty() {
            return Some(s.trim().to_string());
        }
    }
    let title = Selector::parse("title").ok()?;
    if let Some(node) = doc.select(&title).next() {
        let t = node.text().collect::<String>().trim().to_string();
        if !t.is_empty() {
            return Some(t);
        }
    }
    None
}

fn extract_description(doc: &Html) -> Option<String> {
    for sel in [
        "meta[property=\"og:description\"]",
        "meta[name=\"twitter:description\"]",
        "meta[name=\"description\"]",
    ] {
        if let Ok(s) = Selector::parse(sel) {
            if let Some(text) = doc
                .select(&s)
                .next()
                .and_then(|n| n.value().attr("content"))
            {
                let t = text.trim();
                if !t.is_empty() {
                    return Some(t.to_string());
                }
            }
        }
    }
    None
}

fn extract_main_text(doc: &Html) -> String {
    for selector in ["article", "main", "[role=\"main\"]", "body"] {
        if let Ok(s) = Selector::parse(selector) {
            if let Some(node) = doc.select(&s).next() {
                let text = node.text().collect::<String>();
                let trimmed = text.trim();
                if trimmed.len() > 200 {
                    return trimmed.to_string();
                }
            }
        }
    }
    String::new()
}

fn normalize_url(href: &str, base: &str) -> String {
    if href.starts_with("http://") || href.starts_with("https://") {
        return href.to_string();
    }
    if let Ok(b) = reqwest::Url::parse(base) {
        if let Ok(u) = b.join(href) {
            return u.to_string();
        }
    }
    href.to_string()
}

fn first_line(s: &str, max: usize) -> String {
    let first = s.lines().next().unwrap_or("").trim();
    truncate(first, max)
}

fn truncate(s: &str, max: usize) -> String {
    let s = s.trim();
    if s.chars().count() <= max {
        return s.to_string();
    }
    let mut out: String = s.chars().take(max).collect();
    out.push('…');
    out
}
