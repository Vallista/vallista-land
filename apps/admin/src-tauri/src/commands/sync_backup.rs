//! 냥노션 동기화를 처음 연결하기 직전의 백업.
//!
//! 첫 연결 뒤에는 서버에서 받은 것이 로컬 할 일·폴더·메모·하위 항목을 덮어쓸 수 있으므로, 그 전에
//! `backups/nyanotion-<ts>/` 로 tasks.json · task_folders.json · event_notes/ · event_subtasks/ 를 복사한다.
//! 되돌리기 = 동기화를 끄고 이 폴더의 파일들을 data root 의 같은 자리로 다시 복사 + 앱 재시작.

use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::State;

use crate::commands::tasks;
use crate::repo::{ensure_inside, AppState};

const FILES: [&str; 2] = ["tasks.json", "task_folders.json"];
const DIRS: [&str; 2] = ["event_notes", "event_subtasks"];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncBackup {
    pub path: String,
    pub files: u32,
    pub bytes: u64,
}

fn copy_checked(src: &Path, dst: &Path, report: &mut SyncBackup) -> Result<(), String> {
    let expected = fs::metadata(src)
        .map_err(|e| format!("{} 읽기 실패: {}", src.display(), e))?
        .len();
    let copied = fs::copy(src, dst).map_err(|e| format!("{} 백업 실패: {}", src.display(), e))?;
    if copied != expected {
        return Err(format!(
            "{} 백업 크기 불일치 ({} vs {})",
            src.display(),
            copied,
            expected
        ));
    }
    report.files += 1;
    report.bytes += copied;
    Ok(())
}

/// 없는 원본은 건너뛴다(아직 폴더·메모를 안 쓴 기기). 하나라도 복사에 실패하면 Err — 호출하는 쪽은 첫 연결을 멈춘다.
pub fn backup_all(root: &Path) -> Result<SyncBackup, String> {
    let stamp = tasks::now_iso().replace([':', '-'], "");
    let dir = root.join("backups").join(format!("nyanotion-{}", stamp));
    let dir = ensure_inside(root, &dir)?;
    fs::create_dir_all(&dir).map_err(|e| format!("백업 폴더 생성 실패: {}", e))?;
    let mut report = SyncBackup {
        path: dir.to_string_lossy().into_owned(),
        files: 0,
        bytes: 0,
    };
    for name in FILES {
        let src = root.join(name);
        if src.is_file() {
            copy_checked(&src, &dir.join(name), &mut report)?;
        }
    }
    for name in DIRS {
        let src = root.join(name);
        if !src.is_dir() {
            continue;
        }
        let dst = dir.join(name);
        fs::create_dir_all(&dst).map_err(|e| format!("백업 폴더 생성 실패: {}", e))?;
        for entry in fs::read_dir(&src).map_err(|e| format!("{} 읽기 실패: {}", name, e))? {
            let entry = entry.map_err(|e| format!("{} 읽기 실패: {}", name, e))?;
            let path = entry.path();
            if path.is_file() {
                copy_checked(&path, &dst.join(entry.file_name()), &mut report)?;
            }
        }
    }
    Ok(report)
}

#[tauri::command(async)]
pub fn sync_backup(state: State<'_, AppState>) -> Result<SyncBackup, String> {
    backup_all(&state.data_root)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn copies_files_and_note_dirs_and_skips_missing_sources() {
        let root = std::env::temp_dir().join(format!("bento-sync-backup-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("event_notes")).unwrap();
        fs::write(root.join("tasks.json"), "[1,2,3]").unwrap();
        fs::write(root.join("event_notes").join("n1.json"), "{}").unwrap();

        let report = backup_all(&root).unwrap();
        let dir = Path::new(&report.path);
        assert_eq!(report.files, 2);
        assert_eq!(report.bytes, 9);
        assert_eq!(fs::read_to_string(dir.join("tasks.json")).unwrap(), "[1,2,3]");
        assert!(dir.join("event_notes").join("n1.json").is_file());
        assert!(!dir.join("task_folders.json").exists());
        assert!(!dir.join("event_subtasks").exists());

        fs::remove_dir_all(&root).unwrap();
    }
}
