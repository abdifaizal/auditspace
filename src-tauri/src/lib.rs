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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![save_file_to_disk])
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
