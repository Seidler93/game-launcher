import { invoke } from "@tauri-apps/api";
import { dirname } from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/api/fs";
import type { EmulatorDef, Game } from "../types";

function dequote(s: string) {
  return s.replace(/^"+|"+$/g, "");
}

export async function launchSteam(appId: string) {
  // unchanged if you're using shell.open elsewhere
  window.location.href = `steam://rungameid/${appId}`;
}

export async function launchRom(
  game: Game,
  emu: EmulatorDef,
  osKey: "win" | "mac" | "linux"
) {
  const osCfg = emu[osKey];
  if (!osCfg) throw new Error(`No emulator config for ${osKey}`);
  if (!game.romPath) throw new Error("Missing ROM path");

  const exe = dequote(osCfg.exe);
  const rom = dequote(game.romPath);

  const args = osCfg.args.map((a) => a.replace("${ROM}", rom));
  const cwd = await dirname(exe);

  // sanity checks (optional but helpful)
  if (!(await exists(exe))) throw new Error(`Emulator not found: ${exe}`);
  if (!(await exists(rom))) throw new Error(`ROM not found: ${rom}`);

  // 🔎 log the exact command we’re running
  console.log("[launchRom] exe:", exe, "args:", args, "cwd:", cwd);

  try {
    await invoke("launch_process", { spec: { exe, args, cwd } });
  } catch (e: any) {
    console.error("[launchRom] invoke error:", e);
    throw e;
  }
}
