import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { LogEntry } from "../../data/food";
import { clearDayLog, getDayLog, getTodayKey } from "../../lib/storage";
import { totalMacrosForEntries } from "../../utils/macros";

export default function LogScreen() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const dayKey = getTodayKey();

  async function refresh() {
    const data = await getDayLog(dayKey);
    setEntries(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  const totals = totalMacrosForEntries(entries);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "#BFE9FF" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#000" }}>Today</Text>
      <Text style={{ color: "#000" }}>{dayKey}</Text>

      <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#fff", gap: 6 }}>
        <Text style={{ color: "#000" }}>Calories: {Math.round(totals.calories)}</Text>
        <Text style={{ color: "#000" }}>Protein: {Math.round(totals.protein)} g</Text>
        <Text style={{ color: "#000" }}>Carbs: {Math.round(totals.carbs)} g</Text>
        <Text style={{ color: "#000" }}>Fat: {Math.round(totals.fat)} g</Text>
      </View>

      <Pressable
        onPress={async () => {
          await clearDayLog(dayKey);
          await refresh();
        }}
        style={{ paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#ff3b30" }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>Clear Today</Text>
      </Pressable>

      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10 }}>
            <Text style={{ color: "#000", fontWeight: "700" }}>{item.food.name}</Text>
            <Text style={{ color: "#444" }}>
              Servings: {item.servings} | {item.food.calories} cal per serving
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: "#000" }}>No foods logged yet.</Text>}
      />
    </View>
  );
}