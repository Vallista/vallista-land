use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use tauri::State;

use crate::commands::tasks;
use crate::repo::{ensure_inside, load_config, save_config, AppState};

const FILE_NAME: &str = "task_folders.json";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TaskFolder {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub parent_id: Option<String>,
    pub created_at: String,
}

fn file_path(root: &Path) -> std::path::PathBuf {
    root.join(FILE_NAME)
}

pub fn load_all(root: &Path) -> Result<Vec<TaskFolder>, String> {
    let p = file_path(root);
    if !p.is_file() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<TaskFolder>>(&raw).map_err(|e| e.to_string())
}

pub fn save_all(root: &Path, folders: &[TaskFolder]) -> Result<(), String> {
    let p = file_path(root);
    let safe = ensure_inside(root, &p)?;
    let json = serde_json::to_string_pretty(folders).map_err(|e| e.to_string())?;
    fs::write(&safe, json).map_err(|e| e.to_string())
}

fn normalize_name(name: &str) -> Result<String, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("폴더 이름을 입력하세요".to_string());
    }
    Ok(trimmed.to_string())
}

fn has_sibling_named(
    folders: &[TaskFolder],
    parent_id: Option<&str>,
    name: &str,
    except_id: Option<&str>,
) -> bool {
    folders.iter().any(|f| {
        f.parent_id.as_deref() == parent_id
            && f.name == name
            && except_id.map_or(true, |id| f.id != id)
    })
}

#[tauri::command]
pub fn list_task_folders(state: State<'_, AppState>) -> Result<Vec<TaskFolder>, String> {
    load_all(&state.data_root)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskFolderInput {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub parent_id: Option<String>,
}

#[tauri::command]
pub fn add_task_folder(
    input: TaskFolderInput,
    state: State<'_, AppState>,
) -> Result<TaskFolder, String> {
    let mut all = load_all(&state.data_root)?;
    let name = normalize_name(&input.name)?;
    if all.iter().any(|f| f.id == input.id) {
        return Err(format!("folder already exists: {}", input.id));
    }
    let parent_id = input.parent_id.filter(|s| !s.is_empty());
    if let Some(pid) = parent_id.as_deref() {
        if !all.iter().any(|f| f.id == pid) {
            return Err(format!("parent folder not found: {}", pid));
        }
    }
    if has_sibling_named(&all, parent_id.as_deref(), &name, None) {
        return Err(format!("이미 있는 폴더예요: {}", name));
    }
    let folder = TaskFolder {
        id: input.id,
        name,
        parent_id,
        created_at: tasks::now_iso(),
    };
    all.push(folder.clone());
    save_all(&state.data_root, &all)?;
    Ok(folder)
}

#[tauri::command]
pub fn rename_task_folder(
    id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<TaskFolder, String> {
    let mut all = load_all(&state.data_root)?;
    let name = normalize_name(&name)?;
    let idx = all
        .iter()
        .position(|f| f.id == id)
        .ok_or_else(|| format!("folder not found: {}", id))?;
    let parent_id = all[idx].parent_id.clone();
    if has_sibling_named(&all, parent_id.as_deref(), &name, Some(&id)) {
        return Err(format!("이미 있는 폴더예요: {}", name));
    }
    all[idx].name = name;
    let updated = all[idx].clone();
    save_all(&state.data_root, &all)?;
    Ok(updated)
}

#[tauri::command]
pub fn delete_task_folder(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let root = &state.data_root;
    let mut all = load_all(root)?;
    let idx = all
        .iter()
        .position(|f| f.id == id)
        .ok_or_else(|| format!("folder not found: {}", id))?;
    let parent_id = all.remove(idx).parent_id;
    for f in all.iter_mut() {
        if f.parent_id.as_deref() == Some(id.as_str()) {
            f.parent_id = parent_id.clone();
        }
    }
    let mut all_tasks = tasks::load_all(root)?;
    let mut tasks_changed = false;
    for t in all_tasks.iter_mut() {
        if t.folder_id.as_deref() == Some(id.as_str()) {
            t.folder_id = parent_id.clone();
            tasks_changed = true;
        }
    }
    save_all(root, &all)?;
    if tasks_changed {
        tasks::save_all(root, &all_tasks)?;
    }
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskGroupMigration {
    pub skipped: bool,
    pub migrated: usize,
    pub removed_folders: usize,
    pub backup_path: Option<String>,
}

/// `"팀명/ 제목"` 형태의 제목을 (접두어 경로, 남은 제목)으로 나눈다. URL이거나 접두어가 없으면 None.
pub fn split_folder_title(title: &str) -> Option<(Vec<String>, String)> {
    if title.contains("://") {
        return None;
    }
    let mut segments: Vec<String> = title
        .split('/')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect();
    if segments.len() < 2 {
        return None;
    }
    let leaf = segments.pop()?;
    Some((segments, leaf))
}

fn group_name(path: &[String]) -> String {
    path.join(" / ")
}

/// 1차 폴더 마이그레이션이 돌지 않은 기기: 제목 접두어를 `group`으로 옮기고 제목에서 뗀다.
fn apply_title_groups(all_tasks: &mut [tasks::Task]) -> usize {
    let mut migrated = 0usize;
    for t in all_tasks.iter_mut() {
        if let Some((path, leaf)) = split_folder_title(&t.title) {
            t.group = Some(group_name(&path));
            t.title = leaf;
            migrated += 1;
        }
    }
    migrated
}

fn folder_path(folders: &[TaskFolder], id: &str) -> Option<String> {
    let mut names: Vec<String> = Vec::new();
    let mut cursor = Some(id.to_string());
    while let Some(cur) = cursor {
        if names.len() > 64 {
            return None;
        }
        let f = folders.iter().find(|f| f.id == cur)?;
        names.push(f.name.clone());
        cursor = f.parent_id.clone();
    }
    names.reverse();
    Some(group_name(&names))
}

/// 1차 마이그레이션이 제목 접두어로 만든 폴더를 `group` 속성으로 되돌린다.
/// 1차 직전 백업(tasks.json)의 접두어 집합과 경로명이 같은 폴더만 1차 생성분으로 보고,
/// 그 사이 폴더가 지워져 접두어를 잃은 할 일은 백업의 id 매핑으로 복구한다.
fn apply_folder_groups(
    all_tasks: &mut [tasks::Task],
    folders: &mut Vec<TaskFolder>,
    backup: &[tasks::Task],
) -> (usize, usize) {
    let mut backup_groups: HashMap<String, String> = HashMap::new();
    let mut legacy_names: HashSet<String> = HashSet::new();
    for t in backup {
        if let Some((path, _)) = split_folder_title(&t.title) {
            for depth in 1..=path.len() {
                legacy_names.insert(group_name(&path[..depth]));
            }
            backup_groups.insert(t.id.clone(), group_name(&path));
        }
    }
    if legacy_names.is_empty() {
        return (0, 0);
    }

    let legacy: HashMap<String, String> = {
        let all: &[TaskFolder] = folders;
        all.iter()
            .filter_map(|f| folder_path(all, &f.id).map(|p| (f.id.clone(), p)))
            .filter(|(_, p)| legacy_names.contains(p))
            .collect()
    };

    let mut migrated = 0usize;
    for t in all_tasks.iter_mut() {
        let from_folder = t
            .folder_id
            .as_deref()
            .and_then(|id| legacy.get(id).cloned());
        if let Some(g) = from_folder {
            t.group = Some(g);
            t.folder_id = None;
            migrated += 1;
        } else if t.group.is_none() {
            if let Some(g) = backup_groups.get(&t.id) {
                t.group = Some(g.clone());
                migrated += 1;
            }
        }
    }

    let before = folders.len();
    folders.retain(|f| !legacy.contains_key(&f.id));
    for f in folders.iter_mut() {
        if f.parent_id
            .as_deref()
            .map_or(false, |p| legacy.contains_key(p))
        {
            f.parent_id = None;
        }
    }
    (migrated, before - folders.len())
}

fn backup_timestamp() -> String {
    tasks::now_iso().replace([':', '-'], "")
}

fn latest_title_backup(root: &Path) -> Option<std::path::PathBuf> {
    let dir = root.join("backups");
    let mut names: Vec<String> = fs::read_dir(&dir)
        .ok()?
        .filter_map(|e| e.ok())
        .filter_map(|e| e.file_name().to_str().map(|s| s.to_string()))
        .filter(|n| n.starts_with("tasks-"))
        .collect();
    names.sort();
    let p = dir.join(names.pop()?).join("tasks.json");
    if p.is_file() {
        Some(p)
    } else {
        None
    }
}

fn load_backup_tasks(path: &Path) -> Result<Vec<tasks::Task>, String> {
    let raw = fs::read_to_string(path).map_err(|e| format!("백업 읽기 실패: {}", e))?;
    serde_json::from_str::<Vec<tasks::Task>>(&raw).map_err(|e| format!("백업 파싱 실패: {}", e))
}

#[tauri::command]
pub fn migrate_task_groups(state: State<'_, AppState>) -> Result<TaskGroupMigration, String> {
    run_task_group_migration(&state.data_root)
}

fn run_task_group_migration(root: &Path) -> Result<TaskGroupMigration, String> {
    let mut cfg = load_config(root);
    if cfg.task_groups_migrated {
        return Ok(TaskGroupMigration {
            skipped: true,
            migrated: 0,
            removed_folders: 0,
            backup_path: None,
        });
    }

    let mut all_tasks = tasks::load_all(root)?;
    let mut folders = load_all(root)?;

    let (migrated, removed_folders) = if cfg.task_folders_migrated {
        match latest_title_backup(root) {
            Some(p) => {
                let backup = load_backup_tasks(&p)?;
                apply_folder_groups(&mut all_tasks, &mut folders, &backup)
            }
            None => (0, 0),
        }
    } else {
        (apply_title_groups(&mut all_tasks), 0)
    };

    let mut backup_path = None;
    if migrated > 0 || removed_folders > 0 {
        let backup_dir = root
            .join("backups")
            .join(format!("task-groups-{}", backup_timestamp()));
        let backup_dir = ensure_inside(root, &backup_dir)?;
        fs::create_dir_all(&backup_dir).map_err(|e| format!("백업 폴더 생성 실패: {}", e))?;
        let tasks_backup = backup_dir.join("tasks.json");
        fs::copy(tasks::tasks_path(root), &tasks_backup)
            .map_err(|e| format!("tasks.json 백업 실패: {}", e))?;
        let folders_src = file_path(root);
        if folders_src.is_file() {
            fs::copy(&folders_src, backup_dir.join(FILE_NAME))
                .map_err(|e| format!("task_folders.json 백업 실패: {}", e))?;
        }
        save_all(root, &folders)?;
        tasks::save_all(root, &all_tasks)?;
        backup_path = Some(tasks_backup.to_string_lossy().to_string());
    }

    cfg.task_folders_migrated = true;
    cfg.task_groups_migrated = true;
    save_config(root, &cfg)?;

    Ok(TaskGroupMigration {
        skipped: false,
        migrated,
        removed_folders,
        backup_path,
    })
}

#[cfg(test)]
mod tests {
    use super::{apply_folder_groups, apply_title_groups, split_folder_title, TaskFolder};
    use crate::commands::tasks::Task;

    fn owned(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    fn task(id: &str, title: &str, folder_id: Option<&str>) -> Task {
        Task {
            id: id.to_string(),
            title: title.to_string(),
            done: false,
            due: None,
            doc_id: None,
            est_min: None,
            start_at: None,
            tags: Vec::new(),
            notes: None,
            subtasks: Vec::new(),
            color: None,
            kind: None,
            folder_id: folder_id.map(|s| s.to_string()),
            group: None,
            created_at: "2026-10-12T00:00:00Z".to_string(),
            done_at: None,
            repeat_id: None,
            repeat_key: None,
        }
    }

    fn folder(id: &str, name: &str, parent_id: Option<&str>) -> TaskFolder {
        TaskFolder {
            id: id.to_string(),
            name: name.to_string(),
            parent_id: parent_id.map(|s| s.to_string()),
            created_at: "2026-10-12T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn splits_single_prefix() {
        assert_eq!(
            split_folder_title("테크부문/ 위클리 작성"),
            Some((owned(&["테크부문"]), "위클리 작성".to_string()))
        );
    }

    #[test]
    fn splits_nested_prefix() {
        assert_eq!(
            split_folder_title("A/B/ C"),
            Some((owned(&["A", "B"]), "C".to_string()))
        );
    }

    #[test]
    fn keeps_plain_title() {
        assert_eq!(split_folder_title("위클리 작성"), None);
    }

    #[test]
    fn ignores_trailing_slash_only() {
        assert_eq!(split_folder_title("A/"), None);
        assert_eq!(split_folder_title("/A"), None);
    }

    #[test]
    fn ignores_urls() {
        assert_eq!(split_folder_title("https://example.com/path 읽기"), None);
    }

    #[test]
    fn drops_blank_segments() {
        assert_eq!(
            split_folder_title(" / A / / B "),
            Some((owned(&["A"]), "B".to_string()))
        );
    }

    #[test]
    fn title_groups_strip_prefix_into_group() {
        let mut all = vec![
            task("a", "테크부문/ 위클리 작성", None),
            task("b", "메일 답장", None),
        ];
        assert_eq!(apply_title_groups(&mut all), 1);
        assert_eq!(all[0].title, "위클리 작성");
        assert_eq!(all[0].group.as_deref(), Some("테크부문"));
        assert_eq!(all[1].title, "메일 답장");
        assert_eq!(all[1].group, None);
    }

    #[test]
    fn folder_groups_convert_and_remove_legacy_folders() {
        let backup = vec![task("a", "테크부문/ 위클리 작성", None)];
        let mut folders = vec![folder("tf1", "테크부문", None)];
        let mut all = vec![
            task("a", "위클리 작성", Some("tf1")),
            task("b", "오늘 만든 할 일", Some("tf1")),
        ];
        assert_eq!(apply_folder_groups(&mut all, &mut folders, &backup), (2, 1));
        assert!(folders.is_empty());
        for t in &all {
            assert_eq!(t.group.as_deref(), Some("테크부문"));
            assert_eq!(t.folder_id, None);
        }
    }

    #[test]
    fn folder_groups_recover_tasks_whose_folder_was_deleted() {
        let backup = vec![task("a", "카나나/ 리뷰", None)];
        let mut folders: Vec<TaskFolder> = Vec::new();
        let mut all = vec![task("a", "리뷰", None)];
        assert_eq!(apply_folder_groups(&mut all, &mut folders, &backup), (1, 0));
        assert_eq!(all[0].group.as_deref(), Some("카나나"));
    }

    #[test]
    fn folder_groups_keep_user_folders() {
        let backup = vec![task("a", "테크부문/ 위클리 작성", None)];
        let mut folders = vec![
            folder("tf1", "테크부문", None),
            folder("tf2", "10월 출시", None),
        ];
        let mut all = vec![
            task("a", "위클리 작성", Some("tf1")),
            task("c", "릴리즈 노트", Some("tf2")),
        ];
        assert_eq!(apply_folder_groups(&mut all, &mut folders, &backup), (1, 1));
        assert_eq!(folders.len(), 1);
        assert_eq!(folders[0].id, "tf2");
        assert_eq!(all[1].folder_id.as_deref(), Some("tf2"));
        assert_eq!(all[1].group, None);
    }

    #[test]
    fn folder_groups_handle_nested_prefix() {
        let backup = vec![task("a", "A/B/ C", None)];
        let mut folders = vec![folder("f1", "A", None), folder("f2", "B", Some("f1"))];
        let mut all = vec![task("a", "C", Some("f2"))];
        assert_eq!(apply_folder_groups(&mut all, &mut folders, &backup), (1, 2));
        assert_eq!(all[0].group.as_deref(), Some("A / B"));
        assert!(folders.is_empty());
    }

    #[test]
    fn folder_groups_noop_without_backup_prefixes() {
        let backup = vec![task("a", "접두어 없음", None)];
        let mut folders = vec![folder("tf1", "테크부문", None)];
        let mut all = vec![task("a", "위클리 작성", Some("tf1"))];
        assert_eq!(apply_folder_groups(&mut all, &mut folders, &backup), (0, 0));
        assert_eq!(folders.len(), 1);
    }
}
