// src/lib/emulators.ts (Tauri 1.x)
import YAML from "yaml";
import type { EmulatorMap, EmulatorDef } from "../types";

// Load the YAML at build/dev time via Vite; no fs/path APIs needed
export async function loadEmulatorsFromYaml(): Promise<EmulatorMap> {
  const text = (await import("../data/emulators.yaml?raw")).default as string;
  return YAML.parse(text) as EmulatorMap;
}

export function resolveEmu(def: EmulatorDef, os: "win" | "mac" | "linux") {
  return def[os];
}
