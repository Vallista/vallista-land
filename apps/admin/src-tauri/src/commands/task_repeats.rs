use chrono::{DateTime, Datelike, Local, NaiveDate};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::commands::tasks::{self, Task};
use crate::repo::{ensure_inside, AppState};

const FILE_NAME: &str = "task_repeats.json";
const SCAN_DAYS: usize = 400;
const GENERATED_EVENT: &str = "bento:tasks-generated";

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum RepeatFreq {
    Daily,
    Weekly,
    Monthly,
}

fn one() -> u32 {
    1
}

fn one_u8() -> u8 {
    1
}

fn default_true() -> bool {
    true
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RepeatRule {
    pub freq: RepeatFreq,
    /// daily: N일마다, weekly: N주마다 (monthly는 항상 1)
    #[serde(default = "one")]
    pub interval: u32,
    /// weekly 전용. 0=일 … 6=토 (JS `getDay`와 같음)
    #[serde(default)]
    pub weekdays: Vec<u8>,
    /// monthly 전용. 1..=31, 그 달에 없는 날은 말일로 당긴다
    #[serde(default = "one_u8")]
    pub month_day: u8,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TaskRepeat {
    pub id: String,
    pub title: String,
    pub rule: RepeatRule,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub time: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub est_min: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub folder_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub group: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub kind: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub color: Option<String>,
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// YYYY-MM-DD. 반복의 기준일이자 첫 회차 가능일
    pub start_date: String,
    /// 마지막으로 만든(또는 건너뛴) 회차 날짜
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub last_key: Option<String>,
    pub created_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskRepeatInput {
    pub title: String,
    pub rule: RepeatRule,
    #[serde(default)]
    pub time: Option<String>,
    #[serde(default)]
    pub est_min: Option<u32>,
    #[serde(default)]
    pub folder_id: Option<String>,
    #[serde(default)]
    pub group: Option<String>,
    #[serde(default)]
    pub kind: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub enabled: Option<bool>,
    pub start_date: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskRepeatView {
    #[serde(flatten)]
    pub rule: TaskRepeat,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pending_task_id: Option<String>,
}

fn file_path(root: &Path) -> std::path::PathBuf {
    root.join(FILE_NAME)
}

pub fn load_all(root: &Path) -> Result<Vec<TaskRepeat>, String> {
    let p = file_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<TaskRepeat>>(&raw).map_err(|e| e.to_string())
}

pub fn save_all(root: &Path, rules: &[TaskRepeat]) -> Result<(), String> {
    let p = file_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(rules).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

fn parse_date(s: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").ok()
}

fn date_key(d: NaiveDate) -> String {
    d.format("%Y-%m-%d").to_string()
}

/// ISO 타임스탬프를 로컬 날짜로. RFC 3339가 아니면 앞 10자를 날짜로 읽는다.
pub fn local_date_of(iso: &str) -> Option<NaiveDate> {
    if let Ok(dt) = DateTime::parse_from_rfc3339(iso) {
        return Some(dt.with_timezone(&Local).date_naive());
    }
    iso.get(..10).and_then(parse_date)
}

fn clean(s: Option<String>) -> Option<String> {
    s.map(|v| v.trim().to_string()).filter(|v| !v.is_empty())
}

fn is_hhmm(s: &str) -> bool {
    let b = s.as_bytes();
    if b.len() != 5 || b[2] != b':' {
        return false;
    }
    if !b.iter().enumerate().all(|(i, c)| i == 2 || c.is_ascii_digit()) {
        return false;
    }
    let hour: u32 = s[..2].parse().unwrap_or(99);
    let minute: u32 = s[3..].parse().unwrap_or(99);
    hour < 24 && minute < 60
}

fn normalize(mut input: TaskRepeatInput) -> Result<TaskRepeatInput, String> {
    input.title = input.title.trim().to_string();
    if input.title.is_empty() {
        return Err("제목을 입력하세요".to_string());
    }
    match input.rule.freq {
        RepeatFreq::Daily => {
            if !(1..=365).contains(&input.rule.interval) {
                return Err("일 간격은 1~365 사이여야 합니다".to_string());
            }
            input.rule.weekdays.clear();
            input.rule.month_day = 1;
        }
        RepeatFreq::Weekly => {
            if !(1..=52).contains(&input.rule.interval) {
                return Err("주 간격은 1~52 사이여야 합니다".to_string());
            }
            let mut days = input.rule.weekdays.clone();
            days.sort_unstable();
            days.dedup();
            if days.is_empty() {
                return Err("요일을 하나 이상 선택하세요".to_string());
            }
            if days.iter().any(|d| *d > 6) {
                return Err("요일 값이 올바르지 않습니다".to_string());
            }
            input.rule.weekdays = days;
            input.rule.month_day = 1;
        }
        RepeatFreq::Monthly => {
            if !(1..=31).contains(&input.rule.month_day) {
                return Err("날짜는 1~31 사이여야 합니다".to_string());
            }
            input.rule.interval = 1;
            input.rule.weekdays.clear();
        }
    }
    input.time = clean(input.time).map(|t| if t.len() == 8 { t[..5].to_string() } else { t });
    if let Some(t) = &input.time {
        if !is_hhmm(t) {
            return Err("시간은 HH:MM 형식이어야 합니다".to_string());
        }
    }
    input.start_date = input.start_date.trim().to_string();
    if parse_date(&input.start_date).is_none() {
        return Err("시작일은 YYYY-MM-DD 형식이어야 합니다".to_string());
    }
    input.est_min = input.est_min.filter(|n| *n > 0);
    input.folder_id = clean(input.folder_id);
    input.group = clean(input.group);
    input.kind = clean(input.kind);
    input.color = clean(input.color);
    Ok(input)
}

fn days_in_month(year: i32, month: u32) -> u32 {
    let (ny, nm) = if month == 12 {
        (year + 1, 1)
    } else {
        (year, month + 1)
    };
    NaiveDate::from_ymd_opt(ny, nm, 1)
        .and_then(|d| d.pred_opt())
        .map(|d| d.day())
        .unwrap_or(28)
}

/// 월요일 시작 달력 주의 일련번호
fn week_index(d: NaiveDate) -> i64 {
    let days = i64::from(d.num_days_from_ce());
    let offset = i64::from(d.weekday().num_days_from_monday());
    (days - offset).div_euclid(7)
}

pub fn is_occurrence(rule: &RepeatRule, start: NaiveDate, d: NaiveDate) -> bool {
    if d < start {
        return false;
    }
    let interval = i64::from(rule.interval.max(1));
    match rule.freq {
        RepeatFreq::Daily => (d - start).num_days() % interval == 0,
        RepeatFreq::Weekly => {
            let weekday = d.weekday().num_days_from_sunday() as u8;
            rule.weekdays.contains(&weekday)
                && (week_index(d) - week_index(start)) % interval == 0
        }
        RepeatFreq::Monthly => {
            let last = days_in_month(d.year(), d.month());
            d.day() == u32::from(rule.month_day.max(1)).min(last)
        }
    }
}

/// `(after, until]` 구간에서 가장 늦은 회차. `start` 이전은 보지 않는다.
pub fn latest_occurrence_in(
    rule: &RepeatRule,
    start: NaiveDate,
    after: Option<NaiveDate>,
    until: NaiveDate,
) -> Option<NaiveDate> {
    let mut lower = start;
    if let Some(a) = after {
        let next = a.succ_opt()?;
        if next > lower {
            lower = next;
        }
    }
    let mut d = until;
    for _ in 0..SCAN_DAYS {
        if d < lower {
            return None;
        }
        if is_occurrence(rule, start, d) {
            return Some(d);
        }
        d = d.pred_opt()?;
    }
    None
}

pub fn next_occurrence_after(
    rule: &RepeatRule,
    start: NaiveDate,
    after: NaiveDate,
) -> Option<NaiveDate> {
    let mut d = after.succ_opt()?.max(start);
    for _ in 0..SCAN_DAYS {
        if is_occurrence(rule, start, d) {
            return Some(d);
        }
        d = d.succ_opt()?;
    }
    None
}

fn instance_id(rule_id: &str, key: &str) -> String {
    format!("t_{}_{}", rule_id, key)
}

/// 이 규칙에서 다음 회차를 찾기 시작할 기준일: `last_key`와 완료 인스턴스의 완료일 중 가장 늦은 날
fn floor_of(rule: &TaskRepeat, instances: &[&Task]) -> Option<NaiveDate> {
    let mut floor = rule.last_key.as_deref().and_then(parse_date);
    for t in instances {
        let key = t.repeat_key.as_deref().and_then(parse_date);
        let done = t.done_at.as_deref().and_then(local_date_of);
        for d in [key, done].into_iter().flatten() {
            floor = Some(floor.map_or(d, |f| f.max(d)));
        }
    }
    floor
}

fn instance_task(rule: &TaskRepeat, id: &str, key: &str, now: &str) -> Task {
    let due = match &rule.time {
        Some(t) => format!("{}T{}:00", key, t),
        None => key.to_string(),
    };
    Task {
        id: id.to_string(),
        title: rule.title.clone(),
        done: false,
        due: Some(due),
        doc_id: None,
        est_min: rule.est_min,
        start_at: None,
        tags: Vec::new(),
        notes: None,
        subtasks: Vec::new(),
        color: rule.color.clone(),
        kind: rule.kind.clone(),
        folder_id: rule.folder_id.clone(),
        group: rule.group.clone(),
        created_at: now.to_string(),
        done_at: None,
        repeat_id: Some(rule.id.clone()),
        repeat_key: Some(key.to_string()),
    }
}

/// 규칙마다 `today`까지의 최근 회차 1개를 `tasks`에 만든다. 미완료 인스턴스가 있으면 건너뛴다.
/// 반환: (만든 할 일 수, 규칙 변경 여부)
pub fn generate_in(
    rules: &mut [TaskRepeat],
    tasks: &mut Vec<Task>,
    today: NaiveDate,
    now: &str,
) -> (usize, bool) {
    let mut created = 0;
    let mut rules_changed = false;
    for rule in rules.iter_mut() {
        if !rule.enabled {
            continue;
        }
        let Some(start) = parse_date(&rule.start_date) else {
            continue;
        };
        let (has_undone, floor) = {
            let instances: Vec<&Task> = tasks
                .iter()
                .filter(|t| t.repeat_id.as_deref() == Some(rule.id.as_str()))
                .collect();
            (
                instances.iter().any(|t| !t.done),
                floor_of(rule, &instances),
            )
        };
        if has_undone {
            continue;
        }
        let Some(occurrence) = latest_occurrence_in(&rule.rule, start, floor, today) else {
            continue;
        };
        let key = date_key(occurrence);
        if rule.last_key.as_deref() != Some(key.as_str()) {
            rule.last_key = Some(key.clone());
            rules_changed = true;
        }
        let id = instance_id(&rule.id, &key);
        if tasks.iter().any(|t| t.id == id) {
            continue;
        }
        tasks.push(instance_task(rule, &id, &key, now));
        created += 1;
    }
    (created, rules_changed)
}

/// 오늘 기준으로 밀린 회차를 만들고 저장한다. 만든 할 일 수를 돌려준다.
pub fn generate_due(data_root: &Path) -> Result<usize, String> {
    let mut rules = load_all(data_root)?;
    if rules.iter().all(|r| !r.enabled) {
        return Ok(0);
    }
    let mut all = tasks::load_all(data_root)?;
    let today = Local::now().date_naive();
    let now = tasks::now_iso();
    let (created, rules_changed) = generate_in(&mut rules, &mut all, today, &now);
    // 할 일을 먼저 저장한다: 규칙(last_key)만 먼저 남으면 그 회차가 영영 건너뛰어진다.
    if created > 0 {
        tasks::save_all(data_root, &all)?;
    }
    if rules_changed {
        save_all(data_root, &rules)?;
    }
    Ok(created)
}

fn generate_and_notify(app: &AppHandle, data_root: &Path) {
    match generate_due(data_root) {
        Ok(created) if created > 0 => {
            let _ = app.emit(GENERATED_EVENT, created);
        }
        Ok(_) => {}
        Err(e) => eprintln!("task repeat generation failed: {e}"),
    }
}

fn view_of(rule: TaskRepeat, tasks: &[Task], today: NaiveDate) -> TaskRepeatView {
    let instances: Vec<&Task> = tasks
        .iter()
        .filter(|t| t.repeat_id.as_deref() == Some(rule.id.as_str()))
        .collect();
    let pending_task_id = instances.iter().find(|t| !t.done).map(|t| t.id.clone());
    let next_key = if rule.enabled && pending_task_id.is_none() {
        parse_date(&rule.start_date)
            .and_then(|start| {
                let yesterday = today.pred_opt().unwrap_or(today);
                let after = floor_of(&rule, &instances).map_or(yesterday, |f| f.max(yesterday));
                next_occurrence_after(&rule.rule, start, after)
            })
            .map(date_key)
    } else {
        None
    };
    TaskRepeatView {
        rule,
        next_key,
        pending_task_id,
    }
}

#[tauri::command]
pub fn list_task_repeats(state: State<'_, AppState>) -> Result<Vec<TaskRepeatView>, String> {
    let rules = load_all(&state.data_root)?;
    if rules.is_empty() {
        return Ok(Vec::new());
    }
    let all = tasks::load_all(&state.data_root)?;
    let today = Local::now().date_naive();
    Ok(rules
        .into_iter()
        .map(|r| view_of(r, &all, today))
        .collect())
}

#[tauri::command]
pub fn add_task_repeat(
    input: TaskRepeatInput,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<TaskRepeat, String> {
    let input = normalize(input)?;
    let mut rules = load_all(&state.data_root)?;
    let rule = TaskRepeat {
        id: format!("r_{}", uuid::Uuid::new_v4().simple()),
        title: input.title,
        rule: input.rule,
        time: input.time,
        est_min: input.est_min,
        folder_id: input.folder_id,
        group: input.group,
        kind: input.kind,
        color: input.color,
        enabled: input.enabled.unwrap_or(true),
        start_date: input.start_date,
        last_key: None,
        created_at: tasks::now_iso(),
    };
    rules.push(rule.clone());
    save_all(&state.data_root, &rules)?;
    generate_and_notify(&app, &state.data_root);
    Ok(rule)
}

#[tauri::command]
pub fn update_task_repeat(
    id: String,
    input: TaskRepeatInput,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<TaskRepeat, String> {
    let input = normalize(input)?;
    let mut rules = load_all(&state.data_root)?;
    let idx = rules
        .iter()
        .position(|r| r.id == id)
        .ok_or_else(|| format!("task repeat not found: {}", id))?;
    let r = &mut rules[idx];
    r.title = input.title;
    r.rule = input.rule;
    r.time = input.time;
    r.est_min = input.est_min;
    r.folder_id = input.folder_id;
    r.group = input.group;
    r.kind = input.kind;
    r.color = input.color;
    r.enabled = input.enabled.unwrap_or(r.enabled);
    r.start_date = input.start_date;
    let updated = r.clone();
    save_all(&state.data_root, &rules)?;
    generate_and_notify(&app, &state.data_root);
    Ok(updated)
}

/// 규칙만 지운다. 이미 만든 할 일은 그대로 둔다.
#[tauri::command]
pub fn delete_task_repeat(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut rules = load_all(&state.data_root)?;
    let before = rules.len();
    rules.retain(|r| r.id != id);
    if rules.len() == before {
        return Err(format!("task repeat not found: {}", id));
    }
    save_all(&state.data_root, &rules)
}

/// 1분마다 메인 스레드에서 생성기를 돌린다. tasks.json을 쓰는 커맨드가 모두 동기(메인 스레드)라
/// 같은 스레드에 올려야 lost update가 없다.
pub async fn start_poller(app: AppHandle) {
    let mut tick = tokio::time::interval(Duration::from_secs(60));
    tick.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
    loop {
        tick.tick().await;
        let handle = app.clone();
        let queued = app.run_on_main_thread(move || {
            let Some(state) = handle.try_state::<AppState>() else {
                return;
            };
            generate_and_notify(&handle, &state.data_root);
        });
        if let Err(e) = queued {
            eprintln!("task repeat poller: {e}");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const NOW: &str = "2026-10-20T00:00:00Z";

    fn d(s: &str) -> NaiveDate {
        parse_date(s).expect("test date")
    }

    fn rule(freq: RepeatFreq, interval: u32, weekdays: &[u8], month_day: u8) -> RepeatRule {
        RepeatRule {
            freq,
            interval,
            weekdays: weekdays.to_vec(),
            month_day,
        }
    }

    fn repeat(id: &str, rule: RepeatRule, start: &str) -> TaskRepeat {
        TaskRepeat {
            id: id.to_string(),
            title: "물 주기".to_string(),
            rule,
            time: None,
            est_min: None,
            folder_id: None,
            group: None,
            kind: None,
            color: None,
            enabled: true,
            start_date: start.to_string(),
            last_key: None,
            created_at: "2026-10-01T00:00:00Z".to_string(),
        }
    }

    fn instance(rule_id: &str, key: &str, done: bool, done_at: Option<&str>) -> Task {
        let mut t = instance_task(
            &repeat(rule_id, rule(RepeatFreq::Daily, 1, &[], 1), key),
            &instance_id(rule_id, key),
            key,
            NOW,
        );
        t.done = done;
        t.done_at = done_at.map(|s| s.to_string());
        t
    }

    fn input(title: &str, rule: RepeatRule, start: &str) -> TaskRepeatInput {
        TaskRepeatInput {
            title: title.to_string(),
            rule,
            time: None,
            est_min: None,
            folder_id: None,
            group: None,
            kind: None,
            color: None,
            enabled: None,
            start_date: start.to_string(),
        }
    }

    #[test]
    fn daily_creates_once_and_rerun_is_noop() {
        let mut rules = vec![repeat("r1", rule(RepeatFreq::Daily, 1, &[], 1), "2026-10-01")];
        let mut tasks = Vec::new();
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-20"), NOW), (1, true));
        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].id, "t_r1_2026-10-20");
        assert_eq!(tasks[0].due.as_deref(), Some("2026-10-20"));
        assert_eq!(tasks[0].repeat_id.as_deref(), Some("r1"));
        assert_eq!(tasks[0].repeat_key.as_deref(), Some("2026-10-20"));
        assert_eq!(tasks[0].created_at, NOW);
        assert_eq!(rules[0].last_key.as_deref(), Some("2026-10-20"));

        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-20"), NOW), (0, false));
        assert_eq!(tasks.len(), 1);
    }

    #[test]
    fn undone_instance_blocks_the_next_occurrence() {
        let mut rules = vec![repeat("r1", rule(RepeatFreq::Daily, 1, &[], 1), "2026-10-01")];
        rules[0].last_key = Some("2026-10-19".to_string());
        let mut tasks = vec![instance("r1", "2026-10-19", false, None)];
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-21"), NOW), (0, false));
        assert_eq!(tasks.len(), 1);
    }

    #[test]
    fn completion_day_does_not_respawn_but_the_next_day_does() {
        let mut rules = vec![repeat("r1", rule(RepeatFreq::Daily, 1, &[], 1), "2026-10-01")];
        rules[0].last_key = Some("2026-10-01".to_string());
        let mut tasks = vec![instance("r1", "2026-10-01", true, Some("2026-10-03"))];
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-03"), NOW), (0, false));
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-04"), NOW), (1, true));
        assert_eq!(tasks[1].id, "t_r1_2026-10-04");
        assert_eq!(rules[0].last_key.as_deref(), Some("2026-10-04"));
    }

    #[test]
    fn done_instance_without_done_at_falls_back_to_its_key() {
        let mut rules = vec![repeat("r1", rule(RepeatFreq::Daily, 1, &[], 1), "2026-10-01")];
        let mut tasks = vec![instance("r1", "2026-10-05", true, None)];
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-05"), NOW), (0, false));
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-06"), NOW), (1, true));
        assert_eq!(tasks[1].repeat_key.as_deref(), Some("2026-10-06"));
    }

    #[test]
    fn deleted_instance_is_not_recreated_thanks_to_last_key() {
        let mut rules = vec![repeat("r1", rule(RepeatFreq::Daily, 1, &[], 1), "2026-10-01")];
        rules[0].last_key = Some("2026-10-20".to_string());
        let mut tasks = Vec::new();
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-20"), NOW), (0, false));
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-21"), NOW), (1, true));
        assert_eq!(tasks[0].id, "t_r1_2026-10-21");
    }

    #[test]
    fn existing_task_with_the_same_id_only_moves_last_key() {
        let mut rules = vec![repeat("r1", rule(RepeatFreq::Daily, 1, &[], 1), "2026-10-01")];
        let mut tasks = vec![instance("r1", "2026-10-20", true, Some("2026-10-20"))];
        tasks[0].repeat_id = None;
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-20"), NOW), (0, true));
        assert_eq!(rules[0].last_key.as_deref(), Some("2026-10-20"));
        assert_eq!(tasks.len(), 1);
    }

    #[test]
    fn weekdays_pick_the_latest_matching_day() {
        // 2026-10-19 = 월요일
        let r = rule(RepeatFreq::Weekly, 1, &[1, 2, 3, 4, 5], 1);
        let mut rules = vec![repeat("r1", r, "2026-10-19")];
        let mut tasks = Vec::new();
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-24"), NOW), (1, true));
        assert_eq!(tasks[0].repeat_key.as_deref(), Some("2026-10-23"));
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-25"), NOW), (0, false));
        tasks[0].done = true;
        tasks[0].done_at = Some("2026-10-25".to_string());
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-25"), NOW), (0, false));
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-26"), NOW), (1, true));
        assert_eq!(tasks[1].repeat_key.as_deref(), Some("2026-10-26"));
    }

    #[test]
    fn biweekly_counts_monday_based_weeks_from_the_start_week() {
        // 시작 2026-10-14(수) → 기준 주는 10-12(월)부터. 월요일 회차는 10-26, 11-09 …
        let r = rule(RepeatFreq::Weekly, 2, &[1], 1);
        let start = d("2026-10-14");
        assert!(!is_occurrence(&r, start, d("2026-10-12")));
        assert!(!is_occurrence(&r, start, d("2026-10-19")));
        assert!(is_occurrence(&r, start, d("2026-10-26")));
        assert!(!is_occurrence(&r, start, d("2026-11-02")));
        assert!(is_occurrence(&r, start, d("2026-11-09")));

        let mut rules = vec![repeat("r1", r, "2026-10-14")];
        let mut tasks = Vec::new();
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-19"), NOW), (0, false));
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-26"), NOW), (1, true));
        assert_eq!(tasks[0].repeat_key.as_deref(), Some("2026-10-26"));
    }

    #[test]
    fn monthly_day_is_clamped_to_the_month_end() {
        let r = rule(RepeatFreq::Monthly, 1, &[], 31);
        let start = d("2026-01-01");
        assert!(is_occurrence(&r, start, d("2026-01-31")));
        assert!(is_occurrence(&r, start, d("2026-02-28")));
        assert!(!is_occurrence(&r, start, d("2026-02-27")));
        assert!(is_occurrence(&r, start, d("2026-04-30")));
        assert!(is_occurrence(&r, start, d("2028-02-29")));

        let mut rules = vec![repeat("r1", r, "2026-01-01")];
        rules[0].last_key = Some("2026-03-31".to_string());
        let mut tasks = Vec::new();
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-04-29"), NOW), (0, false));
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-05-02"), NOW), (1, true));
        assert_eq!(tasks[0].repeat_key.as_deref(), Some("2026-04-30"));
    }

    #[test]
    fn every_three_days_is_anchored_on_the_start_date() {
        let mut rules = vec![repeat("r1", rule(RepeatFreq::Daily, 3, &[], 1), "2026-10-01")];
        let mut tasks = Vec::new();
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-05"), NOW), (1, true));
        assert_eq!(tasks[0].repeat_key.as_deref(), Some("2026-10-04"));
        tasks[0].done = true;
        tasks[0].done_at = Some("2026-10-05".to_string());
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-06"), NOW), (0, false));
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-07"), NOW), (1, true));
        assert_eq!(tasks[1].repeat_key.as_deref(), Some("2026-10-07"));
    }

    #[test]
    fn a_gap_creates_only_the_latest_occurrence() {
        let mut rules = vec![repeat("r1", rule(RepeatFreq::Daily, 1, &[], 1), "2026-10-01")];
        rules[0].last_key = Some("2026-10-10".to_string());
        let mut tasks = Vec::new();
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-20"), NOW), (1, true));
        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].repeat_key.as_deref(), Some("2026-10-20"));
    }

    #[test]
    fn disabled_or_future_rules_create_nothing() {
        let mut disabled = repeat("r1", rule(RepeatFreq::Daily, 1, &[], 1), "2026-10-01");
        disabled.enabled = false;
        let future = repeat("r2", rule(RepeatFreq::Daily, 1, &[], 1), "2026-10-25");
        let mut rules = vec![disabled, future];
        let mut tasks = Vec::new();
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-20"), NOW), (0, false));
    }

    #[test]
    fn due_includes_the_time_and_fields_are_copied() {
        let mut r = repeat("r1", rule(RepeatFreq::Daily, 1, &[], 1), "2026-10-01");
        r.time = Some("09:00".to_string());
        r.est_min = Some(30);
        r.folder_id = Some("f1".to_string());
        r.group = Some("집".to_string());
        r.kind = Some("life".to_string());
        r.color = Some("green".to_string());
        let mut rules = vec![r];
        let mut tasks = Vec::new();
        assert_eq!(generate_in(&mut rules, &mut tasks, d("2026-10-20"), NOW), (1, true));
        let t = &tasks[0];
        assert_eq!(t.due.as_deref(), Some("2026-10-20T09:00:00"));
        assert_eq!(t.est_min, Some(30));
        assert_eq!(t.folder_id.as_deref(), Some("f1"));
        assert_eq!(t.group.as_deref(), Some("집"));
        assert_eq!(t.kind.as_deref(), Some("life"));
        assert_eq!(t.color.as_deref(), Some("green"));
        assert!(!t.done && t.done_at.is_none() && t.tags.is_empty() && t.subtasks.is_empty());
    }

    #[test]
    fn next_occurrence_and_view_status() {
        // 2026-10-20 = 화요일
        let r = rule(RepeatFreq::Weekly, 1, &[1, 3, 5], 1);
        assert_eq!(
            next_occurrence_after(&r, d("2026-10-01"), d("2026-10-20")),
            Some(d("2026-10-21"))
        );
        assert_eq!(
            next_occurrence_after(&rule(RepeatFreq::Monthly, 1, &[], 15), d("2026-10-16"), d("2026-10-20")),
            Some(d("2026-11-15"))
        );

        let rep = repeat("r1", r, "2026-10-01");
        let view = view_of(rep.clone(), &[], d("2026-10-20"));
        assert_eq!(view.next_key.as_deref(), Some("2026-10-21"));
        assert!(view.pending_task_id.is_none());

        let pending = instance("r1", "2026-10-19", false, None);
        let view = view_of(rep.clone(), &[pending], d("2026-10-20"));
        assert_eq!(view.pending_task_id.as_deref(), Some("t_r1_2026-10-19"));
        assert!(view.next_key.is_none());

        let done_today = instance("r1", "2026-10-19", true, Some("2026-10-21"));
        let view = view_of(rep.clone(), &[done_today], d("2026-10-21"));
        assert_eq!(view.next_key.as_deref(), Some("2026-10-23"));

        let mut paused = rep;
        paused.enabled = false;
        assert!(view_of(paused, &[], d("2026-10-20")).next_key.is_none());
    }

    #[test]
    fn local_date_of_accepts_rfc3339_and_bare_dates() {
        assert_eq!(local_date_of("2026-10-03"), Some(d("2026-10-03")));
        assert_eq!(local_date_of("2026-10-03T12:00:00"), Some(d("2026-10-03")));
        let expected = DateTime::parse_from_rfc3339("2026-10-03T12:00:00+09:00")
            .map(|dt| dt.with_timezone(&Local).date_naive())
            .ok();
        assert_eq!(local_date_of("2026-10-03T12:00:00+09:00"), expected);
        assert!(local_date_of("nope").is_none());
    }

    #[test]
    fn normalize_rejects_bad_input_and_cleans_good_input() {
        let daily = || rule(RepeatFreq::Daily, 1, &[], 1);
        assert!(normalize(input("  ", daily(), "2026-10-20")).is_err());
        assert!(normalize(input("a", rule(RepeatFreq::Daily, 0, &[], 1), "2026-10-20")).is_err());
        assert!(normalize(input("a", rule(RepeatFreq::Daily, 366, &[], 1), "2026-10-20")).is_err());
        assert!(normalize(input("a", rule(RepeatFreq::Weekly, 1, &[], 1), "2026-10-20")).is_err());
        assert!(normalize(input("a", rule(RepeatFreq::Weekly, 1, &[7], 1), "2026-10-20")).is_err());
        assert!(normalize(input("a", rule(RepeatFreq::Weekly, 53, &[1], 1), "2026-10-20")).is_err());
        assert!(normalize(input("a", rule(RepeatFreq::Monthly, 1, &[], 0), "2026-10-20")).is_err());
        assert!(normalize(input("a", rule(RepeatFreq::Monthly, 1, &[], 32), "2026-10-20")).is_err());
        assert!(normalize(input("a", daily(), "2026-13-01")).is_err());
        assert!(normalize(input("a", daily(), "20261020")).is_err());
        let mut bad_time = input("a", daily(), "2026-10-20");
        bad_time.time = Some("24:00".to_string());
        assert!(normalize(bad_time).is_err());
        let mut bad_time = input("a", daily(), "2026-10-20");
        bad_time.time = Some("9:00".to_string());
        assert!(normalize(bad_time).is_err());

        let mut ok = input("  물 주기 ", rule(RepeatFreq::Weekly, 2, &[5, 1, 5, 3], 9), " 2026-10-20 ");
        ok.time = Some("09:30:00".to_string());
        ok.est_min = Some(0);
        ok.folder_id = Some("  ".to_string());
        ok.group = Some(" 집 ".to_string());
        let ok = normalize(ok).expect("valid input");
        assert_eq!(ok.title, "물 주기");
        assert_eq!(ok.rule.weekdays, vec![1, 3, 5]);
        assert_eq!(ok.rule.interval, 2);
        assert_eq!(ok.rule.month_day, 1);
        assert_eq!(ok.time.as_deref(), Some("09:30"));
        assert_eq!(ok.start_date, "2026-10-20");
        assert!(ok.est_min.is_none());
        assert!(ok.folder_id.is_none());
        assert_eq!(ok.group.as_deref(), Some("집"));

        let monthly = normalize(input("a", rule(RepeatFreq::Monthly, 4, &[1], 15), "2026-10-20"))
            .expect("valid monthly");
        assert_eq!(monthly.rule.interval, 1);
        assert!(monthly.rule.weekdays.is_empty());
        assert_eq!(monthly.rule.month_day, 15);
    }

    #[test]
    fn rules_round_trip_through_json_with_defaults() {
        let raw = r#"[{"id":"r1","title":"t","rule":{"freq":"weekly","weekdays":[1]},"startDate":"2026-10-20","createdAt":"2026-10-20T00:00:00Z"}]"#;
        let rules: Vec<TaskRepeat> = serde_json::from_str(raw).expect("parse");
        assert_eq!(rules[0].rule.interval, 1);
        assert_eq!(rules[0].rule.month_day, 1);
        assert!(rules[0].enabled);
        assert!(rules[0].last_key.is_none());
        let json = serde_json::to_string(&rules).expect("serialize");
        assert!(json.contains("\"freq\":\"weekly\""));
        assert!(json.contains("\"startDate\":\"2026-10-20\""));
        assert!(!json.contains("lastKey"));

        let view = view_of(rules[0].clone(), &[], d("2026-10-20"));
        let json = serde_json::to_value(&view).expect("serialize view");
        assert_eq!(json["id"], "r1");
        assert_eq!(json["nextKey"], "2026-10-26");
        assert!(json.get("pendingTaskId").is_none());
    }
}
