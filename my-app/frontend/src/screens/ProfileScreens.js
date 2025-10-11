import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProfileScreens = () => {
  const navigation = useNavigation();

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await fetch("http://192.168.8.101:5000/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          console.log("Error fetching profile:", data.msg);
          return;
        }

        setName(data.name);
        setEmail(data.email);
        setBio(data.bio || "");
        setLoading(false);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://192.168.8.101:5000/api/auth/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, bio }),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.msg || "Failed to update profile");
        return;
      }

      Alert.alert("Success", "Profile updated successfully");
      setEditMode(false);
    } catch (err) {
      console.error("Update profile error:", err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          navigation.replace("Login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo Section */}
        <View style={styles.coverPhotoContainer}>
          <Image
            source={
              coverPhoto
                ? { uri: coverPhoto }
                : require("../../assets/logo.png")
            }
            style={styles.coverPhoto}
          />
          <View style={styles.coverOverlay} />

          {/* Edit Cover Button */}
          {editMode && (
            <TouchableOpacity style={styles.editCoverBtn}>
              <Text style={styles.editCoverText}>📷</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Photo & Name Section */}
        <View style={styles.profileHeaderSection}>
          <View style={styles.profilePhotoWrapper}>
            <Image
              source={
                profilePhoto
                  ? { uri: profilePhoto }
                  : require("../../assets/icon.png")
              }
              style={styles.profilePhoto}
            />
            {editMode && (
              <TouchableOpacity style={styles.editPhotoBtn}>
                <Text style={styles.editPhotoIcon}>📷</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name & Bio Display/Edit */}
          <View style={styles.profileInfo}>
            {editMode ? (
              <TextInput
                style={styles.nameInputEdit}
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.profileName}>{name || "Your Name"}</Text>
            )}

            {editMode ? (
              <TextInput
                style={styles.bioInputEdit}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#999"
                multiline
              />
            ) : (
              <Text style={styles.profileBio}>
                {bio || "Add a bio to tell others about yourself"}
              </Text>
            )}
          </View>
        </View>

        {/* Stats Section - Instagram Style */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Proposals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>89</Text>
            <Text style={styles.statLabel}>Investments</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {editMode ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.actionButtonIcon}>✓</Text>
                <Text style={styles.actionButtonText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setEditMode(false)}
              >
                <Text style={styles.cancelButtonIcon}>✕</Text>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => setEditMode(true)}
            >
              <Text style={styles.actionButtonIcon}>✏️</Text>
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Text style={styles.detailIcon}>📧</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email Address</Text>
                {editMode ? (
                  <TextInput
                    style={styles.detailInputEdit}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@example.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                  />
                ) : (
                  <Text style={styles.detailValue}>
                    {email || "Not provided"}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Text style={styles.detailIcon}>💼</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Account Type</Text>
                <Text style={styles.detailValue}>Investor</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Text style={styles.detailIcon}>📅</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Member Since</Text>
                <Text style={styles.detailValue}>January 2025</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings & Actions Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings & Privacy</Text>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔒</Text>
            <Text style={styles.settingText}>Privacy & Security</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>❓</Text>
            <Text style={styles.settingText}>Help & Support</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>ℹ️</Text>
            <Text style={styles.settingText}>About</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
  },
  loadingText: {
    fontSize: 16,
    color: "#65676B",
    fontWeight: "500",
  },

  // Cover Photo Styles
  coverPhotoContainer: {
    height: 200,
    backgroundColor: "#6750A4",
    position: "relative",
  },
  coverPhoto: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  editCoverBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  editCoverText: {
    fontSize: 20,
  },

  // Profile Header Section
  profileHeaderSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: "center",
    marginTop: -50,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  profilePhotoWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: "#FFFFFF",
  },
  editPhotoBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6750A4",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  editPhotoIcon: {
    fontSize: 16,
  },

  // Profile Info
  profileInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  profileName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1C1E21",
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 15,
    color: "#65676B",
    textAlign: "center",
    lineHeight: 22,
  },
  nameInputEdit: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1C1E21",
    marginBottom: 8,
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#6750A4",
    paddingBottom: 4,
    minWidth: 200,
  },
  bioInputEdit: {
    fontSize: 15,
    color: "#1C1E21",
    textAlign: "center",
    lineHeight: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#6750A4",
    paddingBottom: 4,
    minWidth: 250,
    paddingHorizontal: 10,
  },

  // Stats Section
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1C1E21",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#65676B",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E4E6EB",
    marginHorizontal: 10,
  },

  // Action Buttons
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: "#6750A4",
  },
  saveButton: {
    backgroundColor: "#34A853",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E4E6EB",
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButtonIcon: {
    fontSize: 20,
    color: "#65676B",
  },
  cancelButtonText: {
    color: "#65676B",
    fontSize: 16,
    fontWeight: "700",
  },

  // Details Section
  detailsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1E21",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailIcon: {
    fontSize: 20,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: "#65676B",
    marginBottom: 4,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#1C1E21",
    fontWeight: "600",
  },
  detailInputEdit: {
    fontSize: 16,
    color: "#1C1E21",
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: "#6750A4",
    paddingBottom: 4,
  },

  // Settings Section
  settingsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#1C1E21",
    fontWeight: "600",
  },
  settingArrow: {
    fontSize: 24,
    color: "#65676B",
  },

  // Logout Section
  logoutSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF3B30",
    gap: 8,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ProfileScreens;
