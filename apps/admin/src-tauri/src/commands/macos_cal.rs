use serde::{Deserialize, Serialize};
use tauri::State;

use crate::commands::blocks::{
    upsert_sourced_blocks, BlockSource, IcalImportResult, SourcedBlockInput,
};
use crate::repo::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MacosCalStatus {
    pub available: bool,
    pub authorization: String,
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct ImportedEvent {
    pub title: String,
    pub date: String,
    pub start: String,
    pub end: String,
    pub calendar: Option<String>,
    pub location: Option<String>,
    pub notes: Option<String>,
    pub uid: Option<String>,
    pub all_day: bool,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub recurring: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MacosCalImportReport {
    pub total: usize,
    pub added: usize,
    pub updated: usize,
    pub skipped: usize,
    pub events: Vec<ImportedEvent>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MacosCalImportArgs {
    #[serde(default)]
    pub calendars: Vec<String>,
    #[serde(default)]
    pub days_back: u32,
    #[serde(default)]
    pub days_forward: u32,
    #[serde(default)]
    pub dry_run: bool,
}

// === platform impls ===

#[cfg(not(target_os = "macos"))]
mod platform {
    use super::{ImportedEvent, MacosCalImportArgs, MacosCalStatus};

    pub fn status() -> MacosCalStatus {
        MacosCalStatus {
            available: false,
            authorization: "unsupported".into(),
            message: "macOS에서만 사용 가능합니다.".into(),
        }
    }
    pub fn request_access() -> Result<MacosCalStatus, String> {
        Err("macOS에서만 사용 가능합니다.".into())
    }
    pub fn list_calendars() -> Result<Vec<String>, String> {
        Err("macOS에서만 사용 가능합니다.".into())
    }
    pub fn fetch_events(_args: &MacosCalImportArgs) -> Result<Vec<ImportedEvent>, String> {
        Err("macOS에서만 사용 가능합니다.".into())
    }
}

#[cfg(target_os = "macos")]
mod platform {
    use super::{ImportedEvent, MacosCalImportArgs, MacosCalStatus};
    use std::sync::{Arc, Condvar, Mutex};
    use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

    use block2::RcBlock;
    use objc2::rc::Retained;
    use objc2::runtime::Bool;
    use objc2::Message;
    use objc2_event_kit::{
        EKAuthorizationStatus, EKCalendar, EKEntityType, EKEvent, EKEventStore,
    };
    use objc2_foundation::{NSArray, NSDate, NSError, NSPredicate};

    fn auth_status() -> EKAuthorizationStatus {
        unsafe { EKEventStore::authorizationStatusForEntityType(EKEntityType::Event) }
    }

    fn auth_string(s: EKAuthorizationStatus) -> &'static str {
        match s.0 {
            0 => "notDetermined",
            1 => "restricted",
            2 => "denied",
            3 => "writeOnly",
            4 => "fullAccess",
            _ => "unknown",
        }
    }

    fn has_read_access(s: EKAuthorizationStatus) -> bool {
        s.0 == 3 || s.0 == 4
    }

    pub fn status() -> MacosCalStatus {
        let s = auth_status();
        let available = has_read_access(s);
        let auth = auth_string(s).to_string();
        let message = if available {
            "캘린더 권한이 부여돼 있습니다.".into()
        } else if s.0 == 0 {
            "권한 요청 전입니다. '권한 요청' 버튼을 눌러주세요.".into()
        } else {
            "캘린더 권한이 거부됐습니다. 시스템 설정 → 개인정보 보호 및 보안 → 캘린더에서 Bento를 켜주세요.".into()
        };
        MacosCalStatus {
            available,
            authorization: auth,
            message,
        }
    }

    pub fn request_access() -> Result<MacosCalStatus, String> {
        let store = unsafe { EKEventStore::new() };
        let pair = Arc::new((Mutex::new(None::<bool>), Condvar::new()));
        let pair_clone = Arc::clone(&pair);

        let block = RcBlock::new(move |granted: Bool, _err: *mut NSError| {
            let (lock, cvar) = &*pair_clone;
            let mut guard = lock.lock().unwrap();
            *guard = Some(granted.as_bool());
            cvar.notify_all();
        });

        unsafe {
            let block_ptr: *mut block2::Block<dyn Fn(Bool, *mut NSError)> =
                &*block as *const _ as *mut _;
            store.requestFullAccessToEventsWithCompletion(block_ptr);
        }

        let (lock, cvar) = &*pair;
        let mut guard = lock.lock().unwrap();
        let timeout = Duration::from_secs(30);
        let start = Instant::now();
        while guard.is_none() {
            let elapsed = start.elapsed();
            if elapsed >= timeout {
                return Err("권한 요청이 시간 초과됐습니다.".into());
            }
            let remaining = timeout - elapsed;
            let (g, _) = cvar.wait_timeout(guard, remaining).unwrap();
            guard = g;
        }
        Ok(status())
    }

    pub fn list_calendars() -> Result<Vec<String>, String> {
        let s = auth_status();
        if !has_read_access(s) {
            return Err("캘린더 권한이 없습니다. 권한 요청 후 다시 시도하세요.".into());
        }
        let store = unsafe { EKEventStore::new() };
        let cals: Retained<NSArray<EKCalendar>> =
            unsafe { store.calendarsForEntityType(EKEntityType::Event) };
        let mut names: Vec<String> = Vec::new();
        for cal in cals.iter() {
            let title = unsafe { cal.title() };
            names.push(title.to_string());
        }
        Ok(names)
    }

    pub fn fetch_events(args: &MacosCalImportArgs) -> Result<Vec<ImportedEvent>, String> {
        let s = auth_status();
        if !has_read_access(s) {
            return Err("캘린더 권한이 없습니다. 권한 요청 후 다시 시도하세요.".into());
        }
        let store = unsafe { EKEventStore::new() };

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);
        let today = now / 86_400 * 86_400;
        let days_back = args.days_back.min(365) as i64;
        let days_fwd = args.days_forward.min(365) as i64;
        let from_secs = (today - days_back * 86_400) as f64;
        let to_secs = (today + (days_fwd + 1) * 86_400) as f64;
        let start_date = NSDate::dateWithTimeIntervalSince1970(from_secs);
        let end_date = NSDate::dateWithTimeIntervalSince1970(to_secs);

        let all_cals: Retained<NSArray<EKCalendar>> =
            unsafe { store.calendarsForEntityType(EKEntityType::Event) };
        let filter: Option<Retained<NSArray<EKCalendar>>> = if args.calendars.is_empty() {
            None
        } else {
            let mut keep: Vec<Retained<EKCalendar>> = Vec::new();
            for cal in all_cals.iter() {
                let title = unsafe { cal.title() };
                let title_str = title.to_string();
                if args.calendars.iter().any(|c| c == &title_str) {
                    keep.push(Message::retain(&*cal));
                }
            }
            if keep.is_empty() {
                None
            } else {
                let refs: Vec<&EKCalendar> = keep.iter().map(|c| &**c).collect();
                Some(NSArray::from_slice(&refs))
            }
        };

        let predicate: Retained<NSPredicate> = unsafe {
            store.predicateForEventsWithStartDate_endDate_calendars(
                &start_date,
                &end_date,
                filter.as_deref(),
            )
        };

        let events: Retained<NSArray<EKEvent>> =
            unsafe { store.eventsMatchingPredicate(&predicate) };

        let mut out: Vec<ImportedEvent> = Vec::with_capacity(events.len());
        for ev in events.iter() {
            let title = unsafe { ev.title() }.to_string();
            let location = unsafe { ev.location() }
                .map(|s| s.to_string())
                .filter(|s| !s.trim().is_empty());
            let notes = unsafe { ev.notes() }
                .map(|s| s.to_string())
                .filter(|s| !s.trim().is_empty());
            let calendar =
                unsafe { ev.calendar() }.map(|c| unsafe { c.title() }.to_string());
            let uid = unsafe { ev.calendarItemExternalIdentifier() }
                .map(|s| s.to_string())
                .or_else(|| unsafe { ev.eventIdentifier() }.map(|s| s.to_string()));
            let url = unsafe { ev.URL() }
                .and_then(|u| u.absoluteString())
                .map(|s| s.to_string())
                .filter(|s| !s.trim().is_empty());
            let recurring = unsafe { ev.hasRecurrenceRules() };
            let all_day = unsafe { ev.isAllDay() };
            let start_d = unsafe { ev.startDate() };
            let end_d = unsafe { ev.endDate() };
            let start_secs = start_d.timeIntervalSince1970();
            let end_secs = end_d.timeIntervalSince1970();

            let (date_s, start_s, end_s) = format_event_times(start_secs, end_secs, all_day);

            out.push(ImportedEvent {
                title,
                date: date_s,
                start: start_s,
                end: end_s,
                location,
                notes,
                calendar,
                uid,
                all_day,
                url,
                recurring,
            });
        }
        Ok(out)
    }

    fn format_event_times(start_s: f64, end_s: f64, all_day: bool) -> (String, String, String) {
        let date = ymd_local(start_s as i64);
        if all_day {
            return (date, "00:00".into(), "00:00".into());
        }
        let start_hm = hm_local(start_s as i64);
        let end_hm = hm_local(end_s as i64);
        (date, start_hm, end_hm)
    }

    fn ymd_local(unix: i64) -> String {
        use chrono::{Local, TimeZone};
        match Local.timestamp_opt(unix, 0) {
            chrono::LocalResult::Single(dt) => dt.format("%Y-%m-%d").to_string(),
            _ => "1970-01-01".into(),
        }
    }
    fn hm_local(unix: i64) -> String {
        use chrono::{Local, TimeZone};
        match Local.timestamp_opt(unix, 0) {
            chrono::LocalResult::Single(dt) => dt.format("%H:%M").to_string(),
            _ => "00:00".into(),
        }
    }
}

// === tauri commands ===

#[tauri::command]
pub fn macos_cal_status() -> MacosCalStatus {
    platform::status()
}

#[tauri::command]
pub fn macos_cal_request_access() -> Result<MacosCalStatus, String> {
    platform::request_access()
}

#[tauri::command]
pub fn macos_cal_list() -> Result<Vec<String>, String> {
    platform::list_calendars()
}

#[tauri::command]
pub fn macos_cal_open_privacy() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let new_url = "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Calendars";
        let old_url = "x-apple.systempreferences:com.apple.preference.security?Privacy_Calendars";
        if let Ok(status) = Command::new("open").arg(new_url).status() {
            if status.success() {
                return Ok(());
            }
        }
        Command::new("open")
            .arg(old_url)
            .spawn()
            .map_err(|e| format!("시스템 설정을 열 수 없습니다: {e}"))?;
        return Ok(());
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("macOS에서만 사용 가능합니다.".to_string())
    }
}

#[tauri::command]
pub fn macos_cal_import(
    args: MacosCalImportArgs,
    state: State<'_, AppState>,
) -> Result<MacosCalImportReport, String> {
    let events = platform::fetch_events(&args)?;

    if args.dry_run {
        return Ok(MacosCalImportReport {
            total: events.len(),
            added: 0,
            updated: 0,
            skipped: 0,
            events,
        });
    }

    let records: Vec<SourcedBlockInput> = events
        .iter()
        .map(|ev| SourcedBlockInput {
            external_id: build_external_id(ev),
            date: ev.date.clone(),
            start: ev.start.clone(),
            end: ev.end.clone(),
            end_date: None,
            title: if ev.title.trim().is_empty() {
                "(제목 없음)".to_string()
            } else {
                ev.title.clone()
            },
            kind: "meet".to_string(),
            source: BlockSource::Applecal,
            attendees: Vec::new(),
            notes: ev.notes.clone(),
            location: ev.location.clone(),
            calendar_name: ev.calendar.clone(),
            url: ev.url.clone(),
            recurring: ev.recurring,
        })
        .collect();

    let report: IcalImportResult =
        upsert_sourced_blocks(&state.data_root, &records, "applecal")?;

    Ok(MacosCalImportReport {
        total: events.len(),
        added: report.added,
        updated: report.updated,
        skipped: report.skipped,
        events,
    })
}

fn build_external_id(ev: &ImportedEvent) -> String {
    if let Some(uid) = ev.uid.as_ref().filter(|s| !s.trim().is_empty()) {
        return format!("applecal:{}", uid);
    }
    let cal = ev.calendar.clone().unwrap_or_default();
    format!(
        "applecal:{}:{}:{}:{}:{}",
        cal, ev.date, ev.start, ev.end, ev.title
    )
}

