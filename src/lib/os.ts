import { platform as tauriPlatform } from "@tauri-apps/api/os";

const osMap: Record<string, "win" | "mac" | "linux"> = {
  windows: "win",
  darwin: "mac",
  linux: "linux",
};

export async function getOSKey(): Promise<"win" | "mac" | "linux"> {
  const p = await tauriPlatform();
  return osMap[p] ?? "linux"; // default fallback
}
