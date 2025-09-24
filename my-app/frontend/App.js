import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';

export default function App() {
  const [message, setMessage] = useState("Welcome to ScaleUp App!");

  const handlePress = () => {
    setMessage("You pressed the button! 🚀");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      <Button title="Press Me" onPress={handlePress} color="#6200ee" />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});
