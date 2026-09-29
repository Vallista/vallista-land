use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::State;

use crate::repo::AppState;

const SETTINGS_FILE: &str = "settings.json";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GlobalBinding {
    #[serde(default)]
    pub meta: bool,
    #[serde(default)]
    pub ctrl: bool,
    #[serde(default)]
    pub shift: bool,
    #[serde(default)]
    pub alt: bool,
    #[serde(default)]
    pub key: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GlobalKeybindings {
    pub global_thought: GlobalBinding,
    pub global_task: GlobalBinding,
    pub global_clipboard: GlobalBinding,
}

impl Default for GlobalKeybindings {
    fn default() -> Self {
        Self {
            global_thought: GlobalBinding {
                meta: false, ctrl: true, shift: false, alt: false, key: "n".into(),
            },
            global_task: GlobalBinding {
                meta: false, ctrl: true, shift: false, alt: false, key: "t".into(),
            },
            global_clipboard: GlobalBinding {
                meta: false, ctrl: true, shift: true, alt: false, key: "c".into(),
            },
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default)]
    pub global_keybindings: GlobalKeybindings,
}

pub fn binding_to_shortcut(b: &GlobalBinding) -> String {
    let mut parts: Vec<&str> = Vec::new();
    if b.meta  { parts.push("super"); }
    if b.ctrl  { parts.push("control"); }
    if b.alt   { parts.push("alt"); }
    if b.shift { parts.push("shift"); }
    parts.push(b.key.as_str());
    parts.join("+")
}

pub fn load_settings(data_dir: &Path) -> AppSettings {
    let p = data_dir.join(SETTINGS_FILE);
    if !p.is_file() {
        return AppSettings::default();
    }
    let raw = match fs::read_to_string(&p) {
        Ok(r) => r,
        Err(_) => return AppSettings::default(),
    };
    serde_json::from_str::<AppSettings>(&raw).unwrap_or_default()
}

fn save_settings(data_dir: &Path, settings: &AppSettings) -> Result<(), String> {
    let p = data_dir.join(SETTINGS_FILE);
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&p, json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_global_keybindings(state: State<'_, AppState>) -> Result<GlobalKeybindings, String> {
    Ok(load_settings(&state.data_root).global_keybindings)
}

#[tauri::command]
pub fn write_global_keybindings(
    keybindings: GlobalKeybindings,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut settings = load_settings(&state.data_root);
    settings.global_keybindings = keybindings;
    save_settings(&state.data_root, &settings)
}
