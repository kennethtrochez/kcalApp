import { useState, useMemo, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, TextInput, Pressable, Text, FlatList, ActivityIndicator, Image } from "react-native";

import { searchFoods, FoodPreview, getFoodDetails } from "../../services/foodService";
import { addToDayLog, getTodayKey, getDayLog } from "../../lib/storage";
import { totalMacrosForEntries } from "../../utils/macros";
import { makeId, LogEntry } from "../../data/food";
import BodyFill from "../../components/BodyFill";

export default function SearchScreen() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const calorieGoal = 2000;

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
          fontSize: 22,
          fontWeight: "700",
          color: "#fff"
        }}
      >
        Search
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search foods (ex: rice)"
        placeholderTextColor={"#888"}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10,
          color: "#000",
          backgroundColor: "#fff"
        }}
        onSubmitEditing={onSearch}
        returnKeyType="search"
      />

      <Pressable
        onPress={onSearch}
        style={{
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ccc",
          backgroundColor: "#444",
        }}
      >
        <Text>Search</Text>
      </Pressable>

      {loading ? <ActivityIndicator /> : null}

      {error ? (
        <Text style={{ color: "red" }}>{error}</Text>
      ) : null}

      {results.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
        <BodyFill
          width={370}
          height={680}
          caloriesConsumed={totals.calories}
          calorieGoal={calorieGoal}
          proteinG={totals.protein}
          carbsG={totals.carbs}
          fatG={totals.fat}
        />
        </View>
      ) : (

        <FlatList
          data={results}
          keyExtractor={(item) => String(item.fdcId)}

          renderItem={({ item }) => (
            <Pressable
              onPress={async () => {
                try {

                  setError(null);
                  setLoading(true);

                  const food = await getFoodDetails(item.fdcId);

                  const entry: LogEntry = {
                    id: makeId(),
                    food,
                    servings: 1,
                    eatenAtISO: new Date().toISOString(),
                  };

                  const updated = await addToDayLog(getTodayKey(), entry);
                  setEntries(updated);

                  // optional but recommended so you return to the body view immediately
                  setResults([]);
                  setQuery("");

                } catch (e: any) {
                  setError(e?.message ?? "Failed to log food");
                } finally {
                  setLoading(false);
                }
              }}

              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
              }}
            >

              <Text
                style={{
                  fontWeight: "600",
                  color: "#000"
                }}
              >
                {item.description}
              </Text>

              <Text
                style={{
                  color: "#444"
                }}
              >
                {item.brandOwner ?? item.dataType}
              </Text>

              <Text
                style={{
                  color: "#007AFF",
                  marginTop: 4
                }}
              >
                Tap to log
              </Text>

            </Pressable>
          )}

          ListEmptyComponent={
            !loading && query.trim().length > 0 ? (
              <Text style={{ opacity: 0.7 }}>No results.</Text>
            ) : null
          }
        />

      )}

    </View>
  );
}