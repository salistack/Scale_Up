import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const navigation = useNavigation();

  const handleSignUp = async () => {
    try {
      const response = await fetch(
        "http://192.168.1.101:5000/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: username,
            email,
            password,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        // Save user info and token to AsyncStorage if returned
        if (data.user) {
          await AsyncStorage.setItem("user", JSON.stringify(data.user));
        }
        if (data.token) {
          await AsyncStorage.setItem("token", data.token);
        }
        alert("Signup successful!");
        navigation.navigate("HomeTabs");
      } else {
        alert(data.msg || "Signup failed");
      }
    } catch (error) {
      alert("Error connecting to server");
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      {/* Form Section */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <Text style={styles.signupText}>
          Already have an account?{" "}
          <Text
            style={styles.signupLink}
            onPress={() => navigation.navigate("Login")}
          >
            Sign in
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 29,
    justifyContent: "center",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 390,
    backgroundColor: "#ffffffff",
  },
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: 10,
  },
  formContainer: {
    flex: 2,
    justifyContent: "flex-start",
    backgroundColor: "#ffffffff",
    marginTop: -450,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#6750A4",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupText: {
    marginTop: 23,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
  signupLink: {
    color: "#6750A4",
    fontWeight: "bold",
  },
});

export default SignUp;
