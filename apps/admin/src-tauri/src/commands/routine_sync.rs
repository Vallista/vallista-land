//! 루틴을 냥노션 서버와 맞춘다 — iOS 루틴 앱(`apps/bento-ios`)과 같은 서버 길
//! `/api/sync/routines/changes`. 서버 규칙은 Nyanotion 저장소 `docs/13-sync.md` §루틴.
//!
//! - 한 바퀴 = **올리기 → 받기.** 올릴 것은 `routine_sync.json` 의 dirty 표(고친 시각)다.
//!   `routines::save_*` 가 저장할 때마다 디스크의 이전 값과 비교해 바뀐 것만 적는다(연결 뒤에만).
//! - 나중에 고친 쪽이 이긴다. 서버가 더 새로워 버려진 것은 응답의 `current` 로 곧바로 덮는다.
//!   받은 것보다 이 기기에서 나중에 고쳤고 아직 안 올린 것은 덮지 않는다 — 다음 올리기가 이긴다.
//! - 처음 연결: 로컬 전부를 아주 옛 시각(`EPOCH`)으로 올릴 것에 적는다. 서버에 같은 것이 있으면 서버가
//!   이기고, 없는 것은 올라간다. 연결 직전 세 파일을 `backups/routine-sync-<ts>/` 로 복사한다.
//! - 파일 읽기·쓰기는 전부 메인 스레드(`run_on_main_thread`)에서 한다. 루틴 커맨드가 모두 동기(메인
//!   스레드)라 같은 스레드에 올려야 lost update 가 없다. 네트워크만 비동기 워커에서.
//! - 토큰은 키체인 `nyanotion-sync` 자리(체크리스트 동기화와 같은 자리). 웹뷰로 돌려주지 않는다.

use chrono::{DateTime, SecondsFormat, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::OnceLock;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::Notify;

use crate::commands::keychain;
use crate::commands::routines::{
    self, Routine, RoutineLog, RoutinePause, RoutineSchedule, RoutineSession, RoutineSlot,
    RoutineTimer,
};
use crate::repo::{ensure_inside, AppState};

const STATE_FILE: &str = "routine_sync.json";
/// 키체인 자리 — 체크리스트 동기화(`feat/nyanotion-sync`)와 같은 토큰을 쓴다.
pub const TOKEN_SLOT: &str = "nyanotion-sync";
pub const DEFAULT_SERVER: &str = "https://nyanotion.party";
/// 받은 것으로 로컬 루틴이 바뀌었다 → 프론트가 다시 읽는다.
pub const SYNCED_EVENT: &str = "bento:routines-synced";
/// 동기화 상태가 바뀌었다(시작·끝·설정).
pub const STATUS_EVENT: &str = "bento:routine-sync-status";
/// 처음 연결 때 로컬 것에 붙이는 시각. 서버에 같은 것이 있으면 서버가 이긴다.
pub const EPOCH: &str = "2000-01-01T00:00:00.000Z";
/// 한 번에 올리는 양 (서버 한도 5000 보다 넉넉히 아래)
const BATCH_LIMIT: usize = 2000;
const STALE_TIMER_ID: &str = "timer";

// ---------------------------------------------------------------------------
// 상태 파일
// ---------------------------------------------------------------------------

#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct SyncResult {
    pub pushed: u32,
    pub stale: u32,
    pub rejected: u32,
    pub pulled: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct SyncState {
    pub enabled: bool,
    pub server_url: String,
    /// 받은 데까지의 서버 변경 번호
    pub cursor: i64,
    /// 처음 연결(로컬 전부 올리기)을 마쳤는가
    pub linked: bool,
    /// id → 고친 시각. 로컬에 없으면 지운 것
    pub dirty_routines: BTreeMap<String, String>,
    /// `<routineId>:<date>` → 고친 시각. 로컬에 없으면 지운 것
    pub dirty_logs: BTreeMap<String, String>,
    pub dirty_timer: Option<String>,
    pub last_sync_at: Option<String>,
    pub last_error: Option<String>,
    pub last_result: Option<SyncResult>,
    pub first_link_backup: Option<String>,
}

impl Default for SyncState {
    fn default() -> Self {
        SyncState {
            enabled: false,
            server_url: DEFAULT_SERVER.to_string(),
            cursor: 0,
            linked: false,
            dirty_routines: BTreeMap::new(),
            dirty_logs: BTreeMap::new(),
            dirty_timer: None,
            last_sync_at: None,
            last_error: None,
            last_result: None,
            first_link_backup: None,
        }
    }
}

impl SyncState {
    pub fn pending(&self) -> usize {
        self.dirty_routines.len() + self.dirty_logs.len() + usize::from(self.dirty_timer.is_some())
    }
}

pub fn load_state(root: &Path) -> SyncState {
    let p = root.join(STATE_FILE);
    fs::read_to_string(&p)
        .ok()
        .and_then(|raw| serde_json::from_str::<SyncState>(&raw).ok())
        .unwrap_or_default()
}

pub fn save_state(root: &Path, s: &SyncState) -> Result<(), String> {
    let safe = ensure_inside(root, &root.join(STATE_FILE))?;
    let json = serde_json::to_string_pretty(s).map_err(|e| e.to_string())?;
    let tmp = safe.with_extension(format!("json.{}.tmp", uuid::Uuid::new_v4().simple()));
    fs::write(&tmp, json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &safe).map_err(|e| {
        let _ = fs::remove_file(&tmp);
        e.to_string()
    })
}

pub fn now_millis() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

fn parse_time(s: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(s).ok().map(|t| t.with_timezone(&Utc))
}

/// a 가 b 보다 나중인가. 읽지 못하면 글자 비교.
pub fn is_after(a: &str, b: &str) -> bool {
    match (parse_time(a), parse_time(b)) {
        (Some(x), Some(y)) => x > y,
        _ => a > b,
    }
}

pub fn log_id(routine_id: &str, date: &str) -> String {
    format!("{}:{}", routine_id, date)
}

// ---------------------------------------------------------------------------
// 바뀐 것 적기 — routines::save_* 가 부른다
// ---------------------------------------------------------------------------

fn notifier() -> &'static Notify {
    static N: OnceLock<Notify> = OnceLock::new();
    N.get_or_init(Notify::new)
}

fn same<T: Serialize>(a: &T, b: &T) -> bool {
    serde_json::to_value(a).ok() == serde_json::to_value(b).ok()
}

/// 바뀐 id 를 dirty 표에 적는다. 연결 전이면 적지 않는다(처음 연결이 전부 올린다).
fn mark(root: &Path, apply: impl FnOnce(&mut SyncState, &str) -> bool) {
    let mut s = load_state(root);
    if !s.linked {
        return;
    }
    if !apply(&mut s, &now_millis()) {
        return;
    }
    if let Err(e) = save_state(root, &s) {
        eprintln!("routine sync: mark: {e}");
        return;
    }
    if s.enabled {
        notifier().notify_one();
    }
}

pub fn mark_routines(root: &Path, old: &[Routine], new: &[Routine]) {
    mark(root, |s, now| {
        let before: HashMap<&str, &Routine> = old.iter().map(|r| (r.id.as_str(), r)).collect();
        let after: HashMap<&str, &Routine> = new.iter().map(|r| (r.id.as_str(), r)).collect();
        let mut changed = false;
        for (id, r) in &after {
            if before.get(id).map_or(true, |o| !same(*o, *r)) {
                s.dirty_routines.insert(id.to_string(), now.to_string());
                changed = true;
            }
        }
        for id in before.keys() {
            if !after.contains_key(id) {
                s.dirty_routines.insert(id.to_string(), now.to_string());
                changed = true;
            }
        }
        changed
    });
}

pub fn mark_logs(root: &Path, old: &[RoutineLog], new: &[RoutineLog]) {
    mark(root, |s, now| {
        let key = |l: &RoutineLog| log_id(&l.routine_id, &l.date);
        let before: HashMap<String, &RoutineLog> = old.iter().map(|l| (key(l), l)).collect();
        let after: HashMap<String, &RoutineLog> = new.iter().map(|l| (key(l), l)).collect();
        let mut changed = false;
        for (id, l) in &after {
            if before.get(id).map_or(true, |o| *o != *l) {
                s.dirty_logs.insert(id.clone(), now.to_string());
                changed = true;
            }
        }
        for id in before.keys() {
            if !after.contains_key(id) {
                s.dirty_logs.insert(id.clone(), now.to_string());
                changed = true;
            }
        }
        changed
    });
}

pub fn mark_timer(root: &Path, old: Option<&RoutineTimer>, new: Option<&RoutineTimer>) {
    if old == new {
        return;
    }
    mark(root, |s, now| {
        s.dirty_timer = Some(now.to_string());
        true
    });
}

// ---------------------------------------------------------------------------
// 서버 모양
// ---------------------------------------------------------------------------

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ServerRoutine {
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub color: String,
    #[serde(default)]
    pub slot: Option<RoutineSlot>,
    #[serde(default)]
    pub schedule: Option<RoutineSchedule>,
    #[serde(default)]
    pub goal_min: Option<u32>,
    #[serde(default)]
    pub start_date: String,
    #[serde(default)]
    pub archived_at: Option<String>,
    #[serde(default)]
    pub pauses: Vec<RoutinePause>,
    #[serde(default)]
    pub order: i64,
    #[serde(default)]
    pub created_at: String,
    #[serde(default)]
    pub deleted: bool,
    pub updated_at: String,
}

impl ServerRoutine {
    fn routine(&self) -> Option<Routine> {
        let schedule = self.schedule.clone()?;
        Some(Routine {
            id: self.id.clone(),
            title: self.title.clone(),
            color: if routines::COLORS.contains(&self.color.as_str()) {
                self.color.clone()
            } else {
                "blue".to_string()
            },
            slot: self.slot.unwrap_or_default(),
            schedule,
            goal_min: self.goal_min,
            start_date: self.start_date.clone(),
            archived_at: self.archived_at.clone(),
            pauses: self.pauses.clone(),
            order: u32::try_from(self.order.max(0)).unwrap_or(u32::MAX),
            created_at: self.created_at.clone(),
        })
    }
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ServerLog {
    pub routine_id: String,
    pub date: String,
    #[serde(default)]
    pub done: bool,
    #[serde(default)]
    pub done_at: Option<String>,
    #[serde(default)]
    pub secs: u32,
    #[serde(default)]
    pub sessions: Vec<RoutineSession>,
    #[serde(default)]
    pub deleted: bool,
    pub updated_at: String,
}

impl ServerLog {
    fn log(&self) -> RoutineLog {
        RoutineLog {
            routine_id: self.routine_id.clone(),
            date: self.date.clone(),
            done: self.done,
            done_at: self.done_at.clone(),
            secs: self.secs,
            sessions: self.sessions.clone(),
            updated_at: self.updated_at.clone(),
        }
    }
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ServerTimer {
    #[serde(default)]
    pub routine_id: Option<String>,
    #[serde(default)]
    pub date: Option<String>,
    #[serde(default)]
    pub started_at: Option<String>,
    pub updated_at: String,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Changes {
    #[serde(default)]
    pub routines: Vec<ServerRoutine>,
    #[serde(default)]
    pub logs: Vec<ServerLog>,
    #[serde(default)]
    pub timer: Option<ServerTimer>,
    pub cursor: i64,
    #[serde(default)]
    pub more: bool,
}

#[derive(Deserialize, Clone, Debug)]
pub struct Rejected {
    pub id: String,
    #[serde(default)]
    pub reason: String,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(default)]
pub struct Current {
    pub routines: Vec<ServerRoutine>,
    pub logs: Vec<ServerLog>,
    pub timer: Option<ServerTimer>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(default)]
pub struct PushResult {
    pub applied: u32,
    pub stale: Vec<String>,
    pub rejected: Vec<Rejected>,
    pub current: Current,
}

impl Default for PushResult {
    fn default() -> Self {
        PushResult {
            applied: 0,
            stale: vec![],
            rejected: vec![],
            current: Current::default(),
        }
    }
}

// ---------------------------------------------------------------------------
// 순수 로직 — 로컬 묶음 하나에 대해
// ---------------------------------------------------------------------------

/// 메모리에 올린 로컬 루틴 세 파일
#[derive(Clone, Debug, Default)]
pub struct Local {
    pub routines: Vec<Routine>,
    pub logs: Vec<RoutineLog>,
    pub timer: Option<RoutineTimer>,
}

impl Local {
    pub fn load(root: &Path) -> Result<Local, String> {
        Ok(Local {
            routines: routines::load_routines(root)?,
            logs: routines::load_logs(root)?,
            timer: routines::load_timer(root)?,
        })
    }

    /// 바뀐 파일만 다시 쓴다. dirty 표에는 적지 않는다(받은 것이므로).
    pub fn save_changed(&self, root: &Path, before: &Local) -> Result<bool, String> {
        let mut changed = false;
        if !same(&self.routines, &before.routines) {
            let mut list = self.routines.clone();
            routines::sort_routines(&mut list);
            routines::save_routines_raw(root, &list)?;
            changed = true;
        }
        if self.logs != before.logs {
            routines::save_logs_raw(root, &self.logs)?;
            changed = true;
        }
        if self.timer != before.timer {
            routines::save_timer_raw(root, self.timer.as_ref())?;
            changed = true;
        }
        Ok(changed)
    }
}

/// 처음 연결 — 아직 적히지 않은 로컬 전부를 EPOCH 로 적는다.
pub fn prepare_first_link(s: &mut SyncState, local: &Local) {
    if s.linked {
        return;
    }
    for r in &local.routines {
        s.dirty_routines.entry(r.id.clone()).or_insert_with(|| EPOCH.to_string());
    }
    for l in &local.logs {
        s.dirty_logs
            .entry(log_id(&l.routine_id, &l.date))
            .or_insert_with(|| EPOCH.to_string());
    }
    if local.timer.is_some() && s.dirty_timer.is_none() {
        s.dirty_timer = Some(EPOCH.to_string());
    }
    s.linked = true;
}

#[derive(Clone, Debug, Default)]
pub struct Outgoing {
    pub body: Value,
    pub sent_routines: BTreeMap<String, String>,
    pub sent_logs: BTreeMap<String, String>,
    pub sent_timer: Option<String>,
    pub truncated: bool,
    pub count: usize,
}

fn opt(v: &Option<String>) -> Value {
    v.as_ref().map_or(Value::Null, |s| Value::String(s.clone()))
}

pub fn outgoing(s: &SyncState, local: &Local, limit: usize) -> Outgoing {
    let mut out = Outgoing::default();
    let mut room = limit;
    let mut routines_out = Vec::new();
    let mut logs_out = Vec::new();
    for (id, at) in &s.dirty_routines {
        if room == 0 {
            out.truncated = true;
            break;
        }
        let item = match local.routines.iter().find(|r| &r.id == id) {
            Some(r) => json!({
                "id": r.id,
                "updatedAt": at,
                "title": r.title,
                "color": r.color,
                "slot": r.slot,
                "schedule": r.schedule,
                "goalMin": r.goal_min,
                "startDate": r.start_date,
                "archivedAt": opt(&r.archived_at),
                "pauses": r.pauses,
                "order": r.order,
                "createdAt": r.created_at,
            }),
            None => json!({ "id": id, "updatedAt": at, "deleted": true }),
        };
        routines_out.push(item);
        out.sent_routines.insert(id.clone(), at.clone());
        room -= 1;
    }
    if !out.truncated {
        for (id, at) in &s.dirty_logs {
            if room == 0 {
                out.truncated = true;
                break;
            }
            // id = <routineId>:<date> — 날짜에는 ':' 가 없으므로 마지막 ':' 로 가른다.
            let Some(cut) = id.rfind(':') else { continue };
            let (routine_id, date) = (&id[..cut], &id[cut + 1..]);
            let item = match local
                .logs
                .iter()
                .find(|l| l.routine_id == routine_id && l.date == date)
            {
                Some(l) => json!({
                    "routineId": routine_id,
                    "date": date,
                    "updatedAt": at,
                    "done": l.done,
                    "doneAt": opt(&l.done_at),
                    "secs": l.secs,
                    "sessions": l.sessions,
                }),
                None => json!({ "routineId": routine_id, "date": date, "updatedAt": at, "deleted": true }),
            };
            logs_out.push(item);
            out.sent_logs.insert(id.clone(), at.clone());
            room -= 1;
        }
    }
    let mut body = json!({ "routines": routines_out, "logs": logs_out });
    if let Some(at) = &s.dirty_timer {
        let timer = match &local.timer {
            Some(t) => json!({ "routineId": t.routine_id, "date": t.date, "startedAt": t.started_at, "updatedAt": at }),
            None => json!({ "routineId": Value::Null, "updatedAt": at }),
        };
        body["timer"] = timer;
        out.sent_timer = Some(at.clone());
    }
    out.count = out.sent_routines.len() + out.sent_logs.len() + usize::from(out.sent_timer.is_some());
    out.body = body;
    out
}

fn apply_routine(s: &mut SyncState, local: &mut Local, w: &ServerRoutine, force: bool) {
    if !force {
        if let Some(mine) = s.dirty_routines.get(&w.id) {
            if is_after(mine, &w.updated_at) {
                return;
            }
        }
    }
    s.dirty_routines.remove(&w.id);
    if w.deleted {
        local.routines.retain(|r| r.id != w.id);
        local.logs.retain(|l| l.routine_id != w.id);
        let prefix = format!("{}:", w.id);
        s.dirty_logs.retain(|k, _| !k.starts_with(&prefix));
        if local.timer.as_ref().is_some_and(|t| t.routine_id == w.id) {
            local.timer = None;
        }
        return;
    }
    let Some(r) = w.routine() else { return };
    match local.routines.iter_mut().find(|x| x.id == w.id) {
        Some(x) => *x = r,
        None => local.routines.push(r),
    }
}

fn apply_log(s: &mut SyncState, local: &mut Local, w: &ServerLog, force: bool) {
    let id = log_id(&w.routine_id, &w.date);
    if !force {
        if let Some(mine) = s.dirty_logs.get(&id) {
            if is_after(mine, &w.updated_at) {
                return;
            }
        }
    }
    s.dirty_logs.remove(&id);
    local
        .logs
        .retain(|l| !(l.routine_id == w.routine_id && l.date == w.date));
    if !w.deleted {
        local.logs.push(w.log());
    }
}

fn apply_timer(s: &mut SyncState, local: &mut Local, w: &ServerTimer, force: bool) {
    if !force {
        if let Some(mine) = &s.dirty_timer {
            if is_after(mine, &w.updated_at) {
                return;
            }
        }
    }
    s.dirty_timer = None;
    local.timer = match (&w.routine_id, &w.date, &w.started_at) {
        (Some(r), Some(d), Some(at)) => Some(RoutineTimer {
            routine_id: r.clone(),
            date: d.clone(),
            started_at: at.clone(),
        }),
        _ => None,
    };
}

/// 올린 결과 — 보낸 뒤 다시 고치지 않은 것만 dirty 에서 빼고, 서버가 이긴 것은 곧바로 덮는다.
pub fn apply_push_result(s: &mut SyncState, local: &mut Local, res: &PushResult, sent: &Outgoing) {
    for (id, at) in &sent.sent_routines {
        if s.dirty_routines.get(id) == Some(at) {
            s.dirty_routines.remove(id);
        }
    }
    for (id, at) in &sent.sent_logs {
        if s.dirty_logs.get(id) == Some(at) {
            s.dirty_logs.remove(id);
        }
    }
    if sent.sent_timer.is_some() && s.dirty_timer == sent.sent_timer {
        s.dirty_timer = None;
    }
    // 받지 않은 것은 다시 보내도 또 거절된다 — 내려놓는다.
    for r in &res.rejected {
        s.dirty_routines.remove(&r.id);
        s.dirty_logs.remove(&r.id);
        if r.id == STALE_TIMER_ID {
            s.dirty_timer = None;
        }
    }
    for w in &res.current.routines {
        apply_routine(s, local, w, true);
    }
    for w in &res.current.logs {
        apply_log(s, local, w, true);
    }
    if let Some(t) = &res.current.timer {
        apply_timer(s, local, t, true);
    }
}

pub fn apply_pull(s: &mut SyncState, local: &mut Local, ch: &Changes) {
    for w in &ch.routines {
        apply_routine(s, local, w, false);
    }
    for w in &ch.logs {
        apply_log(s, local, w, false);
    }
    if let Some(t) = &ch.timer {
        apply_timer(s, local, t, false);
    }
    s.cursor = s.cursor.max(ch.cursor);
}

// ---------------------------------------------------------------------------
// 한 바퀴
// ---------------------------------------------------------------------------

static RUNNING: AtomicBool = AtomicBool::new(false);

/// 파일을 만지는 단계를 어디서 돌릴지. 앱에서는 메인 스레드, 시험에서는 그 자리.
pub(crate) trait Exec: Sync {
    fn main<T: Send + 'static>(
        &self,
        f: impl FnOnce(&Path) -> T + Send + 'static,
    ) -> impl std::future::Future<Output = Result<T, String>> + Send;
    fn token(&self) -> impl std::future::Future<Output = Result<Option<String>, String>> + Send;
}

struct AppExec<'a>(&'a AppHandle);

impl Exec for AppExec<'_> {
    /// 메인 스레드에서 f 를 돌리고 결과를 받는다.
    async fn main<T: Send + 'static>(
        &self,
        f: impl FnOnce(&Path) -> T + Send + 'static,
    ) -> Result<T, String> {
        let (tx, rx) = tokio::sync::oneshot::channel();
        let handle = self.0.clone();
        self.0
            .run_on_main_thread(move || {
                let Some(state) = handle.try_state::<AppState>() else {
                    return;
                };
                let _ = tx.send(f(&state.data_root));
            })
            .map_err(|e| e.to_string())?;
        rx.await.map_err(|_| "앱 상태를 읽지 못했어요".to_string())
    }

    async fn token(&self) -> Result<Option<String>, String> {
        self.main(|root| keychain::read_token(TOKEN_SLOT, root)).await?
    }
}

fn endpoint(server: &str) -> Result<String, String> {
    let base = server.trim().trim_end_matches('/');
    if !(base.starts_with("https://") || base.starts_with("http://")) {
        return Err("서버 주소는 https:// 로 시작해야 해요".to_string());
    }
    Ok(format!("{}/api/sync/routines/changes", base))
}

async fn read_body<T: for<'de> Deserialize<'de>>(res: reqwest::Response) -> Result<T, String> {
    let status = res.status();
    let text = res.text().await.map_err(|e| format!("서버 응답을 읽지 못했어요 — {e}"))?;
    if !status.is_success() {
        let msg = serde_json::from_str::<Value>(&text)
            .ok()
            .and_then(|v| v.get("error").and_then(|e| e.as_str()).map(str::to_string))
            .unwrap_or_default();
        return Err(match status.as_u16() {
            401 => {
                if msg.is_empty() {
                    "토큰이 맞지 않아요 — 냥노션 계정 › 개인 토큰을 다시 확인해 주세요".to_string()
                } else {
                    msg
                }
            }
            code => {
                if msg.is_empty() {
                    format!("서버가 {code} 를 돌려줬어요")
                } else {
                    format!("{msg} ({code})")
                }
            }
        });
    }
    serde_json::from_str::<T>(&text).map_err(|e| format!("서버 응답 모양이 달라요 — {e}"))
}

/// 연결 직전 백업 — 세 파일을 복사(크기 대조). 실패하면 연결하지 않는다.
fn backup_before_link(root: &Path) -> Result<String, String> {
    let stamp = Utc::now().format("%Y%m%dT%H%M%SZ").to_string();
    let backups = root.join("backups");
    let mut dir = backups.join(format!("routine-sync-{stamp}"));
    let mut n = 2;
    while dir.exists() {
        dir = backups.join(format!("routine-sync-{stamp}-{n}"));
        n += 1;
    }
    let dir = ensure_inside(root, &dir)?;
    fs::create_dir_all(&dir).map_err(|e| format!("backup: {e}"))?;
    for name in ["routines.json", "routine_logs.json", "routine_timer.json"] {
        let src = root.join(name);
        if !src.is_file() {
            continue;
        }
        let expected = fs::metadata(&src).map_err(|e| e.to_string())?.len();
        let copied = fs::copy(&src, dir.join(name)).map_err(|e| format!("backup {name}: {e}"))?;
        if copied != expected {
            return Err(format!("backup {name}: size mismatch ({copied} != {expected})"));
        }
    }
    Ok(dir.display().to_string())
}

enum Prep {
    Skip,
    Go { url: String, token: String, out: Outgoing },
}

fn prepare(root: &Path, manual: bool, token: Option<String>) -> Result<Prep, String> {
    let mut s = load_state(root);
    if !s.enabled && !manual {
        return Ok(Prep::Skip);
    }
    let url = endpoint(&s.server_url)?;
    let token = match token {
        Some(t) if !t.trim().is_empty() => t.trim().to_string(),
        _ => {
            if manual {
                return Err("개인 토큰을 먼저 넣어 주세요".to_string());
            }
            return Ok(Prep::Skip);
        }
    };
    let local = Local::load(root)?;
    if !s.linked {
        s.first_link_backup = Some(backup_before_link(root)?);
        prepare_first_link(&mut s, &local);
        save_state(root, &s)?;
    }
    let out = outgoing(&s, &local, BATCH_LIMIT);
    Ok(Prep::Go { url, token, out })
}

fn after_push(root: &Path, res: PushResult, sent: Outgoing) -> Result<bool, String> {
    let mut s = load_state(root);
    let before = Local::load(root)?;
    let mut local = before.clone();
    apply_push_result(&mut s, &mut local, &res, &sent);
    let changed = local.save_changed(root, &before)?;
    save_state(root, &s)?;
    Ok(changed)
}

fn after_pull(root: &Path, ch: Changes) -> Result<bool, String> {
    let mut s = load_state(root);
    let before = Local::load(root)?;
    let mut local = before.clone();
    apply_pull(&mut s, &mut local, &ch);
    let changed = local.save_changed(root, &before)?;
    save_state(root, &s)?;
    Ok(changed)
}

fn next_outgoing(root: &Path) -> Result<Outgoing, String> {
    let s = load_state(root);
    let local = Local::load(root)?;
    Ok(outgoing(&s, &local, BATCH_LIMIT))
}

pub(crate) async fn round<E: Exec>(
    exec: &E,
    manual: bool,
) -> Result<Option<(SyncResult, bool)>, String> {
    let token = exec.token().await?;
    let prep = exec.main(move |root| prepare(root, manual, token)).await??;
    let Prep::Go { url, token, mut out } = prep else {
        return Ok(None);
    };
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let mut result = SyncResult::default();
    let mut local_changed = false;

    for _ in 0..20 {
        if out.count == 0 {
            break;
        }
        let res = client
            .post(&url)
            .bearer_auth(&token)
            .json(&out.body)
            .send()
            .await
            .map_err(|e| format!("서버에 닿지 못했어요 — {e}"))?;
        let res: PushResult = read_body(res).await?;
        for r in &res.rejected {
            eprintln!("routine sync: server rejected {} ({})", r.id, r.reason);
        }
        result.pushed += res.applied;
        result.stale += u32::try_from(res.stale.len()).unwrap_or(u32::MAX);
        result.rejected += u32::try_from(res.rejected.len()).unwrap_or(u32::MAX);
        let truncated = out.truncated;
        let sent = out;
        local_changed |= exec.main(move |root| after_push(root, res, sent)).await??;
        if !truncated {
            break;
        }
        out = exec.main(next_outgoing).await??;
    }

    for _ in 0..50 {
        let cursor = exec.main(|root| load_state(root).cursor).await?;
        let res = client
            .get(&url)
            .query(&[("since", cursor.to_string())])
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| format!("서버에 닿지 못했어요 — {e}"))?;
        let ch: Changes = read_body(res).await?;
        let more = ch.more;
        result.pulled += u32::try_from(ch.routines.len() + ch.logs.len() + usize::from(ch.timer.is_some()))
            .unwrap_or(u32::MAX);
        local_changed |= exec.main(move |root| after_pull(root, ch)).await??;
        if !more {
            break;
        }
    }
    Ok(Some((result, local_changed)))
}

/// 한 바퀴 돌리고 결과를 상태 파일에 적는다. 이미 돌고 있으면 건너뛴다.
pub async fn run(app: &AppHandle, manual: bool) -> Result<Option<SyncResult>, String> {
    if RUNNING.swap(true, Ordering::SeqCst) {
        return Ok(None);
    }
    let _ = app.emit(STATUS_EVENT, true);
    let exec = AppExec(app);
    let outcome = round(&exec, manual).await;
    RUNNING.store(false, Ordering::SeqCst);
    let (ret, changed) = match &outcome {
        Ok(Some((r, changed))) => (Ok(Some(r.clone())), *changed),
        Ok(None) => (Ok(None), false),
        Err(e) => (Err(e.clone()), false),
    };
    let record = outcome.clone();
    let _ = exec.main(move |root| {
        let mut s = load_state(root);
        match record {
            Ok(Some((r, _))) => {
                s.last_sync_at = Some(now_millis());
                s.last_error = None;
                s.last_result = Some(r);
            }
            Ok(None) => return,
            Err(e) => s.last_error = Some(e),
        }
        let _ = save_state(root, &s);
    })
    .await;
    if changed {
        let _ = app.emit(SYNCED_EVENT, ());
    }
    let _ = app.emit(STATUS_EVENT, false);
    ret
}

/// 1분마다, 그리고 루틴을 고친 뒤 2초에 한 바퀴. 켜져 있지 않거나 토큰이 없으면 조용히 건너뛴다.
pub async fn start_poller(app: AppHandle) {
    tokio::time::sleep(Duration::from_secs(5)).await;
    loop {
        if let Err(e) = run(&app, false).await {
            eprintln!("routine sync: {e}");
        }
        tokio::select! {
            _ = tokio::time::sleep(Duration::from_secs(60)) => {}
            _ = notifier().notified() => {
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 커맨드
// ---------------------------------------------------------------------------

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatus {
    pub enabled: bool,
    pub server_url: String,
    pub has_token: bool,
    pub linked: bool,
    pub pending: usize,
    pub running: bool,
    pub last_sync_at: Option<String>,
    pub last_error: Option<String>,
    pub last_result: Option<SyncResult>,
    pub first_link_backup: Option<String>,
}

fn status_of(root: &Path) -> SyncStatus {
    let s = load_state(root);
    SyncStatus {
        enabled: s.enabled,
        server_url: s.server_url.clone(),
        has_token: matches!(keychain::read_token(TOKEN_SLOT, root), Ok(Some(t)) if !t.trim().is_empty()),
        linked: s.linked,
        pending: s.pending(),
        running: RUNNING.load(Ordering::SeqCst),
        last_sync_at: s.last_sync_at.clone(),
        last_error: s.last_error.clone(),
        last_result: s.last_result.clone(),
        first_link_backup: s.first_link_backup.clone(),
    }
}

#[tauri::command]
pub fn routine_sync_status(state: State<'_, AppState>) -> Result<SyncStatus, String> {
    Ok(status_of(&state.data_root))
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SyncConfigPatch {
    #[serde(default)]
    pub enabled: Option<bool>,
    #[serde(default)]
    pub server_url: Option<String>,
}

#[tauri::command]
pub fn routine_sync_configure(
    patch: SyncConfigPatch,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<SyncStatus, String> {
    let root = &state.data_root;
    let mut s = load_state(root);
    if let Some(url) = patch.server_url {
        let url = url.trim().trim_end_matches('/').to_string();
        endpoint(&url)?;
        if url != s.server_url {
            // 다른 서버 → 처음 연결부터 다시.
            s.server_url = url;
            s.linked = false;
            s.cursor = 0;
            s.last_error = None;
        }
    }
    if let Some(on) = patch.enabled {
        s.enabled = on;
        if on {
            notifier().notify_one();
        }
    }
    save_state(root, &s)?;
    let _ = app.emit(STATUS_EVENT, false);
    Ok(status_of(root))
}

/// 토큰을 키체인에 넣는다. 빈 값이면 지우고, 다음 연결은 처음 연결처럼 한다(다른 계정일 수 있으므로).
#[tauri::command]
pub fn routine_sync_set_token(
    token: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<SyncStatus, String> {
    let root = &state.data_root;
    let t = token.trim();
    if t.is_empty() {
        keychain::delete_token(TOKEN_SLOT, root)?;
        let mut s = load_state(root);
        s.linked = false;
        s.cursor = 0;
        s.last_error = None;
        save_state(root, &s)?;
    } else {
        if !t.starts_with("nyt_") {
            return Err("냥노션 개인 토큰은 nyt_ 로 시작해요".to_string());
        }
        keychain::write_token(TOKEN_SLOT, t, root)?;
        notifier().notify_one();
    }
    let _ = app.emit(STATUS_EVENT, false);
    Ok(status_of(root))
}

#[tauri::command(async)]
pub async fn routine_sync_now(app: AppHandle) -> Result<Option<SyncResult>, String> {
    run(&app, true).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::routines::{RoutineFreq, RoutineSchedule};

    fn routine(id: &str) -> Routine {
        Routine {
            id: id.to_string(),
            title: format!("루틴 {id}"),
            color: "blue".to_string(),
            slot: RoutineSlot::Morning,
            schedule: RoutineSchedule {
                freq: RoutineFreq::Daily,
                weekdays: vec![],
            },
            goal_min: Some(10),
            start_date: "2026-10-01".to_string(),
            archived_at: None,
            pauses: vec![],
            order: 0,
            created_at: "2026-10-01T00:00:00Z".to_string(),
        }
    }

    fn log(rid: &str, date: &str, done: bool) -> RoutineLog {
        RoutineLog {
            routine_id: rid.to_string(),
            date: date.to_string(),
            done,
            done_at: done.then(|| "2026-10-02T00:00:00Z".to_string()),
            secs: 0,
            sessions: vec![],
            updated_at: "2026-10-02T00:00:00Z".to_string(),
        }
    }

    fn server_routine(r: &Routine, updated: &str, deleted: bool) -> ServerRoutine {
        ServerRoutine {
            id: r.id.clone(),
            title: r.title.clone(),
            color: r.color.clone(),
            slot: Some(r.slot),
            schedule: Some(r.schedule.clone()),
            goal_min: r.goal_min,
            start_date: r.start_date.clone(),
            archived_at: r.archived_at.clone(),
            pauses: r.pauses.clone(),
            order: i64::from(r.order),
            created_at: r.created_at.clone(),
            deleted,
            updated_at: updated.to_string(),
        }
    }

    fn server_log(l: &RoutineLog, updated: &str, deleted: bool) -> ServerLog {
        ServerLog {
            routine_id: l.routine_id.clone(),
            date: l.date.clone(),
            done: l.done,
            done_at: l.done_at.clone(),
            secs: l.secs,
            sessions: l.sessions.clone(),
            deleted,
            updated_at: updated.to_string(),
        }
    }

    fn temp_root(name: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("bento-routine-sync-{name}-{}", uuid::Uuid::new_v4().simple()));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn first_link_marks_everything_with_epoch() {
        let mut s = SyncState::default();
        let local = Local {
            routines: vec![routine("a")],
            logs: vec![log("a", "2026-10-02", true)],
            timer: Some(RoutineTimer {
                routine_id: "a".into(),
                date: "2026-10-03".into(),
                started_at: "2026-10-03T01:00:00Z".into(),
            }),
        };
        prepare_first_link(&mut s, &local);
        assert!(s.linked);
        assert_eq!(s.dirty_routines.get("a").map(String::as_str), Some(EPOCH));
        assert_eq!(s.dirty_logs.get("a:2026-10-02").map(String::as_str), Some(EPOCH));
        assert_eq!(s.dirty_timer.as_deref(), Some(EPOCH));
        // 두 번째는 아무것도 안 한다
        s.dirty_routines.clear();
        prepare_first_link(&mut s, &local);
        assert!(s.dirty_routines.is_empty());
    }

    #[test]
    fn outgoing_encodes_nulls_and_tombstones() {
        let mut s = SyncState::default();
        s.dirty_routines.insert("a".into(), "2026-10-05T00:00:00.000Z".into());
        s.dirty_routines.insert("gone".into(), "2026-10-05T00:00:01.000Z".into());
        s.dirty_logs.insert("a:2026-10-02".into(), "2026-10-05T00:00:02.000Z".into());
        s.dirty_logs.insert("a:2026-10-03".into(), "2026-10-05T00:00:03.000Z".into());
        s.dirty_timer = Some("2026-10-05T00:00:04.000Z".into());
        let mut r = routine("a");
        r.goal_min = None;
        let local = Local {
            routines: vec![r],
            logs: vec![log("a", "2026-10-02", false)],
            timer: None,
        };
        let out = outgoing(&s, &local, 100);
        assert_eq!(out.count, 5);
        let b = &out.body;
        assert_eq!(b["routines"][0]["id"], "a");
        assert!(b["routines"][0]["goalMin"].is_null());
        assert!(b["routines"][0]["archivedAt"].is_null());
        assert_eq!(b["routines"][0]["schedule"]["freq"], "daily");
        assert_eq!(b["routines"][0]["slot"], "morning");
        assert_eq!(b["routines"][1], json!({"id": "gone", "updatedAt": "2026-10-05T00:00:01.000Z", "deleted": true}));
        assert!(b["logs"][0]["doneAt"].is_null());
        assert_eq!(b["logs"][1]["deleted"], true);
        assert!(b["timer"]["routineId"].is_null());
        // 한도
        let small = outgoing(&s, &local, 3);
        assert!(small.truncated);
        assert_eq!(small.sent_routines.len() + small.sent_logs.len(), 3);
    }

    #[test]
    fn push_result_keeps_edits_made_while_sending() {
        let mut s = SyncState::default();
        s.dirty_routines.insert("a".into(), "2026-10-05T00:00:00.000Z".into());
        s.dirty_logs.insert("a:2026-10-02".into(), "2026-10-05T00:00:00.000Z".into());
        let mut local = Local {
            routines: vec![routine("a")],
            logs: vec![log("a", "2026-10-02", true)],
            timer: None,
        };
        let sent = outgoing(&s, &local, 100);
        // 보내는 사이 기록을 또 고쳤다
        s.dirty_logs.insert("a:2026-10-02".into(), "2026-10-05T00:00:09.000Z".into());
        apply_push_result(&mut s, &mut local, &PushResult { applied: 2, ..Default::default() }, &sent);
        assert!(s.dirty_routines.is_empty());
        assert_eq!(s.dirty_logs.len(), 1);
    }

    #[test]
    fn stale_push_takes_server_current() {
        let mut s = SyncState::default();
        s.dirty_routines.insert("a".into(), "2026-10-05T00:00:00.000Z".into());
        let mut local = Local {
            routines: vec![routine("a")],
            ..Default::default()
        };
        let sent = outgoing(&s, &local, 100);
        let mut theirs = routine("a");
        theirs.title = "서버 제목".into();
        let res = PushResult {
            applied: 0,
            stale: vec!["a".into()],
            rejected: vec![],
            current: Current {
                routines: vec![server_routine(&theirs, "2026-10-06T00:00:00.000Z", false)],
                ..Default::default()
            },
        };
        apply_push_result(&mut s, &mut local, &res, &sent);
        assert_eq!(local.routines[0].title, "서버 제목");
        assert!(s.dirty_routines.is_empty());
    }

    #[test]
    fn pull_skips_newer_local_edits_and_cascades_deletes() {
        let mut s = SyncState::default();
        s.dirty_logs.insert("a:2026-10-02".into(), "2026-10-07T00:00:00.000Z".into());
        s.dirty_logs.insert("b:2026-10-02".into(), "2026-10-01T00:00:00.000Z".into());
        let mut local = Local {
            routines: vec![routine("a"), routine("b")],
            logs: vec![log("a", "2026-10-02", true), log("b", "2026-10-02", true)],
            timer: Some(RoutineTimer {
                routine_id: "b".into(),
                date: "2026-10-03".into(),
                started_at: "2026-10-03T01:00:00Z".into(),
            }),
        };
        let ch = Changes {
            routines: vec![server_routine(&routine("b"), "2026-10-06T00:00:00.000Z", true)],
            logs: vec![server_log(&log("a", "2026-10-02", false), "2026-10-06T00:00:00.000Z", false)],
            timer: None,
            cursor: 42,
            more: false,
        };
        apply_pull(&mut s, &mut local, &ch);
        // a 기록은 내 것이 더 새로워 그대로
        assert!(local.logs.iter().any(|l| l.routine_id == "a" && l.done));
        assert!(s.dirty_logs.contains_key("a:2026-10-02"));
        // b 는 지워졌고 기록·타이머·보낼 것도 같이
        assert!(local.routines.iter().all(|r| r.id != "b"));
        assert!(local.logs.iter().all(|l| l.routine_id != "b"));
        assert!(local.timer.is_none());
        assert!(!s.dirty_logs.contains_key("b:2026-10-02"));
        assert_eq!(s.cursor, 42);
    }

    #[test]
    fn pull_timer_and_uncheck() {
        let mut s = SyncState::default();
        let mut local = Local {
            routines: vec![routine("a")],
            logs: vec![log("a", "2026-10-02", true)],
            timer: None,
        };
        let ch = Changes {
            routines: vec![],
            logs: vec![server_log(&log("a", "2026-10-02", true), "2026-10-06T00:00:00.000Z", true)],
            timer: Some(ServerTimer {
                routine_id: Some("a".into()),
                date: Some("2026-10-06".into()),
                started_at: Some("2026-10-06T01:00:00.000Z".into()),
                updated_at: "2026-10-06T01:00:00.000Z".into(),
            }),
            cursor: 7,
            more: false,
        };
        apply_pull(&mut s, &mut local, &ch);
        assert!(local.logs.is_empty());
        assert_eq!(local.timer.as_ref().map(|t| t.routine_id.as_str()), Some("a"));
    }

    #[test]
    fn saves_mark_only_after_link_and_only_changes() {
        let root = temp_root("mark");
        // 연결 전: 적지 않는다
        routines::save_routines(&root, &[routine("a")]).unwrap();
        assert_eq!(load_state(&root).pending(), 0);
        // 연결 뒤
        let mut s = load_state(&root);
        s.linked = true;
        save_state(&root, &s).unwrap();
        routines::save_routines(&root, &[routine("a")]).unwrap();
        assert_eq!(load_state(&root).pending(), 0, "같은 값은 적지 않는다");
        let mut changed = routine("a");
        changed.title = "새 이름".into();
        routines::save_routines(&root, &[changed, routine("b")]).unwrap();
        let s = load_state(&root);
        assert!(s.dirty_routines.contains_key("a") && s.dirty_routines.contains_key("b"));
        routines::save_logs(&root, &[log("a", "2026-10-02", true)]).unwrap();
        routines::save_logs(&root, &[]).unwrap();
        assert!(load_state(&root).dirty_logs.contains_key("a:2026-10-02"));
        routines::save_timer(&root, None).unwrap();
        assert!(load_state(&root).dirty_timer.is_none(), "없던 타이머를 없애는 건 변경 아님");
        // 받은 것을 쓰는 길은 적지 않는다
        let mut s = load_state(&root);
        s.dirty_routines.clear();
        save_state(&root, &s).unwrap();
        routines::save_routines_raw(&root, &[routine("c")]).unwrap();
        assert!(load_state(&root).dirty_routines.is_empty());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn deleting_a_routine_marks_routine_and_logs() {
        let root = temp_root("delete");
        routines::save_routines_raw(&root, &[routine("a")]).unwrap();
        routines::save_logs_raw(&root, &[log("a", "2026-10-02", true)]).unwrap();
        let mut s = load_state(&root);
        s.linked = true;
        save_state(&root, &s).unwrap();
        routines::delete_in(&root, "a").unwrap();
        let s = load_state(&root);
        assert!(s.dirty_routines.contains_key("a"));
        assert!(s.dirty_logs.contains_key("a:2026-10-02"));
        let local = Local::load(&root).unwrap();
        let out = outgoing(&s, &local, 100);
        assert_eq!(out.body["routines"][0]["deleted"], true);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn time_compare_reads_both_precisions() {
        assert!(is_after("2026-10-05T00:00:00.500Z", "2026-10-05T00:00:00Z"));
        assert!(!is_after("2026-10-05T00:00:00Z", "2026-10-05T00:00:00.000Z"));
        assert!(is_after("2026-10-05T09:00:01+09:00", "2026-10-05T00:00:00Z"));
    }

    struct DirectExec {
        root: std::path::PathBuf,
        token: String,
    }

    impl Exec for DirectExec {
        async fn main<T: Send + 'static>(
            &self,
            f: impl FnOnce(&Path) -> T + Send + 'static,
        ) -> Result<T, String> {
            Ok(f(&self.root))
        }

        async fn token(&self) -> Result<Option<String>, String> {
            Ok(Some(self.token.clone()))
        }
    }

    /// 실제 서버로 두 기기를 흉내 낸다. 서버 계정에 시험 루틴이 남지 않게 끝에서 지운다.
    /// `BENTO_SYNC_URL=http://localhost:3000 BENTO_SYNC_TOKEN=nyt_… cargo test --lib real_server -- --ignored --nocapture`
    #[tokio::test]
    #[ignore]
    async fn real_server_two_devices() {
        let url = std::env::var("BENTO_SYNC_URL").expect("BENTO_SYNC_URL");
        let token = std::env::var("BENTO_SYNC_TOKEN").expect("BENTO_SYNC_TOKEN");
        let a = DirectExec { root: temp_root("dev-a"), token: token.clone() };
        let b = DirectExec { root: temp_root("dev-b"), token };
        for e in [&a, &b] {
            let s = SyncState { enabled: true, server_url: url.clone(), ..Default::default() };
            save_state(&e.root, &s).unwrap();
        }
        let pause = || tokio::time::sleep(Duration::from_millis(15));
        let rid = format!("t{}", &uuid::Uuid::new_v4().simple().to_string()[..12]);
        let day = "2026-10-02";

        // A: 연결 전부터 있던 루틴과 기록 → 처음 연결이 올린다
        routines::save_routines(&a.root, &[routine(&rid)]).unwrap();
        routines::save_logs(&a.root, &[log(&rid, day, true)]).unwrap();
        let (ra, _) = round(&a, true).await.unwrap().unwrap();
        println!("A first link: {ra:?}");
        assert!(ra.pushed >= 2, "{ra:?}");
        assert!(load_state(&a.root).first_link_backup.is_some());
        assert_eq!(load_state(&a.root).pending(), 0);

        // B: 처음 연결 → 받는다
        let (rb, changed) = round(&b, true).await.unwrap().unwrap();
        println!("B first link: {rb:?}");
        assert!(changed);
        let lb = Local::load(&b.root).unwrap();
        assert!(lb.routines.iter().any(|r| r.id == rid));
        assert!(lb.logs.iter().any(|l| l.routine_id == rid && l.date == day && l.done));

        // B 에서 체크 해제 → A 로
        pause().await;
        let logs: Vec<RoutineLog> = lb.logs.iter().filter(|l| l.routine_id != rid).cloned().collect();
        routines::save_logs(&b.root, &logs).unwrap();
        round(&b, false).await.unwrap().unwrap();
        round(&a, false).await.unwrap().unwrap();
        assert!(!Local::load(&a.root).unwrap().logs.iter().any(|l| l.routine_id == rid));

        // A 에서 타이머 → B 로, 멈춤 → B 로
        pause().await;
        let t = RoutineTimer { routine_id: rid.clone(), date: day.into(), started_at: "2026-10-02T01:00:00Z".into() };
        routines::save_timer(&a.root, Some(&t)).unwrap();
        round(&a, false).await.unwrap().unwrap();
        round(&b, false).await.unwrap().unwrap();
        assert_eq!(Local::load(&b.root).unwrap().timer.map(|t| t.routine_id), Some(rid.clone()));
        pause().await;
        routines::save_timer(&a.root, None).unwrap();
        round(&a, false).await.unwrap().unwrap();
        round(&b, false).await.unwrap().unwrap();
        assert!(Local::load(&b.root).unwrap().timer.is_none());

        // 양쪽에서 이름을 고침 — 나중에 고친 B 가 이긴다 (A 가 먼저 올렸어도)
        pause().await;
        let mut ra_ = routine(&rid);
        ra_.title = "A 가 고침".into();
        routines::save_routines(&a.root, &[ra_]).unwrap();
        pause().await;
        let mut rb_ = routine(&rid);
        rb_.title = "B 가 고침".into();
        routines::save_routines(&b.root, &[rb_]).unwrap();
        round(&a, false).await.unwrap().unwrap();
        let (rb2, _) = round(&b, false).await.unwrap().unwrap();
        round(&a, false).await.unwrap().unwrap();
        println!("B rename round: {rb2:?}");
        for e in [&a, &b] {
            let l = Local::load(&e.root).unwrap();
            assert_eq!(l.routines.iter().find(|r| r.id == rid).map(|r| r.title.as_str()), Some("B 가 고침"));
        }

        // 반대 순서: B 가 먼저 고치고 A 가 나중에 고쳤는데 B 가 먼저 올림 → A 가 올릴 때 A 가 이긴다
        pause().await;
        let mut x = routine(&rid);
        x.title = "B 먼저".into();
        routines::save_routines(&b.root, &[x]).unwrap();
        pause().await;
        let mut y = routine(&rid);
        y.title = "A 나중".into();
        routines::save_routines(&a.root, &[y]).unwrap();
        round(&b, false).await.unwrap().unwrap();
        round(&a, false).await.unwrap().unwrap();
        round(&b, false).await.unwrap().unwrap();
        for e in [&a, &b] {
            let l = Local::load(&e.root).unwrap();
            assert_eq!(l.routines.iter().find(|r| r.id == rid).map(|r| r.title.as_str()), Some("A 나중"));
        }

        // A 에서 삭제 → B 에서도 루틴·기록이 사라진다
        pause().await;
        routines::save_logs(&a.root, &[log(&rid, "2026-10-03", true)]).unwrap();
        round(&a, false).await.unwrap().unwrap();
        round(&b, false).await.unwrap().unwrap();
        assert!(Local::load(&b.root).unwrap().logs.iter().any(|l| l.routine_id == rid));
        pause().await;
        routines::delete_in(&a.root, &rid).unwrap();
        round(&a, false).await.unwrap().unwrap();
        round(&b, false).await.unwrap().unwrap();
        let lb = Local::load(&b.root).unwrap();
        assert!(lb.routines.iter().all(|r| r.id != rid));
        assert!(lb.logs.iter().all(|l| l.routine_id != rid));
        assert_eq!(load_state(&a.root).pending(), 0);
        assert_eq!(load_state(&b.root).pending(), 0);

        // 꺼져 있으면 폴러 바퀴는 건너뛴다
        let mut s = load_state(&a.root);
        s.enabled = false;
        save_state(&a.root, &s).unwrap();
        assert!(round(&a, false).await.unwrap().is_none());

        let _ = fs::remove_dir_all(&a.root);
        let _ = fs::remove_dir_all(&b.root);
    }

    #[test]
    fn decodes_server_response() {
        let raw = r#"{"routines":[{"id":"r1","title":"독서","color":"violet","slot":"evening","schedule":{"freq":"weekly","weekdays":[1,3]},"goalMin":null,"startDate":"2026-10-01","archivedAt":null,"pauses":[],"order":2,"createdAt":"2026-10-01T00:00:00.000Z","deleted":false,"updatedAt":"2026-10-02T00:00:00.000Z","rev":5}],"logs":[{"id":"r1:2026-10-02","routineId":"r1","date":"2026-10-02","done":true,"doneAt":"2026-10-02T03:00:00.000Z","secs":600,"sessions":[{"start":"2026-10-02T02:50:00.000Z","end":"2026-10-02T03:00:00.000Z","secs":600}],"deleted":false,"updatedAt":"2026-10-02T03:00:00.000Z","rev":6}],"timer":{"routineId":null,"date":null,"startedAt":null,"updatedAt":"2026-10-02T03:00:00.000Z","rev":7},"cursor":7,"more":false}"#;
        let ch: Changes = serde_json::from_str(raw).unwrap();
        let r = ch.routines[0].routine().unwrap();
        assert_eq!(r.schedule.weekdays, vec![1, 3]);
        assert_eq!(r.slot, RoutineSlot::Evening);
        assert_eq!(ch.logs[0].log().secs, 600);
        assert!(ch.timer.unwrap().routine_id.is_none());
    }
}
