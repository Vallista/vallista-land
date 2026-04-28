#[cfg(target_os = "macos")]
const SERVICE: &str = "land.vallista.bento.git";

#[cfg(target_os = "macos")]
const ERR_SEC_ITEM_NOT_FOUND: i32 = -25300;

#[cfg(target_os = "macos")]
fn account_for(remote: &str) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(remote.trim().as_bytes());
    let digest = hasher.finalize();
    digest.iter().take(8).map(|b| format!("{:02x}", b)).collect()
}

#[cfg(target_os = "macos")]
pub fn read_token(remote: &str) -> Result<Option<String>, String> {
    use security_framework::passwords::get_generic_password;
    let r = remote.trim();
    if r.is_empty() {
        return Ok(None);
    }
    let account = account_for(r);
    match get_generic_password(SERVICE, &account) {
        Ok(bytes) => {
            let s =
                String::from_utf8(bytes).map_err(|e| format!("keychain decode: {}", e))?;
            Ok(Some(s))
        }
        Err(e) => {
            if e.code() == ERR_SEC_ITEM_NOT_FOUND {
                Ok(None)
            } else {
                Err(format!("keychain get: {}", e))
            }
        }
    }
}

#[cfg(not(target_os = "macos"))]
pub fn read_token(_remote: &str) -> Result<Option<String>, String> {
    Ok(None)
}

#[cfg(target_os = "macos")]
fn write_token_inner(remote: &str, token: &str) -> Result<(), String> {
    use security_framework::passwords::set_generic_password;
    let account = account_for(remote);
    set_generic_password(SERVICE, &account, token.as_bytes())
        .map_err(|e| format!("keychain set: {}", e))
}

#[cfg(not(target_os = "macos"))]
fn write_token_inner(_remote: &str, _token: &str) -> Result<(), String> {
    Err("keychain은 macOS에서만 지원합니다".to_string())
}

#[cfg(target_os = "macos")]
fn delete_token_inner(remote: &str) -> Result<(), String> {
    use security_framework::passwords::delete_generic_password;
    let account = account_for(remote);
    match delete_generic_password(SERVICE, &account) {
        Ok(_) => Ok(()),
        Err(e) => {
            if e.code() == ERR_SEC_ITEM_NOT_FOUND {
                Ok(())
            } else {
                Err(format!("keychain delete: {}", e))
            }
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn delete_token_inner(_remote: &str) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn keychain_set_token(remote: String, token: String) -> Result<(), String> {
    let r = remote.trim();
    let t = token.trim();
    if r.is_empty() {
        return Err("git 원격 주소를 먼저 설정하세요".to_string());
    }
    if t.is_empty() {
        return Err("토큰이 비어있습니다".to_string());
    }
    write_token_inner(r, t)
}

#[tauri::command]
pub fn keychain_has_token(remote: String) -> bool {
    let r = remote.trim();
    if r.is_empty() {
        return false;
    }
    matches!(read_token(r), Ok(Some(_)))
}

#[tauri::command]
pub fn keychain_delete_token(remote: String) -> Result<(), String> {
    let r = remote.trim();
    if r.is_empty() {
        return Err("git 원격 주소가 비어있습니다".to_string());
    }
    delete_token_inner(r)
}
