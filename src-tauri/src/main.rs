#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod process;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      process::launch_process,
      process::is_process_running
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
