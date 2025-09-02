use std::process::{Command, Stdio};
use tauri::command;


#[derive(serde::Deserialize)]
pub struct LaunchSpec {
  pub exe: String,
  pub args: Vec<String>,
  pub cwd: Option<String>,
}


#[command]
pub fn launch_process(spec: LaunchSpec) -> Result<(), String> {
  let mut cmd = Command::new(&spec.exe);

  if let Some(cwd) = &spec.cwd { cmd.current_dir(cwd); }

  cmd.args(&spec.args)
    .stdin(Stdio::null())
    .stdout(Stdio::null())
    .stderr(Stdio::null())
    .spawn()
    .map_err(|e| format!("Failed to launch: {} — {}", &spec.exe, e))?;
  Ok(())
}


#[command]
pub fn is_process_running(_pid: u32) -> Result<bool, String> {
  // Minimal stub for now (we’ll add PID tracking later if desired)
  Ok(false)
}