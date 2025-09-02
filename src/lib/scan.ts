import { readDir, type FileEntry, exists } from "@tauri-apps/api/fs";
import { join } from "@tauri-apps/api/path";

const EXTENSIONS: Record<string, string[]> = {
  ps2: [".iso", ".chd", ".cue", ".bin"],
  ps3: [], // handled specially
  gba: [".gba", ".zip"],
  custom: [".exe"],
};

type WalkResult = { files: string[]; dirs: string[] };

async function collectAll(dir: string): Promise<WalkResult> {
  const root = await readDir(dir, { recursive: true });
  const files: string[] = [];
  const dirs: string[] = [];

  function visit(list: FileEntry[]) {
    for (const e of list) {
      if (e.children && e.children.length) {
        // directory
        if (e.path) dirs.push(e.path);
        visit(e.children);
      } else {
        // file
        if (e.path) files.push(e.path);
      }
    }
  }
  visit(root);
  return { files, dirs };
}

function isPs3Eboot(p: string) {
  // .../PS3_GAME/USRDIR/EBOOT.BIN
  return /[\\/]+PS3_GAME[\\/]+USRDIR[\\/]+EBOOT\.BIN$/i.test(p);
}

function ps3TitleFromPath(p: string) {
  const withoutTail = p.replace(/[\\/]+PS3_GAME[\\/]+USRDIR[\\/]+EBOOT\.BIN$/i, "");
  const parts = withoutTail.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || "PS3 Game";
}

export function titleFromFilename(path: string) {
  if (isPs3Eboot(path)) return ps3TitleFromPath(path);
  const base = path.split(/[\\/]/).pop() || path;
  console.log('hi')

  console.log(
    base
    .replace(/\.(iso|chd|bin|cue|pkg|gba|zip|exe)$/i, "")
    .replace(/[._]/g, " ")
    .trim()
  );

  return base
    .replace(/\.(iso|chd|bin|cue|pkg|gba|zip|exe)$/i, "")
    .replace(/[._]/g, " ")
    .trim();
}

export async function findRomsInFolder(
  folder: string,
  platform: string
): Promise<string[]> {
  const matches: string[] = [];
  const { files, dirs } = await collectAll(folder);

  if (platform === "ps3") {
    // 1) Direct EBOOT.BIN hits
    for (const f of files) if (isPs3Eboot(f)) matches.push(f);

    // 2) Fallback: if we only saw dirs like .../PS3_GAME or .../USRDIR, derive EBOOT path
    if (matches.length === 0) {
      for (const d of dirs) {
        if (/[\\/]+USRDIR$/i.test(d)) {
          const eboot = await join(d, "EBOOT.BIN");
          if (await exists(eboot)) matches.push(eboot);
        } else if (/[\\/]+PS3_GAME$/i.test(d)) {
          const eboot = await join(d, "USRDIR", "EBOOT.BIN");
          if (await exists(eboot)) matches.push(eboot);
        }
      }
    }

    console.log("[scan:ps3]", {
      folder,
      filesSeen: files.length,
      dirsSeen: dirs.length,
      found: matches.length,
      sample: matches.slice(0, 3),
    });
    return matches;
  }

  // Non-PS3 platforms (extension-based)
  const exts = EXTENSIONS[platform] || [];
  for (const f of files) {
    if (exts.some((ext) => f.toLowerCase().endsWith(ext))) matches.push(f);
  }
  console.log("[scan:other]", { platform, folder, filesSeen: files.length, found: matches.length });
  return matches;
}
