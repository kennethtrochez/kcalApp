import AsyncStorage from "@react-native-async-storage/async-storage";

export const APP_MODE_KEY = "app:mode";

export type AppMode = "local" | "authenticated";

export async function getAppMode(): Promise<AppMode | null> {
  const rawMode = await AsyncStorage.getItem(APP_MODE_KEY);

  if (rawMode === "local" || rawMode === "authenticated") {
    return rawMode;
  }

  return null;
}

export async function setAppMode(mode: AppMode): Promise<void> {
  await AsyncStorage.setItem(APP_MODE_KEY, mode);
}

export async function clearAppMode(): Promise<void> {
  await AsyncStorage.removeItem(APP_MODE_KEY);
}
