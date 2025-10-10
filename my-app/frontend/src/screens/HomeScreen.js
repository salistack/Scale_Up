import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = () => {
  const handleDeletePost = async (postId) => {
    const token = await AsyncStorage.getItem("token");
    try {
      const response = await fetch(
        `http://192.168.178.202:5000/api/entrepreneur/posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        // Refresh posts after deletion
        loadUserAndPosts();
      } else {
        alert("You can only delete your own posts.");
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);
  const [userName, setUserName] = useState("");
  const [posts, setPosts] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null); // Track expanded post ID
  const [mentors, setMentors] = useState([]);
  const navigation = useNavigation();

  const loadUserAndPosts = async () => {
    // Get user name
    const userData = await AsyncStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name || "");
    }

    // Get JWT token directly
    const token = await AsyncStorage.getItem("token");

    // Fetch entrepreneur posts with Authorization header
    try {
      const response = await fetch(
        "http://192.168.178.202:5000/api/entrepreneur/posts",
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await response.json();
      // Defensive: ensure posts is always an array
      if (Array.isArray(data)) {
        setPosts(data);
      } else if (data && Array.isArray(data.posts)) {
        setPosts(data.posts);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    }
  };

  useEffect(() => {
    fetch("http://192.168.178.202:5000/api/mentors")
      .then((res) => res.json())
      .then((data) => setMentors(data))
      .catch(() => setMentors([]));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserAndPosts();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>Good morning, {userName}!</Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.getParent()?.navigate("InvestorFeed")}
        >
          <Text style={styles.ctaText}>Investor Feeds</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.feedSection}>
          <Text style={styles.feedSectionTitle}>Entrepreneur Posts</Text>
          {posts.length === 0 ? (
            <Text>No posts yet.</Text>
          ) : (
            posts.map((post) => (
              <View key={post._id} style={styles.feedCard}>
                {/* Show poster's name and menu button in a row */}
                <View style={styles.feedCardTopRow}>
                  <Text style={styles.feedAuthorName}>
                    {post.user && post.user.name ? post.user.name : "Unknown"}
                  </Text>
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => {
                      setMenuVisible(true);
                      setMenuPostId(post._id);
                    }}
                  >
                    <Text style={styles.menuDots}>⋯</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.feedHeader}>
                  <Text style={styles.feedTitle}>{post.businessTitle}</Text>
                </View>
                {/* Menu Modal */}
                {menuVisible && menuPostId === post._id && (
                  <Modal
                    transparent
                    animationType="fade"
                    visible={menuVisible}
                    onRequestClose={() => setMenuVisible(false)}
                  >
                    <TouchableOpacity
                      style={styles.menuOverlay}
                      activeOpacity={1}
                      onPress={() => setMenuVisible(false)}
                    >
                      <View style={styles.menuContainer}>
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => {
                            /* TODO: handle update */ setMenuVisible(false);
                          }}
                        >
                          <Text style={styles.menuText}>Update</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => {
                            handleDeletePost(post._id);
                            setMenuVisible(false);
                          }}
                        >
                          <Text style={styles.menuText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Modal>
                )}
                {expandedPostId === post._id && post.longDescription ? (
                  <Text style={styles.feedDescription}>
                    {post.longDescription}
                    <Text
                      style={styles.moreText}
                      onPress={() => setExpandedPostId(null)}
                    >
                      {" "}
                      less..
                    </Text>
                  </Text>
                ) : (
                  <Text style={styles.feedDescription}>
                    {post.shortDescription}
                    {post.longDescription && (
                      <Text
                        style={styles.moreText}
                        onPress={() => setExpandedPostId(post._id)}
                      >
                        {" "}
                        more..
                      </Text>
                    )}
                  </Text>
                )}
                <Text style={styles.feedAuthor}>{post.industry}</Text>
                <Text style={styles.feedAuthor}>{post.tagline}</Text>
                {/* Display all Cloudinary images below industry and tagline */}
                {post.images && post.images.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 8 }}
                  >
                    {post.images.map((imgUrl, idx) => (
                      <Image
                        key={imgUrl + idx}
                        source={{ uri: imgUrl }}
                        style={{
                          width: 200,
                          height: 200,
                          borderRadius: 12,
                          marginRight: 10,
                        }}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                )}
                {/* Add more fields/images as needed */}
                <View style={styles.feedcardBottom}>
                  <View style={styles.feedcardLike}>
                    <Text style={styles.feedLike}>like</Text>
                  </View>
                  <View style={styles.feedcardActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        /* TODO: handle download */
                      }}
                    >
                      <Text style={{ color: "#ffffffff", fontWeight: "bold" }}>
                        download
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        /* TODO: handle qr */
                      }}
                    >
                      <Text style={{ color: "#ffffffff", fontWeight: "bold" }}>
                        qr
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={styles.mentorSection}>
          <Text style={styles.sectionTitle}>Mentor Profiles</Text>
          {mentors.length === 0 ? (
            <Text style={styles.noMentor}>No mentors yet.</Text>
          ) : (
            mentors.map((mentor, idx) => (
              <View key={idx} style={styles.mentorCard}>
                <Text style={styles.mentorName}>{mentor.name}</Text>
                <Text style={styles.mentorExpertise}>{mentor.expertise}</Text>
                <Text style={styles.mentorBio}>{mentor.bio}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  feedCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    //backgroundColor: "#fffefeff",
  },
  menuDots: {
    fontSize: 24,
    color: "#666",
    fontWeight: "bold",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 5,
    minWidth: 120,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  feedcardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionBtn: {
    backgroundColor: "#6750A4",
    color: "#ffffffff",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 13,
    overflow: "hidden",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  feedcardBottom: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 3,
    borderTopColor: "#6750A4",
    backgroundColor: "#ffffffff",
    paddingVertical: 10,
  },
  feedcardLike: {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdfcfcff",
  },
  feedLike: {
    color: "#6750A4",
    fontWeight: "600",
    //backgroundColor: "#cf0000ff",
    //alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6750A4",
  },
  notificationButton: {
    position: "relative",
    padding: 5,
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  roleSelector: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  roleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    marginRight: 10,
  },
  roleButtonActive: {
    backgroundColor: "#6750A4",
  },
  roleButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  roleButtonTextActive: {
    color: "#FFFFFF",
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsContent: {
    paddingHorizontal: 20,
  },
  statCard: {
    width: 140,
    height: 120,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  ctaButton: {
    flexDirection: "row",
    backgroundColor: "#6750A4",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    width: 150,
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
  aiTipPanel: {
    backgroundColor: "#FFF9E6",
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FFD166",
    marginBottom: 20,
  },
  aiTipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  aiTipText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  feedSection: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  feedHeader: {
    marginBottom: 15,
  },
  feedSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  searchBar: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  feedCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 10,
    marginBottom: 25,
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    //border: "10px solid #000000ff",
    //borderColor: "#a60b9c",
    borderWidth: 1,
    borderColor: "rgba(158, 31, 249, 0.2)",
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginLeft: 4,
    fontWeight: "600",
    color: "#333",
  },
  feedDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
  },
  feedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedAuthor: {
    fontSize: 12,
    color: "#6750A4",
    fontWeight: "600",
  },
  feedAuthorName: {
    fontSize: 17,
    color: "#000000ff",
    fontWeight: "600",
    marginBottom: 10,
  },
  moreText: {
    color: "#1976D2",
    fontWeight: "600",
    //paddingLeft: 19,
    fontSize: 13,
    //fontStyle: "italic",
    //fontStyle:"underline"
  },

  feedTimestamp: {
    fontSize: 12,
    color: "#999",
  },
  qrCodePlaceholder: {
    backgroundColor: "#E3F2FD",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  qrText: {
    color: "#1976D2",
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#a60b9c",
  },
  navItem: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 12,
  },
  noMentor: {
    color: "#888",
    fontStyle: "italic",
    marginBottom: 12,
  },
  mentorCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  mentorExpertise: {
    fontSize: 14,
    color: "#6750A4",
  },
  mentorBio: {
    fontSize: 13,
    color: "#333",
  },
});

export default HomeScreen;
