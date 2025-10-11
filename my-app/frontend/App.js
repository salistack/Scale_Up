import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// Import stack screens
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignUp";
import InvestorForm from "./src/screens/InvestorForm";
import InvestorFeed from "./src/screens/InvestorFeed";
import EditProposal from "./src/screens/EditProposal";
import CreatePostScreen from "./src/screens/CreatePostScreen";
import FranchiseFormScreen from "./src/screens/FranchiseFormScreen";

// Import Bottom Tabs
import BottomTabs from "./src/navigation/BottomTabs";

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* Login screen */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />

          {/* Home replaced by Bottom Tabs - keep this first to ensure it's the main view */}
          <Stack.Screen
            name="HomeTabs"
            component={BottomTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="InvestorForm"
            component={InvestorForm}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="InvestorFeed"
            component={InvestorFeed}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="EditProposal" component={EditProposal} options={{ headerShown: false }} />
          <Stack.Screen
            name="SignUp"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreatePostScreen"
            component={CreatePostScreen}
            options={{ title: "Create Post" }}
          />
          <Stack.Screen
            name="FranchiseForm"
            component={FranchiseFormScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
