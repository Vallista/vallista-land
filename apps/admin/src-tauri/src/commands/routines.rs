//! 루틴(습관) 트래커. 할 일·캘린더와 따로 저장한다.
//!
//! - `routines.json`: 루틴 정의 (`Routine`)
//! - `routine_logs.json`: 루틴 × 날짜 기록 (`RoutineLog`, 완료 여부 + 누적 초 + 타이머 세션)
//! - `routine_timer.json`: 지금 돌아가는 타이머 하나 (`RoutineTimer`). 없으면 파일이 없다.
//!
//! 통계(스트릭·달성률·히트맵)는 프론트(`src/lib/routineStats.ts`)가 이 기록으로 계산한다.
//! 커맨드는 전부 동기(메인 스레드)라 같은 파일을 쓰는 커맨드끼리 직렬화된다.

use chrono::{DateTime, Local, NaiveDate, SecondsFormat, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::State;

use crate::commands::{routine_sync, tasks};
use crate::repo::{ensure_inside, AppState};

const ROUTINES_FILE: &str = "routines.json";
const LOGS_FILE: &str = "routine_logs.json";
const TIMER_FILE: &str = "routine_timer.json";
/// 타이머를 끄지 않고 둔 경우를 대비한 세션 하나의 상한
pub const MAX_SESSION_SECS: u32 = 12 * 3600;
const MAX_DAY_SECS: u32 = 24 * 3600;
const MAX_GOAL_MIN: u32 = 600;
const MAX_TITLE_CHARS: usize = 60;
const MAX_SESSIONS_PER_LOG: usize = 100;
pub const COLORS: &[&str] = &["blue", "orange", "aqua", "yellow", "magenta", "violet"];

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum RoutineFreq {
    Daily,
    Weekly,
}

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Debug, Default)]
#[serde(rename_all = "lowercase")]
pub enum RoutineSlot {
    Morning,
    Afternoon,
    Evening,
    #[default]
    Anytime,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RoutineSchedule {
    pub freq: RoutineFreq,
    /// weekly 전용. 0=일 … 6=토 (JS `getDay`와 같음)
    #[serde(default)]
    pub weekdays: Vec<u8>,
}

/// 보관했다가 다시 꺼낸 구간. 양 끝 포함. 이 날들은 예정일로 치지 않는다.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RoutinePause {
    pub from: String,
    pub to: String,
}

fn default_color() -> String {
    "blue".to_string()
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Routine {
    pub id: String,
    pub title: String,
    #[serde(default = "default_color")]
    pub color: String,
    #[serde(default)]
    pub slot: RoutineSlot,
    pub schedule: RoutineSchedule,
    /// 하루 목표 시간(분). 타이머·직접 입력으로 채우면 자동 완료된다
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub goal_min: Option<u32>,
    /// YYYY-MM-DD. 이날부터 예정일을 센다
    pub start_date: String,
    /// YYYY-MM-DD. 보관한 날. 이날부터 예정일로 치지 않는다
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub archived_at: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub pauses: Vec<RoutinePause>,
    #[serde(default)]
    pub order: u32,
    pub created_at: String,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RoutineInput {
    pub title: String,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub slot: Option<RoutineSlot>,
    pub schedule: RoutineSchedule,
    #[serde(default)]
    pub goal_min: Option<u32>,
    pub start_date: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RoutineSession {
    pub start: String,
    pub end: String,
    pub secs: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RoutineLog {
    pub routine_id: String,
    /// YYYY-MM-DD (로컬 날짜)
    pub date: String,
    #[serde(default)]
    pub done: bool,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub done_at: Option<String>,
    /// 그날 기록한 시간(초). 타이머 세션 합 + 직접 입력
    #[serde(default)]
    pub secs: u32,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub sessions: Vec<RoutineSession>,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RoutineTimer {
    pub routine_id: String,
    /// 시작한 로컬 날짜. 자정을 넘겨도 이 날짜에 기록한다
    pub date: String,
    /// RFC 3339 UTC
    pub started_at: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TimerCommit {
    pub log: RoutineLog,
    pub added_secs: u32,
    /// 세션 상한(12시간)에 걸려 잘렸는지
    pub capped: bool,
    /// 이번 기록으로 목표 시간을 채워 자동 완료됐는지
    pub reached_goal: bool,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TimerStart {
    pub timer: RoutineTimer,
    /// 다른 루틴의 타이머가 돌고 있었다면 그 기록
    #[serde(skip_serializing_if = "Option::is_none")]
    pub committed: Option<TimerCommit>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RoutineLogUpdate {
    pub log: RoutineLog,
    pub reached_goal: bool,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeletedRoutine {
    pub removed_logs: usize,
    pub backup_path: String,
}

// ---------------------------------------------------------------------------
// 저장
// ---------------------------------------------------------------------------

fn read_json<T: for<'de> Deserialize<'de>>(p: &Path) -> Result<Option<T>, String> {
    if !p.is_file() {
        return Ok(None);
    }
    let raw = fs::read_to_string(p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(None);
    }
    serde_json::from_str::<T>(&raw)
        .map(Some)
        .map_err(|e| format!("{}: {}", p.display(), e))
}

/// 임시 파일에 쓴 뒤 rename. 쓰다 죽어도 기존 파일이 반쯤 잘리지 않는다.
fn write_json<T: Serialize + ?Sized>(root: &Path, name: &str, value: &T) -> Result<(), String> {
    let safe = ensure_inside(root, &root.join(name))?;
    let json = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    let tmp = safe.with_extension(format!("json.{}.tmp", uuid::Uuid::new_v4().simple()));
    fs::write(&tmp, json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &safe).map_err(|e| {
        let _ = fs::remove_file(&tmp);
        e.to_string()
    })
}

pub fn load_routines(root: &Path) -> Result<Vec<Routine>, String> {
    let mut all: Vec<Routine> = read_json(&root.join(ROUTINES_FILE))?.unwrap_or_default();
    sort_routines(&mut all);
    Ok(all)
}

// 이 기기에서 고친 것을 저장하는 길(`save_*`)은 디스크의 이전 값과 비교해 바뀐 것을 동기화 dirty 표에
// 적는다(`routine_sync`, 연결 뒤에만). 서버에서 받은 것을 쓰는 길은 `save_*_raw` — 적지 않는다.

pub fn save_routines(root: &Path, routines: &[Routine]) -> Result<(), String> {
    let old: Vec<Routine> = read_json(&root.join(ROUTINES_FILE))
        .ok()
        .flatten()
        .unwrap_or_default();
    save_routines_raw(root, routines)?;
    routine_sync::mark_routines(root, &old, routines);
    Ok(())
}

pub fn save_routines_raw(root: &Path, routines: &[Routine]) -> Result<(), String> {
    write_json(root, ROUTINES_FILE, routines)
}

pub fn load_logs(root: &Path) -> Result<Vec<RoutineLog>, String> {
    Ok(read_json(&root.join(LOGS_FILE))?.unwrap_or_default())
}

pub fn save_logs(root: &Path, logs: &[RoutineLog]) -> Result<(), String> {
    let old: Vec<RoutineLog> = read_json(&root.join(LOGS_FILE))
        .ok()
        .flatten()
        .unwrap_or_default();
    save_logs_raw(root, logs)?;
    routine_sync::mark_logs(root, &old, logs);
    Ok(())
}

pub fn save_logs_raw(root: &Path, logs: &[RoutineLog]) -> Result<(), String> {
    write_json(root, LOGS_FILE, logs)
}

pub fn load_timer(root: &Path) -> Result<Option<RoutineTimer>, String> {
    read_json(&root.join(TIMER_FILE))
}

pub fn save_timer(root: &Path, timer: Option<&RoutineTimer>) -> Result<(), String> {
    let old: Option<RoutineTimer> = read_json(&root.join(TIMER_FILE)).ok().flatten();
    save_timer_raw(root, timer)?;
    routine_sync::mark_timer(root, old.as_ref(), timer);
    Ok(())
}

pub fn save_timer_raw(root: &Path, timer: Option<&RoutineTimer>) -> Result<(), String> {
    match timer {
        Some(t) => write_json(root, TIMER_FILE, t),
        None => {
            let p = ensure_inside(root, &root.join(TIMER_FILE))?;
            if p.exists() {
                fs::remove_file(&p).map_err(|e| e.to_string())?;
            }
            Ok(())
        }
    }
}

// ---------------------------------------------------------------------------
// 순수 로직
// ---------------------------------------------------------------------------

fn parse_date(s: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").ok()
}

fn date_key(d: NaiveDate) -> String {
    d.format("%Y-%m-%d").to_string()
}

fn utc_iso(t: DateTime<Utc>) -> String {
    t.to_rfc3339_opts(SecondsFormat::Secs, true)
}

pub fn sort_routines(routines: &mut [Routine]) {
    routines.sort_by(|a, b| {
        a.order
            .cmp(&b.order)
            .then_with(|| a.created_at.cmp(&b.created_at))
    });
}

pub fn normalize(mut input: RoutineInput) -> Result<RoutineInput, String> {
    input.title = input.title.trim().to_string();
    if input.title.is_empty() {
        return Err("루틴 이름을 입력하세요".to_string());
    }
    if input.title.chars().count() > MAX_TITLE_CHARS {
        return Err(format!(
            "루틴 이름은 {}자 이하로 적어주세요",
            MAX_TITLE_CHARS
        ));
    }
    let color = input
        .color
        .map(|c| c.trim().to_string())
        .filter(|c| !c.is_empty())
        .unwrap_or_else(default_color);
    if !COLORS.contains(&color.as_str()) {
        return Err(format!("알 수 없는 색상입니다: {}", color));
    }
    input.color = Some(color);
    input.slot = Some(input.slot.unwrap_or_default());
    match input.schedule.freq {
        RoutineFreq::Daily => input.schedule.weekdays.clear(),
        RoutineFreq::Weekly => {
            let mut days = input.schedule.weekdays.clone();
            days.sort_unstable();
            days.dedup();
            if days.is_empty() {
                return Err("요일을 하나 이상 선택하세요".to_string());
            }
            if days.iter().any(|d| *d > 6) {
                return Err("요일 값이 올바르지 않습니다".to_string());
            }
            if days.len() == 7 {
                input.schedule.freq = RoutineFreq::Daily;
                days.clear();
            }
            input.schedule.weekdays = days;
        }
    }
    input.goal_min = input.goal_min.filter(|m| *m > 0);
    if let Some(m) = input.goal_min {
        if m > MAX_GOAL_MIN {
            return Err(format!("목표 시간은 {}분 이하로 정해주세요", MAX_GOAL_MIN));
        }
    }
    input.start_date = input.start_date.trim().to_string();
    if parse_date(&input.start_date).is_none() {
        return Err("시작일은 YYYY-MM-DD 형식이어야 합니다".to_string());
    }
    Ok(input)
}

fn new_routine(input: RoutineInput, order: u32, now: &str) -> Routine {
    Routine {
        id: format!("rt_{}", uuid::Uuid::new_v4().simple()),
        title: input.title,
        color: input.color.unwrap_or_else(default_color),
        slot: input.slot.unwrap_or_default(),
        schedule: input.schedule,
        goal_min: input.goal_min,
        start_date: input.start_date,
        archived_at: None,
        pauses: Vec::new(),
        order,
        created_at: now.to_string(),
    }
}

fn apply_input(r: &mut Routine, input: RoutineInput) {
    r.title = input.title;
    r.color = input.color.unwrap_or_else(default_color);
    r.slot = input.slot.unwrap_or_default();
    r.schedule = input.schedule;
    r.goal_min = input.goal_min;
    r.start_date = input.start_date;
}

/// 보관: 오늘부터 예정일이 아니다. 이미 보관 중이면 그대로.
pub fn archive(r: &mut Routine, today: NaiveDate) {
    if r.archived_at.is_none() {
        r.archived_at = Some(date_key(today));
    }
}

/// 보관 해제: 보관한 날부터 어제까지를 쉬는 구간으로 남겨 그동안을 놓친 날로 세지 않는다.
pub fn unarchive(r: &mut Routine, today: NaiveDate) {
    let Some(from) = r.archived_at.take().as_deref().and_then(parse_date) else {
        return;
    };
    if let Some(to) = today.pred_opt() {
        if from <= to {
            r.pauses.push(RoutinePause {
                from: date_key(from),
                to: date_key(to),
            });
        }
    }
}

/// `ids` 순서대로 order를 다시 매긴다. 목록에 없는 루틴은 기존 순서를 유지한 채 뒤로 간다.
pub fn reorder_in(routines: &mut [Routine], ids: &[String]) {
    sort_routines(routines);
    let mut next = 0u32;
    let mut listed: Vec<bool> = vec![false; routines.len()];
    for id in ids {
        if let Some(idx) = routines.iter().position(|r| &r.id == id) {
            if !listed[idx] {
                routines[idx].order = next;
                listed[idx] = true;
                next += 1;
            }
        }
    }
    for (idx, r) in routines.iter_mut().enumerate() {
        if !listed[idx] {
            r.order = next;
            next += 1;
        }
    }
    sort_routines(routines);
}

fn next_order(routines: &[Routine]) -> u32 {
    routines.iter().map(|r| r.order + 1).max().unwrap_or(0)
}

/// 기록할 수 있는 날짜인지: 형식이 맞고, 미래가 아니고, 시작일 이후.
pub fn check_date(routine: &Routine, date: &str, today: NaiveDate) -> Result<String, String> {
    let d =
        parse_date(date.trim()).ok_or_else(|| "날짜는 YYYY-MM-DD 형식이어야 합니다".to_string())?;
    if d > today {
        return Err("미래 날짜는 기록할 수 없어요".to_string());
    }
    if let Some(start) = parse_date(&routine.start_date) {
        if d < start {
            return Err(format!(
                "시작일({}) 이전 날짜는 기록할 수 없어요. 루틴 편집에서 시작일을 앞당기세요",
                routine.start_date
            ));
        }
    }
    Ok(date_key(d))
}

fn is_empty_log(l: &RoutineLog) -> bool {
    !l.done && l.secs == 0 && l.sessions.is_empty()
}

fn log_index(logs: &mut Vec<RoutineLog>, routine_id: &str, date: &str, now: &str) -> usize {
    if let Some(i) = logs
        .iter()
        .position(|l| l.routine_id == routine_id && l.date == date)
    {
        return i;
    }
    logs.push(RoutineLog {
        routine_id: routine_id.to_string(),
        date: date.to_string(),
        done: false,
        done_at: None,
        secs: 0,
        sessions: Vec::new(),
        updated_at: now.to_string(),
    });
    logs.len() - 1
}

fn prune(logs: &mut Vec<RoutineLog>) {
    logs.retain(|l| !is_empty_log(l));
}

fn maybe_complete(l: &mut RoutineLog, goal_min: Option<u32>, now: &str) -> bool {
    match goal_min {
        Some(g) if g > 0 && !l.done && l.secs >= g.saturating_mul(60) => {
            l.done = true;
            l.done_at = Some(now.to_string());
            true
        }
        _ => false,
    }
}

pub fn apply_check(
    logs: &mut Vec<RoutineLog>,
    routine_id: &str,
    date: &str,
    done: bool,
    now: &str,
) -> RoutineLog {
    let i = log_index(logs, routine_id, date, now);
    let l = &mut logs[i];
    if l.done != done {
        l.done = done;
        l.done_at = if done { Some(now.to_string()) } else { None };
    }
    l.updated_at = now.to_string();
    let out = l.clone();
    prune(logs);
    out
}

/// 그날 기록 시간을 `minutes`분으로 맞춘다(타이머 세션 기록은 그대로 둔다).
pub fn apply_minutes(
    logs: &mut Vec<RoutineLog>,
    routine: &Routine,
    date: &str,
    minutes: u32,
    now: &str,
) -> RoutineLogUpdate {
    let i = log_index(logs, &routine.id, date, now);
    let l = &mut logs[i];
    l.secs = minutes.saturating_mul(60).min(MAX_DAY_SECS);
    l.updated_at = now.to_string();
    let reached_goal = maybe_complete(l, routine.goal_min, now);
    let out = l.clone();
    prune(logs);
    RoutineLogUpdate {
        log: out,
        reached_goal,
    }
}

/// 돌던 타이머를 기록으로 옮긴다. 루틴이 없거나(삭제됨) 1초도 안 지났으면 아무것도 쓰지 않는다.
pub fn commit_timer(
    logs: &mut Vec<RoutineLog>,
    routine: Option<&Routine>,
    timer: &RoutineTimer,
    now: DateTime<Utc>,
) -> Option<TimerCommit> {
    let routine = routine?;
    let started = DateTime::parse_from_rfc3339(&timer.started_at)
        .ok()?
        .with_timezone(&Utc);
    let elapsed = (now - started).num_seconds().max(0);
    let capped = elapsed > i64::from(MAX_SESSION_SECS);
    let secs = elapsed.min(i64::from(MAX_SESSION_SECS)) as u32;
    if secs == 0 {
        return None;
    }
    let now_iso = utc_iso(now);
    let i = log_index(logs, &routine.id, &timer.date, &now_iso);
    let l = &mut logs[i];
    l.sessions.push(RoutineSession {
        start: utc_iso(started),
        end: if capped {
            utc_iso(started + chrono::Duration::seconds(i64::from(MAX_SESSION_SECS)))
        } else {
            now_iso.clone()
        },
        secs,
    });
    if l.sessions.len() > MAX_SESSIONS_PER_LOG {
        let drop = l.sessions.len() - MAX_SESSIONS_PER_LOG;
        l.sessions.drain(..drop);
    }
    l.secs = l.secs.saturating_add(secs).min(MAX_DAY_SECS);
    l.updated_at = now_iso.clone();
    let reached_goal = maybe_complete(l, routine.goal_min, &now_iso);
    Some(TimerCommit {
        log: l.clone(),
        added_secs: secs,
        capped,
        reached_goal,
    })
}

fn find<'a>(routines: &'a [Routine], id: &str) -> Result<&'a Routine, String> {
    routines
        .iter()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("routine not found: {}", id))
}

// ---------------------------------------------------------------------------
// 파일 단위 동작 (커맨드와 테스트가 같이 쓴다)
// ---------------------------------------------------------------------------

/// 돌던 타이머가 있으면 기록으로 옮기고 지운다(`discard`면 기록 없이 지운다).
/// 기록을 먼저 쓰고 타이머를 지운다: 기록 쓰기가 실패하면 타이머가 남아 다시 멈출 수 있다.
pub fn stop_timer_in(
    root: &Path,
    discard: bool,
    now: DateTime<Utc>,
) -> Result<Option<TimerCommit>, String> {
    let Some(timer) = load_timer(root)? else {
        return Ok(None);
    };
    let mut committed = None;
    if !discard {
        let routines = load_routines(root)?;
        let mut logs = load_logs(root)?;
        let routine = routines.iter().find(|r| r.id == timer.routine_id);
        committed = commit_timer(&mut logs, routine, &timer, now);
        if committed.is_some() {
            save_logs(root, &logs)?;
        }
    }
    save_timer(root, None)?;
    Ok(committed)
}

pub fn start_timer_in(
    root: &Path,
    routine_id: &str,
    now: DateTime<Utc>,
    today: NaiveDate,
) -> Result<TimerStart, String> {
    let routines = load_routines(root)?;
    let routine = find(&routines, routine_id)?;
    if routine.archived_at.is_some() {
        return Err("보관한 루틴은 타이머를 켤 수 없어요".to_string());
    }
    check_date(routine, &date_key(today), today)?;
    if let Some(running) = load_timer(root)? {
        if running.routine_id == routine_id {
            return Ok(TimerStart {
                timer: running,
                committed: None,
            });
        }
    }
    let committed = stop_timer_in(root, false, now)?;
    let timer = RoutineTimer {
        routine_id: routine_id.to_string(),
        date: date_key(today),
        started_at: utc_iso(now),
    };
    save_timer(root, Some(&timer))?;
    Ok(TimerStart { timer, committed })
}

pub fn set_archived_in(
    root: &Path,
    id: &str,
    archived: bool,
    now: DateTime<Utc>,
    today: NaiveDate,
) -> Result<Routine, String> {
    let mut routines = load_routines(root)?;
    find(&routines, id)?;
    if archived {
        if let Some(t) = load_timer(root)? {
            if t.routine_id == id {
                stop_timer_in(root, false, now)?;
            }
        }
    }
    let r = routines
        .iter_mut()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("routine not found: {}", id))?;
    if archived {
        archive(r, today);
    } else {
        unarchive(r, today);
    }
    let out = r.clone();
    save_routines(root, &routines)?;
    Ok(out)
}

fn backup_dir(root: &Path) -> Result<PathBuf, String> {
    let base = format!("routines-{}", tasks::now_iso().replace(['-', ':'], ""));
    let backups = root.join("backups");
    for n in 1..=1000u32 {
        let name = if n == 1 {
            base.clone()
        } else {
            format!("{}-{}", base, n)
        };
        let dir = backups.join(name);
        if !dir.exists() {
            return Ok(dir);
        }
    }
    Err(format!("backup dir: too many backups at {}", base))
}

/// 루틴과 그 기록을 지운다. 지우기 전에 두 파일을 `backups/routines-<ts>/`로 복사(크기 대조)하고,
/// 복사가 하나라도 실패하면 아무것도 지우지 않는다.
pub fn delete_in(root: &Path, id: &str) -> Result<DeletedRoutine, String> {
    let mut routines = load_routines(root)?;
    find(&routines, id)?;
    let dir = ensure_inside(root, &backup_dir(root)?)?;
    fs::create_dir_all(&dir).map_err(|e| format!("backup: {}", e))?;
    for name in [ROUTINES_FILE, LOGS_FILE] {
        let src = root.join(name);
        if !src.is_file() {
            continue;
        }
        let expected = fs::metadata(&src).map_err(|e| e.to_string())?.len();
        let copied =
            fs::copy(&src, dir.join(name)).map_err(|e| format!("backup {}: {}", name, e))?;
        if copied != expected {
            return Err(format!(
                "backup {}: size mismatch ({} != {})",
                name, copied, expected
            ));
        }
    }
    let mut logs = load_logs(root)?;
    let before = logs.len();
    logs.retain(|l| l.routine_id != id);
    let removed_logs = before - logs.len();
    routines.retain(|r| r.id != id);
    if removed_logs > 0 {
        save_logs(root, &logs)?;
    }
    save_routines(root, &routines)?;
    if load_timer(root)?.is_some_and(|t| t.routine_id == id) {
        save_timer(root, None)?;
    }
    Ok(DeletedRoutine {
        removed_logs,
        backup_path: dir.display().to_string(),
    })
}

fn today_local() -> NaiveDate {
    Local::now().date_naive()
}

// ---------------------------------------------------------------------------
// 커맨드
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn list_routines(state: State<'_, AppState>) -> Result<Vec<Routine>, String> {
    load_routines(&state.data_root)
}

#[tauri::command]
pub fn add_routine(input: RoutineInput, state: State<'_, AppState>) -> Result<Routine, String> {
    let input = normalize(input)?;
    let mut routines = load_routines(&state.data_root)?;
    let r = new_routine(input, next_order(&routines), &tasks::now_iso());
    routines.push(r.clone());
    save_routines(&state.data_root, &routines)?;
    Ok(r)
}

#[tauri::command]
pub fn update_routine(
    id: String,
    input: RoutineInput,
    state: State<'_, AppState>,
) -> Result<Routine, String> {
    let input = normalize(input)?;
    let mut routines = load_routines(&state.data_root)?;
    let r = routines
        .iter_mut()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("routine not found: {}", id))?;
    apply_input(r, input);
    let out = r.clone();
    save_routines(&state.data_root, &routines)?;
    Ok(out)
}

#[tauri::command]
pub fn set_routine_archived(
    id: String,
    archived: bool,
    state: State<'_, AppState>,
) -> Result<Routine, String> {
    set_archived_in(&state.data_root, &id, archived, Utc::now(), today_local())
}

#[tauri::command]
pub fn delete_routine(id: String, state: State<'_, AppState>) -> Result<DeletedRoutine, String> {
    delete_in(&state.data_root, &id)
}

#[tauri::command]
pub fn reorder_routines(
    ids: Vec<String>,
    state: State<'_, AppState>,
) -> Result<Vec<Routine>, String> {
    let mut routines = load_routines(&state.data_root)?;
    reorder_in(&mut routines, &ids);
    save_routines(&state.data_root, &routines)?;
    Ok(routines)
}

/// 기록 조회. 날짜를 빼면 그쪽 끝은 열어 둔다.
#[tauri::command]
pub fn list_routine_logs(
    start_date: Option<String>,
    end_date: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<RoutineLog>, String> {
    let mut logs = load_logs(&state.data_root)?;
    logs.retain(|l| {
        start_date.as_deref().map_or(true, |s| l.date.as_str() >= s)
            && end_date.as_deref().map_or(true, |e| l.date.as_str() <= e)
    });
    logs.sort_by(|a, b| {
        a.date
            .cmp(&b.date)
            .then_with(|| a.routine_id.cmp(&b.routine_id))
    });
    Ok(logs)
}

#[tauri::command]
pub fn set_routine_check(
    routine_id: String,
    date: String,
    done: bool,
    state: State<'_, AppState>,
) -> Result<RoutineLog, String> {
    let routines = load_routines(&state.data_root)?;
    let routine = find(&routines, &routine_id)?;
    let date = check_date(routine, &date, today_local())?;
    let mut logs = load_logs(&state.data_root)?;
    let log = apply_check(&mut logs, &routine_id, &date, done, &tasks::now_iso());
    save_logs(&state.data_root, &logs)?;
    Ok(log)
}

#[tauri::command]
pub fn set_routine_minutes(
    routine_id: String,
    date: String,
    minutes: u32,
    state: State<'_, AppState>,
) -> Result<RoutineLogUpdate, String> {
    let routines = load_routines(&state.data_root)?;
    let routine = find(&routines, &routine_id)?;
    let date = check_date(routine, &date, today_local())?;
    let mut logs = load_logs(&state.data_root)?;
    let update = apply_minutes(&mut logs, routine, &date, minutes, &tasks::now_iso());
    save_logs(&state.data_root, &logs)?;
    Ok(update)
}

#[tauri::command]
pub fn get_routine_timer(state: State<'_, AppState>) -> Result<Option<RoutineTimer>, String> {
    load_timer(&state.data_root)
}

#[tauri::command]
pub fn start_routine_timer(
    routine_id: String,
    state: State<'_, AppState>,
) -> Result<TimerStart, String> {
    start_timer_in(&state.data_root, &routine_id, Utc::now(), today_local())
}

#[tauri::command]
pub fn stop_routine_timer(
    discard: bool,
    state: State<'_, AppState>,
) -> Result<Option<TimerCommit>, String> {
    stop_timer_in(&state.data_root, discard, Utc::now())
}

#[cfg(test)]
mod tests {
    use super::*;

    const NOW: &str = "2026-10-25T00:00:00Z";

    fn d(s: &str) -> NaiveDate {
        parse_date(s).expect("test date")
    }

    fn t(s: &str) -> DateTime<Utc> {
        DateTime::parse_from_rfc3339(s)
            .expect("test time")
            .with_timezone(&Utc)
    }

    fn input(title: &str, freq: RoutineFreq, weekdays: &[u8]) -> RoutineInput {
        RoutineInput {
            title: title.to_string(),
            color: None,
            slot: None,
            schedule: RoutineSchedule {
                freq,
                weekdays: weekdays.to_vec(),
            },
            goal_min: None,
            start_date: "2026-10-01".to_string(),
        }
    }

    fn routine(id: &str, goal_min: Option<u32>) -> Routine {
        let mut r = new_routine(
            normalize(input("독서", RoutineFreq::Daily, &[])).expect("valid"),
            0,
            NOW,
        );
        r.id = id.to_string();
        r.goal_min = goal_min;
        r
    }

    struct TempRoot(PathBuf);

    impl TempRoot {
        fn new() -> Self {
            let p = std::env::temp_dir()
                .join(format!("bento-routines-{}", uuid::Uuid::new_v4().simple()));
            fs::create_dir_all(&p).expect("mkdir");
            Self(p)
        }
    }

    impl Drop for TempRoot {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn normalize_cleans_and_validates() {
        let ok = normalize(RoutineInput {
            title: "  물 2L ".to_string(),
            color: Some(" aqua ".to_string()),
            slot: Some(RoutineSlot::Morning),
            schedule: RoutineSchedule {
                freq: RoutineFreq::Weekly,
                weekdays: vec![5, 1, 3, 1],
            },
            goal_min: Some(0),
            start_date: " 2026-10-20 ".to_string(),
        })
        .expect("valid");
        assert_eq!(ok.title, "물 2L");
        assert_eq!(ok.color.as_deref(), Some("aqua"));
        assert_eq!(ok.schedule.weekdays, vec![1, 3, 5]);
        assert!(ok.goal_min.is_none());
        assert_eq!(ok.start_date, "2026-10-20");

        let defaults = normalize(input("명상", RoutineFreq::Daily, &[2])).expect("valid");
        assert_eq!(defaults.color.as_deref(), Some("blue"));
        assert_eq!(defaults.slot, Some(RoutineSlot::Anytime));
        assert!(defaults.schedule.weekdays.is_empty());

        let all_week =
            normalize(input("일기", RoutineFreq::Weekly, &[0, 1, 2, 3, 4, 5, 6])).expect("valid");
        assert_eq!(all_week.schedule.freq, RoutineFreq::Daily);
        assert!(all_week.schedule.weekdays.is_empty());

        assert!(normalize(input("   ", RoutineFreq::Daily, &[])).is_err());
        assert!(normalize(input(&"가".repeat(61), RoutineFreq::Daily, &[])).is_err());
        assert!(normalize(input("a", RoutineFreq::Weekly, &[])).is_err());
        assert!(normalize(input("a", RoutineFreq::Weekly, &[7])).is_err());
        let mut bad_color = input("a", RoutineFreq::Daily, &[]);
        bad_color.color = Some("#ff0000".to_string());
        assert!(normalize(bad_color).is_err());
        let mut bad_goal = input("a", RoutineFreq::Daily, &[]);
        bad_goal.goal_min = Some(601);
        assert!(normalize(bad_goal).is_err());
        let mut bad_date = input("a", RoutineFreq::Daily, &[]);
        bad_date.start_date = "2026-13-01".to_string();
        assert!(normalize(bad_date).is_err());
    }

    #[test]
    fn check_date_rejects_future_and_pre_start() {
        let r = routine("r1", None);
        assert_eq!(
            check_date(&r, "2026-10-25", d("2026-10-25")).as_deref(),
            Ok("2026-10-25")
        );
        assert_eq!(
            check_date(&r, "2026-10-01", d("2026-10-25")).as_deref(),
            Ok("2026-10-01")
        );
        assert!(check_date(&r, "2026-10-26", d("2026-10-25")).is_err());
        assert!(check_date(&r, "2026-09-30", d("2026-10-25")).is_err());
        assert!(check_date(&r, "10/25", d("2026-10-25")).is_err());
    }

    #[test]
    fn check_toggles_and_prunes_empty_logs() {
        let mut logs = Vec::new();
        let l = apply_check(&mut logs, "r1", "2026-10-25", true, NOW);
        assert!(l.done);
        assert_eq!(l.done_at.as_deref(), Some(NOW));
        assert_eq!(logs.len(), 1);

        // 같은 상태로 다시 체크해도 done_at은 처음 그대로
        let l = apply_check(&mut logs, "r1", "2026-10-25", true, "2026-10-25T09:00:00Z");
        assert_eq!(l.done_at.as_deref(), Some(NOW));

        let l = apply_check(&mut logs, "r1", "2026-10-25", false, NOW);
        assert!(!l.done && l.done_at.is_none());
        assert!(logs.is_empty(), "빈 기록은 남기지 않는다");

        apply_check(&mut logs, "r1", "2026-10-24", true, NOW);
        apply_check(&mut logs, "r2", "2026-10-24", true, NOW);
        assert_eq!(logs.len(), 2);
    }

    #[test]
    fn unchecking_keeps_a_log_that_still_has_time() {
        let r = routine("r1", None);
        let mut logs = Vec::new();
        apply_minutes(&mut logs, &r, "2026-10-25", 15, NOW);
        apply_check(&mut logs, "r1", "2026-10-25", true, NOW);
        apply_check(&mut logs, "r1", "2026-10-25", false, NOW);
        assert_eq!(logs.len(), 1);
        assert_eq!(logs[0].secs, 900);
    }

    #[test]
    fn minutes_reach_the_goal_and_auto_complete_once() {
        let r = routine("r1", Some(30));
        let mut logs = Vec::new();
        let u = apply_minutes(&mut logs, &r, "2026-10-25", 20, NOW);
        assert!(!u.reached_goal && !u.log.done);
        assert_eq!(u.log.secs, 1200);
        let u = apply_minutes(&mut logs, &r, "2026-10-25", 30, NOW);
        assert!(u.reached_goal && u.log.done);
        // 이미 완료면 다시 '달성'으로 알리지 않는다
        let u = apply_minutes(&mut logs, &r, "2026-10-25", 45, NOW);
        assert!(!u.reached_goal && u.log.done);
        // 시간을 줄여도 완료는 그대로(완료는 사용자가 끈다)
        let u = apply_minutes(&mut logs, &r, "2026-10-25", 5, NOW);
        assert!(u.log.done);
        // 0분 + 미완료면 기록이 사라진다
        apply_check(&mut logs, "r1", "2026-10-25", false, NOW);
        apply_minutes(&mut logs, &r, "2026-10-25", 0, NOW);
        assert!(logs.is_empty());
        // 하루 상한
        let u = apply_minutes(&mut logs, &routine("r2", None), "2026-10-25", 100_000, NOW);
        assert_eq!(u.log.secs, MAX_DAY_SECS);
    }

    #[test]
    fn commit_timer_adds_a_session_to_the_start_date() {
        let r = routine("r1", Some(30));
        let mut logs = Vec::new();
        let timer = RoutineTimer {
            routine_id: "r1".to_string(),
            date: "2026-10-24".to_string(),
            started_at: "2026-10-24T14:50:00Z".to_string(),
        };
        let c =
            commit_timer(&mut logs, Some(&r), &timer, t("2026-10-24T15:10:30Z")).expect("commit");
        assert_eq!(c.added_secs, 20 * 60 + 30);
        assert!(!c.capped && !c.reached_goal);
        assert_eq!(c.log.date, "2026-10-24");
        assert_eq!(c.log.sessions.len(), 1);
        assert_eq!(c.log.sessions[0].start, "2026-10-24T14:50:00Z");
        assert_eq!(c.log.sessions[0].end, "2026-10-24T15:10:30Z");

        let timer2 = RoutineTimer {
            started_at: "2026-10-24T16:00:00Z".to_string(),
            ..timer.clone()
        };
        let c =
            commit_timer(&mut logs, Some(&r), &timer2, t("2026-10-24T16:10:00Z")).expect("commit");
        assert_eq!(c.log.secs, 30 * 60 + 30);
        assert!(c.reached_goal && c.log.done);
        assert_eq!(c.log.sessions.len(), 2);
        assert_eq!(logs.len(), 1);
    }

    #[test]
    fn commit_timer_caps_forgotten_timers_and_skips_noise() {
        let r = routine("r1", None);
        let mut logs = Vec::new();
        let timer = RoutineTimer {
            routine_id: "r1".to_string(),
            date: "2026-10-24".to_string(),
            started_at: "2026-10-24T00:00:00Z".to_string(),
        };
        let c =
            commit_timer(&mut logs, Some(&r), &timer, t("2026-10-25T06:00:00Z")).expect("commit");
        assert!(c.capped);
        assert_eq!(c.added_secs, MAX_SESSION_SECS);
        assert_eq!(c.log.sessions[0].end, "2026-10-24T12:00:00Z");

        let mut empty = Vec::new();
        // 0초, 시계가 거꾸로 간 경우, 루틴이 사라진 경우, 시각이 깨진 경우는 기록하지 않는다
        assert!(commit_timer(&mut empty, Some(&r), &timer, t("2026-10-24T00:00:00Z")).is_none());
        assert!(commit_timer(&mut empty, Some(&r), &timer, t("2026-10-23T23:00:00Z")).is_none());
        assert!(commit_timer(&mut empty, None, &timer, t("2026-10-24T01:00:00Z")).is_none());
        let broken = RoutineTimer {
            started_at: "nope".to_string(),
            ..timer
        };
        assert!(commit_timer(&mut empty, Some(&r), &broken, t("2026-10-24T01:00:00Z")).is_none());
        assert!(empty.is_empty());
    }

    #[test]
    fn archive_then_unarchive_leaves_a_pause() {
        let mut r = routine("r1", None);
        archive(&mut r, d("2026-10-10"));
        assert_eq!(r.archived_at.as_deref(), Some("2026-10-10"));
        archive(&mut r, d("2026-10-12"));
        assert_eq!(
            r.archived_at.as_deref(),
            Some("2026-10-10"),
            "이미 보관이면 날짜를 바꾸지 않는다"
        );
        unarchive(&mut r, d("2026-10-20"));
        assert!(r.archived_at.is_none());
        assert_eq!(
            r.pauses,
            vec![RoutinePause {
                from: "2026-10-10".to_string(),
                to: "2026-10-19".to_string()
            }]
        );
        // 같은 날 보관했다 바로 꺼내면 쉬는 구간이 없다
        archive(&mut r, d("2026-10-21"));
        unarchive(&mut r, d("2026-10-21"));
        assert_eq!(r.pauses.len(), 1);
        // 보관 중이 아니면 해제는 아무 일도 하지 않는다
        unarchive(&mut r, d("2026-10-22"));
        assert_eq!(r.pauses.len(), 1);
    }

    #[test]
    fn reorder_follows_ids_and_keeps_the_rest_behind() {
        let mut rs: Vec<Routine> = ["a", "b", "c", "d"]
            .iter()
            .enumerate()
            .map(|(i, id)| {
                let mut r = routine(id, None);
                r.order = i as u32;
                r
            })
            .collect();
        reorder_in(
            &mut rs,
            &[
                "c".to_string(),
                "a".to_string(),
                "zz".to_string(),
                "c".to_string(),
            ],
        );
        let ids: Vec<&str> = rs.iter().map(|r| r.id.as_str()).collect();
        assert_eq!(ids, vec!["c", "a", "b", "d"]);
        assert_eq!(
            rs.iter().map(|r| r.order).collect::<Vec<_>>(),
            vec![0, 1, 2, 3]
        );
        assert_eq!(next_order(&rs), 4);
        assert_eq!(next_order(&[]), 0);
    }

    #[test]
    fn json_round_trip_uses_camel_case_and_defaults() {
        let raw = r#"[{"id":"rt_1","title":"독서","schedule":{"freq":"weekly","weekdays":[1,3]},"startDate":"2026-10-01","createdAt":"2026-10-01T00:00:00Z"}]"#;
        let rs: Vec<Routine> = serde_json::from_str(raw).expect("parse");
        assert_eq!(rs[0].color, "blue");
        assert_eq!(rs[0].slot, RoutineSlot::Anytime);
        assert_eq!(rs[0].order, 0);
        assert!(rs[0].pauses.is_empty());
        let json = serde_json::to_string(&rs).expect("serialize");
        assert!(json.contains("\"startDate\":\"2026-10-01\""));
        assert!(json.contains("\"slot\":\"anytime\""));
        assert!(
            !json.contains("archivedAt") && !json.contains("pauses") && !json.contains("goalMin")
        );

        let log_raw = r#"[{"routineId":"rt_1","date":"2026-10-02","done":true,"updatedAt":"x"}]"#;
        let logs: Vec<RoutineLog> = serde_json::from_str(log_raw).expect("parse logs");
        assert_eq!(logs[0].secs, 0);
        assert!(logs[0].sessions.is_empty());
        let commit = TimerCommit {
            log: logs[0].clone(),
            added_secs: 3,
            capped: false,
            reached_goal: true,
        };
        let v = serde_json::to_value(&commit).expect("serialize commit");
        assert_eq!(v["reachedGoal"], true);
        assert_eq!(v["log"]["routineId"], "rt_1");
    }

    #[test]
    fn files_timer_lifecycle() {
        let root = TempRoot::new();
        let r = routine("r1", Some(10));
        let mut other = routine("r2", None);
        other.order = 1;
        save_routines(&root.0, &[r.clone(), other]).expect("save");
        assert!(load_timer(&root.0).expect("load").is_none());
        assert!(stop_timer_in(&root.0, false, t("2026-10-25T01:00:00Z"))
            .expect("stop")
            .is_none());

        let s = start_timer_in(&root.0, "r1", t("2026-10-25T01:00:00Z"), d("2026-10-25"))
            .expect("start");
        assert_eq!(s.timer.date, "2026-10-25");
        assert!(s.committed.is_none());
        // 같은 루틴을 다시 켜면 그대로
        let again = start_timer_in(&root.0, "r1", t("2026-10-25T01:05:00Z"), d("2026-10-25"))
            .expect("again");
        assert_eq!(again.timer.started_at, "2026-10-25T01:00:00Z");
        // 다른 루틴을 켜면 앞의 타이머를 기록하고 넘어간다
        let switched = start_timer_in(&root.0, "r2", t("2026-10-25T01:12:00Z"), d("2026-10-25"))
            .expect("switch");
        let c = switched.committed.expect("committed");
        assert_eq!(c.log.routine_id, "r1");
        assert_eq!(c.added_secs, 12 * 60);
        assert!(c.reached_goal);
        assert_eq!(
            load_timer(&root.0)
                .expect("load")
                .map(|t| t.routine_id)
                .as_deref(),
            Some("r2")
        );

        // 버리기
        assert!(stop_timer_in(&root.0, true, t("2026-10-25T02:00:00Z"))
            .expect("discard")
            .is_none());
        assert!(load_timer(&root.0).expect("load").is_none());
        let logs = load_logs(&root.0).expect("logs");
        assert_eq!(logs.len(), 1, "버린 타이머는 기록하지 않는다");
        assert!(!root.0.join(TIMER_FILE).exists());
        assert!(fs::read_dir(&root.0)
            .expect("ls")
            .filter_map(|e| e.ok())
            .all(|e| !e.file_name().to_string_lossy().ends_with(".tmp")));

        assert!(
            start_timer_in(&root.0, "nope", t("2026-10-25T03:00:00Z"), d("2026-10-25")).is_err()
        );
    }

    #[test]
    fn files_archive_stops_its_timer_and_blocks_new_ones() {
        let root = TempRoot::new();
        save_routines(&root.0, &[routine("r1", None)]).expect("save");
        start_timer_in(&root.0, "r1", t("2026-10-25T01:00:00Z"), d("2026-10-25")).expect("start");
        let r = set_archived_in(
            &root.0,
            "r1",
            true,
            t("2026-10-25T01:30:00Z"),
            d("2026-10-25"),
        )
        .expect("archive");
        assert_eq!(r.archived_at.as_deref(), Some("2026-10-25"));
        assert!(load_timer(&root.0).expect("timer").is_none());
        assert_eq!(load_logs(&root.0).expect("logs")[0].secs, 1800);
        assert!(start_timer_in(&root.0, "r1", t("2026-10-25T02:00:00Z"), d("2026-10-25")).is_err());

        let r = set_archived_in(
            &root.0,
            "r1",
            false,
            t("2026-10-28T00:00:00Z"),
            d("2026-10-28"),
        )
        .expect("unarchive");
        assert!(r.archived_at.is_none());
        assert_eq!(r.pauses[0].to, "2026-10-27");
        assert_eq!(load_routines(&root.0).expect("reload")[0].pauses.len(), 1);
    }

    #[test]
    fn files_delete_backs_up_then_removes_routine_logs_and_timer() {
        let root = TempRoot::new();
        let mut keep = routine("keep", None);
        keep.order = 1;
        save_routines(&root.0, &[routine("gone", None), keep]).expect("save");
        let mut logs = Vec::new();
        apply_check(&mut logs, "gone", "2026-10-24", true, NOW);
        apply_check(&mut logs, "gone", "2026-10-25", true, NOW);
        apply_check(&mut logs, "keep", "2026-10-25", true, NOW);
        save_logs(&root.0, &logs).expect("save logs");
        start_timer_in(&root.0, "gone", t("2026-10-25T01:00:00Z"), d("2026-10-25")).expect("start");

        let res = delete_in(&root.0, "gone").expect("delete");
        assert_eq!(res.removed_logs, 2);
        let backup = PathBuf::from(&res.backup_path);
        assert!(backup.starts_with(root.0.canonicalize().expect("canon").join("backups")));
        let backed: Vec<Routine> = read_json(&backup.join(ROUTINES_FILE))
            .expect("read")
            .expect("some");
        assert_eq!(backed.len(), 2);
        let backed_logs: Vec<RoutineLog> = read_json(&backup.join(LOGS_FILE))
            .expect("read")
            .expect("some");
        assert_eq!(backed_logs.len(), 3);

        let left = load_routines(&root.0).expect("routines");
        assert_eq!(
            left.iter().map(|r| r.id.as_str()).collect::<Vec<_>>(),
            vec!["keep"]
        );
        assert_eq!(load_logs(&root.0).expect("logs").len(), 1);
        assert!(load_timer(&root.0).expect("timer").is_none());

        // 같은 초에 한 번 더 지워도 백업 폴더가 겹치지 않는다
        let res2 = delete_in(&root.0, "keep").expect("delete again");
        assert_ne!(res2.backup_path, res.backup_path);
        assert!(delete_in(&root.0, "keep").is_err());
    }
}
