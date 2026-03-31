import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, Image, Modal, TextInput, Alert, ScrollView } from "react-native";
import { LogEntry } from "../../data/food";
import { clearDayLog, getDayLog, getTodayKey, removeDayLogEntry, updateDayLogEntry } from "../../lib/storage";
import { getProfile, UserProfile } from "../../lib/profileStorage";
import { totalMacrosForEntries } from "../../utils/macros";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

function formatLoggedTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LogScreen() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  const [editName, setEditName] = useState("");
  const [editServingSize, setEditServingSize] = useState("");
  const [editServings, setEditServings] = useState("1");
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editFat, setEditFat] = useState("");
  const dayKey = getTodayKey();

  const [fontsLoaded] = useFonts({
    MetalMania: require("../../assets/fonts/MetalMania-Regular.ttf"),
  });

  async function refresh() {
    const [data, savedProfile] = await Promise.all([
      getDayLog(dayKey),
      getProfile(),
    ]);
    setEntries(data);
    setProfile(savedProfile);
  }

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const totals = totalMacrosForEntries(entries);

  function openEditModal(entry: LogEntry) {
    setEditingEntry(entry);
    setEditName(entry.food.name ?? "");
    setEditServingSize(entry.food.servingSize ?? "");
    setEditServings(String(entry.servings));
    setEditCalories(String(entry.food.calories));
    setEditProtein(String(entry.food.protein));
    setEditCarbs(String(entry.food.carbs));
    setEditFat(String(entry.food.fat));
  }

  function closeEditModal() {
    setEditingEntry(null);
    setEditName("");
    setEditServingSize("");
    setEditServings("1");
    setEditCalories("");
    setEditProtein("");
    setEditCarbs("");
    setEditFat("");
  }

  function parseNonNegativeNumber(value: string): number | null {
    const trimmed = value.trim();

    if (!trimmed) {
      return 0;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  async function handleRemoveEntry(entryId: string) {
    const next = await removeDayLogEntry(dayKey, entryId);
    setEntries(next);
  }

  async function handleSaveEdit() {
    if (!editingEntry) {
      return;
    }

    const trimmedName = editName.trim();
    const trimmedServingSize = editServingSize.trim();
    const servingsValue = Number(editServings.trim());
    const caloriesValue = parseNonNegativeNumber(editCalories);
    const proteinValue = parseNonNegativeNumber(editProtein);
    const carbsValue = parseNonNegativeNumber(editCarbs);
    const fatValue = parseNonNegativeNumber(editFat);

    if (!trimmedName) {
      Alert.alert("Food Name Required", "Food name is required.");
      return;
    }

    if (!Number.isFinite(servingsValue) || servingsValue <= 0) {
      Alert.alert("Invalid Servings", "Servings must be a number greater than 0.");
      return;
    }

    if ([caloriesValue, proteinValue, carbsValue, fatValue].some((value) => value === null)) {
      Alert.alert("Invalid Nutrition", "Calories and macros must be valid numbers.");
      return;
    }

    const next = await updateDayLogEntry(dayKey, editingEntry.id, (entry) => ({
      ...entry,
      servings: servingsValue,
      food: {
        ...entry.food,
        name: trimmedName,
        servingSize: trimmedServingSize || "1 serving",
        calories: caloriesValue ?? 0,
        protein: proteinValue ?? 0,
        carbs: carbsValue ?? 0,
        fat: fatValue ?? 0,
      },
    }));

    setEntries(next);
    closeEditModal();
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#2e2a2a",
        paddingHorizontal: 16,
        paddingTop: 58,
        paddingBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <Pressable
          onPress={() => {
            router.push("/profile");
          }}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#3a3535",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#4a4545",
            overflow: "hidden",
          }}
        >
          {profile?.avatarUri ? (
            <Image
              source={{ uri: profile.avatarUri }}
              style={{ width: "100%", height: "100%", borderRadius: 21 }}
            />
          ) : (
            <Ionicons name="person-outline" size={22} color="#fff" />
          )}
        </Pressable>

        <Text
          style={{
            fontFamily: "MetalMania",
            color: "#fff",
            fontSize: 28,
            letterSpacing: 2,
            textShadowColor: "#8b5cf6",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10,
          }}
        >
          Log
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <Text
        style={{
          color: "#fff",
          fontSize: 22,
          fontWeight: "700",
        }}
      >
        Today
      </Text>

      <Text
        style={{
          color: "#aaa",
          marginTop: 4,
          marginBottom: 14,
          fontSize: 13,
        }}
      >
        {dayKey}
      </Text>

      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 18,
          padding: 14,
          gap: 10,
          borderWidth: 1,
          borderColor: "#4a4545",
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          Daily Totals
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <View
            style={{
              backgroundColor: "#2f2a2a",
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 12,
              minWidth: "47%",
              borderLeftWidth: 5,
              borderLeftColor: "#6b5cff",
            }}
          >
            <Text style={{ color: "#aaa", fontSize: 12 }}>Calories</Text>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 2 }}>
              {Math.round(totals.calories)}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#2f2a2a",
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 12,
              minWidth: "47%",
              borderLeftWidth: 5,
              borderLeftColor: "#7C3AED",
            }}
          >
            <Text style={{ color: "#aaa", fontSize: 12 }}>Protein</Text>
            <Text style={{ color: "#c4b5fd", fontSize: 18, fontWeight: "700", marginTop: 2 }}>
              {Math.round(totals.protein)}g
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#2f2a2a",
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 12,
              minWidth: "47%",
              borderLeftWidth: 5,
              borderLeftColor: "#F59E0B",
            }}
          >
            <Text style={{ color: "#aaa", fontSize: 12 }}>Carbs</Text>
            <Text style={{ color: "#fcd34d", fontSize: 18, fontWeight: "700", marginTop: 2 }}>
              {Math.round(totals.carbs)}g
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#2f2a2a",
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 12,
              minWidth: "47%",
              borderLeftWidth: 5,
              borderLeftColor: "#16A34A",
            }}
          >
            <Text style={{ color: "#aaa", fontSize: 12 }}>Fat</Text>
            <Text style={{ color: "#86efac", fontSize: 18, fontWeight: "700", marginTop: 2 }}>
              {Math.round(totals.fat)}g
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={async () => {
          await clearDayLog(dayKey);
          await refresh();
        }}
        style={({ pressed }) => ({
          paddingVertical: 12,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? "#d9342b" : "#ff3b30",
          marginBottom: 14,
        })}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
          Clear Today
        </Text>
      </Pressable>

      <Modal
        visible={Boolean(editingEntry)}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            justifyContent: "center",
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              maxHeight: "88%",
              backgroundColor: "#3a3535",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#4a4545",
              padding: 16,
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                Edit Logged Food
              </Text>
              <Text style={{ color: "#b8b0b0", fontSize: 13, lineHeight: 20, marginTop: 6 }}>
                Changes apply only to this logged entry.
              </Text>

              <View style={{ gap: 12, marginTop: 16 }}>
                {[
                  { label: "Food Name", value: editName, setter: setEditName, placeholder: "Food name" },
                  {
                    label: "Serving Description",
                    value: editServingSize,
                    setter: setEditServingSize,
                    placeholder: "ex. 1 cup, 100 g",
                  },
                  {
                    label: "Servings",
                    value: editServings,
                    setter: setEditServings,
                    placeholder: "1",
                    keyboardType: "decimal-pad" as const,
                  },
                  {
                    label: "Calories",
                    value: editCalories,
                    setter: setEditCalories,
                    placeholder: "0",
                    keyboardType: "decimal-pad" as const,
                  },
                  {
                    label: "Protein",
                    value: editProtein,
                    setter: setEditProtein,
                    placeholder: "0",
                    keyboardType: "decimal-pad" as const,
                  },
                  {
                    label: "Carbs",
                    value: editCarbs,
                    setter: setEditCarbs,
                    placeholder: "0",
                    keyboardType: "decimal-pad" as const,
                  },
                  {
                    label: "Fat",
                    value: editFat,
                    setter: setEditFat,
                    placeholder: "0",
                    keyboardType: "decimal-pad" as const,
                  },
                ].map((field) => (
                  <View key={field.label}>
                    <Text
                      style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6 }}
                    >
                      {field.label}
                    </Text>
                    <TextInput
                      value={field.value}
                      onChangeText={field.setter}
                      placeholder={field.placeholder}
                      placeholderTextColor="#888"
                      keyboardType={field.keyboardType}
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
                ))}
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
                <Pressable
                  onPress={closeEditModal}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 14,
                    alignItems: "center",
                    backgroundColor: pressed ? "#4a4545" : "#2e2a2a",
                    borderWidth: 1,
                    borderColor: "#4a4545",
                  })}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    void handleSaveEdit();
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 14,
                    alignItems: "center",
                    backgroundColor: pressed ? "#5b5567" : "#6b5cff",
                    borderWidth: 1,
                    borderColor: "#8d84ff",
                  })}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Save Changes</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
          flexGrow: entries.length === 0 ? 1 : 0,
        }}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#3a3535",
              padding: 14,
              borderRadius: 16,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: "#4a4545",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  {item.food.name ?? "Unknown Food"}
                </Text>

                {item.food.brandOwner ? (
                  <Text
                    style={{
                      color: "#aaa",
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    {item.food.brandOwner}
                  </Text>
                ) : null}

                <Text
                  style={{
                    color: "#8f8a8a",
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  {formatLoggedTime(item.eatenAtISO)}
                </Text>
              </View>

              <Text
                style={{
                  color: "#6b5cff",
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {Math.round(item.food.calories * item.servings)} kcal
              </Text>
            </View>

            <View
              style={{
                marginTop: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text
                style={{
                  color: "#d1d1d1",
                  fontSize: 13,
                  flex: 1,
                }}
              >
                Servings: {item.servings} | {Math.round(item.food.calories)} cal per serving
              </Text>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => openEditModal(item)}
                  style={({ pressed }) => ({
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? "#4a4545" : "#2e2a2a",
                    borderWidth: 1,
                    borderColor: "#4a4545",
                  })}
                >
                  <Ionicons name="create-outline" size={16} color="#fff" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    void handleRemoveEntry(item.id);
                  }}
                  style={({ pressed }) => ({
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? "#4a4545" : "#2e2a2a",
                    borderWidth: 1,
                    borderColor: "#4a4545",
                  })}
                >
                  <Ionicons name="trash-outline" size={16} color="#fca5a5" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 40,
            }}
          >
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: "#3a3535",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#4a4545",
                marginBottom: 12,
              }}
            >
              <Ionicons name="restaurant-outline" size={28} color="#aaa" />
            </View>

            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              No foods logged yet
            </Text>

            <Text
              style={{
                color: "#aaa",
                fontSize: 13,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Foods you log from the Home screen will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
