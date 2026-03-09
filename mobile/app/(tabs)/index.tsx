import { useState, useMemo, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, TextInput, Pressable, Text, FlatList, ActivityIndicator, Image } from "react-native";

import { searchFoods, FoodPreview, getFoodDetails } from "../../services/foodService";
import { addToDayLog, getTodayKey, getDayLog } from "../../lib/storage";
import { totalMacrosForEntries } from "../../utils/macros";
import { makeId, LogEntry } from "../../data/food";
import BodyFill from "../../components/BodyFill";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

export default function SearchScreen() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loggingFoodId, setLoggingFoodId] = useState<number | null>(null);
  const calorieGoal = 2000;

  const [fontsLoaded] = useFonts({
    MetalMania: require("../../assets/fonts/MetalMania-Regular.ttf"),
  });

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        try {
          const todays = await getDayLog(getTodayKey());
          if (alive) setEntries(todays);
        } catch (e) {
          console.log("Failed to load today log", e);
          if (alive) setEntries([]);
        }
      })();

      return () => {
        alive = false;
      };
    }, [])
  );

  const totals = useMemo(() => totalMacrosForEntries(entries), [entries]);

  const progress = Math.max(
    0,
    Math.min(1, calorieGoal > 0 ? totals.calories / calorieGoal : 0)
  );

  if (!fontsLoaded) {
    return null;
  }
  
  async function onSearch() {
    try {
      setError(null);
      setLoading(true);

      const data = await searchFoods(query);
      setResults(data);

    } catch (e: any) {
      setError(e?.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#2e2a2a",
        padding: 16,
        gap: 12
      }}
    >
  <Text
    style={{
      fontFamily: "MetalMania",
      color: "#fff",
      fontSize: 32,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 46,
      letterSpacing: 2,
      textShadowColor: "#8b5cf6",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10
    }}
  >
    kCalApp
  </Text>

  <View
    style={{ // Search bar location and layout
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 8,
    }}
  >
    <TextInput
      value={query}
      onChangeText={setQuery}
      placeholder="Search foods"
      placeholderTextColor="#888"
      autoCapitalize="none"
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: "#4a4545",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        color: "#fff",
        backgroundColor: "#3a3535",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}
      onSubmitEditing={onSearch}
      returnKeyType="search"
    />

    <Pressable
      onPress={onSearch}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? "#5b5567" : "#6b5cff",
        borderWidth: 1,
        borderColor: "#8d84ff",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
      })}
    >
    <Ionicons name="search" size={22} color="#fff" />
    </Pressable>

    <Pressable
      onPress={() => {
        console.log("Open filters");
      }}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? "#4a4545" : "#3f3a3a",
        borderWidth: 1,
        borderColor: "#5b5555",
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      })}
    >
    <Ionicons name="options-outline" size={20} color="#fff" />
    </Pressable>
  </View>

      {loading ? <ActivityIndicator /> : null}

      {error ? (
        <Text style={{ color: "red" }}>{error}</Text>
      ) : null}

    <View style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 8,
        }}
      >
        <View
          style={{
            flex: 1.2,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <BodyFill
            width={320}
            height={620}
            caloriesConsumed={totals.calories}
            calorieGoal={calorieGoal}
            proteinG={totals.protein}
            carbsG={totals.carbs}
            fatG={totals.fat}
          />
        </View>

        <View
          style={{
            flex: 0.6,
            gap: 12,
            paddingRight: 8,
            marginTop: -60,
          }}
        >
          <View
            style={{
              backgroundColor: "#3a3535",
              borderRadius: 16,
              padding: 10,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Calories
            </Text>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 4 }}>
              {Math.round(totals.calories)}
            </Text>
            <Text style={{ color: "#aaa", marginTop: 2 }}>
              of {calorieGoal}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#3a3535",
              borderRadius: 16,
              padding: 8,
              borderLeftWidth: 6,
              borderLeftColor: "#7C3AED",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Protein</Text>
            <Text style={{ color: "#c4b5fd", fontSize: 20, marginTop: 4 }}>
              {Math.round(totals.protein)}g
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#3a3535",
              borderRadius: 16,
              padding: 8,
              borderLeftWidth: 6,
              borderLeftColor: "#F59E0B",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Carbs</Text>
            <Text style={{ color: "#fcd34d", fontSize: 20, marginTop: 4 }}>
              {Math.round(totals.carbs)}g
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#3a3535",
              borderRadius: 16,
              padding: 8,
              borderLeftWidth: 6,
              borderLeftColor: "#FDE047",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Fat</Text>
            <Text style={{ color: "#fde68a", fontSize: 20, marginTop: 4 }}>
              {Math.round(totals.fat)}g
            </Text>
          </View>
        </View>
      </View>

      {results.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 16,
            right: 16,
            maxHeight: 260,
            backgroundColor: "#3a3535",
            borderRadius: 18,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: "#4b4545",
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.fdcId)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                disabled={loggingFoodId === item.fdcId}
                onPress={async () => {
                  if (loggingFoodId === item.fdcId) return;

                  try {
                    setError(null);
                    setLoggingFoodId(item.fdcId);

                    const food = await getFoodDetails(item.fdcId);

                    const entry: LogEntry = {
                      id: makeId(),
                      food,
                      servings: 1,
                      eatenAtISO: new Date().toISOString(),
                    };

                    const updated = await addToDayLog(getTodayKey(), entry);
                    setEntries(updated);

                    setResults([]);
                    setQuery("");

                  } catch (e: any) {
                    setError(e?.message ?? "Failed to log food");
                  } finally {
                    setLoggingFoodId(null);
                  }
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#4a4444",
                  opacity: loggingFoodId === item.fdcId ? 0.5 : 1,
                }}
              >
                <Text style={{ fontWeight: "600", color: "#fff" }}>
                  {item.description}
                </Text>

                <Text style={{ color: "#aaa", marginTop: 2 }}>
                  {item.brandOwner ?? item.dataType}
                </Text>

                <Text style={{ color: "#7ea7ff", marginTop: 4 }}>
                  {loggingFoodId === item.fdcId ? "Logging..." : "Tap to log"}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              !loading && query.trim().length > 0 ? (
                <Text style={{ opacity: 0.7, color: "#fff", paddingHorizontal: 14, paddingVertical: 12 }}>
                  No results.
                </Text>
              ) : null
            }
          />
        </View>
      )}
    </View>

    </View>
  );
}