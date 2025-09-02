import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";
import type { Game, EmulatorDef, Platform } from "../types";
import { loadEmulatorsFromYaml } from "../lib/emulators";
import { getOSKey } from "../lib/os";
import { findRomsInFolder, titleFromFilename } from "../lib/scan";
import { launchRom, launchSteam } from "../lib/launch";
import { open } from "@tauri-apps/api/dialog";

const FILTERS: ("all" | Platform)[] = ["all", "steam", "ps2", "ps3", "gba", "custom"];

export default function App() {
  const {
    games,
    settings,
    toggleFavorite,
    setEmulators,
    setGames,
    addSteamApp,
    addRomGame,
    upsertEmulatorPath,
    addGameFolder,
  } = useStore();
  const [osKey, setOsKey] = useState<"win" | "mac" | "linux">("win");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Platform>("all");

  useEffect(() => {
  (async () => {
    try {
      setOsKey(await getOSKey());
      if (Object.keys(settings.emulators).length === 0) {
        const emap = await loadEmulatorsFromYaml();
        // optional inference
        Object.keys(emap).forEach((id) => {
          const e: any = (emap as any)[id];
          if (!e.platform) {
            const lower = id.toLowerCase();
            e.platform = lower.includes("pcsx2")
              ? "ps2"
              : lower.includes("rpcs3")
              ? "ps3"
              : "custom";
          }
        });
        setEmulators(emap);
      }
    } catch (err) {
      console.error("Boot error:", err);
    }
  })();
}, []);


  const filtered = useMemo(() => {
    let list = games;
    if (filter !== "all") list = list.filter((g) => g.platform === filter);
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((g) => g.title.toLowerCase().includes(s));
  }, [games, q, filter]);

  async function handleAddEmulator() {
    const name = prompt("Emulator name (e.g., PCSX2)")?.trim();
    if (!name) return;
    const platform = (prompt("Platform (ps2, ps3, gba, custom)")?.trim()?.toLowerCase() ||
      "custom") as Platform;
    const exePath = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Executable", extensions: osKey === "win" ? ["exe"] : ["app", ""] }],
    });
    if (!exePath || typeof exePath !== "string") return;
    const argsStr = prompt("Default args (use ${ROM} for file placeholder)", "${ROM}") || "${ROM}";
    upsertEmulatorPath(null, name, platform, osKey, exePath, argsStr.split(" ").filter(Boolean));
    alert("Emulator saved for this OS!");
  }

  async function handleAddGameFolder() {
    const platform = (prompt("Folder platform (ps2, ps3, gba, custom or steam)")
      ?.trim()
      ?.toLowerCase() || "custom") as Platform;
    const folder = await open({ directory: true, multiple: false });
    if (!folder || typeof folder !== "string") return;

    // pick emulator for ROM platforms
    let emulatorId: string | undefined = undefined;
    if (platform !== "steam") {
      const entries = Object.entries(settings.emulators).filter(([, e]) => e.platform === platform);
      if (entries.length === 0) {
        alert("No emulator configured for this platform yet. Add one first.");
        return;
      }
      const choice = prompt(
        "Choose emulator by number:" + entries.map(([id, e], i) => `${i + 1}) ${e.name}`).join("")
      );
      const idx = choice ? parseInt(choice) - 1 : -1;
      if (idx < 0 || idx >= entries.length) return;
      emulatorId = entries[idx][0];
    }

    const name = prompt("Folder label (e.g., PS2 ROMs)")?.trim() || "ROMs";
    addGameFolder(name, platform, folder, emulatorId);
    alert("Folder added! You can now Scan to populate games.");
  }

  async function scanAll() {
    const found: Game[] = [];
    for (const f of settings.gameFolders) {
      if (f.platform === "steam") continue;
      const files = await findRomsInFolder(f.path, f.platform);
      for (const file of files) {
        const title = titleFromFilename(file);
        found.push({
          id: crypto.randomUUID(),
          title,
          platform: f.platform,
          romPath: file,
          emulatorId: f.emulatorId,
        });
      }
    }
    // Keep Steam entries and manual adds; merge ROMs by path
    const roms = mergeUniqueByPath(found);
    const others = games.filter((g) => !g.romPath);
    setGames([...others, ...roms]);
  }

  function mergeUniqueByPath(arr: Game[]): Game[] {
    const seen = new Set<string>();
    const out: Game[] = [];
    for (const g of arr) {
      const key = g.romPath || `${g.platform}:${g.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(g);
      }
    }
    return out;
  }

  function getEmu(id?: string): EmulatorDef | undefined {
    if (!id) return undefined;
    return settings.emulators[id];
  }

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Game Launcher</h1>
        <nav style={{ display: "flex", gap: 8, marginLeft: 16 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                background: filter === f ? "#333" : "#eee",
                color: filter === f ? "#fff" : "#000",
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </nav>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          style={{ marginLeft: "auto", padding: 8, minWidth: 280 }}
        />
      </header>

      <section style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={panel}>
          <h3>Folders & Emulators</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleAddEmulator}>Add Emulator Path</button>
            <button onClick={handleAddGameFolder}>Add Game Folder</button>
            <button onClick={scanAll}>Scan All Folders</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <b>Configured Emulators:</b>
            <ul>
              {Object.entries(settings.emulators ?? {}).map(([id, e]) => (
                <li key={id}>
                  <code>{e.name}</code> → {e.platform.toUpperCase()}{" "}
                  {(e as any)[osKey]?.exe ? `✅` : `⚠️ set ${osKey} path`}
                </li>
              ))}
            </ul>
            <b>Game Folders:</b>
            <ul>
              {(settings.gameFolders ?? {}).map((f) => (
                <li key={f.id}>
                  <code>{f.name}</code> — {f.platform.toUpperCase()} — {f.path}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <AddSteamPanel onAdd={(id, t) => addSteamApp(id, t)} />
      </section>

      <LibraryGrid games={filtered} osKey={osKey} getEmu={getEmu} onFav={toggleFavorite} />
    </div>
  );
}

function AddSteamPanel({ onAdd }: { onAdd: (id: string, title: string) => void }) {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  return (
    <div style={panel}>
      <h3>Add Steam App</h3>
      <input value={id} onChange={(e) => setId(e.target.value)} placeholder="AppID (e.g., 570)" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        style={{ marginLeft: 8 }}
      />
      <button onClick={() => id && title && onAdd(id, title)} style={{ marginLeft: 8 }}>
        Add
      </button>
    </div>
  );
}

function LibraryGrid({
  games,
  osKey,
  getEmu,
  onFav,
}: {
  games: Game[];
  osKey: "win" | "mac" | "linux";
  getEmu: (id?: string) => EmulatorDef | undefined;
  onFav: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))",
        gap: 12,
        marginTop: 16,
      }}
    >
      {games.map((g) => (
        <div key={g.id} style={card}>
          <div style={{ fontWeight: 600 }}>{g.title}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{g.platform.toUpperCase()}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {g.platform === "steam" && g.steamAppId && (
              <button onClick={() => launchSteam(g.steamAppId!)}>Launch</button>
            )}
            {g.platform !== "steam" && (
              <button
                onClick={() => {
                  const emu = getEmu(g.emulatorId);
                  if (!emu) {
                    alert("Missing emulator config for this game");
                    return;
                  }
                  launchRom(g, emu, osKey).catch((e) => alert(String(e)));
                }}
              >
                Launch
              </button>
            )}
            <button onClick={() => onFav(g.id)}>{g.favorite ? "★" : "☆"}</button>
          </div>
          {g.romPath && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>{g.romPath}</div>}
        </div>
      ))}
    </div>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 12,
  borderRadius: 10,
  minWidth: 320,
};
const card: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 12,
  borderRadius: 10,
  background: "#fff",
};
