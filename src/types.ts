export type Platform = "steam" | "ps2" | "ps3" | "gba" | "custom";

export type Game = {
  id: string;
  title: string;
  platform: Platform;
  steamAppId?: string;
  romPath?: string;
  emulatorId?: string; // which emulator to use when launching
  coverUrl?: string;
  favorite?: boolean;
};

export type EmulatorOSConfig = {
  exe: string;
  args: string[];
};

// Each emulator targets a platform (e.g., PCSX2 -> ps2, RPCS3 -> ps3)
export type EmulatorDef = {
  name: string;
  platform: Platform; // steam is not an emulator; use shell open for Steam
  win?: EmulatorOSConfig;
  mac?: EmulatorOSConfig;
  linux?: EmulatorOSConfig;
};

export type EmulatorMap = Record<string, EmulatorDef>; // key = emulatorId

export type GameFolder = {
  id: string;
  name: string;
  platform: Platform; // which system these ROMs are for
  path: string; // folder path on this device
  emulatorId?: string; // required for ROM platforms, not used for steam
};

export type Settings = {
  gameFolders: GameFolder[]; // replaces old romFolders
  emulators: EmulatorMap;
};
