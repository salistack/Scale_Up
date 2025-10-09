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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = () => {
  const [userName, setUserName] = useState("");
  const [posts, setPosts] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null); // Track expanded post ID
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
        "http://192.168.1.121:5000/api/entrepreneur/posts",
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
                {/* Show poster's name above business title */}
                <Text style={styles.feedAuthorName}>
                  {post.user && post.user.name ? post.user.name : "Unknown"}
                </Text>
                <View style={styles.feedHeader}>
                  <Text style={styles.feedTitle}>{post.businessTitle}</Text>
                </View>
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
              </View>
            ))
          )}
        </View>
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
    alignSelf: 'flex-start',
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
    paddingHorizontal: 20,
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
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    padding: 10,
  },
});

export default HomeScreen;
