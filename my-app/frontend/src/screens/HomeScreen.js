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
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import InvestorFeed from "../screens/InvestorFeed";

const { width } = Dimensions.get("window");

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

  const timestamp = Math.floor(Date.now() / 1000);
  formData.append("timestamp", timestamp);
  formData.append("api_key", CLOUDINARY_API_KEY);

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
        `http://192.168.8.101:5000/api/entrepreneur/posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        loadUserAndPosts();
        Alert.alert("Success", "Post deleted successfully");
      } else {
        Alert.alert("Error", "You can only delete your own posts.");
      }
    } catch (err) {
      console.error("Delete failed", err);
      Alert.alert("Error", "Failed to delete post");
    }
  };

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    businessTitle: "",
    tagline: "",
    industry: "",
    shortDescription: "",
    longDescription: "",
    fundAmount: "",
    otherNeeds: "",
  });
  const [editPostId, setEditPostId] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [posts, setPosts] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [mentorDetailVisible, setMentorDetailVisible] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrPostId, setQrPostId] = useState(null);
  const [activeFeed, setActiveFeed] = useState("entrepreneur");
  const [fadeAnim] = useState(new Animated.Value(0));

  const navigation = useNavigation();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const openEditModal = (post) => {
    setEditForm({
      businessTitle: post.businessTitle || "",
      tagline: post.tagline || "",
      industry: post.industry || "",
      shortDescription: post.shortDescription || "",
      longDescription: post.longDescription || "",
      fundAmount: post.fundAmount ? String(post.fundAmount) : "",
      otherNeeds: post.otherNeeds || "",
    });
    setEditPostId(post._id);
    setEditModalVisible(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async () => {
    const token = await AsyncStorage.getItem("token");
    try {
      const response = await fetch(
        `http://192.168.8.101:5000/api/entrepreneur/posts/${editPostId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );
      if (response.ok) {
        setEditModalVisible(false);
        setEditPostId(null);
        setEditForm({
          businessTitle: "",
          tagline: "",
          industry: "",
          shortDescription: "",
          longDescription: "",
          fundAmount: "",
          otherNeeds: "",
        });
        loadUserAndPosts();
        Alert.alert("Success", "Post updated successfully");
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText || "Failed to update post");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update post");
    }
  };

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

  const handleShowQr = (postId) => {
    setQrPostId(postId);
    setQrVisible(true);
  };

  const handleDownloadPdf = async (postId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const fileUri = FileSystem.documentDirectory + `post_${postId}.pdf`;

      const downloadResumable = FileSystem.createDownloadResumable(
        `http://192.168.8.101:5000/api/entrepreneur/posts/${postId}/download-pdf`,
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
    const userData = await AsyncStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name || "");
      setUserEmail(user.email || "");
    }

    const token = await AsyncStorage.getItem("token");

    try {
      const response = await fetch(
        "http://192.168.8.101:5000/api/entrepreneur/posts",
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await response.json();
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
    fetch("http://192.168.8.101:5000/api/mentors")
      .then((res) => res.json())
      .then((data) => setMentors(data))
      .catch(() => setMentors([]));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserAndPosts();
    }, [])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerGradient}>
        <Animated.View style={[styles.greetingSection, { opacity: fadeAnim }]}>
          <Text style={styles.greeting}>
            {getGreeting()}, {userName}! 👋
          </Text>
          <Text style={styles.subGreeting}>Welcome back to your dashboard</Text>
        </Animated.View>
      </View>

      <View style={styles.buttonGroupContainer}>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.formSwitchBtn,
              activeFeed === "investor" && styles.formSwitchBtnActive,
            ]}
            onPress={() => setActiveFeed("investor")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.formSwitchText,
                activeFeed === "investor" && styles.formSwitchTextActive,
              ]}
            >
              💼 Investors
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.formSwitchBtn,
              activeFeed === "entrepreneur" && styles.formSwitchBtnActive,
            ]}
            onPress={() => setActiveFeed("entrepreneur")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.formSwitchText,
                activeFeed === "entrepreneur" && styles.formSwitchTextActive,
              ]}
            >
              🚀 Entrepreneurs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.formSwitchBtn,
              activeFeed === "mentor" && styles.formSwitchBtnActive,
            ]}
            onPress={() => setActiveFeed("mentor")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.formSwitchText,
                activeFeed === "mentor" && styles.formSwitchTextActive,
              ]}
            >
              🎓 Mentors
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {activeFeed === "mentor" ? (
          <View style={styles.mentorSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Mentors</Text>
              <Text style={styles.sectionSubtitle}>Connect with industry experts</Text>
            </View>
            {mentors.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>👥</Text>
                <Text style={styles.emptyStateText}>No mentors available</Text>
                <Text style={styles.emptyStateSubtext}>Check back soon for updates</Text>
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
                      activeOpacity={0.95}
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
        ) : activeFeed === "entrepreneur" ? (
          <View style={styles.feedSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Entrepreneur Feed</Text>
              <Text style={styles.sectionSubtitle}>Discover innovative ideas</Text>
            </View>
            {posts.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>📝</Text>
                <Text style={styles.emptyStateText}>No posts yet</Text>
                <Text style={styles.emptyStateSubtext}>Be the first to share your idea!</Text>
              </View>
            ) : (
              <View>
                {posts.map((post) => (
                  <View key={post._id} style={styles.feedCardProfessional}>
                    <View style={styles.feedCardTopRowProfessional}>
                      <View style={styles.profilePicContainer}>
                        <Image
                          source={{
                            uri:
                              post.user?.photo ||
                              "https://ui-avatars.com/api/?name=" +
                                (post.user?.name || "U") +
                                "&background=6750A4&color=fff",
                          }}
                          style={styles.profilePic}
                        />
                        <View style={styles.profileOnlineIndicator} />
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
                      <View style={styles.industryBadge}>
                        <Text style={styles.feedIndustry}>{post.industry}</Text>
                      </View>
                    </View>

                    {post.images && post.images.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.imageScroll}
                      >
                        {post.images.map((imgUrl, idx) => (
                          <View key={imgUrl + idx} style={styles.imageWrapper}>
                            <Image
                              source={{ uri: imgUrl }}
                              style={styles.feedImageProfessional}
                              resizeMode="cover"
                            />
                          </View>
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
                            Show less
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
                              Read more
                            </Text>
                          )}
                        </Text>
                      )}
                    </View>

                    <View style={styles.feedcardBottomProfessional}>
                      <TouchableOpacity style={styles.feedcardLikeProfessional}>
                        <Text style={styles.feedLikeProfessional}>👍 Like</Text>
                      </TouchableOpacity>
                      <View style={styles.feedcardActionsProfessional}>
                        <TouchableOpacity
                          style={styles.actionBtnProfessional}
                          onPress={() => handleDownloadPdf(post._id)}
                        >
                          <Text style={styles.actionBtnText}>📥 Download</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtnProfessional, styles.qrBtn]}
                          onPress={() => handleShowQr(post._id)}
                        >
                          <Text style={styles.actionBtnText}>QR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <InvestorFeed />
        )}
      </ScrollView>

      {/* Mentor Detail Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={mentorDetailVisible}
        onRequestClose={closeMentorDetail}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeMentorDetail}
          />
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

                <ScrollView style={styles.detailModalScroll}>
                  <View style={styles.detailModalExpertise}>
                    <Text style={styles.detailModalExpertiseText}>
                      {selectedMentor.sector || selectedMentor.expertise || "General"}
                      {selectedMentor.experienceYears && (
                        <Text style={styles.detailModalYears}>
                          {" "}
                          • {selectedMentor.experienceYears} years
                        </Text>
                      )}
                    </Text>
                  </View>

                  <View style={styles.detailModalBody}>
                    <Text style={styles.detailModalLabel}>About</Text>
                    <Text style={styles.detailModalBio}>
                      {selectedMentor.brief || selectedMentor.bio || ""}
                    </Text>
                  </View>

                  {!!selectedMentor.email && (
                    <View style={styles.detailModalContact}>
                      <Text style={styles.detailModalLabel}>Contact Information</Text>
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
                          📧 Send Email
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* QR Modal */}
      {qrVisible && (
        <Modal
          visible={qrVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setQrVisible(false)}
        >
          <View style={styles.qrModalOverlay}>
            <View style={styles.qrModalContent}>
              <Text style={styles.qrModalTitle}>Scan QR Code</Text>
              <Text style={styles.qrModalSubtitle}>
                Scan to download PDF instantly
              </Text>
              {qrPostId && (
                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={`http://192.168.8.101:5000/api/entrepreneur/posts/${qrPostId}/download-pdf`}
                    size={220}
                    backgroundColor="white"
                    color="#6750A4"
                  />
                </View>
              )}
              <TouchableOpacity
                onPress={() => setQrVisible(false)}
                style={styles.qrCloseButton}
              >
                <Text style={styles.qrCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Menu Modal */}
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
                  const post = posts.find((p) => p._id === menuPostId);
                  setMenuVisible(false);
                  if (post) openEditModal(post);
                }}
              >
                <Text style={styles.menuText}>✏️ Update</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  handleDeletePost(menuPostId);
                  setMenuVisible(false);
                }}
              >
                <Text style={[styles.menuText, styles.menuTextDanger]}>
                  🗑️ Delete
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Edit Post Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Post</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll}>
              <View style={styles.editModalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter business title"
                    value={editForm.businessTitle}
                    onChangeText={(text) =>
                      handleEditFormChange("businessTitle", text)
                    }
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tagline</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Catchy tagline"
                    value={editForm.tagline}
                    onChangeText={(text) => handleEditFormChange("tagline", text)}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Industry</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Industry sector"
                    value={editForm.industry}
                    onChangeText={(text) => handleEditFormChange("industry", text)}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Short Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Brief description"
                    value={editForm.shortDescription}
                    onChangeText={(text) =>
                      handleEditFormChange("shortDescription", text)
                    }
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Long Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { height: 100 }]}
                    placeholder="Detailed description"
                    multiline
                    value={editForm.longDescription}
                    onChangeText={(text) =>
                      handleEditFormChange("longDescription", text)
                    }
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fund Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Amount needed"
                    value={editForm.fundAmount}
                    keyboardType="numeric"
                    onChangeText={(text) =>
                      handleEditFormChange("fundAmount", text)
                    }
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Other Needs</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Additional requirements"
                    value={editForm.otherNeeds}
                    onChangeText={(text) =>
                      handleEditFormChange("otherNeeds", text)
                    }
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.editModalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleEditSubmit}
                  >
                    <Text style={styles.saveButtonText}>💾 Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  headerGradient: {
    backgroundColor: "#6750A4",
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  greetingSection: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subGreeting: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  buttonGroupContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "#FFF",
    padding: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formSwitchBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  formSwitchBtnActive: {
    backgroundColor: "#6750A4",
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  formSwitchText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "700",
  },
  formSwitchTextActive: {
    color: "#FFF",
  },
  contentScroll: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  mentorSection: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  mentorCarousel: {
    paddingRight: 20,
    paddingBottom: 10,
  },
  mentorCard: {
    width: 300,
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(103, 80, 164, 0.1)",
  },
  mentorImageContainer: {
    height: 180,
    backgroundColor: "#F0E6FF",
    position: "relative",
  },
  mentorImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  mentorImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#6750A4",
    alignItems: "center",
    justifyContent: "center",
  },
  mentorImagePlaceholderText: {
    fontSize: 60,
    fontWeight: "900",
    color: "#FFF",
  },
  mentorCardContent: {
    padding: 18,
  },
  mentorCardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  mentorCardBadge: {
    backgroundColor: "#F0E6FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(103, 80, 164, 0.2)",
  },
  mentorCardBadgeText: {
    color: "#6750A4",
    fontSize: 13,
    fontWeight: "700",
  },
  mentorCardDesc: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  emptyStateContainer: {
    paddingVertical: 60,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
  feedSection: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  feedCardProfessional: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(103, 80, 164, 0.08)",
  },
  feedCardTopRowProfessional: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profilePicContainer: {
    marginRight: 14,
    position: "relative",
  },
  profilePic: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F0E6FF",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  profileOnlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  feedCardInfo: {
    flex: 1,
  },
  feedAuthorNameProfessional: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  feedAuthorEmail: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  menuButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  menuDots: {
    fontSize: 28,
    color: "#666",
    fontWeight: "bold",
    lineHeight: 28,
  },
  feedHeaderProfessional: {
    marginBottom: 14,
  },
  feedTitleProfessional: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  feedTagline: {
    fontSize: 15,
    color: "#6750A4",
    fontWeight: "600",
    marginBottom: 8,
    fontStyle: "italic",
  },
  industryBadge: {
    backgroundColor: "#F0E6FF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(103, 80, 164, 0.2)",
  },
  feedIndustry: {
    fontSize: 12,
    color: "#6750A4",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  imageScroll: {
    marginVertical: 14,
  },
  imageWrapper: {
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  feedImageProfessional: {
    width: 140,
    height: 140,
    borderRadius: 16,
  },
  feedDescriptionContainer: {
    marginBottom: 16,
  },
  feedDescriptionProfessional: {
    fontSize: 15,
    color: "#444",
    lineHeight: 24,
    fontWeight: "400",
  },
  moreText: {
    color: "#6750A4",
    fontWeight: "700",
  },
  feedcardBottomProfessional: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 16,
    marginTop: 6,
  },
  feedcardLikeProfessional: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F8F9FD",
  },
  feedLikeProfessional: {
    color: "#6750A4",
    fontWeight: "800",
    fontSize: 15,
  },
  feedcardActionsProfessional: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionBtnProfessional: {
    backgroundColor: "#6750A4",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  qrBtn: {
    backgroundColor: "#9E1FF9",
  },
  actionBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  detailModal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "90%",
    overflow: "hidden",
  },
  detailModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#6750A4",
  },
  detailModalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    flex: 1,
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 30,
    color: "#FFF",
    lineHeight: 30,
    fontWeight: "300",
  },
  detailModalScroll: {
    maxHeight: "100%",
  },
  detailModalExpertise: {
    backgroundColor: "#F0E6FF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(103, 80, 164, 0.1)",
  },
  detailModalExpertiseText: {
    color: "#6750A4",
    fontWeight: "700",
    fontSize: 15,
  },
  detailModalYears: {
    fontWeight: "500",
  },
  detailModalBody: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailModalLabel: {
    fontSize: 13,
    color: "#888",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  detailModalBio: {
    fontSize: 16,
    lineHeight: 26,
    color: "#333",
    fontWeight: "400",
  },
  detailModalContact: {
    padding: 24,
  },
  detailModalEmail: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 18,
  },
  contactButton: {
    backgroundColor: "#6750A4",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  contactButtonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  qrModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  qrModalContent: {
    backgroundColor: "#FFF",
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    width: width * 0.85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  qrModalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  qrModalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    fontWeight: "500",
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 16,
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 24,
  },
  qrCloseButton: {
    backgroundColor: "#6750A4",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  qrCloseButtonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "700",
  },
  menuTextDanger: {
    color: "#E53935",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 4,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  editModalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "90%",
    overflow: "hidden",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#6750A4",
  },
  editModalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  editModalScroll: {
    maxHeight: "100%",
  },
  editModalContent: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#F8F9FD",
    fontWeight: "500",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  editModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "800",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#6750A4",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#6750A4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
});

export default HomeScreen;