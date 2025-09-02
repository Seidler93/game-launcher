import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Game, Settings, EmulatorMap, Platform, EmulatorDef } from "../types";
import type { GameFolder } from "../types";
import { v4 as uuid } from "uuid";

type State = {
  games: Game[];
  settings: Settings;
  // game ops
  addSteamApp: (appId: string, title: string) => void;
  addRomGame: (title: string, platform: Platform, romPath: string, emulatorId?: string) => void;
  setGames: (games: Game[]) => void;
  toggleFavorite: (id: string) => void;
  // emulator + folder ops
  setEmulators: (emap: EmulatorMap) => void;
  upsertEmulatorPath: (
    emulatorId: string | null,
    name: string,
    platform: Platform,
    osKey: "win" | "mac" | "linux",
    exe: string,
    args: string[]
  ) => string;
  addGameFolder: (name: string, platform: Platform, path: string, emulatorId?: string) => string;
  removeGameFolder: (id: string) => void;
  pruneGamesByFolder: (folderPath: string) => void;
};

const defaultSettings: Settings = {
  gameFolders: [],
  emulators: {},
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      games: [],
      settings: defaultSettings,

      addSteamApp: (appId, title) =>
        set((s) => ({
          games: [...s.games, { id: uuid(), title, platform: "steam", steamAppId: appId }],
        })),

      addRomGame: (title, platform, romPath, emulatorId) =>
        set((s) => ({
          games: [...s.games, { id: uuid(), title, platform, romPath, emulatorId }],
        })),

      setGames: (games) => set(() => ({ games })),

      toggleFavorite: (id) =>
        set((s) => ({
          games: s.games.map((g) => (g.id === id ? { ...g, favorite: !g.favorite } : g)),
        })),

      setEmulators: (emap) => set((s) => ({ settings: { ...s.settings, emulators: emap } })),

      upsertEmulatorPath: (emulatorId, name, platform, osKey, exe, args) => {
        const s = get();
        let id = emulatorId ?? uuid();
        const existing = s.settings.emulators[id];
        const nextDef: EmulatorDef = existing ? { ...existing } : { name, platform };
        nextDef[osKey] = { exe, args };
        if (!existing) ((nextDef.name = name), (nextDef.platform = platform));

        set({ settings: { ...s.settings, emulators: { ...s.settings.emulators, [id]: nextDef } } });
        return id;
      },

      addGameFolder: (name, platform, path, emulatorId) => {
        const s = get();
        const id = uuid();
        const folder: GameFolder = { id, name, platform, path, emulatorId };
        set({ settings: { ...s.settings, gameFolders: [...s.settings.gameFolders, folder] } });
        return id;
      },

      // inside persist(...) object where other actions live:
      removeGameFolder: (id) =>
        set(s => ({
          settings: {
            ...s.settings,
            gameFolders: (s.settings.gameFolders ?? []).filter(f => f.id !== id),
          },
        })),

      pruneGamesByFolder: (folderPath) =>
        set(s => ({
          games: s.games.filter(
            g => !(g.romPath && g.romPath.toLowerCase().startsWith(folderPath.toLowerCase()))
          ),
        })),
      }),
      
    { name: "launcher-local-state" }
  )
);
