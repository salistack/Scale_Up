import React from "react";
import { Platform, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import CalendarScreen from "../screens/CalendarScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
import NotificationScreen from "../screens/NotificationScreen";
import ProfileScreen from "../screens/ProfileScreens";

const Tab = createBottomTabNavigator();

// Custom button for the "Create Post" tab
const PlusButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={styles.plusButtonContainer}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {children}
  </TouchableOpacity>
);

export default function BottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#2f95dc",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          paddingBottom: Platform.OS === "android" ? 6 : 10,
          height: 60,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Calendar":
              iconName = focused ? "calendar" : "calendar-outline";
              break;
            case "CreatePost":
              // Use a blank icon because we are using a custom button
              return <Ionicons name="add" size={30} color="#fff" />;
            case "Notifications":
              iconName = focused ? "notifications" : "notifications-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "ellipse";
          }

          return route.name === "CreatePost" ? null : (
            <Ionicons name={iconName} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          tabBarLabel: "",
          tabBarButton: (props) => (
            <PlusButton {...props}>
              <View style={styles.plusIcon}>
                <Ionicons name="add" size={30} color="#fff" />
              </View>
            </PlusButton>
          ),
        }}
      />
      <Tab.Screen name="Notifications" component={NotificationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  plusButtonContainer: {
    top: -20,
    justifyContent: "center",
    alignItems: "center",
  },
  plusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2f95dc",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
