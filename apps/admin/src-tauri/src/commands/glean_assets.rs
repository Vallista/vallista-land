//! 줍기 본문의 `[img]data:...` 인라인 이미지를 `glean/assets/<id>/<n>.<ext>` 파일로 분리한다.
//!
//! 저장 시(`glean::write_item`) 분리하고 본문에는 `[img]asset:<n>.<ext>` 참조만 남긴다. WebView는
//! `glean://localhost/<id>%2F<n>.<ext>` 커스텀 프로토콜로 파일을 직접 읽으므로 `read_glean` 페이로드에
//! 이미지가 실리지 않는다. 기존 항목은 설정 › 데이터에서 백업 후 일괄 변환한다.

use base64::Engine;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::http::{header, Response, StatusCode, Uri};
use tauri::{AppHandle, Manager, State};

use crate::commands::docs::AssetData;
use crate::commands::glean::{self, GleanItem, IMG_MARKER};
use crate::repo::{ensure_inside, AppState};

pub const ASSET_REF: &str = "asset:";
const DATA_URI_PREFIX: &str = "data:";
const ASSETS_DIR: &str = "assets";
const BACKUP_PREFIX: &str = "glean-images";

fn assets_dir(root: &Path, id: &str) -> Result<PathBuf, String> {
    glean::validate_id(id)?;
    let dir = glean::glean_dir(root).join(ASSETS_DIR).join(id);
    ensure_inside(root, &dir)
}

/// `<n>.<ext>` 꼴만 허용한다(경로 구성요소 하나, 숫자 stem, 영숫자 확장자).
fn is_asset_name(name: &str) -> bool {
    let Some((stem, ext)) = name.split_once('.') else {
        return false;
    };
    !stem.is_empty()
        && stem.bytes().all(|b| b.is_ascii_digit())
        && !ext.is_empty()
        && ext.len() <= 8
        && ext
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit())
}

fn asset_file(root: &Path, id: &str, name: &str) -> Result<PathBuf, String> {
    if !is_asset_name(name) {
        return Err(format!("invalid asset name: {}", name));
    }
    Ok(assets_dir(root, id)?.join(name))
}

fn ext_for_mime(mime: &str) -> &'static str {
    match mime {
        "image/jpeg" | "image/jpg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
        "image/gif" => "gif",
        "image/avif" => "avif",
        "image/heic" => "heic",
        "image/heif" => "heif",
        "image/bmp" => "bmp",
        "image/svg+xml" => "svg",
        _ => "bin",
    }
}

fn mime_for_ext(ext: &str) -> &'static str {
    match ext {
        "jpg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "avif" => "image/avif",
        "heic" => "image/heic",
        "heif" => "image/heif",
        "bmp" => "image/bmp",
        "svg" => "image/svg+xml",
        _ => "application/octet-stream",
    }
}

/// `data:<mime>;base64,<payload>` → (확장자, 바이트). 형식이 다르거나 디코드에 실패하면 None(줄을 그대로 둔다).
fn decode_data_uri(value: &str) -> Option<(&'static str, Vec<u8>)> {
    let rest = value.strip_prefix(DATA_URI_PREFIX)?;
    let (meta, payload) = rest.split_once(',')?;
    let mut parts = meta.split(';');
    let mime = parts.next().unwrap_or("").trim().to_ascii_lowercase();
    if !parts.any(|p| p.trim().eq_ignore_ascii_case("base64")) {
        return None;
    }
    let payload = payload.trim();
    let engines = [
        base64::engine::general_purpose::STANDARD,
        base64::engine::general_purpose::STANDARD_NO_PAD,
        base64::engine::general_purpose::URL_SAFE,
        base64::engine::general_purpose::URL_SAFE_NO_PAD,
    ];
    let bytes = engines.iter().find_map(|e| e.decode(payload).ok())?;
    if bytes.is_empty() {
        return None;
    }
    Some((ext_for_mime(&mime), bytes))
}

fn asset_stem(value: &str) -> Option<usize> {
    let name = value.strip_prefix(ASSET_REF)?;
    if !is_asset_name(name) {
        return None;
    }
    name.split_once('.')?.0.parse().ok()
}

pub fn has_inline_images(body: &str) -> bool {
    body.split('\n').any(|l| {
        l.starts_with(IMG_MARKER) && l[IMG_MARKER.len()..].trim().starts_with(DATA_URI_PREFIX)
    })
}

/// 본문의 `[img]data:` 줄을 파일로 내보내고 `[img]asset:<n>.<ext>`로 바꾼다. 내보낸 장 수를 돌려준다.
/// 이미 분리된 참조가 섞여 있으면 그 다음 번호부터 쓴다. 디코드에 실패한 줄은 그대로 둔다.
pub fn externalize(root: &Path, item: &mut GleanItem) -> Result<usize, String> {
    if !has_inline_images(&item.body) {
        return Ok(0);
    }
    let dir = assets_dir(root, &item.id)?;
    let mut next = item
        .body
        .split('\n')
        .filter(|l| l.starts_with(IMG_MARKER))
        .filter_map(|l| asset_stem(l[IMG_MARKER.len()..].trim()))
        .max()
        .map_or(0, |n| n + 1);
    let mut written = 0usize;
    let mut lines: Vec<String> = Vec::new();
    for line in item.body.split('\n') {
        if line.starts_with(IMG_MARKER) {
            if let Some((ext, bytes)) = decode_data_uri(line[IMG_MARKER.len()..].trim()) {
                if written == 0 {
                    fs::create_dir_all(&dir).map_err(|e| format!("assets dir: {}", e))?;
                }
                let name = format!("{}.{}", next, ext);
                fs::write(dir.join(&name), bytes).map_err(|e| format!("write {}: {}", name, e))?;
                lines.push(format!("{}{}{}", IMG_MARKER, ASSET_REF, name));
                next += 1;
                written += 1;
                continue;
            }
        }
        lines.push(line.to_string());
    }
    item.body = lines.join("\n");
    Ok(written)
}

/// 항목 삭제 시 분리된 이미지 폴더도 지운다. 없으면 조용히 넘어간다.
pub fn remove_assets(root: &Path, id: &str) -> Result<(), String> {
    let dir = assets_dir(root, id)?;
    match fs::remove_dir_all(&dir) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(format!("remove assets: {}", e)),
    }
}

fn ext_of(name: &str) -> &str {
    name.rsplit_once('.').map_or("", |(_, ext)| ext)
}

/// 승격(노트로 복사)처럼 바이트가 필요한 곳에서 쓴다. 상세 화면 렌더링은 프로토콜로 직접 읽는다.
#[tauri::command(async)]
pub fn read_glean_asset(
    id: String,
    file: String,
    state: State<'_, AppState>,
) -> Result<AssetData, String> {
    let path = asset_file(&state.data_root, &id, &file)?;
    let bytes = fs::read(&path).map_err(|e| format!("read {}: {}", file, e))?;
    Ok(AssetData {
        mime: mime_for_ext(ext_of(&file)).to_string(),
        base64: base64::engine::general_purpose::STANDARD.encode(bytes),
    })
}

/// `glean://localhost/<id>%2F<n>.<ext>` 요청 경로를 파일로 푼다. 경로 이탈·이상한 이름은 None.
fn locate(root: &Path, request_path: &str) -> Option<(PathBuf, &'static str)> {
    let decoded = percent_encoding::percent_decode_str(request_path)
        .decode_utf8()
        .ok()?;
    let (id, name) = decoded.trim_start_matches('/').split_once('/')?;
    let path = asset_file(root, id, name).ok()?;
    if !path.is_file() {
        return None;
    }
    Some((path, mime_for_ext(ext_of(name))))
}

fn empty_response(status: StatusCode) -> Response<Vec<u8>> {
    let mut res = Response::new(Vec::new());
    *res.status_mut() = status;
    res
}

/// 커스텀 프로토콜 핸들러 본체. 워커 스레드에서 돌며 파일을 그대로 돌려준다.
pub fn serve(app: &AppHandle, uri: &Uri) -> Response<Vec<u8>> {
    let root = app.state::<AppState>().data_root.clone();
    let Some((path, mime)) = locate(&root, uri.path()) else {
        return empty_response(StatusCode::NOT_FOUND);
    };
    let Ok(bytes) = fs::read(&path) else {
        return empty_response(StatusCode::NOT_FOUND);
    };
    let mut res = Response::new(bytes);
    let headers = res.headers_mut();
    if let Ok(v) = header::HeaderValue::from_str(mime) {
        headers.insert(header::CONTENT_TYPE, v);
    }
    headers.insert(
        header::CACHE_CONTROL,
        header::HeaderValue::from_static("private, max-age=86400"),
    );
    res
}

#[derive(Serialize, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct InlineImageStats {
    pub items: usize,
    pub markers: usize,
    pub bytes: u64,
}

/// 아직 base64로 들어 있는 항목만 센다. 인덱스에서 이미지가 있는 항목만 골라 원문을 훑으므로 JSON 파싱은 없다.
fn inline_candidates(root: &Path) -> Result<(Vec<String>, InlineImageStats), String> {
    let needle = format!("{}{}", IMG_MARKER, DATA_URI_PREFIX);
    let mut ids = Vec::new();
    let mut stats = InlineImageStats {
        items: 0,
        markers: 0,
        bytes: 0,
    };
    for summary in glean::list_summaries(root)? {
        if !summary.has_image {
            continue;
        }
        let path = glean::item_path(root, &summary.id)?;
        let raw = match fs::read_to_string(&path) {
            Ok(r) => r,
            Err(_) => continue,
        };
        let markers = raw.matches(needle.as_str()).count();
        if markers == 0 {
            continue;
        }
        stats.items += 1;
        stats.markers += markers;
        stats.bytes += raw.len() as u64;
        ids.push(summary.id);
    }
    Ok((ids, stats))
}

#[tauri::command(async)]
pub fn glean_image_stats(state: State<'_, AppState>) -> Result<InlineImageStats, String> {
    inline_candidates(&state.data_root).map(|(_, stats)| stats)
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ExternalizeReport {
    pub items: usize,
    pub markers: usize,
    pub bytes_before: u64,
    pub bytes_after: u64,
    pub failed: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backup_path: Option<String>,
}

#[cfg(target_os = "macos")]
fn free_bytes(path: &Path) -> Option<u64> {
    use std::ffi::CString;
    use std::os::unix::ffi::OsStrExt;
    let c = CString::new(path.as_os_str().as_bytes()).ok()?;
    let mut st: libc::statvfs = unsafe { std::mem::zeroed() };
    let rc = unsafe { libc::statvfs(c.as_ptr(), &mut st) };
    if rc != 0 {
        return None;
    }
    Some(st.f_bavail as u64 * st.f_frsize as u64)
}

#[cfg(not(target_os = "macos"))]
fn free_bytes(_path: &Path) -> Option<u64> {
    None
}

fn backup_timestamp() -> String {
    glean::now_iso().replace(['-', ':'], "")
}

/// 기존 항목 일괄 변환. 항목마다 원본 JSON을 `backups/glean-images-<ts>/`에 먼저 복사하고(크기 대조),
/// 그다음 `write_item`으로 분리 저장한다(임시 파일 + rename). 중간에 멈춰도 아직 안 바꾼 항목은 원본 그대로이고
/// 바꾼 항목은 백업이 있다. 다시 돌리면 남은 항목만 이어서 처리한다.
pub fn externalize_all(root: &Path) -> Result<ExternalizeReport, String> {
    let (ids, stats) = inline_candidates(root)?;
    let mut report = ExternalizeReport {
        items: 0,
        markers: 0,
        bytes_before: stats.bytes,
        bytes_after: 0,
        failed: 0,
        backup_path: None,
    };
    if ids.is_empty() {
        return Ok(report);
    }
    if let Some(free) = free_bytes(root) {
        let needed = stats
            .bytes
            .saturating_mul(2)
            .saturating_add(100 * 1024 * 1024);
        if free < needed {
            return Err(format!(
                "디스크 여유 공간이 부족합니다 (필요 {}MB, 남음 {}MB)",
                needed / 1_048_576,
                free / 1_048_576
            ));
        }
    }
    let backup_dir = root
        .join("backups")
        .join(format!("{}-{}", BACKUP_PREFIX, backup_timestamp()));
    fs::create_dir_all(&backup_dir).map_err(|e| format!("backup dir: {}", e))?;
    report.backup_path = Some(backup_dir.to_string_lossy().into_owned());

    for id in ids {
        match externalize_one(root, &backup_dir, &id) {
            Ok((markers, after)) => {
                report.items += 1;
                report.markers += markers;
                report.bytes_after += after;
            }
            Err(e) => {
                eprintln!("glean: image externalize failed for {}: {}", id, e);
                report.failed += 1;
            }
        }
    }
    Ok(report)
}

fn externalize_one(root: &Path, backup_dir: &Path, id: &str) -> Result<(usize, u64), String> {
    let path = glean::item_path(root, id)?;
    let original_len = fs::metadata(&path).map_err(|e| e.to_string())?.len();
    let backup = backup_dir.join(format!("{}.json", id));
    let copied = fs::copy(&path, &backup).map_err(|e| format!("backup copy: {}", e))?;
    if copied != original_len {
        return Err(format!(
            "backup size mismatch ({} vs {})",
            copied, original_len
        ));
    }
    let mut item = glean::read_item(root, id)?;
    let before = item.body.clone();
    let markers = externalize(root, &mut item)?;
    if markers == 0 {
        item.body = before;
        return Ok((0, original_len));
    }
    glean::write_item(root, &mut item)?;
    let after = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
    Ok((markers, after))
}

#[tauri::command(async)]
pub fn externalize_glean_images(state: State<'_, AppState>) -> Result<ExternalizeReport, String> {
    externalize_all(&state.data_root)
}

#[cfg(test)]
mod tests {
    use super::{decode_data_uri, ext_for_mime, has_inline_images, is_asset_name, locate};
    use std::fs;

    #[test]
    fn asset_names_are_numeric_stem_plus_short_extension() {
        assert!(is_asset_name("0.jpg"));
        assert!(is_asset_name("12.webp"));
        assert!(!is_asset_name("a.jpg"));
        assert!(!is_asset_name("0"));
        assert!(!is_asset_name("0.JPG"));
        assert!(!is_asset_name("../0.jpg"));
        assert!(!is_asset_name("0.jpg/x"));
        assert!(!is_asset_name("0.toolongext1"));
    }

    #[test]
    fn data_uri_decoding_maps_mime_to_extension_and_rejects_garbage() {
        let (ext, bytes) = decode_data_uri("data:image/png;base64,AQID").expect("png");
        assert_eq!(ext, "png");
        assert_eq!(bytes, vec![1, 2, 3]);
        let (ext, _) = decode_data_uri("data:image/jpeg;base64,AQID").expect("jpeg");
        assert_eq!(ext, "jpg");
        assert!(decode_data_uri("data:image/png;base64,").is_none());
        assert!(decode_data_uri("data:image/png,plain").is_none());
        assert!(decode_data_uri("https://example.com/a.png").is_none());
        assert!(decode_data_uri("data:image/png;base64,!!!").is_none());
        assert_eq!(ext_for_mime("video/mp4"), "bin");
        assert!(has_inline_images("x\n[img] data:image/png;base64,AQID"));
        assert!(!has_inline_images("x\n[img]asset:0.png"));
    }

    /// `BENTO_GLEAN_DRY_ROOT=<실데이터 사본 root> cargo test -- --ignored real_root_externalize --nocapture`
    /// 사본에서만 돌릴 것: 그 root 안에 backups/와 glean/assets/를 만들고 JSON을 다시 쓴다.
    #[test]
    #[ignore]
    fn real_root_externalize_timing() {
        let root = match std::env::var("BENTO_GLEAN_DRY_ROOT") {
            Ok(r) => std::path::PathBuf::from(r),
            Err(_) => return,
        };
        let started = std::time::Instant::now();
        let report = super::externalize_all(&root).expect("externalize");
        eprintln!("first run: {:?} in {:?}", report, started.elapsed());
        let started = std::time::Instant::now();
        let again = super::externalize_all(&root).expect("again");
        eprintln!("second run: {:?} in {:?}", again, started.elapsed());
        assert_eq!(again.items, 0);
        assert!(again.backup_path.is_none());
    }

    #[test]
    fn locate_decodes_the_request_path_and_refuses_escapes() {
        let root =
            std::env::temp_dir().join(format!("bento_glean_assets_{}", uuid::Uuid::new_v4()));
        let dir = root.join("glean").join("assets").join("item_1");
        fs::create_dir_all(&dir).expect("dir");
        fs::write(dir.join("0.png"), b"png").expect("file");
        fs::write(root.join("secret.txt"), b"no").expect("secret");

        let (path, mime) = locate(&root, "/item_1%2F0.png").expect("found");
        assert!(path.ends_with("0.png"));
        assert_eq!(mime, "image/png");
        assert!(locate(&root, "/item_1/0.png").is_some());
        assert!(locate(&root, "/item_1%2F1.png").is_none());
        assert!(locate(&root, "/..%2Fsecret.txt").is_none());
        assert!(locate(&root, "/item_1%2F..%2F..%2F..%2Fsecret.txt").is_none());
        assert!(locate(&root, "/item_1").is_none());

        let _ = fs::remove_dir_all(&root);
    }
}
