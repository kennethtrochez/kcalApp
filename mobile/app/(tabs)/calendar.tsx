import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { LogEntry } from "../../data/food";
import { getDayLog, getDayWaterOz } from "../../lib/storage";
import { getProfile, UserProfile } from "../../lib/profileStorage";
import { totalMacrosForEntries } from "../../utils/macros";

type DayActivity = {
  hasFood: boolean;
  hasWater: boolean;
};

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatLoggedTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDefaultSelectedDate(monthDate: Date) {
  const today = new Date();

  if (isSameMonth(today, monthDate)) {
    return today;
  }

  return new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
}

export default function CalendarScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(() => today);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [waterOz, setWaterOz] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [monthActivity, setMonthActivity] = useState<Record<string, DayActivity>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);

  const [fontsLoaded] = useFonts({
    MetalMania: require("../../assets/fonts/MetalMania-Regular.ttf"),
  });

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        try {
          setLoadingMonth(true);

          const year = visibleMonth.getFullYear();
          const month = visibleMonth.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const monthDates = Array.from({ length: daysInMonth }, (_, index) => {
            return new Date(year, month, index + 1);
          });

          const activityEntries = await Promise.all(
            monthDates.map(async (date) => {
              const dayKey = getDateKey(date);
              const [dayEntries, dayWaterOz] = await Promise.all([
                getDayLog(dayKey),
                getDayWaterOz(dayKey),
              ]);

              return [
                dayKey,
                {
                  hasFood: dayEntries.length > 0,
                  hasWater: dayWaterOz > 0,
                },
              ] as const;
            })
          );

          if (alive) {
            setMonthActivity(Object.fromEntries(activityEntries));
          }
        } finally {
          if (alive) {
            setLoadingMonth(false);
          }
        }
      })();

      return () => {
        alive = false;
      };
    }, [visibleMonth])
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        try {
          setLoadingDay(true);

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
        } finally {
          if (alive) {
            setLoadingDay(false);
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
      (a, b) => new Date(a.eatenAtISO).getTime() - new Date(b.eatenAtISO).getTime()
    );
  }, [entries]);

  const calendarCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstDay.getDay();
    const cells: Array<
      | {
          key: string;
          date: Date;
          dayNumber: number;
          isSelected: boolean;
          isToday: boolean;
          activity?: DayActivity;
        }
      | null
    > = [];

    for (let index = 0; index < leadingBlanks; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const dayKey = getDateKey(date);

      cells.push({
        key: dayKey,
        date,
        dayNumber: day,
        isSelected: isSameDay(date, selectedDate),
        isToday: isSameDay(date, today),
        activity: monthActivity[dayKey],
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [monthActivity, selectedDate, today, visibleMonth]);

  if (!fontsLoaded) {
    return null;
  }

  const calorieGoal = profile?.dailyCalories;
  const proteinGoal = profile?.proteinGoal;
  const carbsGoal = profile?.carbsGoal;
  const fatGoal = profile?.fatGoal;
  const waterGoal = profile?.waterGoalOz;
  const hasProfile = Boolean(profile?.profileCreatedAt);
  const monthLabel = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const selectedDateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function changeMonth(offset: number) {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1
    );

    setVisibleMonth(nextMonth);
    setSelectedDate(getDefaultSelectedDate(nextMonth));
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#2e2a2a" }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 58,
        paddingBottom: tabBarHeight + 56,
        gap: 14,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
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
          Calendar
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 20,
          padding: 14,
          borderWidth: 1,
          borderColor: "#4a4545",
          gap: 12,
        }}
      >
        {!hasProfile ? (
          <View
            style={{
              borderRadius: 16,
              padding: 14,
              backgroundColor: "#2e2a2a",
              borderWidth: 1,
              borderColor: "#4a4545",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              Set up a profile for goals
            </Text>
            <Text style={{ color: "#b8b0b0", fontSize: 13, lineHeight: 20, marginTop: 6 }}>
              Calorie, macro, and water goals are available after you create a profile in the Profile tab.
            </Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={() => changeMonth(-1)}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? "#4a4545" : "#2e2a2a",
              borderWidth: 1,
              borderColor: "#4a4545",
            })}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              {monthLabel}
            </Text>
            {loadingMonth ? (
              <Text style={{ color: "#8d84ff", fontSize: 12, marginTop: 2 }}>
                Loading activity...
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => changeMonth(1)}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? "#4a4545" : "#2e2a2a",
              borderWidth: 1,
              borderColor: "#4a4545",
            })}
          >
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row" }}>
          {weekDayLabels.map((label) => (
            <View
              key={label}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: "#8f8a8a", fontSize: 12, fontWeight: "700" }}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          {Array.from({ length: calendarCells.length / 7 }, (_, rowIndex) => {
            const row = calendarCells.slice(rowIndex * 7, rowIndex * 7 + 7);

            return (
              <View key={`row-${rowIndex}`} style={{ flexDirection: "row", gap: 8 }}>
                {row.map((cell, cellIndex) => {
                  if (!cell) {
                    return <View key={`blank-${rowIndex}-${cellIndex}`} style={{ flex: 1 }} />;
                  }

                  const indicatorColor =
                    cell.activity?.hasFood && cell.activity?.hasWater
                      ? "#6b5cff"
                      : cell.activity?.hasFood
                        ? "#8d84ff"
                        : cell.activity?.hasWater
                          ? "#6fb7df"
                          : null;

                  return (
                    <Pressable
                      key={cell.key}
                      onPress={() => setSelectedDate(cell.date)}
                      style={{
                        flex: 1,
                        minHeight: 52,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: cell.isSelected ? "#6b5cff" : "#2e2a2a",
                        borderWidth: 1,
                        borderColor: cell.isSelected
                          ? "#8d84ff"
                          : cell.isToday
                            ? "#6b5cff"
                            : "#4a4545",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: cell.isSelected ? "700" : "600",
                        }}
                      >
                        {cell.dayNumber}
                      </Text>

                      {indicatorColor ? (
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: cell.isSelected ? "#fff" : indicatorColor,
                            marginTop: 6,
                          }}
                        />
                      ) : (
                        <View style={{ width: 6, height: 6, marginTop: 6 }} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 20,
          padding: 14,
          borderWidth: 1,
          borderColor: "#4a4545",
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              {selectedDateLabel}
            </Text>
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
              {getDateKey(selectedDate)}
            </Text>
          </View>

          {loadingDay ? <ActivityIndicator color="#fff" /> : null}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
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
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 2 }}>
              {calorieGoal !== undefined ? `of ${calorieGoal} kcal` : "Goal not set"}
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
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 2 }}>
              {proteinGoal !== undefined ? `of ${proteinGoal}g` : "Goal not set"}
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
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 2 }}>
              {carbsGoal !== undefined ? `of ${carbsGoal}g` : "Goal not set"}
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
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 2 }}>
              {fatGoal !== undefined ? `of ${fatGoal}g` : "Goal not set"}
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
              borderLeftColor: "#3276a0",
            }}
          >
            <Text style={{ color: "#aaa", fontSize: 12 }}>Water</Text>
            <Text style={{ color: "#8fd3ff", fontSize: 18, fontWeight: "700", marginTop: 2 }}>
              {waterOz} oz
            </Text>
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 2 }}>
              {waterGoal !== undefined ? `of ${waterGoal} oz` : "No water goal set"}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#3a3535",
          borderRadius: 20,
          padding: 14,
          borderWidth: 1,
          borderColor: "#4a4545",
          gap: 12,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          Food Log
        </Text>

        {sortedEntries.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 20,
            }}
          >
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: "#2e2a2a",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#4a4545",
                marginBottom: 10,
              }}
            >
              <Ionicons name="restaurant-outline" size={26} color="#aaa" />
            </View>

            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              No foods logged
            </Text>
            <Text
              style={{
                color: "#aaa",
                fontSize: 13,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Logged foods for this date will appear here.
            </Text>
          </View>
        ) : (
          sortedEntries.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: "#2f2a2a",
                padding: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#4a4545",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                    {item.food.name}
                  </Text>
                  {item.food.brandOwner ? (
                    <Text style={{ color: "#aaa", fontSize: 12, marginTop: 3 }}>
                      {item.food.brandOwner}
                    </Text>
                  ) : null}
                  <Text style={{ color: "#8f8a8a", fontSize: 12, marginTop: 6 }}>
                    {formatLoggedTime(item.eatenAtISO)}
                  </Text>
                </View>

                <Text style={{ color: "#6b5cff", fontSize: 14, fontWeight: "700" }}>
                  {Math.round(item.food.calories * item.servings)} kcal
                </Text>
              </View>

              <Text style={{ color: "#d1d1d1", marginTop: 10, fontSize: 13 }}>
                Servings: {item.servings} | {Math.round(item.food.calories)} cal per serving
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
