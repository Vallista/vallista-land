use std::path::Path;
use std::time::Duration;

use tauri::{Emitter, Manager};

use crate::commands::radar::{append_activity, append_suggestion, load_goals, now_iso, save_goals};
use crate::repo::{build_user_agent, load_config, AppState};

// ============================================================
// === Public entrypoint ======================================
// ============================================================

pub async fn start_poller(app: tauri::AppHandle) {
    // 초기 지터: rss poller와 겹치지 않도록 45초 대기
    tokio::time::sleep(Duration::from_secs(45)).await;

    let mut tick = tokio::time::interval(Duration::from_secs(24 * 60 * 60));
    tick.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);

    loop {
        tick.tick().await;
        poll_all_goals(&app).await;
    }
}

async fn poll_all_goals(app: &tauri::AppHandle) {
    let (data_root, user_agent) = {
        let state = match app.try_state::<AppState>() {
            Some(s) => s,
            None => return,
        };
        let cfg = load_config(&state.data_root);
        let ua = build_user_agent(&cfg.app);
        (state.data_root.clone(), ua)
    };

    let mut goals = match load_goals(&data_root) {
        Ok(v) => v,
        Err(err) => {
            eprintln!("radar: failed to load goals: {}", err);
            return;
        }
    };

    if goals.is_empty() {
        return;
    }

    let gitlab_token = get_keychain_token("bento_gitlab_token");
    let confluence_token = get_keychain_token("bento_confluence_token");
    // User Token 우선, 없으면 Bot Token fallback
    let slack_token = get_keychain_token("bento_slack_user_token")
        .or_else(|| get_keychain_token("bento_slack_bot_token"));

    let mut seq: u64 = 0;

    for goal in goals.iter_mut() {
        let since = goal.last_polled_at.as_deref();

        if let Some(ref token) = gitlab_token {
            for project in goal.gitlab_projects.iter() {
                seq += 1;
                poll_gitlab(&data_root, &goal.id, project, since, token, &user_agent, seq).await;
            }
        }

        if let Some(ref token) = confluence_token {
            for url in goal.confluence_urls.iter() {
                seq += 1;
                poll_confluence(&data_root, &goal.id, url, since, token, &user_agent, seq).await;
            }
        }

        if let Some(ref token) = slack_token {
            for channel in goal.slack_channels.iter() {
                seq += 1;
                poll_slack(&data_root, &goal.id, channel, since, token, &user_agent, seq).await;
            }
        }

        goal.last_polled_at = Some(now_iso());
    }

    if let Err(err) = save_goals(&data_root, &goals) {
        eprintln!("radar: failed to persist goals: {}", err);
    }

    let _ = app.emit("bento:radar-synced", ());
}

// ============================================================
// === Keychain helper ========================================
// ============================================================

#[cfg(target_os = "macos")]
fn get_keychain_token(key: &str) -> Option<String> {
    use security_framework::passwords::get_generic_password;
    get_generic_password("bento", key)
        .ok()
        .and_then(|b| String::from_utf8(b).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

#[cfg(not(target_os = "macos"))]
fn get_keychain_token(_key: &str) -> Option<String> {
    None
}

// ============================================================
// === GitLab =================================================
// ============================================================

async fn poll_gitlab(
    data_root: &Path,
    goal_id: &str,
    project: &str,
    since: Option<&str>,
    token: &str,
    user_agent: &str,
    seq: u64,
) {
    if project.trim().is_empty() {
        return;
    }

    let encoded = urlencode(project.trim());
    let url = format!(
        "https://gitlab.com/api/v4/projects/{}/merge_requests?state=all&per_page=20",
        encoded
    );

    let client = match build_client(user_agent) {
        Ok(c) => c,
        Err(err) => {
            eprintln!("radar(gitlab): client build failed: {}", err);
            return;
        }
    };

    let resp = match client
        .get(&url)
        .header("PRIVATE-TOKEN", token)
        .send()
        .await
    {
        Ok(r) => r,
        Err(err) => {
            eprintln!("radar(gitlab): request failed: {}", err);
            return;
        }
    };

    if !resp.status().is_success() {
        eprintln!("radar(gitlab): HTTP {}", resp.status());
        return;
    }

    let body: Vec<serde_json::Value> = match resp.json().await {
        Ok(v) => v,
        Err(err) => {
            eprintln!("radar(gitlab): json parse failed: {}", err);
            return;
        }
    };

    let mut new_items: Vec<(String, String)> = Vec::new();
    let mut sub: u64 = 0;

    for mr in body.iter() {
        let updated_at = mr
            .get("updated_at")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        if updated_at.is_empty() {
            continue;
        }
        let is_new = since.map_or(true, |prev| updated_at.as_str() > prev);
        if !is_new {
            continue;
        }
        let title = mr
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("(제목 없음)");
        let state = mr.get("state").and_then(|v| v.as_str()).unwrap_or("opened");

        sub += 1;
        match state {
            "merged" => {
                let msg = format!("[GitLab] 병합 · {}", title);
                let suggested = format!("배포 확인 · {}", title);
                if let Err(err) = append_suggestion(
                    data_root,
                    goal_id,
                    "gitlab",
                    "mr_merged",
                    &msg,
                    &suggested,
                    seq * 1000 + sub,
                ) {
                    eprintln!("radar(gitlab): append suggestion failed: {}", err);
                }
            }
            "closed" => {
                new_items.push(("status_change".to_string(), format!("[GitLab] 닫힘 · {}", title)));
            }
            _ => {
                new_items.push(("mr_opened".to_string(), format!("[GitLab] MR · {}", title)));
            }
        }
    }

    for (atype, msg) in new_items.iter() {
        sub += 1;
        if let Err(err) = append_activity(
            data_root,
            goal_id,
            None,
            "gitlab",
            atype,
            msg,
            false,
            seq * 1000 + sub,
        ) {
            eprintln!("radar(gitlab): append activity failed: {}", err);
        }
    }
}

// ============================================================
// === Confluence =============================================
// ============================================================

async fn poll_confluence(
    data_root: &Path,
    goal_id: &str,
    url_str: &str,
    since: Option<&str>,
    token: &str,
    user_agent: &str,
    seq: u64,
) {
    if url_str.trim().is_empty() {
        return;
    }

    let Some((base_url, page_id)) = parse_confluence_url(url_str.trim()) else {
        return;
    };

    let api_url = format!(
        "{}/rest/api/content/{}?expand=version",
        base_url.trim_end_matches('/'),
        page_id
    );

    let client = match build_client(user_agent) {
        Ok(c) => c,
        Err(err) => {
            eprintln!("radar(confluence): client build failed: {}", err);
            return;
        }
    };

    let resp = match client
        .get(&api_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
    {
        Ok(r) => r,
        Err(err) => {
            eprintln!("radar(confluence): request failed: {}", err);
            return;
        }
    };

    if !resp.status().is_success() {
        eprintln!("radar(confluence): HTTP {}", resp.status());
        return;
    }

    let body: serde_json::Value = match resp.json().await {
        Ok(v) => v,
        Err(err) => {
            eprintln!("radar(confluence): json parse failed: {}", err);
            return;
        }
    };

    let title = body
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("(제목 없음)")
        .to_string();
    let when = body
        .get("version")
        .and_then(|v| v.get("when"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    if when.is_empty() {
        return;
    }

    let is_new = since.map_or(true, |p| when.as_str() > p);
    if is_new {
        let msg = format!("[Confluence] 페이지 업데이트 · {}", title);
        if let Err(err) = append_activity(
            data_root,
            goal_id,
            None,
            "confluence",
            "page_updated",
            &msg,
            false,
            seq * 1000,
        ) {
            eprintln!("radar(confluence): append activity failed: {}", err);
        }
    }
}

fn parse_confluence_url(url: &str) -> Option<(String, String)> {
    // 지원 패턴:
    //   https://{base}/pages/viewpage.action?pageId=12345
    //   https://{base}/wiki/spaces/SPACE/pages/12345/...
    //   https://{base}/wiki/pages/viewpage.action?pageId=12345
    let scheme_end = url.find("://")?;
    let after_scheme = &url[scheme_end + 3..];
    let path_start = after_scheme.find('/')?;
    let host = &after_scheme[..path_start];
    let path_query = &after_scheme[path_start..];
    let scheme = &url[..scheme_end];

    // pageId 쿼리 파라미터
    if let Some(q_start) = path_query.find('?') {
        let query = &path_query[q_start + 1..];
        for pair in query.split('&') {
            let mut it = pair.splitn(2, '=');
            let k = it.next()?.trim();
            if k == "pageId" {
                let v = it.next()?.trim();
                if !v.is_empty() {
                    let base = if path_query.starts_with("/wiki") {
                        format!("{}://{}/wiki", scheme, host)
                    } else {
                        format!("{}://{}", scheme, host)
                    };
                    return Some((base, v.to_string()));
                }
            }
        }
    }

    // /pages/{id}/ 패턴
    let path_only = path_query.split('?').next().unwrap_or(path_query);
    let segs: Vec<&str> = path_only.split('/').filter(|s| !s.is_empty()).collect();
    let mut base_prefix = String::new();
    if segs.first().copied() == Some("wiki") {
        base_prefix = "/wiki".to_string();
    }
    for i in 0..segs.len() {
        if segs[i] == "pages" {
            if let Some(id) = segs.get(i + 1) {
                if id.chars().all(|c| c.is_ascii_digit()) {
                    let base = format!("{}://{}{}", scheme, host, base_prefix);
                    return Some((base, (*id).to_string()));
                }
            }
        }
    }

    None
}

// ============================================================
// === Slack ==================================================
// ============================================================

async fn poll_slack(
    data_root: &Path,
    goal_id: &str,
    channel: &str,
    since: Option<&str>,
    token: &str,
    user_agent: &str,
    seq: u64,
) {
    if channel.trim().is_empty() {
        return;
    }
    let client = match build_client(user_agent) {
        Ok(c) => c,
        Err(err) => {
            eprintln!("radar(slack): client build failed: {}", err);
            return;
        }
    };

    // Resolve channel name → ID if needed
    let channel_id = if looks_like_slack_id(channel.trim()) {
        channel.trim().to_string()
    } else {
        match resolve_channel_id(channel.trim(), token, &client).await {
            Some(id) => id,
            None => {
                eprintln!("radar(slack): channel not found: {}", channel);
                return;
            }
        }
    };

    let since_unix = since.and_then(iso_to_unix_f64).unwrap_or(0.0);
    let ch_name = channel.trim().trim_start_matches('#');

    // Fetch new messages since last poll
    let url = format!(
        "https://slack.com/api/conversations.history?channel={}&oldest={}&limit=20",
        channel_id, since_unix
    );
    let resp = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await;

    let body: serde_json::Value = match resp {
        Ok(r) => match r.json().await {
            Ok(v) => v,
            Err(err) => {
                eprintln!("radar(slack): json parse failed: {}", err);
                return;
            }
        },
        Err(err) => {
            eprintln!("radar(slack): request failed: {}", err);
            return;
        }
    };

    if !body.get("ok").and_then(|v| v.as_bool()).unwrap_or(false) {
        let err = body.get("error").and_then(|v| v.as_str()).unwrap_or("unknown");
        eprintln!("radar(slack): API error: {}", err);
        return;
    }

    let messages = body.get("messages").and_then(|v| v.as_array());
    let msg_count = messages.map(|m| m.len()).unwrap_or(0);

    if msg_count > 0 {
        let msg = format!("[Slack] #{} · 새 메시지 {}건", ch_name, msg_count);
        if let Err(err) = append_activity(
            data_root,
            goal_id,
            None,
            "slack",
            "status_change",
            &msg,
            false,
            seq * 1000,
        ) {
            eprintln!("radar(slack): append activity failed: {}", err);
        }
    }

    // Check for stale channel: fetch the single most recent message
    if since.is_some() {
        let latest_url = format!(
            "https://slack.com/api/conversations.history?channel={}&limit=1",
            channel_id
        );
        if let Ok(r) = client
            .get(&latest_url)
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
        {
            if let Ok(latest_body) = r.json::<serde_json::Value>().await {
                let latest_ts = latest_body
                    .get("messages")
                    .and_then(|m| m.as_array())
                    .and_then(|arr| arr.first())
                    .and_then(|msg| msg.get("ts"))
                    .and_then(|ts| ts.as_str())
                    .and_then(|s| s.parse::<f64>().ok());

                if let Some(ts) = latest_ts {
                    let now_unix = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .map(|d| d.as_secs_f64())
                        .unwrap_or(0.0);
                    let days_silent = (now_unix - ts) / 86400.0;
                    if days_silent >= 3.0 {
                        let alert_msg = format!(
                            "[Slack] #{} · {:.0}일간 활동 없음",
                            ch_name, days_silent
                        );
                        let suggested = format!("#{} 진행상황 확인", ch_name);
                        if let Err(err) = append_suggestion(
                            data_root,
                            goal_id,
                            "slack",
                            "checkin_needed",
                            &alert_msg,
                            &suggested,
                            seq * 1000 + 1,
                        ) {
                            eprintln!("radar(slack): append suggestion failed: {}", err);
                        }
                    }
                }
            }
        }
    }
}

fn looks_like_slack_id(s: &str) -> bool {
    s.len() >= 9
        && (s.starts_with('C') || s.starts_with('G') || s.starts_with('D'))
        && s.chars().all(|c| c.is_ascii_alphanumeric())
}

async fn resolve_channel_id(
    name: &str,
    token: &str,
    client: &reqwest::Client,
) -> Option<String> {
    let clean = name.trim_start_matches('#');
    let url = "https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=200";
    let resp = client
        .get(url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .ok()?;
    let body: serde_json::Value = resp.json().await.ok()?;
    body.get("channels")?
        .as_array()?
        .iter()
        .find(|ch| ch.get("name").and_then(|n| n.as_str()) == Some(clean))
        .and_then(|ch| ch.get("id"))
        .and_then(|id| id.as_str())
        .map(|s| s.to_string())
}

fn iso_to_unix_f64(s: &str) -> Option<f64> {
    if s.len() < 19 {
        return None;
    }
    let year: i64 = s[0..4].parse().ok()?;
    let month: u32 = s[5..7].parse().ok()?;
    let day: u32 = s[8..10].parse().ok()?;
    let hour: i64 = s[11..13].parse().ok()?;
    let minute: i64 = s[14..16].parse().ok()?;
    let second: i64 = s[17..19].parse().ok()?;
    // Civil date → days since unix epoch (Cassio algorithm)
    let y = year - if month <= 2 { 1 } else { 0 };
    let era = y.div_euclid(400);
    let yoe = (y - era * 400) as u64;
    let doy = (153 * (month as u64 + if month > 2 { 0 } else { 9 }) + 2) / 5 + day as u64 - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = era * 146097 + doe as i64 - 719468;
    let unix = days * 86400 + hour * 3600 + minute * 60 + second;
    Some(unix as f64)
}

// ============================================================
// === Misc helpers ===========================================
// ============================================================

fn build_client(user_agent: &str) -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(user_agent)
        .timeout(Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|e| e.to_string())
}

fn urlencode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.' | '~') {
            out.push(ch);
        } else {
            for b in ch.to_string().as_bytes() {
                out.push_str(&format!("%{:02X}", b));
            }
        }
    }
    out
}
