import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { router } from "expo-router";

import { getProfile, UserProfile } from "../../lib/profileStorage";

const actionItems = [
  { label: "Edit Profile", icon: "create-outline" as const, route: "/profile/edit" },
  { label: "Goals", icon: "flag-outline" as const, route: "/profile/goals" },
  { label: "Preferences", icon: "options-outline" as const, route: "/profile/preferences" },
  { label: "Sign Out", icon: "log-out-outline" as const, route: null },
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

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        const loaded = await getProfile();
        if (alive) {
          setProfile(loaded);
        }
      })();

      return () => {
        alive = false;
      };
    }, [])
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
            onPress={() => router.push("/profile/edit")}
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
                <Text style={{ color: "#b8b0b0", fontSize: 14, marginTop: 4 }}>
                  {profile?.email?.trim() || "Not set"}
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

      {hasProfile ? (
        <>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 2 }}>
            Account
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
                  if (item.route) {
                    router.push(item.route as "/profile/edit" | "/profile/goals" | "/profile/preferences");
                    return;
                  }

                  Alert.alert("Sign Out", "Authentication will be added later.");
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 15,
                  backgroundColor: pressed ? "#433d3d" : "#3a3535",
                  borderBottomWidth: index === actionItems.length - 1 ? 0 : 1,
                  borderBottomColor: "#4a4545",
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={item.label === "Sign Out" ? "#f87171" : "#fff"}
                  />
                  <Text
                    style={{
                      color: item.label === "Sign Out" ? "#fca5a5" : "#fff",
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
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
