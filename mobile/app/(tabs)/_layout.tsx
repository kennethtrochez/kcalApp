import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

function TabBarIcon({
  focused,
  color,
  label,
  activeIcon,
  inactiveIcon,
}: {
  focused: boolean;
  color: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        minWidth: 64,
        height: 58,
        marginTop: 10,
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: focused ? "rgba(107, 92, 255, 0.18)" : "transparent",
        }}
      >
        <Ionicons
          name={focused ? activeIcon : inactiveIcon}
          size={20}
          color={color}
        />
      </View>

      <Text
        style={{
          fontSize: 10,
          color,
          fontWeight: focused ? "700" : "500",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6b5cff",
        tabBarInactiveTintColor: "#b0aaaa",
        tabBarStyle: {
          position: "absolute",
          bottom: 18,
          height: 80,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarLabel: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              label="Home"
              activeIcon="home"
              inactiveIcon="home-outline"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="log"
        options={{
          title: "Log",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              label="Log"
              activeIcon="list"
              inactiveIcon="list-outline"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              label="Calendar"
              activeIcon="calendar"
              inactiveIcon="calendar-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}