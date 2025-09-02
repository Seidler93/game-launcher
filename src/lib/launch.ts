import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import type { EmulatorDef, Game } from "../types";

export async function launchSteam(appId: string) {
  // Steam URI
  // On macOS this opens Steam app; on Windows it uses the URL protocol
  window.location.href = `steam://rungameid/${appId}`;
}

export async function launchRom(game: Game, emu: EmulatorDef, osKey: "win" | "mac" | "linux") {
  const osCfg = emu[osKey];
  if (!osCfg) throw new Error(`No emulator config for ${osKey}`);
  if (!game.romPath) throw new Error("Missing ROM path");
  const args = osCfg.args.map((a) => a.replace("${ROM}", game.romPath!));
  await invoke("launch_process", { spec: { exe: osCfg.exe, args, cwd: null } });
}
