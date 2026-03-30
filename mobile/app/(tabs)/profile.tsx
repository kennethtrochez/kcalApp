import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { router } from "expo-router";

import { getProfile, normalizeProfile, UserProfile } from "../../lib/profileStorage";
import { apiFetch } from "../../services/api";
import { setAppMode, type AppMode, getAppMode } from "../../services/appMode";
import { signIn, signOut, signUp } from "../../services/authState";

const actionItems = [
  { label: "Edit Profile", icon: "create-outline" as const, route: "/profile/edit" },
  { label: "Goals", icon: "flag-outline" as const, route: "/profile/goals" },
  { label: "Preferences", icon: "options-outline" as const, route: "/profile/preferences" },
];

function formatValue(value: number | undefined, suffix: string) {
  return value === undefined ? "Not set" : `${value}${suffix}`;
}

function formatHeight(profile: UserProfile | null) {
  if (
    profile?.heightFeet === undefined ||
    profile?.heightInches === undefined
  ) {
    return "Not set";
  }

  return `${profile.heightFeet}'${profile.heightInches}`;
}

export default function ProfileScreen() {
  const [fontsLoaded] = useFonts({
    MetalMania: require("../../assets/fonts/MetalMania-Regular.ttf"),
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appMode, setAppModeState] = useState<AppMode | null>(null);
  const [authBusy, setAuthBusy] = useState<"signin" | "signup" | null>(null);
  const loadProfile = useCallback(async (): Promise<UserProfile | null> => {
    const nextMode = await getAppMode();
    setAppModeState(nextMode);

    if (nextMode !== "authenticated") {
      return getProfile();
    }

    const loaded = await apiFetch("/me/profile");
    const normalized = normalizeProfile(loaded as Record<string, unknown>);
    const hasBackendProfile = Object.keys(normalized).length > 0;

    return hasBackendProfile ? normalized : null;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        try {
          const nextProfile = await loadProfile();

          if (alive) {
            setProfile(nextProfile);
          }
        } catch {
          if (alive) {
            setProfile(null);
          }
        }
      })();

      return () => {
        alive = false;
      };
    }, [loadProfile])
  );

  if (!fontsLoaded) {
    return null;
  }

  const hasProfile = Boolean(profile?.profileCreatedAt);
  const goalItems = [
    { label: "Daily Calories", value: formatValue(profile?.dailyCalories, " kcal"), icon: "flame-outline" as const, color: "#8d84ff" },
    { label: "Protein Goal", value: formatValue(profile?.proteinGoal, "g"), icon: "barbell-outline" as const, color: "#c4b5fd" },
    { label: "Carbs Goal", value: formatValue(profile?.carbsGoal, "g"), icon: "nutrition-outline" as const, color: "#fcd34d" },
    { label: "Fat Goal", value: formatValue(profile?.fatGoal, "g"), icon: "water-outline" as const, color: "#34d399" },
    { label: "Water Goal", value: formatValue(profile?.waterGoalOz, " oz"), icon: "water-outline" as const, color: "#7dd3fc" },
  ];

  const bodyStats = [
    { label: "Weight", value: profile?.weightLb !== undefined ? `${profile.weightLb} lb` : "Not set", icon: "body-outline" as const },
    { label: "Height", value: formatHeight(profile), icon: "resize-outline" as const },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#2e2a2a" }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 54,
        paddingBottom: 120,
        gap: 14,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontFamily: "MetalMania",
          color: "#fff",
          fontSize: 32,
          letterSpacing: 2,
          textShadowColor: "#8b5cf6",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
        }}
      >
        Profile
      </Text>

      {!hasProfile ? (
        <View
          style={{
            backgroundColor: "#3a3535",
            borderRadius: 24,
            padding: 22,
            borderWidth: 1,
            borderColor: "#4a4545",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#4b4545",
              borderWidth: 1,
              borderColor: "#6b5cff",
              marginBottom: 18,
            }}
          >
            {profile?.avatarUri ? (
              <Image
                source={{ uri: profile.avatarUri }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Ionicons name="person-outline" size={38} color="#fff" />
            )}
          </View>

          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", textAlign: "center" }}>
            Set up your profile
          </Text>

          <Text
            style={{
              color: "#b8b0b0",
              fontSize: 15,
              textAlign: "center",
              marginTop: 10,
              lineHeight: 22,
              maxWidth: 300,
            }}
          >
            Add your goals and preferences to personalize kCalApp.
          </Text>

          <Pressable
            onPress={() => {
              void (async () => {
                await setAppMode("local");
                setAppModeState("local");
                router.push("/profile/edit");
              })();
            }}
            style={({ pressed }) => ({
              marginTop: 20,
              paddingHorizontal: 20,
              paddingVertical: 13,
              borderRadius: 14,
              backgroundColor: pressed ? "#5b5567" : "#6b5cff",
              borderWidth: 1,
              borderColor: "#8d84ff",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              Create Profile
            </Text>
          </Pressable>

          <Text
            style={{
              color: "#8f8a8a",
              fontSize: 13,
              textAlign: "center",
              marginTop: 12,
              lineHeight: 20,
              maxWidth: 300,
            }}
          >
            You can use kCalApp locally without a profile, then set one up here when you want goals and personalization.
          </Text>
        </View>
      ) : (
        <>
          <View
            style={{
              backgroundColor: "#3a3535",
              borderRadius: 22,
              padding: 18,
              borderWidth: 1,
              borderColor: "#4a4545",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#4b4545",
                  borderWidth: 1,
                  borderColor: "#6b5cff",
                }}
              >
                {profile?.avatarUri ? (
                  <Image
                    source={{ uri: profile.avatarUri }}
                    style={{ width: "100%", height: "100%", borderRadius: 36 }}
                  />
                ) : (
                  <Ionicons name="person" size={34} color="#fff" />
                )}
              </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>
                    {profile?.displayName?.trim() || "Not set"}
                  </Text>
                </View>
              </View>
            </View>

          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 2 }}>
            Goals
          </Text>

          <View style={{ gap: 10 }}>
            {goalItems.map((item) => (
              <View
                key={item.label}
                style={{
                  backgroundColor: "#3a3535",
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#4a4545",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#2e2a2a",
                    }}
                  >
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>

                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                    {item.label}
                  </Text>
                </View>

                <Text style={{ color: item.value === "Not set" ? "#a8a0a0" : item.color, fontSize: 15, fontWeight: "700" }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 2 }}>
            Body Stats
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            {bodyStats.map((item) => (
              <View
                key={item.label}
                style={{
                  flex: 1,
                  backgroundColor: "#3a3535",
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#4a4545",
                }}
              >
                <Ionicons name={item.icon} size={18} color="#8d84ff" />
                <Text style={{ color: "#b8b0b0", fontSize: 13, marginTop: 10 }}>
                  {item.label}
                </Text>
                <Text style={{ color: item.value === "Not set" ? "#a8a0a0" : "#fff", fontSize: 20, fontWeight: "700", marginTop: 4 }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#4a4545",
          padding: 16,
          gap: 12,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          Sync Across Devices
        </Text>

        {appMode === "authenticated" ? (
          <View
            style={{
              borderRadius: 16,
              padding: 14,
              backgroundColor: "#2e2a2a",
              borderWidth: 1,
              borderColor: "#4a4545",
              gap: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              Connected with Cognito
            </Text>
            <Text style={{ color: "#b8b0b0", fontSize: 13, lineHeight: 20 }}>
              Your authenticated account can use protected backend features and sync across devices.
            </Text>
          </View>
        ) : (
          <>
            <Pressable
              disabled={authBusy !== null}
              onPress={() => {
                void (async () => {
                  try {
                    setAuthBusy("signup");
                    await signUp();
                  } finally {
                    setAuthBusy(null);
                  }
                })();
              }}
              style={({ pressed }) => ({
                borderRadius: 16,
                padding: 16,
                backgroundColor: pressed ? "#5b5567" : "#6b5cff",
                borderWidth: 1,
                borderColor: "#8d84ff",
                opacity: authBusy !== null ? 0.8 : 1,
              })}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                {authBusy === "signup" ? "Opening account setup..." : "Create Account"}
              </Text>
              <Text style={{ color: "#ebe8ff", fontSize: 13, lineHeight: 20, marginTop: 6 }}>
                To sync across all devices, create an account with Cognito.
              </Text>
            </Pressable>

            <Pressable
              disabled={authBusy !== null}
              onPress={() => {
                void (async () => {
                  try {
                    setAuthBusy("signin");
                    await signIn();
                  } finally {
                    setAuthBusy(null);
                  }
                })();
              }}
              style={({ pressed }) => ({
                borderRadius: 16,
                padding: 16,
                backgroundColor: pressed ? "#433d3d" : "#2e2a2a",
                borderWidth: 1,
                borderColor: "#4a4545",
                opacity: authBusy !== null ? 0.8 : 1,
              })}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                {authBusy === "signin" ? "Opening sign-in..." : "Sign In"}
              </Text>
              <Text style={{ color: "#b8b0b0", fontSize: 13, lineHeight: 20, marginTop: 6 }}>
                Already have an account? Sign in.
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 2 }}>
        {appMode === "authenticated" ? "Account" : "Profile"}
      </Text>

      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#4a4545",
          overflow: "hidden",
        }}
      >
        {actionItems.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => {
              router.push(item.route as "/profile/edit" | "/profile/goals" | "/profile/preferences");
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 15,
              backgroundColor: pressed ? "#433d3d" : "#3a3535",
              borderBottomWidth: index === actionItems.length - 1 && appMode !== "authenticated" ? 0 : 1,
              borderBottomColor: "#4a4545",
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Ionicons
                name={item.icon}
                size={18}
                color="#fff"
              />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                {item.label}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#9f9797" />
          </Pressable>
        ))}

        {appMode === "authenticated" ? (
          <Pressable
            onPress={() => {
              void (async () => {
                await signOut();
                setAppModeState("local");
                setProfile(await getProfile());
              })();
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 15,
              backgroundColor: pressed ? "#433d3d" : "#3a3535",
              borderTopWidth: 1,
              borderTopColor: "#4a4545",
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Ionicons
                name="log-out-outline"
                size={18}
                color="#f87171"
              />
              <Text
                style={{
                  color: "#fca5a5",
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Sign Out
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#9f9797" />
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
