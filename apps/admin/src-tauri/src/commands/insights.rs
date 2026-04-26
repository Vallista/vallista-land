use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use walkdir::WalkDir;

use crate::repo::AppState;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DocRef {
    pub id: String,
    pub title: String,
    pub path: String,
    pub state: String,
    pub updated_at: String,
    pub tags: Vec<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DocWithDegree {
    pub id: String,
    pub title: String,
    pub path: String,
    pub state: String,
    pub updated_at: String,
    pub tags: Vec<String>,
    pub in_count: u32,
    pub out_count: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StateCounts {
    pub seed: u32,
    pub sprout: u32,
    pub draft: u32,
    pub published: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TagCount {
    pub tag: String,
    pub count: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Insights {
    pub total: u32,
    pub state_counts: StateCounts,
    pub orphans: Vec<DocRef>,
    pub stale_seeds: Vec<DocRef>,
    pub tag_counts: Vec<TagCount>,
    pub hubs: Vec<DocWithDegree>,
    pub recent_updates: Vec<DocRef>,
}

struct DocRecord {
    id: String,
    title: String,
    path: String,
    state: String,
    updated_at: String,
    updated_unix: i64,
    tags: Vec<String>,
    slug: Option<String>,
    filename_stem: String,
    body: String,
}

#[tauri::command]
pub fn compute_insights(state: State<'_, AppState>) -> Result<Insights, String> {
    let root = &state.vault_root;
    let collections = ["contents/articles", "contents/notes"];

    let mut docs: Vec<DocRecord> = Vec::new();
    for sub in collections {
        let dir = root.join(sub);
        if !dir.is_dir() {
            continue;
        }
        for entry in WalkDir::new(&dir).into_iter().filter_map(|e| e.ok()) {
            if !entry.file_type().is_file() {
                continue;
            }
            let path = entry.path();
            if path.extension().map_or(true, |e| e != "md") {
                continue;
            }
            let raw = match fs::read_to_string(path) {
                Ok(s) => s,
                Err(_) => continue,
            };
            if let Some(rec) = parse_record(&raw, path, root, sub) {
                docs.push(rec);
            }
        }
    }

    let mut by_slug: HashMap<String, usize> = HashMap::new();
    let mut by_filename: HashMap<String, usize> = HashMap::new();
    for (idx, d) in docs.iter().enumerate() {
        if let Some(s) = &d.slug {
            by_slug.insert(s.clone(), idx);
        }
        by_filename.insert(d.filename_stem.clone(), idx);
    }

    let n = docs.len();
    let mut out_links: Vec<u32> = vec![0; n];
    let mut in_links: Vec<u32> = vec![0; n];

    for (idx, d) in docs.iter().enumerate() {
        for raw_target in extract_link_targets(&d.body) {
            if !is_internal(&raw_target) {
                continue;
            }
            if let Some(target_idx) = match_doc(&raw_target, &by_slug, &by_filename) {
                if target_idx == idx {
                    continue;
                }
                out_links[idx] += 1;
                in_links[target_idx] += 1;
            }
        }
    }

    let now = now_secs();
    let stale_threshold_days: i64 = 30;

    let mut state_counts = StateCounts {
        seed: 0,
        sprout: 0,
        draft: 0,
        published: 0,
    };
    let mut orphans: Vec<DocRef> = Vec::new();
    let mut stale_seeds: Vec<DocRef> = Vec::new();
    let mut hubs_pool: Vec<DocWithDegree> = Vec::new();
    let mut tag_freq: HashMap<String, u32> = HashMap::new();

    for (idx, d) in docs.iter().enumerate() {
        match d.state.as_str() {
            "seed" => state_counts.seed += 1,
            "sprout" => state_counts.sprout += 1,
            "draft" => state_counts.draft += 1,
            "published" => state_counts.published += 1,
            _ => state_counts.sprout += 1,
        }

        for t in &d.tags {
            *tag_freq.entry(t.clone()).or_insert(0) += 1;
        }

        let dref = doc_ref(d);

        if in_links[idx] == 0 && out_links[idx] == 0 {
            orphans.push(dref.clone());
        }

        if d.state == "seed" {
            let age_days = if d.updated_unix > 0 {
                (now - d.updated_unix).max(0) / 86_400
            } else {
                0
            };
            if age_days >= stale_threshold_days {
                stale_seeds.push(dref.clone());
            }
        }

        hubs_pool.push(DocWithDegree {
            id: dref.id,
            title: dref.title,
            path: dref.path,
            state: dref.state,
            updated_at: dref.updated_at,
            tags: dref.tags,
            in_count: in_links[idx],
            out_count: out_links[idx],
        });
    }

    orphans.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    stale_seeds.sort_by(|a, b| a.updated_at.cmp(&b.updated_at));

    let mut tag_counts: Vec<TagCount> = tag_freq
        .into_iter()
        .map(|(tag, count)| TagCount { tag, count })
        .collect();
    tag_counts.sort_by(|a, b| b.count.cmp(&a.count).then_with(|| a.tag.cmp(&b.tag)));
    tag_counts.truncate(20);

    hubs_pool.sort_by(|a, b| (b.in_count + b.out_count).cmp(&(a.in_count + a.out_count)));
    let hubs: Vec<DocWithDegree> = hubs_pool
        .iter()
        .filter(|d| d.in_count + d.out_count > 0)
        .take(10)
        .cloned()
        .collect();

    let mut recent_updates: Vec<DocRef> = docs.iter().map(doc_ref).collect();
    recent_updates.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    recent_updates.truncate(10);

    Ok(Insights {
        total: n as u32,
        state_counts,
        orphans: orphans.into_iter().take(20).collect(),
        stale_seeds: stale_seeds.into_iter().take(20).collect(),
        tag_counts,
        hubs,
        recent_updates,
    })
}

fn doc_ref(d: &DocRecord) -> DocRef {
    DocRef {
        id: d.id.clone(),
        title: d.title.clone(),
        path: d.path.clone(),
        state: d.state.clone(),
        updated_at: d.updated_at.clone(),
        tags: d.tags.clone(),
    }
}

fn parse_record(raw: &str, path: &Path, root: &Path, sub: &str) -> Option<DocRecord> {
    let metadata = fs::metadata(path).ok();
    let updated_unix = metadata
        .as_ref()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    let updated_at = if updated_unix > 0 {
        iso_from_unix(updated_unix)
    } else {
        String::new()
    };

    let parsed = gray_matter::Matter::<gray_matter::engine::YAML>::new().parse(raw);
    let body = parsed.content.clone();

    let default_state = if sub.ends_with("articles") {
        "published"
    } else {
        "sprout"
    };

    let mut id = String::new();
    let mut state_val = default_state.to_string();
    let mut title = String::new();
    let mut slug: Option<String> = None;
    let mut tags: Vec<String> = Vec::new();

    if let Some(data) = parsed.data {
        if let Ok(map) = data.as_hashmap() {
            if let Some(v) = map.get("id").and_then(|p| p.as_string().ok()) {
                id = v;
            }
            if let Some(v) = map.get("state").and_then(|p| p.as_string().ok()) {
                state_val = v;
            }
            if let Some(v) = map.get("title").and_then(|p| p.as_string().ok()) {
                title = v;
            }
            if let Some(v) = map.get("slug").and_then(|p| p.as_string().ok()) {
                slug = Some(v);
            }
            if let Some(v) = map.get("tags") {
                if let Ok(arr) = v.as_vec() {
                    tags = arr.into_iter().filter_map(|p| p.as_string().ok()).collect();
                } else if let Ok(s) = v.as_string() {
                    tags = vec![s];
                }
            }
        }
    }

    if title.is_empty() {
        if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
            title = if stem == "index" {
                path.parent()
                    .and_then(|p| p.file_name())
                    .and_then(|s| s.to_str())
                    .unwrap_or("")
                    .to_string()
            } else {
                stem.to_string()
            };
        }
    }

    let filename_stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.to_string())
        .unwrap_or_default();

    let rel = path.strip_prefix(root).unwrap_or(path);
    Some(DocRecord {
        id: if id.is_empty() {
            filename_stem.clone()
        } else {
            id
        },
        title,
        path: rel.to_string_lossy().replace('\\', "/"),
        state: state_val,
        updated_at,
        updated_unix,
        tags,
        slug,
        filename_stem,
        body,
    })
}

fn extract_link_targets(body: &str) -> Vec<String> {
    let bytes = body.as_bytes();
    let mut out: Vec<String> = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b']' && i + 1 < bytes.len() && bytes[i + 1] == b'(' {
            let mut j = i + 2;
            let mut depth: i32 = 1;
            while j < bytes.len() {
                let c = bytes[j];
                if c == b'(' {
                    depth += 1;
                } else if c == b')' {
                    depth -= 1;
                    if depth == 0 {
                        break;
                    }
                }
                j += 1;
            }
            if j < bytes.len() {
                let target = &body[i + 2..j];
                let trimmed = target.split_whitespace().next().unwrap_or("");
                if !trimmed.is_empty() {
                    out.push(trimmed.to_string());
                }
                i = j + 1;
                continue;
            }
        }
        i += 1;
    }
    out
}

fn is_internal(target: &str) -> bool {
    if target.is_empty() {
        return false;
    }
    let lower = target.to_ascii_lowercase();
    if lower.starts_with("http://") || lower.starts_with("https://") {
        return false;
    }
    if lower.starts_with("mailto:") || lower.starts_with("tel:") {
        return false;
    }
    if lower.contains("://") {
        return false;
    }
    if lower.starts_with('#') {
        return false;
    }
    if lower.starts_with("data:") {
        return false;
    }
    true
}

fn match_doc(
    target: &str,
    by_slug: &HashMap<String, usize>,
    by_filename: &HashMap<String, usize>,
) -> Option<usize> {
    let clean = target
        .split('#')
        .next()
        .unwrap_or("")
        .split('?')
        .next()
        .unwrap_or("")
        .trim();
    if clean.is_empty() {
        return None;
    }
    if let Some(idx) = by_slug.get(clean) {
        return Some(*idx);
    }
    let stem_owned: String = clean
        .rsplit('/')
        .next()
        .unwrap_or("")
        .trim_end_matches(".md")
        .trim_end_matches(".mdx")
        .to_string();
    if !stem_owned.is_empty() {
        if let Some(idx) = by_filename.get(&stem_owned) {
            return Some(*idx);
        }
        if let Some(idx) = by_slug.get(&stem_owned) {
            return Some(*idx);
        }
    }
    None
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
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
