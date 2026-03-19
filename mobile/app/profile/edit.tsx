import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";

import { getProfile, updateProfile } from "../../lib/profileStorage";

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const feetOptions = [4, 5, 6, 7];
const inchOptions = Array.from({ length: 12 }, (_, index) => index);

export default function EditProfileScreen() {
  const [fontsLoaded] = useFonts({
    MetalMania: require("../../assets/fonts/MetalMania-Regular.ttf"),
  });
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [heightFeet, setHeightFeet] = useState<number | null>(null);
  const [heightInches, setHeightInches] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      if (!profile) return;

      setAvatarUri(profile.avatarUri);
      setDisplayName(profile.displayName ?? "");
      setEmail(profile.email ?? "");
      setWeightLb(profile.weightLb !== undefined ? String(profile.weightLb) : "");
      setHeightFeet(profile.heightFeet ?? null);
      setHeightInches(profile.heightInches ?? null);
    })();
  }, []);

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Photo Access", "Allow photo access to choose a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0]?.uri);
    }
  }

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
            Profile
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#3a3535",
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: "#4a4545",
            gap: 14,
          }}
        >
          <View style={{ alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#4b4545",
                borderWidth: 1,
                borderColor: "#6b5cff",
              }}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Ionicons name="person-outline" size={40} color="#fff" />
              )}
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={pickAvatar}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: pressed ? "#5b5567" : "#6b5cff",
                  borderWidth: 1,
                  borderColor: "#8d84ff",
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {avatarUri ? "Change Photo" : "Choose Photo"}
                </Text>
              </Pressable>

              {avatarUri ? (
                <Pressable
                  onPress={() => setAvatarUri(undefined)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: pressed ? "#4a4545" : "#2e2a2a",
                    borderWidth: 1,
                    borderColor: "#4a4545",
                  })}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
              Display Name
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              placeholderTextColor="#888"
              style={{
                borderWidth: 1,
                borderColor: "#4a4545",
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 14,
                color: "#fff",
                backgroundColor: "#2e2a2a",
              }}
            />
          </View>

          <View>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              placeholderTextColor="#888"
              style={{
                borderWidth: 1,
                borderColor: "#4a4545",
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 14,
                color: "#fff",
                backgroundColor: "#2e2a2a",
              }}
            />
          </View>

          <View>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
              Weight
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#4a4545",
                borderRadius: 14,
                backgroundColor: "#2e2a2a",
                paddingRight: 10,
              }}
            >
              <TextInput
                value={weightLb}
                onChangeText={setWeightLb}
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
              <Text style={{ color: "#aaa", fontSize: 13, fontWeight: "700", marginRight: 10 }}>
                lb
              </Text>
              <Pressable
                onPress={Keyboard.dismiss}
                style={({ pressed }) => ({
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

          <View style={{ gap: 8 }}>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
              Height
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#aaa", fontSize: 12, marginBottom: 6 }}>Feet</Text>
                <Text style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>
                  {heightFeet !== null ? `${heightFeet}' selected` : "Pick feet"}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {feetOptions.map((value) => {
                    const selected = heightFeet === value;

                    return (
                      <Pressable
                        key={`feet-${value}`}
                        onPress={() => setHeightFeet(value)}
                        style={({ pressed }) => ({
                          minWidth: 52,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 12,
                          alignItems: "center",
                          backgroundColor: selected ? "#6b5cff" : pressed ? "#4a4545" : "#2e2a2a",
                          borderWidth: 1,
                          borderColor: selected ? "#8d84ff" : "#4a4545",
                        })}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>{value}'</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: "#aaa", fontSize: 12, marginBottom: 6 }}>Inches</Text>
                <Text style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>
                  {heightInches !== null ? `${heightInches}" selected` : "Pick inches"}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {inchOptions.map((value) => {
                    const selected = heightInches === value;

                    return (
                      <Pressable
                        key={`inches-${value}`}
                        onPress={() => setHeightInches(value)}
                        style={({ pressed }) => ({
                          minWidth: 46,
                          paddingHorizontal: 10,
                          paddingVertical: 10,
                          borderRadius: 12,
                          alignItems: "center",
                          backgroundColor: selected ? "#6b5cff" : pressed ? "#4a4545" : "#2e2a2a",
                          borderWidth: 1,
                          borderColor: selected ? "#8d84ff" : "#4a4545",
                        })}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>{value}"</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
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
              Keyboard.dismiss();
              await updateProfile({
                avatarUri,
                displayName: displayName.trim() || undefined,
                email: email.trim() || undefined,
                weightLb: parseOptionalNumber(weightLb),
                heightFeet: heightFeet ?? undefined,
                heightInches: heightInches ?? undefined,
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
    </TouchableWithoutFeedback>
  );
}
