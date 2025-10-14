import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const navigation = useNavigation();

  // Dynamic backend URL - use localhost for web, IP address for mobile
  const getBackendUrl = () => {
    if (Platform.OS === 'web') {
      return 'http://localhost:5000';
    }
    // For mobile devices, use your computer's IP address
    return 'http://10.161.162.45:5000';
  };

  // Ensure the web browser completes the auth flow properly on native
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  // Support both modern (expoConfig) and legacy (manifest) ways of accessing extra
  // Hardcode the value if env fails to load - remove this fallback in production
  const googleClientId =
    Constants.expoConfig?.extra?.googleClientId ||
    Constants.manifest?.extra?.googleClientId ||
    Constants.manifest2?.extra?.googleClientId ||
    "1028686468313-n0dbn7b0r882ehu2jaomqp413b9q8798.apps.googleusercontent.com";
  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ useProxy: true }),
    []
  );
  const discovery = AuthSession.useAutoDiscovery("https://accounts.google.com");

  const handleSignIn = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username, // login by username
          password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        // Save user info and token to AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("token", data.token);
        alert("Login successful!");
        navigation.replace("HomeTabs");
      } else {
        alert(data.msg || "Login failed");
      }
    } catch (error) {
      alert("Error connecting to server");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log("Google Client ID:", googleClientId);
      
      if (!googleClientId) {
        alert("Missing Google Client ID. Please configure expo.extra.googleClientId in app.json.");
        return;
      }
      setLoadingGoogle(true);

      // Use authorization code flow with PKCE disabled
      const req = new AuthSession.AuthRequest({
        clientId: googleClientId,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        scopes: ["openid", "profile", "email"],
        extraParams: { 
          prompt: "select_account",
          access_type: "offline"
        },
        // Ensure PKCE is properly disabled
        usePKCE: false,
        codeChallenge: undefined,
        codeChallengeMethod: undefined,
      });

      console.log("Auth request config:", {
        clientId: googleClientId,
        redirectUri,
        usePKCE: false,
        responseType: AuthSession.ResponseType.Code
      });

      const result = await req.promptAsync(discovery);
      console.log("Auth result:", result);

      if (result.type !== "success" || !result.params?.code) {
        if (result.type !== "dismiss") {
          alert("Google sign-in was cancelled or failed.");
        }
        return;
      }

      const authCode = result.params.code;

      // For web application OAuth, send the authorization code to backend
      // Backend will exchange it for tokens using the client secret
      console.log("Sending to backend:", { authCode: authCode.substring(0, 20) + "...", redirectUri });
      
      const backendResponse = await fetch(`${getBackendUrl()}/api/auth/oauth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          authCode: authCode,
          redirectUri: redirectUri 
        }),
      });
      
      const data = await backendResponse.json().catch(() => ({}));
      if (!backendResponse.ok) {
        alert(data?.msg || "Google OAuth failed on server");
        return;
      }

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);
      alert("Signed in with Google successfully!");
      navigation.replace("HomeTabs");
    } catch (e) {
      console.error("Google sign-in error:", e);
      alert("Google sign-in error: " + (e?.message || String(e)));
    } finally {
      setLoadingGoogle(false);
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
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>
        <TouchableOpacity
          style={[styles.button, styles.googleButton, loadingGoogle && { opacity: 0.7 }]}
          onPress={handleGoogleSignIn}
          disabled={loadingGoogle}
        >
          <Text style={[styles.buttonText, styles.googleButtonText]}>
            {loadingGoogle ? "Signing in..." : "Continue with Google"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.signupText}>
          Don't have an account?{" "}
          <Text
            style={styles.signupLink}
            onPress={() => navigation.navigate("SignUp")}
          >
            Sign up
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
    paddingBottom: 60,
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
    marginTop: -100,
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
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    gap: 10,
  },
  orLine: {
    height: 1,
    backgroundColor: "#e0e0e0",
    flex: 1,
  },
  orText: {
    color: "#666",
    paddingHorizontal: 8,
  },
  googleButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  googleButtonText: {
    color: "#000",
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

export default LoginScreen;
