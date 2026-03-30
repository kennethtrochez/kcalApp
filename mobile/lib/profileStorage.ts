import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../services/api";
import { getAppMode, setAppMode } from "../services/appMode";

const PROFILE_KEY = "profile:data";

export type UserProfile = {
  avatarUri?: string;
  displayName?: string;
  email?: string;
  weightLb?: number;
  heightFeet?: number;
  heightInches?: number;
  dailyCalories?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  waterGoalOz?: number;
  remindersEnabled?: boolean;
  profileCreatedAt?: string;
};

export function normalizeProfile(profile: Record<string, unknown>): UserProfile {
  const normalized: UserProfile = {
    avatarUri: typeof profile.avatarUri === "string" ? profile.avatarUri : undefined,
    displayName: typeof profile.displayName === "string" ? profile.displayName : undefined,
    email: typeof profile.email === "string" ? profile.email : undefined,
    weightLb:
      typeof profile.weightLb === "number"
        ? profile.weightLb
        : typeof profile.weight === "number"
          ? profile.weight
          : undefined,
    heightFeet: typeof profile.heightFeet === "number" ? profile.heightFeet : undefined,
    heightInches: typeof profile.heightInches === "number" ? profile.heightInches : undefined,
    dailyCalories: typeof profile.dailyCalories === "number" ? profile.dailyCalories : undefined,
    proteinGoal: typeof profile.proteinGoal === "number" ? profile.proteinGoal : undefined,
    carbsGoal: typeof profile.carbsGoal === "number" ? profile.carbsGoal : undefined,
    fatGoal: typeof profile.fatGoal === "number" ? profile.fatGoal : undefined,
    waterGoalOz:
      typeof profile.waterGoalOz === "number"
        ? profile.waterGoalOz
        : typeof profile.waterGoal === "number"
          ? profile.waterGoal
          : undefined,
    remindersEnabled:
      typeof profile.remindersEnabled === "boolean"
        ? profile.remindersEnabled
        : undefined,
    profileCreatedAt:
      typeof profile.profileCreatedAt === "string" ? profile.profileCreatedAt : undefined,
  };

  return normalized;
}

export async function getProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);

  if (!raw) {
    return null;
  }

  return normalizeProfile(JSON.parse(raw) as Record<string, unknown>);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const current = (await getProfile()) ?? {};
  const next: UserProfile = {
    ...current,
    ...updates,
  };

  if (!next.profileCreatedAt) {
    next.profileCreatedAt = new Date().toISOString();
  }

  const appMode = await getAppMode();

  if (appMode !== "authenticated") {
    await setAppMode("local");
    await saveProfile(next);
    return next;
  }

  const saved = await apiFetch("/me/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(next),
  });

  const normalizedSaved = normalizeProfile(saved as Record<string, unknown>);
  const resolvedProfile: UserProfile = {
    ...next,
    ...normalizedSaved,
  };

  await saveProfile(resolvedProfile);
  return resolvedProfile;
}
