import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFonts } from "expo-font";

import { getProfile, updateProfile } from "../../lib/profileStorage";

export default function PreferencesScreen() {
  const [fontsLoaded] = useFonts({
    MetalMania: require("../../assets/fonts/MetalMania-Regular.ttf"),
  });
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      if (!profile) return;

      setRemindersEnabled(Boolean(profile.remindersEnabled));
    })();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#2e2a2a" }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 54, paddingBottom: 40, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text
          style={{
            fontFamily: "MetalMania",
            color: "#fff",
            fontSize: 28,
            letterSpacing: 2,
          }}
        >
          Preferences
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#4a4545",
          overflow: "hidden",
        }}
      >
        {[
          {
            label: "Reminder Notifications",
            value: remindersEnabled,
            setter: setRemindersEnabled,
            subtitle: "Local placeholder toggle for future reminders",
          },
        ].map((item, index) => (
          <View
            key={item.label}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: index === 0 ? 0 : 1,
              borderBottomColor: "#4a4545",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                {item.label}
              </Text>
              <Text style={{ color: "#a9a1a1", fontSize: 12, marginTop: 4 }}>
                {item.subtitle}
              </Text>
            </View>

            <Switch
              value={item.value}
              onValueChange={item.setter}
              trackColor={{ false: "#5b5555", true: "#6b5cff" }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#4a4545",
          paddingHorizontal: 16,
          paddingVertical: 15,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
            Metric Units
          </Text>
          <Text style={{ color: "#a9a1a1", fontSize: 12, marginTop: 4 }}>
            Coming soon. Profile uses US units for now.
          </Text>
        </View>

        <Ionicons name="scale-outline" size={18} color="#8d84ff" />
      </View>

      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#4a4545",
          paddingHorizontal: 16,
          paddingVertical: 15,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
            Theme
          </Text>
          <Text style={{ color: "#a9a1a1", fontSize: 12, marginTop: 4 }}>
            Coming soon
          </Text>
        </View>

        <Ionicons name="moon-outline" size={18} color="#8d84ff" />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: pressed ? "#4a4545" : "#3a3535",
            borderWidth: 1,
            borderColor: "#4a4545",
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            await updateProfile({
              remindersEnabled,
            });
            router.back();
          }}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: pressed ? "#5b5567" : "#6b5cff",
            borderWidth: 1,
            borderColor: "#8d84ff",
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
