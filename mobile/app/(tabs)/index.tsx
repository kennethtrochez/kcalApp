import { useState } from "react";
import { View, TextInput, Pressable, Text, FlatList, ActivityIndicator } from "react-native"
import { searchFoods, FoodPreview, getFoodDetails } from "../../services/foodService";
import { addToDayLog, getTodayKey } from "../../lib/storage";
import { makeId, LogEntry } from "../../data/food";

export default function SearchScreen(){
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSearch(){
    try{
      setError(null);
      setLoading(true);
      const data = await searchFoods(query);
      setResults(data);
    } catch (e: any){
      setError(e?.message ?? "Search failed");
    } finally{
      setLoading(false);
    }
  }

  return (
    <View style={{flex: 1, backgroundColor: "#BFE9FF",padding: 16, gap: 12}}>
      <Text style={{fontSize: 22, fontWeight: "700", color: "#fff"}}>Search</Text>

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
          }}
        >
          <Text>Search</Text>
        </Pressable>

        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={{color: "red"}}>{error}</Text>: null}

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

                  await addToDayLog(getTodayKey(), entry);
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
              <Text style={{ fontWeight: "600", color: "#000" }}>{item.description}</Text>
              <Text style={{ color: "#444" }}>{item.brandOwner ?? item.dataType}</Text>
              <Text style={{ color: "#007AFF", marginTop: 4 }}>Tap to log</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading && query.trim().length > 0 ? <Text style={{opacity: 0.7}}>No results.</Text> : null
          }
        />
    </View>
  )
}