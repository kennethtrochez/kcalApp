import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, Image } from "react-native";
import { LogEntry } from "../../data/food";
import { clearDayLog, getDayLog, getTodayKey } from "../../lib/storage";
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

            <Text
              style={{
                color: "#d1d1d1",
                marginTop: 10,
                fontSize: 13,
              }}
            >
              Servings: {item.servings} | {Math.round(item.food.calories)} cal per serving
            </Text>
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
