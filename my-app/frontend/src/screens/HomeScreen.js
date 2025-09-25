import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <Button title="Go to Profile" onPress={() => navigation.navigate("")} />
      <Button title="Go to Settings" onPress={() => navigation.navigate("")} />
      <Button title="Go to Dashboard" onPress={() => navigation.navigate("")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, marginBottom: 20 },
});
