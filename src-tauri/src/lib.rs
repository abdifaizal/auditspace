#[tauri::command]
fn save_file_to_disk(filename: String, base64_data: String) -> Result<String, String> {
  use base64::{engine::general_purpose, Engine as _};

  let clean = if let Some(idx) = base64_data.find(',') {
    &base64_data[idx + 1..]
  } else {
    &base64_data
  };

  let bytes = general_purpose::STANDARD
    .decode(clean.trim())
    .map_err(|e| format!("Base64 decode error: {}", e))?;

  // Prompt native Windows Save File Dialog
  let dialog = rfd::FileDialog::new().set_file_name(&filename);

  if let Some(target) = dialog.save_file() {
    std::fs::write(&target, bytes)
      .map_err(|e| format!("Gagal menulis file: {}", e))?;
    Ok(target.to_string_lossy().to_string())
  } else {
    Ok("cancelled".to_string())
  }
}

#[tauri::command]
fn open_in_browser(url: String) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    std::process::Command::new("cmd")
      .args(["/c", "start", "", &url])
      .creation_flags(CREATE_NO_WINDOW)
      .spawn()
      .map_err(|e| format!("Gagal membuka browser: {}", e))?;
    return Ok(());
  }

  #[cfg(not(target_os = "windows"))]
  {
    let cmd = if cfg!(target_os = "macos") { "open" } else { "xdg-open" };
    std::process::Command::new(cmd)
      .arg(&url)
      .spawn()
      .map_err(|e| format!("Gagal membuka browser: {}", e))?;
    return Ok(());
  }
}

#[tauri::command]
fn download_and_install_update(url: String, filename: String) -> Result<(), String> {
  let mut temp_path = std::env::temp_dir();
  let safe_name = if filename.is_empty() {
    "AuditSpace_Setup_Update.exe".to_string()
  } else {
    filename
  };
  temp_path.push(&safe_name);
  let dest_str = temp_path.to_string_lossy().to_string();

  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    const DETACHED_PROCESS: u32 = 0x00000008;

    // 1. Try downloading via curl.exe directly with robust retry and connect timeout
    let curl_res = std::process::Command::new("curl.exe")
      .args([
        "-f",
        "-L",
        "-s",
        "-S",
        "--retry", "5",
        "--retry-delay", "2",
        "--connect-timeout", "30",
        "-o", &dest_str,
        &url,
      ])
      .creation_flags(CREATE_NO_WINDOW)
      .output();

    let mut download_ok = false;
    let mut last_error = String::new();

    match curl_res {
      Ok(out) if out.status.success() => {
        download_ok = true;
      }
      Ok(out) => {
        last_error = String::from_utf8_lossy(&out.stderr).to_string();
      }
      Err(e) => {
        last_error = e.to_string();
      }
    }

    // 2. Fallback to PowerShell if curl failed
    if !download_ok {
      let ps_script = format!(
        "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('{}', '{}')",
        url, dest_str
      );
      let ps_res = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &ps_script])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      match ps_res {
        Ok(out) if out.status.success() => {
          download_ok = true;
        }
        Ok(out) => {
          let ps_err = String::from_utf8_lossy(&out.stderr).to_string();
          last_error = format!("curl: {} | powershell: {}", last_error.trim(), ps_err.trim());
        }
        Err(e) => {
          last_error = format!("curl: {} | powershell error: {}", last_error.trim(), e);
        }
      }
    }

    if !download_ok {
      return Err(format!("Gagal mengunduh berkas installer: {}", last_error.trim()));
    }

    // Launch downloaded installer directly in detached mode
    std::process::Command::new(&dest_str)
      .creation_flags(DETACHED_PROCESS)
      .spawn()
      .map_err(|e| format!("Gagal menjalankan berkas installer: {}", e))?;

    std::process::exit(0);
  }

  #[cfg(not(target_os = "windows"))]
  {
    Ok(())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![save_file_to_disk, open_in_browser, download_and_install_update])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
