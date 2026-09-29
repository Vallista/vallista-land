use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::repo::{ensure_inside, AppState};

const GOALS_FILE: &str = "goals.json";
const RADAR_TASKS_FILE: &str = "radar_tasks.json";
const RADAR_ACTIVITIES_FILE: &str = "radar_activities.json";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Goal {
    pub id: String,
    pub title: String,
    pub goal_type: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub start_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub deadline: Option<String>,
    pub color: String,
    pub status: String,
    // 소스 (각 타입별 배열. 없으면 빈 배열)
    #[serde(default)]
    pub slack_channels: Vec<String>,   // ["fe-platform", "fe-arch"]
    #[serde(default)]
    pub gitlab_projects: Vec<String>,  // ["group/project"]
    #[serde(default)]
    pub jira_urls: Vec<String>,
    #[serde(default)]
    pub confluence_urls: Vec<String>,
    // 폴링 상태
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub last_polled_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub folder: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RadarTask {
    pub id: String,
    pub goal_id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub assignee: Option<String>,
    pub is_mine: bool,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub deadline: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub plan_task_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub doc_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub parent_task_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RadarActivity {
    pub id: String,
    pub goal_id: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub task_id: Option<String>,
    pub source_type: String,
    pub activity_type: String,
    pub message: String,
    #[serde(default)]
    pub is_alert: bool,
    #[serde(default)]
    pub alert_dismissed: bool,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub suggested_task_title: Option<String>,
    pub created_at: String,
}

// ============================================================
// === Path / IO helpers ======================================
// ============================================================

fn goals_path(root: &Path) -> std::path::PathBuf {
    root.join(GOALS_FILE)
}

fn radar_tasks_path(root: &Path) -> std::path::PathBuf {
    root.join(RADAR_TASKS_FILE)
}

fn radar_activities_path(root: &Path) -> std::path::PathBuf {
    root.join(RADAR_ACTIVITIES_FILE)
}

pub fn load_goals(root: &Path) -> Result<Vec<Goal>, String> {
    let p = goals_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<Goal>>(&raw).map_err(|e| e.to_string())
}

pub fn save_goals(root: &Path, goals: &[Goal]) -> Result<(), String> {
    let p = goals_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(goals).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

pub fn load_radar_tasks(root: &Path) -> Result<Vec<RadarTask>, String> {
    let p = radar_tasks_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<RadarTask>>(&raw).map_err(|e| e.to_string())
}

pub fn save_radar_tasks(root: &Path, tasks: &[RadarTask]) -> Result<(), String> {
    let p = radar_tasks_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(tasks).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

pub fn load_radar_activities(root: &Path) -> Result<Vec<RadarActivity>, String> {
    let p = radar_activities_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<RadarActivity>>(&raw).map_err(|e| e.to_string())
}

pub fn save_radar_activities(root: &Path, items: &[RadarActivity]) -> Result<(), String> {
    let p = radar_activities_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(items).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

// ============================================================
// === Time helpers (copied from tasks.rs) ====================
// ============================================================

pub fn now_iso() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    iso_from_unix(secs as i64)
}

fn iso_from_unix(secs: i64) -> String {
    let days = secs.div_euclid(86_400);
    let mut s = secs.rem_euclid(86_400);
    let hour = (s / 3600) as u32;
    s %= 3600;
    let minute = (s / 60) as u32;
    let second = (s % 60) as u32;
    let (year, month, day) = civil_from_days(days);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hour, minute, second
    )
}

fn civil_from_days(days: i64) -> (i32, u32, u32) {
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = y + (if m <= 2 { 1 } else { 0 });
    (year as i32, m as u32, d as u32)
}

// ============================================================
// === Goals ==================================================
// ============================================================

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalInput {
    pub id: String,
    pub title: String,
    pub goal_type: String,
    #[serde(default)]
    pub start_date: Option<String>,
    #[serde(default)]
    pub deadline: Option<String>,
    pub color: String,
    pub status: String,
    #[serde(default)]
    pub slack_channels: Vec<String>,
    #[serde(default)]
    pub gitlab_projects: Vec<String>,
    #[serde(default)]
    pub jira_urls: Vec<String>,
    #[serde(default)]
    pub confluence_urls: Vec<String>,
    #[serde(default)]
    pub folder: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalPatch {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub goal_type: Option<String>,
    #[serde(default)]
    pub start_date: Option<Option<String>>,
    #[serde(default)]
    pub deadline: Option<Option<String>>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub slack_channels: Option<Vec<String>>,
    #[serde(default)]
    pub gitlab_projects: Option<Vec<String>>,
    #[serde(default)]
    pub jira_urls: Option<Vec<String>>,
    #[serde(default)]
    pub confluence_urls: Option<Vec<String>>,
    #[serde(default)]
    pub folder: Option<Option<String>>,
}

#[tauri::command]
pub fn list_goals(state: State<'_, AppState>) -> Result<Vec<Goal>, String> {
    load_goals(&state.data_root)
}

#[tauri::command]
pub fn add_goal(input: GoalInput, state: State<'_, AppState>) -> Result<Goal, String> {
    let mut all = load_goals(&state.data_root)?;
    if all.iter().any(|g| g.id == input.id) {
        return Err(format!("goal already exists: {}", input.id));
    }
    let now = now_iso();
    let goal = Goal {
        id: input.id,
        title: input.title,
        goal_type: input.goal_type,
        start_date: input.start_date.filter(|s| !s.is_empty()),
        deadline: input.deadline.filter(|s| !s.is_empty()),
        color: input.color,
        status: input.status,
        slack_channels: input.slack_channels,
        gitlab_projects: input.gitlab_projects,
        jira_urls: input.jira_urls,
        confluence_urls: input.confluence_urls,
        last_polled_at: None,
        folder: input.folder.filter(|s| !s.is_empty()),
        created_at: now.clone(),
        updated_at: now,
    };
    all.push(goal.clone());
    save_goals(&state.data_root, &all)?;
    Ok(goal)
}

#[tauri::command]
pub fn update_goal(
    id: String,
    patch: GoalPatch,
    state: State<'_, AppState>,
) -> Result<Goal, String> {
    let mut all = load_goals(&state.data_root)?;
    let idx = all
        .iter()
        .position(|g| g.id == id)
        .ok_or_else(|| format!("goal not found: {}", id))?;
    if let Some(t) = patch.title {
        all[idx].title = t;
    }
    if let Some(t) = patch.goal_type {
        all[idx].goal_type = t;
    }
    if let Some(d) = patch.start_date {
        all[idx].start_date = d.filter(|s| !s.is_empty());
    }
    if let Some(d) = patch.deadline {
        all[idx].deadline = d.filter(|s| !s.is_empty());
    }
    if let Some(c) = patch.color {
        all[idx].color = c;
    }
    if let Some(s) = patch.status {
        all[idx].status = s;
    }
    if let Some(v) = patch.slack_channels {
        all[idx].slack_channels = v;
    }
    if let Some(v) = patch.gitlab_projects {
        all[idx].gitlab_projects = v;
    }
    if let Some(v) = patch.jira_urls {
        all[idx].jira_urls = v;
    }
    if let Some(v) = patch.confluence_urls {
        all[idx].confluence_urls = v;
    }
    if let Some(v) = patch.folder {
        all[idx].folder = v.filter(|s| !s.is_empty());
    }
    all[idx].updated_at = now_iso();
    let updated = all[idx].clone();
    save_goals(&state.data_root, &all)?;
    Ok(updated)
}

#[tauri::command]
pub fn delete_goal(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut goals = load_goals(&state.data_root)?;
    let before = goals.len();
    goals.retain(|g| g.id != id);
    if goals.len() == before {
        return Err(format!("goal not found: {}", id));
    }
    save_goals(&state.data_root, &goals)?;
    // 연관 태스크/활동도 함께 정리
    let mut tasks = load_radar_tasks(&state.data_root)?;
    tasks.retain(|t| t.goal_id != id);
    save_radar_tasks(&state.data_root, &tasks)?;
    let mut acts = load_radar_activities(&state.data_root)?;
    acts.retain(|a| a.goal_id != id);
    save_radar_activities(&state.data_root, &acts)?;
    Ok(())
}

// ============================================================
// === Radar Tasks ============================================
// ============================================================

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RadarTaskInput {
    pub id: String,
    pub goal_id: String,
    pub title: String,
    #[serde(default)]
    pub assignee: Option<String>,
    pub is_mine: bool,
    pub status: String,
    #[serde(default)]
    pub deadline: Option<String>,
    #[serde(default)]
    pub plan_task_id: Option<String>,
    #[serde(default)]
    pub doc_path: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub parent_task_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RadarTaskPatch {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub assignee: Option<Option<String>>,
    #[serde(default)]
    pub is_mine: Option<bool>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub deadline: Option<Option<String>>,
    #[serde(default)]
    pub plan_task_id: Option<Option<String>>,
    #[serde(default)]
    pub doc_path: Option<Option<String>>,
    #[serde(default)]
    pub notes: Option<Option<String>>,
    #[serde(default)]
    pub parent_task_id: Option<Option<String>>,
}

#[tauri::command]
pub fn list_radar_tasks(
    goal_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<RadarTask>, String> {
    let all = load_radar_tasks(&state.data_root)?;
    let filtered = match goal_id {
        Some(gid) if !gid.is_empty() => all.into_iter().filter(|t| t.goal_id == gid).collect(),
        _ => all,
    };
    Ok(filtered)
}

#[tauri::command]
pub fn add_radar_task(
    input: RadarTaskInput,
    state: State<'_, AppState>,
) -> Result<RadarTask, String> {
    let mut all = load_radar_tasks(&state.data_root)?;
    if all.iter().any(|t| t.id == input.id) {
        return Err(format!("radar task already exists: {}", input.id));
    }
    let now = now_iso();
    let task = RadarTask {
        id: input.id,
        goal_id: input.goal_id,
        title: input.title,
        assignee: input.assignee.filter(|s| !s.is_empty()),
        is_mine: input.is_mine,
        status: input.status,
        deadline: input.deadline.filter(|s| !s.is_empty()),
        plan_task_id: input.plan_task_id.filter(|s| !s.is_empty()),
        doc_path: input.doc_path.filter(|s| !s.is_empty()),
        notes: input.notes.filter(|s| !s.is_empty()),
        parent_task_id: input.parent_task_id.filter(|s| !s.is_empty()),
        created_at: now.clone(),
        updated_at: now,
    };
    all.push(task.clone());
    save_radar_tasks(&state.data_root, &all)?;
    Ok(task)
}

#[tauri::command]
pub fn update_radar_task(
    id: String,
    patch: RadarTaskPatch,
    state: State<'_, AppState>,
) -> Result<RadarTask, String> {
    let mut all = load_radar_tasks(&state.data_root)?;
    let idx = all
        .iter()
        .position(|t| t.id == id)
        .ok_or_else(|| format!("radar task not found: {}", id))?;
    if let Some(t) = patch.title {
        all[idx].title = t;
    }
    if let Some(a) = patch.assignee {
        all[idx].assignee = a.filter(|s| !s.is_empty());
    }
    if let Some(m) = patch.is_mine {
        all[idx].is_mine = m;
    }
    if let Some(s) = patch.status {
        all[idx].status = s;
    }
    if let Some(d) = patch.deadline {
        all[idx].deadline = d.filter(|s| !s.is_empty());
    }
    if let Some(p) = patch.plan_task_id {
        all[idx].plan_task_id = p.filter(|s| !s.is_empty());
    }
    if let Some(d) = patch.doc_path {
        all[idx].doc_path = d.filter(|s| !s.is_empty());
    }
    if let Some(n) = patch.notes {
        all[idx].notes = n.filter(|s| !s.is_empty());
    }
    if let Some(p) = patch.parent_task_id {
        all[idx].parent_task_id = p.filter(|s| !s.is_empty());
    }
    all[idx].updated_at = now_iso();
    let updated = all[idx].clone();
    save_radar_tasks(&state.data_root, &all)?;
    Ok(updated)
}

#[tauri::command]
pub fn delete_radar_task(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut all = load_radar_tasks(&state.data_root)?;
    let before = all.len();
    all.retain(|t| t.id != id);
    if all.len() == before {
        return Err(format!("radar task not found: {}", id));
    }
    save_radar_tasks(&state.data_root, &all)
}

// ============================================================
// === Radar Activities =======================================
// ============================================================

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RadarActivityInput {
    pub goal_id: String,
    #[serde(default)]
    pub task_id: Option<String>,
    pub source_type: String,
    pub activity_type: String,
    pub message: String,
    #[serde(default)]
    pub is_alert: bool,
}

#[tauri::command]
pub fn list_radar_activities(
    goal_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<RadarActivity>, String> {
    let all = load_radar_activities(&state.data_root)?;
    let filtered = match goal_id {
        Some(gid) if !gid.is_empty() => all.into_iter().filter(|a| a.goal_id == gid).collect(),
        _ => all,
    };
    Ok(filtered)
}

#[tauri::command]
pub fn add_radar_activity(
    input: RadarActivityInput,
    state: State<'_, AppState>,
) -> Result<RadarActivity, String> {
    let mut all = load_radar_activities(&state.data_root)?;
    let unix_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let activity = RadarActivity {
        id: format!("radar_act_{}", unix_ms),
        goal_id: input.goal_id,
        task_id: input.task_id.filter(|s| !s.is_empty()),
        source_type: input.source_type,
        activity_type: input.activity_type,
        message: input.message,
        is_alert: input.is_alert,
        alert_dismissed: false,
        suggested_task_title: None,
        created_at: now_iso(),
    };
    all.push(activity.clone());
    save_radar_activities(&state.data_root, &all)?;
    Ok(activity)
}

#[tauri::command]
pub fn dismiss_radar_alert(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut all = load_radar_activities(&state.data_root)?;
    let idx = all
        .iter()
        .position(|a| a.id == id)
        .ok_or_else(|| format!("activity not found: {}", id))?;
    all[idx].alert_dismissed = true;
    save_radar_activities(&state.data_root, &all)
}

// ============================================================
// === Radar token keychain helpers (service = "bento") =======
// ============================================================

#[tauri::command]
pub fn radar_save_token(key: String, token: String) -> Result<(), String> {
    let k = key.trim();
    let t = token.trim();
    if k.is_empty() {
        return Err("key is empty".to_string());
    }
    #[cfg(target_os = "macos")]
    {
        use security_framework::passwords::set_generic_password;
        set_generic_password("bento", k, t.as_bytes()).map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = t;
        Ok(())
    }
}

#[tauri::command]
pub fn radar_has_token(key: String) -> bool {
    #[cfg(target_os = "macos")]
    {
        use security_framework::passwords::get_generic_password;
        get_generic_password("bento", key.trim())
            .ok()
            .and_then(|b| String::from_utf8(b).ok())
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "macos"))]
    false
}

// ============================================================
// === Internal helpers for poller ============================
// ============================================================

/// Poller가 직접 호출하는 헬퍼. JSON 파일에 activity 한 건 추가.
pub fn append_activity(
    data_root: &Path,
    goal_id: &str,
    task_id: Option<&str>,
    source_type: &str,
    activity_type: &str,
    message: &str,
    is_alert: bool,
    seq: u64,
) -> Result<(), String> {
    let mut all = load_radar_activities(data_root)?;
    let unix_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let activity = RadarActivity {
        id: format!("radar_act_{}_{}", unix_ms, seq),
        goal_id: goal_id.to_string(),
        task_id: task_id.map(|s| s.to_string()).filter(|s| !s.is_empty()),
        source_type: source_type.to_string(),
        activity_type: activity_type.to_string(),
        message: message.to_string(),
        is_alert,
        alert_dismissed: false,
        suggested_task_title: None,
        created_at: now_iso(),
    };
    all.push(activity);
    save_radar_activities(data_root, &all)
}

pub fn append_suggestion(
    data_root: &Path,
    goal_id: &str,
    source_type: &str,
    activity_type: &str,
    message: &str,
    suggested_task_title: &str,
    seq: u64,
) -> Result<(), String> {
    let mut all = load_radar_activities(data_root)?;
    let unix_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let activity = RadarActivity {
        id: format!("radar_act_{}_{}", unix_ms, seq),
        goal_id: goal_id.to_string(),
        task_id: None,
        source_type: source_type.to_string(),
        activity_type: activity_type.to_string(),
        message: message.to_string(),
        is_alert: true,
        alert_dismissed: false,
        suggested_task_title: Some(suggested_task_title.to_string()),
        created_at: now_iso(),
    };
    all.push(activity);
    save_radar_activities(data_root, &all)
}

// ============================================================
// === Manual sync trigger ====================================
// ============================================================

#[tauri::command]
pub async fn trigger_radar_poll_goal(
    goal_id: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    use tauri::Emitter;
    app.emit("bento:radar-synced", &goal_id)
        .map_err(|e| e.to_string())
}
