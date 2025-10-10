import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";

const MentorFormScreen = () => {
  const [name, setName] = useState("");
  const [expertise, setExpertise] = useState("");
  const [bio, setBio] = useState("");

  const handleSubmit = () => {
    alert("Mentor profile submitted!");
    setName("");
    setExpertise("");
    setBio("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mentor Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>Area of Expertise</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Eg: Marketing, Finance, Tech"
          value={expertise}
          onChangeText={setExpertise}
        />
        <Text style={styles.label}>Short Bio</Text>
        <TextInput
          style={[styles.inputField, { height: 80 }]}
          placeholder="Tell us about yourself"
          value={bio}
          onChangeText={setBio}
          multiline
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  inputField: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#6750A4",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default MentorFormScreen;
