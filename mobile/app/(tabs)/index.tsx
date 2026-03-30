import { useState, useMemo, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, TextInput, Pressable, Text, FlatList, ActivityIndicator, Dimensions, Image } from "react-native";
import { router } from "expo-router";

import { searchFoods, FoodPreview, getFoodDetails, FoodTypeFilter } from "../../services/foodService";
import { addDayWaterOz, addToDayLog, getDayLog, getDayWaterOz } from "../../lib/storage";
import { getProfile, UserProfile } from "../../lib/profileStorage";
import { totalMacrosForEntries } from "../../utils/macros";
import { makeId, LogEntry, Food } from "../../data/food";
import BodyFill from "../../components/BodyFill";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

function formatLoggedTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeSearchQuery(query: string) {
  const fillerWords = new Set([
    "of",
    "a",
    "an",
    "the",
    "for",
  ]);
  const sizeWords = new Set(["small", "medium", "large"]);
  const quantityWords = new Set([
    "slice",
    "slices",
    "cup",
    "cups",
    "tbsp",
    "tsp",
    "oz",
    "ounce",
    "ounces",
    "g",
    "gram",
    "grams",
    "lb",
    "lbs",
    "serving",
    "servings",
    "piece",
    "pieces",
  ]);

  const cleaned = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  const tokens = cleaned.split(" ").filter(Boolean);
  const normalizedTokens: string[] = [];
  let index = 0;

  while (index < tokens.length && /^\d+$/.test(tokens[index])) {
    index += 1;

    if (index < tokens.length && quantityWords.has(tokens[index])) {
      index += 1;
    }
  }

  for (; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (fillerWords.has(token)) {
      continue;
    }

    normalizedTokens.push(token);
  }

  const fromIndex = normalizedTokens.indexOf("from");

  if (fromIndex >= 0 && fromIndex < normalizedTokens.length - 1) {
    const brandTokens = normalizedTokens.slice(fromIndex + 1);
    const foodTokens = normalizedTokens.slice(0, fromIndex).filter((token) => !sizeWords.has(token));
    const sizeTokens = normalizedTokens.slice(0, fromIndex).filter((token) => sizeWords.has(token));

    return [...brandTokens, ...foodTokens, ...sizeTokens].join(" ").trim();
  }

  const nonSizeTokens = normalizedTokens.filter((token) => !sizeWords.has(token));
  const presentSizeTokens = normalizedTokens.filter((token) => sizeWords.has(token));

  return [...nonSizeTokens, ...presentSizeTokens].join(" ").trim();
}

export default function SearchScreen() {
  const calendarListRef = useRef<FlatList<any> | null>(null);
  const [showCustomEntry, setShowCustomEntry] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [activeQuery, setActiveQuery] = useState("");
  const [activeFoodType, setActiveFoodType] = useState<FoodTypeFilter>("all");
  const [activeBrandFilter, setActiveBrandFilter] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [waterOz, setWaterOz] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loggingFoodId, setLoggingFoodId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [customName, setCustomName] = useState("");
  const [customServingSize, setCustomServingSize] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [customServings, setCustomServings] = useState("1");
  const [savingCustomEntry, setSavingCustomEntry] = useState(false);
  const [draftFoodType, setDraftFoodType] = useState<FoodTypeFilter>("all");
  const [draftBrandFilter, setDraftBrandFilter] = useState("");

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
          const dayKey = getDateKey(selectedDate);
          const [selectedDayLog, selectedDayWaterOz, savedProfile] = await Promise.all([
            getDayLog(dayKey),
            getDayWaterOz(dayKey),
            getProfile(),
          ]);

          if (alive) {
            setEntries(selectedDayLog);
            setWaterOz(selectedDayWaterOz);
            setProfile(savedProfile);
          }
        } catch (e) {
          console.log("Failed to load today log", e);
          if (alive) {
            setEntries([]);
            setWaterOz(0);
            setProfile(null);
          }
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

  const calorieGoal = profile?.dailyCalories;
  const proteinGoal = profile?.proteinGoal;
  const carbsGoal = profile?.carbsGoal;
  const fatGoal = profile?.fatGoal;
  const hasProfile = Boolean(profile?.profileCreatedAt);

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
  const calendarItemLength = itemWidth + 8;
  const todayIndex = calendarDates.findIndex((item) => item.isToday);
  const initialCalendarIndex = Math.max(0, todayIndex - 2);
  const foodTypeOptions: { label: string; value: FoodTypeFilter }[] = [
    { label: "All", value: "all" },
    { label: "Branded", value: "branded" },
    { label: "Generic", value: "generic" },
  ];

  async function runSearch(normalizedQuery: string, foodType: FoodTypeFilter, brandFilter: string) {
    const trimmedBrandFilter = brandFilter.trim();

    setResults([]);
    setOffset(0);
    setActiveQuery(normalizedQuery);
    setActiveFoodType(foodType);
    setActiveBrandFilter(trimmedBrandFilter);
    setHasMore(false);

    if (!normalizedQuery) {
      setError(null);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const data = await searchFoods(normalizedQuery, 0, 10, foodType, trimmedBrandFilter);
      setResults(data);
      setOffset(data.length);
      setHasMore(data.length === 10);

    } catch (e: any) {
      setError(e?.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSearch() {
    const normalizedQuery = normalizeSearchQuery(query);
    await runSearch(normalizedQuery, activeFoodType, activeBrandFilter);
  }

  async function loadMoreResults() {
    if (loading || loadingMore || !hasMore || !activeQuery) {
      return;
    }

    try {
      setLoadingMore(true);

      const data = await searchFoods(activeQuery, offset, 10, activeFoodType, activeBrandFilter);

      setResults((current) => [...current, ...data]);
      setOffset((current) => current + data.length);

      if (data.length < 10) {
        setHasMore(false);
      }
    } catch (e: any) {
      setError(e?.message ?? "Search failed");
    } finally {
      setLoadingMore(false);
    }
  }

  function resetCustomEntryForm() {
    setCustomName("");
    setCustomServingSize("");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
    setCustomServings("1");
  }

  async function addWaterCup(amount: number) {
    try {
      setError(null);
      const updatedWaterOz = await addDayWaterOz(getDateKey(selectedDate), amount);
      setWaterOz(updatedWaterOz);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save water");
    }
  }

  async function saveCustomEntry() {
    const trimmedName = customName.trim();
    const trimmedServingSize = customServingSize.trim();
    const calories = Number(customCalories);
    const protein = customProtein.trim() ? Number(customProtein) : 0;
    const carbs = customCarbs.trim() ? Number(customCarbs) : 0;
    const fat = customFat.trim() ? Number(customFat) : 0;
    const servings = customServings.trim() ? Number(customServings) : 1;

    if (!trimmedName) {
      setError("Food name is required");
      return;
    }

    if (!customCalories.trim() || Number.isNaN(calories) || calories < 0) {
      setError("Calories must be a valid number");
      return;
    }

    if (
      Number.isNaN(protein) ||
      Number.isNaN(carbs) ||
      Number.isNaN(fat) ||
      Number.isNaN(servings) ||
      protein < 0 ||
      carbs < 0 ||
      fat < 0 ||
      servings <= 0
    ) {
      setError("Macros and servings must be valid numbers");
      return;
    }

    try {
      setError(null);
      setSavingCustomEntry(true);

      const food: Food = {
        id: makeId(),
        name: trimmedName,
        servingSize: trimmedServingSize || "1 serving",
        calories,
        protein,
        carbs,
        fat,
        source: "manual",
      };

      const entry: LogEntry = {
        id: makeId(),
        food,
        servings,
        eatenAtISO: new Date().toISOString(),
      };

      const updated = await addToDayLog(getDateKey(selectedDate), entry);
      setEntries(updated);
      setShowCustomEntry(false);
      resetCustomEntryForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save custom food");
    } finally {
      setSavingCustomEntry(false);
    }
  }

  function openGoalsScreen() {
    router.push("/profile/goals");
  }

  function renderGoalStatus(
    value: number | undefined,
    formattedValue: string
  ) {
    if (value !== undefined) {
      return (
        <Text style={{ color: "#aaa", fontSize: 12, marginTop: 2 }}>
          {formattedValue}
        </Text>
      );
    }

    return (
      <Pressable onPress={openGoalsScreen}>
        <Text
          style={{
            color: "#FDE047",
            fontSize: 12,
            marginTop: 2,
            fontWeight: "700",
          }}
        >
          goal not set
        </Text>
      </Pressable>
    );
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
        setDraftFoodType(activeFoodType);
        setDraftBrandFilter(activeBrandFilter);
        setShowFilters((current) => !current);
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

    <Pressable
      onPress={() => {
        setError(null);
        setShowCustomEntry((current) => !current);
      }}
      style={({ pressed }) => ({
        minWidth: 48,
        height: 48,
        paddingHorizontal: 12,
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
      <Ionicons name="add" size={20} color="#fff" />
    </Pressable>
    
  </View>
    {showFilters ? (
      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 18,
          padding: 12,
          borderWidth: 1,
          borderColor: "#4b4545",
          gap: 10,
          zIndex: 3,
          elevation: 3,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          Search Filter
        </Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {foodTypeOptions.map((option) => {
            const selected = draftFoodType === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setDraftFoodType(option.value);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: selected ? "#6b5cff" : pressed ? "#4a4545" : "#2e2a2a",
                  borderWidth: 1,
                  borderColor: selected ? "#8d84ff" : "#4a4545",
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={draftBrandFilter}
          onChangeText={setDraftBrandFilter}
          placeholderTextColor="#888"
          autoCapitalize="words"
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

        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
          <Pressable
            onPress={async () => {
              setDraftFoodType("all");
              setDraftBrandFilter("");
              setShowFilters(false);
              await runSearch(normalizeSearchQuery(query), "all", "");
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: pressed ? "#4a4545" : "#2e2a2a",
              borderWidth: 1,
              borderColor: "#4a4545",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Clear</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              setShowFilters(false);
              await runSearch(normalizeSearchQuery(query), draftFoodType, draftBrandFilter);
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: pressed ? "#5b5567" : "#6b5cff",
              borderWidth: 1,
              borderColor: "#8d84ff",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Apply</Text>
          </Pressable>
        </View>
      </View>
    ) : null}
    {showCustomEntry ? (
      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 18,
          padding: 12,
          borderWidth: 1,
          borderColor: "#4b4545",
          gap: 10,
          zIndex: 3,
          elevation: 3,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          Add Custom Food
        </Text>

        <TextInput
          value={customName}
          onChangeText={setCustomName}
          placeholder="Food or meal name"
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

        <TextInput
          value={customServingSize}
          onChangeText={setCustomServingSize}
          placeholder="ex. 1 slice, 1 cup, 100 g"
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

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput
            value={customCalories}
            onChangeText={setCustomCalories}
            placeholder="Calories"
            placeholderTextColor="#888"
            keyboardType="numeric"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#4a4545",
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 14,
              color: "#fff",
              backgroundColor: "#2e2a2a",
            }}
          />

          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
              Servings Eaten
            </Text>
            <TextInput
              value={customServings}
              onChangeText={setCustomServings}
              placeholder="ex. 1 serving"
              placeholderTextColor="#888"
              keyboardType="numeric"
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
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput
            value={customProtein}
            onChangeText={setCustomProtein}
            placeholder="Protein"
            placeholderTextColor="#888"
            keyboardType="numeric"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#4a4545",
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 14,
              color: "#fff",
              backgroundColor: "#2e2a2a",
            }}
          />

          <TextInput
            value={customCarbs}
            onChangeText={setCustomCarbs}
            placeholder="Carbs"
            placeholderTextColor="#888"
            keyboardType="numeric"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#4a4545",
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 14,
              color: "#fff",
              backgroundColor: "#2e2a2a",
            }}
          />

          <TextInput
            value={customFat}
            onChangeText={setCustomFat}
            placeholder="Fat"
            placeholderTextColor="#888"
            keyboardType="numeric"
            style={{
              flex: 1,
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

        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
          <Pressable
            onPress={() => {
              setShowCustomEntry(false);
              resetCustomEntryForm();
              setError(null);
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: pressed ? "#4a4545" : "#2e2a2a",
              borderWidth: 1,
              borderColor: "#4a4545",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel</Text>
          </Pressable>

          <Pressable
            disabled={savingCustomEntry}
            onPress={saveCustomEntry}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: pressed ? "#5b5567" : "#6b5cff",
              borderWidth: 1,
              borderColor: "#8d84ff",
              opacity: savingCustomEntry ? 0.6 : 1,
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {savingCustomEntry ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>
    ) : null}
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
        ref={calendarListRef}
        data={calendarDates}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="normal"
        disableIntervalMomentum
        initialScrollIndex={initialCalendarIndex}
        keyExtractor={(item) => item.key}
        style={{
          height: 90,
        }}
        contentContainerStyle={{
          paddingHorizontal: 2,
          paddingBottom: 2,
        }}
        getItemLayout={(_, index) => ({
          length: calendarItemLength,
          offset: calendarItemLength * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          calendarListRef.current?.scrollToOffset({
            offset: calendarItemLength * info.index,
            animated: false,
          });
        }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => setSelectedDate(item.fullDate)}
            style={{
              width: itemWidth,
              height: 72,
              marginRight: index === calendarDates.length - 1 ? 0 : 8,
              borderRadius: 12,
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
                fontSize: 12,
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
                marginTop: 3,
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
      {!showCustomEntry ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 8,
            marginTop: -128,
            zIndex: 1,
            elevation: 1,
          }}
          >
            {!hasProfile ? (
              <View
                style={{
                  position: "absolute",
                  top: 18,
                  left: 8,
                  right: 8,
                  backgroundColor: "#3a3535",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#4a4545",
                  zIndex: 4,
                  elevation: 4,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                  Set up a profile for goal tracking
                </Text>
                <Text style={{ color: "#b8b0b0", fontSize: 13, lineHeight: 20, marginTop: 6 }}>
                  Calorie and macro goals appear after you create a profile in the Profile tab.
                </Text>
              </View>
            ) : null}

          <View
            style={{
              flex: 1.2,
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <View
              style={{
                position: "absolute",
                left: 5,
                top: 120,
                alignItems: "center",
                gap: 4,
                zIndex: 3,
                elevation: 3,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: "#8fd3ff", fontSize: 10, fontWeight: "700" }}>
                  {waterOz} oz
                </Text>
                <Text style={{ color: "#6fb7df", fontSize: 8, fontWeight: "600" }}>
                  drank today
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Pressable
                  onPress={() => addWaterCup(-8)}
                  style={({ pressed }) => ({
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? "#4a4545" : "#3a3535",
                    borderWidth: 1,
                    borderColor: "#4a4545",
                  })}
                >
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>-</Text>
                </Pressable>

                <View style={{ alignItems: "center", gap: 1 }}>
                  <Pressable
                    onPress={() => addWaterCup(8)}
                    style={({ pressed }) => ({
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: pressed ? "#2b5d7d" : "#3276a0",
                      borderWidth: 1,
                      borderColor: "#5ba8d6",
                    })}
                  >
                    <Ionicons name="water-outline" size={14} color="#d9f2ff" />
                  </Pressable>

                  <Text style={{ color: "#8fd3ff", fontSize: 8, fontWeight: "600" }}>
                    +8 oz
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginLeft: 24, marginTop: hasProfile ? 0 : 54 }}>
              <BodyFill
                width={342}
                height={664}
                caloriesConsumed={calorieGoal ? totals.calories : 0}
                calorieGoal={calorieGoal ?? 1}
                proteinG={totals.protein}
                carbsG={totals.carbs}
                fatG={totals.fat}
              />
            </View>
          </View>

          <View
            style={{ //nutrition fact scale
              flex: 0.45,
              gap: 12,
              paddingRight: 0,
              marginTop: -54,
              marginLeft: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "#3a3535",
                borderRadius: 16,
                padding: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                Calories
              </Text>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 4 }}>
                {Math.round(totals.calories)}
              </Text>
              {renderGoalStatus(calorieGoal, `of ${calorieGoal} kcal`)}
            </View>

            <View
              style={{
                backgroundColor: "#3a3535",
                borderRadius: 16,
                padding: 9,
                borderLeftWidth: 6,
                borderLeftColor: "#7C3AED",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Protein</Text>
              <Text style={{ color: "#c4b5fd", fontSize: 20, marginTop: 4 }}>
                {Math.round(totals.protein)}g
              </Text>
              {renderGoalStatus(proteinGoal, `of ${proteinGoal}g`)}
            </View>

            <View
              style={{
                backgroundColor: "#3a3535",
                borderRadius: 16,
                padding: 9,
                borderLeftWidth: 6,
                borderLeftColor: "#F59E0B",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Carbs</Text>
              <Text style={{ color: "#fcd34d", fontSize: 20, marginTop: 4 }}>
                {Math.round(totals.carbs)}g
              </Text>
              {renderGoalStatus(carbsGoal, `of ${carbsGoal}g`)}
            </View>

            <View
              style={{
                backgroundColor: "#3a3535",
                borderRadius: 16,
                padding: 9,
                borderLeftWidth: 6,
                borderLeftColor: "#16A34A",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Fat</Text>
              <Text style={{ color: "#16A34A", fontSize: 20, marginTop: 4 }}>
                {Math.round(totals.fat)}g
              </Text>
              {renderGoalStatus(fatGoal, `of ${fatGoal}g`)}
            </View>
          </View>
        </View>
      ) : null}
        <View
          style={{
            marginTop: showCustomEntry ? 0 : -150,
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
            onEndReached={loadMoreResults}
            onEndReachedThreshold={0.2}
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
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 12 }}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null
            }
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
