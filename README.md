# Game Launcher — Local Only (Tauri + React)

**Features now**

- Add emulator installs (e.g., PCSX2, RPCS3) with per‑OS paths
- Add ROM folders per platform
- Automatic scan for ROMs (iso/chd/bin+cue/pkg, configurable)
- Unified library grid with search, favorites, launch
- Launch: Steam via URI, ROMs via emulator command

**Not included (by request)**

- Cloud sync (Firebase) — omitted
- In‑game overlay — omitted

## Quick Start

```bash
# 1) Create Tauri app (if you don’t already have one)
# Requires: Node 18+, Rust, Tauri prerequisites (see tauri.app)


npm create tauri-app@latest game-launcher
cd game-launcher


# 2) Replace the generated files with the ones in this repo
# (copy all files from this starter into your folder)


# 3) Install deps
npm install


# 4) Run dev
npm run tauri dev


# 5) Build installers
npm run tauri build
```

---

## Configure Emulators

Open **src/data/emulators.yaml** and set your local paths. You can also add new emulators/systems.

## Add ROM Folders

In the app UI, go to **Settings → ROM Folders**, add a platform (e.g., `ps2`) and pick one or more directories. Then click **Scan**.

## Steam Games

Use **Add Steam App** to add by AppID (`steam://rungameid/APPID`). The launcher will show it in the grid and launch Steam.

---

## Notes

- This is intentionally minimal. No database yet; state is saved to a local JSON file.
- Later, you can swap in SQLite via Prisma for durability.
- On macOS, if you get permission prompts for launching processes, allow them in System Settings → Privacy & Security.
