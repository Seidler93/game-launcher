import YAML from "yaml";
import type { EmulatorMap, EmulatorDef } from "../types";

export async function loadEmulatorsFromYaml(): Promise<EmulatorMap> {
  const text = (await import("../data/emulators.yaml?raw")).default as string;
  return YAML.parse(text) as EmulatorMap;
}

export function resolveEmu(def: EmulatorDef, os: "win" | "mac" | "linux") {
  return def[os];
}
