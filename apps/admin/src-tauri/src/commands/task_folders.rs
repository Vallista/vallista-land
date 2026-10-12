use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
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

fn new_id(existing: &[TaskFolder]) -> String {
    loop {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default();
        let id = format!("tf_{:x}_{:08x}", now.as_secs(), rand::random::<u32>());
        if !existing.iter().any(|f| f.id == id) {
            return id;
        }
    }
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
pub struct TaskFolderMigration {
    pub skipped: bool,
    pub migrated: usize,
    pub created_folders: usize,
    pub backup_path: Option<String>,
}

/// `"팀명/ 제목"` 형태의 제목을 (폴더 경로, 남은 제목)으로 나눈다. URL이거나 접두어가 없으면 None.
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

fn backup_timestamp() -> String {
    tasks::now_iso().replace([':', '-'], "")
}

#[tauri::command]
pub fn migrate_task_titles_to_folders(
    state: State<'_, AppState>,
) -> Result<TaskFolderMigration, String> {
    let root = &state.data_root;
    let mut cfg = load_config(root);
    if cfg.task_folders_migrated {
        return Ok(TaskFolderMigration {
            skipped: true,
            migrated: 0,
            created_folders: 0,
            backup_path: None,
        });
    }

    let mut all_tasks = tasks::load_all(root)?;
    let targets: Vec<(usize, Vec<String>, String)> = all_tasks
        .iter()
        .enumerate()
        .filter_map(|(i, t)| split_folder_title(&t.title).map(|(path, leaf)| (i, path, leaf)))
        .collect();

    if targets.is_empty() {
        cfg.task_folders_migrated = true;
        save_config(root, &cfg)?;
        return Ok(TaskFolderMigration {
            skipped: false,
            migrated: 0,
            created_folders: 0,
            backup_path: None,
        });
    }

    let backup_dir = root
        .join("backups")
        .join(format!("tasks-{}", backup_timestamp()));
    let backup_dir = ensure_inside(root, &backup_dir)?;
    fs::create_dir_all(&backup_dir).map_err(|e| format!("백업 폴더 생성 실패: {}", e))?;
    let backup_file = backup_dir.join(tasks::tasks_path(root).file_name().unwrap_or_default());
    fs::copy(tasks::tasks_path(root), &backup_file)
        .map_err(|e| format!("tasks.json 백업 실패: {}", e))?;

    let mut folders = load_all(root)?;
    let mut created_folders = 0usize;
    let migrated = targets.len();
    for (idx, path, leaf) in targets {
        let mut parent: Option<String> = None;
        for name in path {
            let found = folders
                .iter()
                .find(|f| f.parent_id == parent && f.name == name)
                .map(|f| f.id.clone());
            let id = match found {
                Some(id) => id,
                None => {
                    let id = new_id(&folders);
                    folders.push(TaskFolder {
                        id: id.clone(),
                        name,
                        parent_id: parent.clone(),
                        created_at: tasks::now_iso(),
                    });
                    created_folders += 1;
                    id
                }
            };
            parent = Some(id);
        }
        all_tasks[idx].folder_id = parent;
        all_tasks[idx].title = leaf;
    }

    save_all(root, &folders)?;
    tasks::save_all(root, &all_tasks)?;
    cfg.task_folders_migrated = true;
    save_config(root, &cfg)?;

    Ok(TaskFolderMigration {
        skipped: false,
        migrated,
        created_folders,
        backup_path: Some(backup_file.to_string_lossy().to_string()),
    })
}

#[cfg(test)]
mod tests {
    use super::split_folder_title;

    fn owned(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| s.to_string()).collect()
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
}
