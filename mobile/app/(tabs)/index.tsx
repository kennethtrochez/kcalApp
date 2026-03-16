import { useState, useMemo, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, TextInput, Pressable, Text, FlatList, ActivityIndicator, Image, Dimensions } from "react-native";

import { searchFoods, FoodPreview, getFoodDetails } from "../../services/foodService";
import { addToDayLog, getTodayKey, getDayLog } from "../../lib/storage";
import { totalMacrosForEntries } from "../../utils/macros";
import { makeId, LogEntry } from "../../data/food";
import BodyFill from "../../components/BodyFill";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

function formatLoggedTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SearchScreen() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loggingFoodId, setLoggingFoodId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calorieGoal = 2000;

  const [fontsLoaded] = useFonts({
    MetalMania: require("../../assets/fonts/MetalMania-Regular.ttf"),
  });

  function getDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        try {
          const selectedDayLog = await getDayLog(getDateKey(selectedDate));
          if (alive) setEntries(selectedDayLog);
        } catch (e) {
          console.log("Failed to load today log", e);
          if (alive) setEntries([]);
        }
      })();

      return () => {
        alive = false;
      };
    }, [selectedDate])
  );

  const totals = useMemo(() => totalMacrosForEntries(entries), [entries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) =>
        new Date(a.eatenAtISO).getTime() - new Date(b.eatenAtISO).getTime()
    );
  }, [entries]);

  const foodLogColumns = useMemo(() => {
    const chunkSize = 3;
    const columns: LogEntry[][] = [];

    for (let i = 0; i < sortedEntries.length; i += chunkSize) {
      columns.push(sortedEntries.slice(i, i + chunkSize));
    }

    return columns;
  }, [sortedEntries]);

  const progress = Math.max(
    0,
    Math.min(1, calorieGoal > 0 ? totals.calories / calorieGoal : 0)
  );

  const calendarDates = useMemo(() => {
    const today = new Date();
    const dates = [];

    for (let i = -30; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const isSelected =
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();

      dates.push({
        key: date.toISOString(),
        fullDate: date,
        monthLabel: date.toLocaleDateString("en-US", { month: "long" }),
        dayLabel: date.toLocaleDateString("en-US", { weekday: "short" }),
        dateNumber: date.getDate(),
        isToday,
        isSelected,
      });
    }
    
    return dates;
  }, [selectedDate]);

  if (!fontsLoaded) {
    return null;
  }

  const screenWidth = Dimensions.get("window").width;
  const horizontalPadding = 16 * 2;
  const listPadding = 2 * 2;
  const gapBetweenCards = 8;
  const itemWidth = (screenWidth - horizontalPadding - listPadding - gapBetweenCards * 4) / 5;

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
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 46,
    }}
  >

    <Pressable
      onPress={() => {
        console.log("Open profile");
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
      }}
    >
      <Ionicons name="person-outline" size={22} color="#fff" />
    </Pressable>

    <Text
      style={{
        fontFamily: "MetalMania",
        color: "#fff",
        fontSize: 32,
        fontWeight: "700",
        letterSpacing: 2,
        textShadowColor: "#8b5cf6",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10
      }}
    >
      kCalApp
    </Text>

    <View style={{ width: 42 }} />

  </View>

  <View
    style={{ // Search bar location and layout
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 8,
      zIndex: 3,
      elevation: 3,
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
        zIndex: 3,
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
    <View
      style={{
        position: "relative",
        zIndex: 2,
        elevation: 2,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 16,
          fontWeight: "700",
          marginTop: 4,
          marginBottom: 6,
          paddingHorizontal: 2,
        }}
      >
        {selectedDate.toLocaleDateString("en-US", { month: "long" })}
      </Text>

      <FlatList
        data={calendarDates}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="normal"
        disableIntervalMomentum
        keyExtractor={(item) => item.key}
        style={{
          height: 90,
        }}
        contentContainerStyle={{
          paddingHorizontal: 2,
          paddingBottom: 2,
        }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => setSelectedDate(item.fullDate)}
            style={{
              width: itemWidth,
              height: 72,
              marginRight: index === calendarDates.length - 1 ? 0 : 8,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: item.isSelected ? "#6b5cff" : "#3a3535",
              borderWidth: 1,
              borderColor: item.isSelected ? "#8d84ff" : item.isToday ? "#6b5cff" : "#4a4545",
            }}
          >
            <Text
              style={{
                color: item.isSelected ? "#fff" : "#aaa",
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {item.dayLabel}
            </Text>

            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {item.dateNumber}
            </Text>
          </Pressable>
        )}
      />
    </View>

  {loading ? <ActivityIndicator /> : null}

      {error ? (
        <Text style={{ color: "red" }}>{error}</Text>
      ) : null}

    <View style={{ flex: 1 }} pointerEvents="box-none">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 8,
          marginTop: -100,
          zIndex: 1,
          elevation: 1,
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
              borderLeftColor: "#16A34A",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Fat</Text>
            <Text style={{ color: "#16A34A", fontSize: 20, marginTop: 4 }}>
              {Math.round(totals.fat)}g
            </Text>
          </View>
        </View>
      </View>
        <View
          style={{
            marginTop: -150,
            backgroundColor: "#3a3535",
            borderRadius: 18,
            paddingVertical: 8,
            paddingHorizontal: 10,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            Food Log
          </Text>

          {entries.length === 0 ? (
            <Text style={{ color: "#aaa", fontSize: 13 }}>
              No foods logged.
            </Text>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              {foodLogColumns.map((column, columnIndex) => (
                <View
                  key={`column-${columnIndex}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {column.map((item) => {
                    console.log("food item", item.food);
                    return (
                      <Text
                        key={item.id}
                        numberOfLines={1}
                        style={{
                          color: "#fff",
                          fontSize: 13,
                          marginBottom: 6,
                        }}
                      >
                        {formatLoggedTime(item.eatenAtISO)}:{" "}
                        {item.food.name}{" "}
                        {Math.round(item.food.calories * item.servings)}kcal
                      </Text>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>
      {results.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: -125,
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
            elevation: 10,
            zIndex: 4,
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

                    const updated = await addToDayLog(getDateKey(selectedDate), entry);
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