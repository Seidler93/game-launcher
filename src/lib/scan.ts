import { readDir, type FileEntry } from "@tauri-apps/api/fs";

const EXTENSIONS: Record<string, string[]> = {
  ps2: [".iso", ".chd", ".cue", ".bin"],
  ps3: [".pkg", ".iso"],
  gba: [".gba", ".zip"],
  custom: [".exe"],
};

async function* walkEntries(entries: FileEntry[]): AsyncGenerator<string> {
  for (const e of entries) {
    if (e.children && e.children.length) {
      yield* walkEntries(e.children);
    } else if (e.path) {
      // Leaf = file
      yield e.path;
    }
  }
}

export async function* walk(dir: string): AsyncGenerator<string> {
  // One recursive read, then traverse the tree
  const entries = await readDir(dir, { recursive: true });
  yield* walkEntries(entries);
}

export function titleFromFilename(path: string) {
  const base = path.split(/[\\/]/).pop() || path;
  return base
    .replace(/\.(iso|chd|bin|cue|pkg|gba|zip|exe)$/i, "")
    .replace(/[._]/g, " ")
    .trim();
}

export async function findRomsInFolder(folder: string, platform: string): Promise<string[]> {
  const exts = EXTENSIONS[platform] || [];
  const matches: string[] = [];
  for await (const file of walk(folder)) {
    if (exts.some((ext) => file.toLowerCase().endsWith(ext))) {
      matches.push(file);
    }
  }
  return matches;
}
