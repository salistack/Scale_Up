import QRCode from "react-native-qrcode-svg";
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
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Add: image picker (Expo). Install if missing: npx expo install expo-image-picker
import * as ImagePicker from "expo-image-picker";

// Cloudinary config (set your own)
const CLOUDINARY_CLOUD_NAME = "dpgsqqr9j";
const CLOUDINARY_API_KEY = "972712514358626";
const CLOUDINARY_API_SECRET = "AhsSmC4D7qFlWQ6ba2l4CKF_9JE";

const SECTORS = [
  "Travel",
  "Automotive",
  "Technology",
  "Education",
  "Health",
  "Finance",
  "Retail",
  "Other",
];

const uploadToCloudinary = async (localUri) => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary not configured.");
  }

  console.log("Starting upload for:", localUri);

  const fileType = (localUri.split(".").pop() || "jpg").toLowerCase();
  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: `photo_${Date.now()}.${fileType}`,
    type: `image/${fileType}`,
  });

  // Use API key for upload
  const timestamp = Math.floor(Date.now() / 1000);
  formData.append("timestamp", timestamp);
  formData.append("api_key", CLOUDINARY_API_KEY);
  // Using raw public upload for simplicity

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Cloudinary error:", errorText);
      throw new Error(`Upload failed (${res.status}): ${errorText}`);
    }

    const json = await res.json();
    console.log("Upload successful:", json.secure_url);
    return json.secure_url;
  } catch (err) {
    console.error("Upload exception:", err);
    throw err;
  }
};

const HomeScreen = () => {
  const handleDeletePost = async (postId) => {
    const token = await AsyncStorage.getItem("token");
    try {
      const response = await fetch(
        `http://10.68.102.202:5000/api/entrepreneur/posts/${postId}`,
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
  const [userEmail, setUserEmail] = useState(""); // add
  const [posts, setPosts] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null); // Track expanded post ID
  const [mentors, setMentors] = useState([]);
  // Add missing state variables
  const [mentorDetailVisible, setMentorDetailVisible] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrPostId, setQrPostId] = useState(null);
  
  // Add chat states
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const navigation = useNavigation();

  // Add missing functions for mentor details
  const openMentorDetail = (mentor) => {
    setSelectedMentor(mentor);
    setMentorDetailVisible(true);
  };

  const closeMentorDetail = () => {
    setMentorDetailVisible(false);
    setSelectedMentor(null);
  };

  const emailMentor = (email, subject) => {
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(mailtoUrl).catch((err) =>
      Alert.alert("Error", "Could not open email client")
    );
  };

  // Add missing functions for QR code
  const handleShowQr = (postId) => {
    setQrPostId(postId);
    setQrVisible(true);
  };

  const handleDownloadPdf = async (postId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const fileUri = FileSystem.documentDirectory + `post_${postId}.pdf`;

      const downloadResumable = FileSystem.createDownloadResumable(
        `http://10.68.102.202:5000/api/entrepreneur/posts/${postId}/download-pdf`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { uri } = await downloadResumable.downloadAsync();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          "Sharing not available",
          "Sharing is not available on this device"
        );
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      Alert.alert("Download Failed", "Could not download the PDF");
    }
  };

  const loadUserAndPosts = async () => {
    // Get user name
    const userData = await AsyncStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name || "");
      setUserEmail(user.email || ""); // add
    }

    // Get JWT token directly
    const token = await AsyncStorage.getItem("token");

    // Fetch entrepreneur posts with Authorization header
    try {
      const response = await fetch(
        "http://10.68.102.202:5000/api/entrepreneur/posts",
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
    fetch("http://10.68.102.202:5000/api/mentors")
      .then((res) => res.json())
      .then((data) => setMentors(data))
      .catch(() => setMentors([]));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserAndPosts();
    }, [])
  );

  // Add chat functions
  const openChat = () => {
    setChatVisible(true);
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: "assistant",
          content: "Hello! I'm your AI business mentor. I can help you with:\n\n• Business strategy & planning\n• Marketing & customer acquisition\n• Fundraising & pitch preparation\n• Product development\n• Team building\n• Financial management\n\nWhat would you like to discuss today?",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const closeChat = () => {
    setChatVisible(false);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isSending) return;

    const userMessage = {
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsSending(true);

    try {
      const token = await AsyncStorage.getItem("token");
      
      console.log('Sending message to mentor API...');
      
      const response = await fetch("http://10.68.102.202:5000/api/chat/mentor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: chatMessages,
        }),
      });

      const data = await response.json();
      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        },
      ]);
      Alert.alert("Connection Error", error.message || "Failed to get response from mentor");
    } finally {
      setIsSending(false);
    }
  };

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
        <View style={styles.mentorSection}>
          <Text style={styles.sectionTitle}>Mentor Experience</Text>

          {mentors.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No mentors available at the moment
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mentorCarousel}
            >
              {mentors.map((mentor, idx) => {
                const photo =
                  Array.isArray(mentor.photos) && mentor.photos.length
                    ? mentor.photos[0]
                    : null;
                const title = mentor.title || mentor.name || "Mentor";
                const sector = mentor.sector || mentor.expertise || "General";
                const years = mentor.experienceYears || mentor.years || null;
                const brief = mentor.brief || mentor.bio || "";
                return (
                  <TouchableOpacity
                    key={mentor._id || idx}
                    onPress={() => openMentorDetail(mentor)}
                    style={styles.mentorCard}
                    activeOpacity={0.9}
                  >
                    <View style={styles.mentorImageContainer}>
                      {photo ? (
                        <Image
                          source={{ uri: photo }}
                          style={styles.mentorImage}
                        />
                      ) : (
                        <View style={styles.mentorImagePlaceholder}>
                          <Text style={styles.mentorImagePlaceholderText}>
                            {title.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.mentorCardContent}>
                      <Text numberOfLines={1} style={styles.mentorCardTitle}>
                        {title}
                      </Text>
                      <View style={styles.mentorCardBadge}>
                        <Text style={styles.mentorCardBadgeText}>
                          {sector}
                          {years ? ` • ${years} yrs` : ""}
                        </Text>
                      </View>
                      <Text numberOfLines={2} style={styles.mentorCardDesc}>
                        {brief}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.feedSection}>
          <Text style={styles.sectionTitle}>Entrepreneur Posts</Text>
          {posts.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No posts yet</Text>
            </View>
          ) : (
            posts.map((post) => (
              <View key={post._id} style={styles.feedCardProfessional}>
                <View style={styles.feedCardTopRowProfessional}>
                  <View style={styles.profilePicContainer}>
                    <Image
                      source={{
                        uri:
                          post.user?.profilePic ||
                          "https://ui-avatars.com/api/?name=" +
                            (post.user?.name || "User") +
                            "&background=6750A4&color=fff&size=128",
                      }}
                      style={styles.profilePic}
                    />
                  </View>
                  <View style={styles.feedCardInfo}>
                    <Text style={styles.feedAuthorNameProfessional}>
                      {post.user?.name || "Unknown"}
                    </Text>
                    <Text style={styles.feedAuthorEmail}>
                      {post.user?.email || ""}
                    </Text>
                  </View>
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
                <View style={styles.feedHeaderProfessional}>
                  <Text style={styles.feedTitleProfessional}>
                    {post.businessTitle}
                  </Text>
                  <Text style={styles.feedTagline}>{post.tagline}</Text>
                </View>
                <Text style={styles.feedIndustry}>{post.industry}</Text>
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
                        style={styles.feedImageProfessional}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                )}
                <View style={styles.feedDescriptionContainer}>
                  {expandedPostId === post._id && post.longDescription ? (
                    <Text style={styles.feedDescriptionProfessional}>
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
                    <Text style={styles.feedDescriptionProfessional}>
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
                </View>
                <View style={styles.feedcardBottomProfessional}>
                  <View style={styles.feedcardLikeProfessional}>
                    <Text style={styles.feedLikeProfessional}>👍 Like</Text>
                  </View>
                  <View style={styles.feedcardActionsProfessional}>
                    <TouchableOpacity
                      style={styles.actionBtnProfessional}
                      onPress={() => handleDownloadPdf(post._id)}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        Download
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtnProfessional}
                      onPress={() => handleShowQr(post._id)}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        QR
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Mentor detail modal with contact */}
        <Modal
          transparent
          animationType="slide"
          visible={mentorDetailVisible}
          onRequestClose={closeMentorDetail}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={closeMentorDetail}
          >
            <View style={styles.detailModal}>
              {selectedMentor && (
                <>
                  <View style={styles.detailModalHeader}>
                    <Text style={styles.detailModalTitle}>
                      {selectedMentor.title || selectedMentor.name || "Mentor"}
                    </Text>
                    <TouchableOpacity
                      onPress={closeMentorDetail}
                      style={styles.closeButton}
                    >
                      <Text style={styles.closeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailModalExpertise}>
                    <Text style={styles.detailModalExpertiseText}>
                      {selectedMentor.sector ||
                        selectedMentor.expertise ||
                        "General"}
                      {selectedMentor.experienceYears ? (
                        <Text style={styles.detailModalYears}>
                          {" "}
                          • {selectedMentor.experienceYears} years experience
                        </Text>
                      ) : (
                        ""
                      )}
                    </Text>
                  </View>

                  <View style={styles.detailModalBody}>
                    <Text style={styles.detailModalBio}>
                      {selectedMentor.brief || selectedMentor.bio || ""}
                    </Text>
                  </View>

                  {!!selectedMentor.email && (
                    <View style={styles.detailModalContact}>
                      <Text style={styles.detailModalContactLabel}>
                        Contact
                      </Text>
                      <Text style={styles.detailModalEmail}>
                        {selectedMentor.email}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          emailMentor(
                            selectedMentor.email,
                            selectedMentor.title || "Mentor Inquiry"
                          )
                        }
                        style={styles.contactButton}
                      >
                        <Text style={styles.contactButtonText}>
                          Email Mentor
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
      {qrVisible && (
        <Modal
          visible={qrVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setQrVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <View
              style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12 }}
            >
              <Text style={{ marginBottom: 10, fontWeight: "bold" }}>
                Scan to download PDF
              </Text>
              {qrPostId && (
                <QRCode
                  value={`http://10.68.102.202:5000/api/entrepreneur/posts/${qrPostId}/download-pdf`}
                  size={200}
                />
              )}
              <TouchableOpacity
                onPress={() => setQrVisible(false)}
                style={{ marginTop: 20 }}
              >
                <Text style={{ color: "#6750A4", fontWeight: "bold" }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {posts.length > 0 && (
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
                  handleDeletePost(menuPostId);
                  setMenuVisible(false);
                }}
              >
                <Text style={styles.menuText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={openChat}
        activeOpacity={0.8}
      >
        <Text style={styles.chatIcon}>💬</Text>
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeChat}
      >
        <View style={styles.chatModalContainer}>
          <View style={styles.chatModal}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.chatAvatarContainer}>
                  <Text style={styles.chatAvatarText}>🤖</Text>
                </View>
                <View>
                  <Text style={styles.chatHeaderTitle}>AI Mentor Assistant</Text>
                  <Text style={styles.chatHeaderSubtitle}>Business Guidance</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeChat} style={styles.chatCloseButton}>
                <Text style={styles.chatCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <ScrollView
              style={styles.chatMessagesContainer}
              contentContainerStyle={styles.chatMessagesContent}
              ref={(ref) => {
                if (ref) ref.scrollToEnd({ animated: true });
              }}
            >
              {chatMessages.map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chatMessageBubble,
                    msg.role === "user"
                      ? styles.chatMessageUser
                      : styles.chatMessageAssistant,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatMessageText,
                      msg.role === "user"
                        ? styles.chatMessageTextUser
                        : styles.chatMessageTextAssistant,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
              {isSending && (
                <View style={[styles.chatMessageBubble, styles.chatMessageAssistant]}>
                  <Text style={styles.chatMessageTextAssistant}>Thinking...</Text>
                </View>
              )}
            </ScrollView>

            {/* Chat Input */}
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask your business question..."
                placeholderTextColor="#999"
                value={chatInput}
                onChangeText={setChatInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={sendMessage}
                style={[
                  styles.chatSendButton,
                  (!chatInput.trim() || isSending) && styles.chatSendButtonDisabled,
                ]}
                disabled={!chatInput.trim() || isSending}
              >
                <Text style={styles.chatSendButtonText}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "rgba(0,0,0,0.5)",
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
  ctaButton: {
    backgroundColor: "#6750A4",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
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
  },

  mentorSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
    color: "#212121",
  },
  mentorCarousel: {
    paddingRight: 20,
    paddingBottom: 5,
  },
  mentorCard: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(158,31,249,0.15)",
  },
  mentorImageContainer: {
    height: 160,
    backgroundColor: "#f5f5f5",
  },
  mentorImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  mentorImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  mentorImagePlaceholderText: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#999",
  },
  mentorCardContent: {
    padding: 16,
  },
  mentorCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },
  mentorCardBadge: {
    backgroundColor: "#f0e6ff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  mentorCardBadgeText: {
    color: "#6750A4",
    fontSize: 13,
    fontWeight: "600",
  },
  mentorCardDesc: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },

  emptyStateContainer: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#888",
    fontStyle: "italic",
  },

  feedSection: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  feedCardProfessional: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(158, 31, 249, 0.15)",
  },
  feedCardTopRowProfessional: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profilePicContainer: {
    marginRight: 14,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eee",
  },
  feedCardInfo: {
    flex: 1,
  },
  feedAuthorNameProfessional: {
    fontSize: 17,
    fontWeight: "700",
    color: "#6750A4",
  },
  feedAuthorEmail: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  feedHeaderProfessional: {
    marginBottom: 8,
  },
  feedTitleProfessional: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 2,
  },
  feedTagline: {
    fontSize: 13,
    color: "#6750A4",
    fontWeight: "600",
    marginBottom: 2,
  },
  feedIndustry: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginBottom: 8,
  },
  feedImageProfessional: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  feedDescriptionContainer: {
    marginBottom: 10,
  },
  feedDescriptionProfessional: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  feedcardBottomProfessional: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    marginTop: 8,
  },
  feedcardLikeProfessional: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedLikeProfessional: {
    color: "#6750A4",
    fontWeight: "700",
    fontSize: 15,
  },
  feedcardActionsProfessional: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtnProfessional: {
    backgroundColor: "#6750A4",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 14,
    overflow: "hidden",
  },
  // Modal styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    padding: 0,
    overflow: "hidden",
  },
  detailModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 16,
  },
  detailModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
    lineHeight: 24,
  },
  detailModalExpertise: {
    backgroundColor: "#f0e6ff",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  detailModalExpertiseText: {
    color: "#6750A4",
    fontWeight: "600",
    fontSize: 14,
  },
  detailModalYears: {
    fontWeight: "400",
  },
  detailModalBody: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailModalBio: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  detailModalContact: {
    padding: 16,
  },
  detailModalContactLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  detailModalEmail: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: "#6750A4",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  // Chat styles
  floatingChatButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6750A4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatIcon: {
    fontSize: 28,
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  chatModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    overflow: "hidden",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#6750A4",
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatAvatarText: {
    fontSize: 20,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: "#e0e0e0",
    marginTop: 2,
  },
  chatCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  chatCloseText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  chatMessagesContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  chatMessagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  chatMessageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  chatMessageUser: {
    alignSelf: "flex-end",
    backgroundColor: "#6750A4",
    borderBottomRightRadius: 4,
  },
  chatMessageAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatMessageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  chatMessageTextUser: {
    color: "#fff",
  },
  chatMessageTextAssistant: {
    color: "#333",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  chatSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6750A4",
    justifyContent: "center",
    alignItems: "center",
  },
  chatSendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  chatSendButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default HomeScreen;
