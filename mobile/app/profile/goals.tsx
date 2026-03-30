import { useEffect, useState } from "react";
import { Keyboard, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFonts } from "expo-font";

import { getProfile, updateProfile } from "../../lib/profileStorage";

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function GoalsScreen() {
  const [fontsLoaded] = useFonts({
    MetalMania: require("../../assets/fonts/MetalMania-Regular.ttf"),
  });
  const [dailyCalories, setDailyCalories] = useState("");
  const [proteinGoal, setProteinGoal] = useState("");
  const [carbsGoal, setCarbsGoal] = useState("");
  const [fatGoal, setFatGoal] = useState("");
  const [waterGoalOz, setWaterGoalOz] = useState("");

  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      if (!profile) return;

      setDailyCalories(profile.dailyCalories !== undefined ? String(profile.dailyCalories) : "");
      setProteinGoal(profile.proteinGoal !== undefined ? String(profile.proteinGoal) : "");
      setCarbsGoal(profile.carbsGoal !== undefined ? String(profile.carbsGoal) : "");
      setFatGoal(profile.fatGoal !== undefined ? String(profile.fatGoal) : "");
      setWaterGoalOz(profile.waterGoalOz !== undefined ? String(profile.waterGoalOz) : "");
    })();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#2e2a2a" }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 54, paddingBottom: 40, gap: 14 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={handleBack}>
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
          Goals
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: "#4a4545",
          gap: 12,
        }}
      >
        {[
          { label: "Daily Calories", value: dailyCalories, setter: setDailyCalories, unit: "kcal" },
          { label: "Protein Goal", value: proteinGoal, setter: setProteinGoal, unit: "g" },
          { label: "Carbs Goal", value: carbsGoal, setter: setCarbsGoal, unit: "g" },
          { label: "Fat Goal", value: fatGoal, setter: setFatGoal, unit: "g" },
          { label: "Water Goal", value: waterGoalOz, setter: setWaterGoalOz, unit: "oz" },
        ].map((field) => (
          <View key={field.label}>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
              {field.label}
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#4a4545",
                borderRadius: 14,
                backgroundColor: "#2e2a2a",
                flexDirection: "row",
                alignItems: "center",
                paddingRight: 14,
              }}
            >
              <TextInput
                value={field.value}
                onChangeText={field.setter}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                placeholderTextColor="#888"
                style={{
                  flex: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: "#fff",
                }}
              />
              <Text style={{ color: "#aaa", fontSize: 13, fontWeight: "700" }}>
                {field.unit}
              </Text>
              <Pressable
                onPress={Keyboard.dismiss}
                style={({ pressed }) => ({
                  marginLeft: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: pressed ? "#5b5567" : "#3a3535",
                  borderWidth: 1,
                  borderColor: "#4a4545",
                })}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Done</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
        <Pressable
          onPress={handleBack}
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
            Keyboard.dismiss();
            await updateProfile({
              dailyCalories: parseOptionalNumber(dailyCalories),
              proteinGoal: parseOptionalNumber(proteinGoal),
              carbsGoal: parseOptionalNumber(carbsGoal),
              fatGoal: parseOptionalNumber(fatGoal),
              waterGoalOz: parseOptionalNumber(waterGoalOz),
            });
            handleBack();
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
    </TouchableWithoutFeedback>
  );
}
  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/profile");
  }
