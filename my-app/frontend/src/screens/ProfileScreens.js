import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const rolesList = ["Entrepreneur", "Mentor", "Investor", "Franchise Owner"];

const ProfileScreens = () => {
  const navigation = useNavigation();
  // Example state (replace with real data/fetch)
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [name, setName] = useState("Inaam");
  const [roles, setRoles] = useState(["Entrepreneur"]);
  const [bio, setBio] = useState("Building the future of scale-ups!");
  const [email, setEmail] = useState("inaam@email.com");
  const [phone, setPhone] = useState("");
  const [showContact, setShowContact] = useState(true);
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [portfolio, setPortfolio] = useState("");
  // Activity overview (dummy)
  const [posts, setPosts] = useState(12);
  const [ratings, setRatings] = useState({ given: 5, received: 8 });
  const [meetings, setMeetings] = useState(3);

  const handleLogout = () => {
    navigation.replace("Login");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Cover Photo */}
      <View style={styles.coverPhotoContainer}>
        <Image
          source={
            coverPhoto ? { uri: coverPhoto } : require("../../assets/logo.png")
          }
          style={styles.coverPhoto}
        />
        {/* Profile Photo */}
        <View style={styles.profilePhotoWrapper}>
          <Image
            source={
              profilePhoto
                ? { uri: profilePhoto }
                : require("../../assets/icon.png")
            }
            style={styles.profilePhoto}
          />
        </View>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.rolesRow}>
          {rolesList.map((role) => (
            <View
              key={role}
              style={[
                styles.roleBadge,
                roles.includes(role) && styles.roleBadgeActive,
              ]}
            >
              <Text style={styles.roleText}>{role}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.bio}>{bio}</Text>
      </View>

      {/* Contact & Socials */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact & Socials</Text>
        <View style={styles.rowBetween}>
          <Text>Email: {email}</Text>
          <Switch value={showContact} onValueChange={setShowContact} />
        </View>
        {showContact && <Text>Phone: {phone || "Not provided"}</Text>}
        <TextInput
          style={styles.input}
          placeholder="LinkedIn URL"
          value={linkedin}
          onChangeText={setLinkedin}
        />
        <TextInput
          style={styles.input}
          placeholder="Website"
          value={website}
          onChangeText={setWebsite}
        />
        <TextInput
          style={styles.input}
          placeholder="Portfolio"
          value={portfolio}
          onChangeText={setPortfolio}
        />
      </View>

      {/* Activity Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Overview</Text>
        <Text>Posts created: {posts}</Text>
        <Text>Ratings given: {ratings.given}</Text>
        <Text>Ratings received: {ratings.received}</Text>
        <Text>Meetings scheduled: {meetings}</Text>
      </View>

      {/* Account & Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account & Settings</Text>
        <TouchableOpacity style={styles.button}>
          <Text>Edit Profile Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text>Change Password / Preferences</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text>Privacy & Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={{ color: "#fff" }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  coverPhotoContainer: {
    height: 140,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  coverPhoto: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  profilePhotoWrapper: {
    position: "absolute",
    bottom: -40,
    left: "50%",
    marginLeft: -40,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#fff",
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  section: {
    marginTop: 60,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  rolesRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  roleBadge: {
    backgroundColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  roleBadgeActive: {
    backgroundColor: "#6750A4",
  },
  roleText: {
    color: "#333",
    fontSize: 12,
  },
  bio: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#6750A4",
  },
});

export default ProfileScreens;
