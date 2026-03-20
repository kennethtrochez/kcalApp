import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
        minWidth: 60,
        height: 48,
        marginTop: 0,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: focused ? "rgba(107, 92, 255, 0.18)" : "transparent",
        }}
      >
        <Ionicons
          name={focused ? activeIcon : inactiveIcon}
          size={21}
          color={color}
        />
      </View>

      <Text
        style={{
          fontSize: 11,
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
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6b5cff",
        tabBarInactiveTintColor: "#c6c0c0",
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 74 + insets.bottom,
          backgroundColor: "#332f2f",
          borderTopWidth: 0,
          borderRadius: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 15,
          paddingBottom: Math.max(8, insets.bottom),
        },
        tabBarLabel: () => null,
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              label="Profile"
              activeIcon="person"
              inactiveIcon="person-outline"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scanner",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              label="Scanner"
              activeIcon="scan"
              inactiveIcon="scan-outline"
            />
          ),
        }}
      />

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
