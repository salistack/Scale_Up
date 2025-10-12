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
  Modal,
  FlatList,
  ActivityIndicator,
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
  
  // New state variables for user posts
  const [userPosts, setUserPosts] = useState([]);
  const [showPosts, setShowPosts] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editPostModal, setEditPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editedSector, setEditedSector] = useState("");
  const [editedYears, setEditedYears] = useState("");

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await fetch("http://10.68.102.202:5000/api/auth/me", {
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

  // Direct delete function with immediate feedback
  const handleDeletePost = async (postId) => {
    console.log("DELETE BUTTON CLICKED - postId:", postId);
    
    if (!postId) {
      console.log("ERROR: No postId provided");
      Alert.alert("Error", "Cannot delete post: missing post ID");
      return;
    }
    
    // Immediately perform delete without confirmation
    performDelete(postId);
  };

  // Separate function to perform the actual delete
  const performDelete = async (postId) => {
    console.log("PERFORMING DELETE for postId:", postId);
    
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("Token retrieved:", token ? "EXISTS" : "NULL");
      
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }
      
      console.log("Making DELETE request...");
      
      const deleteUrl = `http://10.68.102.202:5000/api/mentors/${postId}`;
      console.log("DELETE URL:", deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      console.log("Response received - Status:", response.status);
      console.log("Response OK:", response.ok);
      
      const responseText = await response.text();
      console.log("Response Text:", responseText);
      
      if (response.ok || response.status === 200 || response.status === 204) {
        console.log("DELETE SUCCESS - Removing from UI");
        
        // Remove from local state
        setUserPosts(currentPosts => {
          const newPosts = currentPosts.filter(post => post._id !== postId);
          console.log("Posts before delete:", currentPosts.length);
          console.log("Posts after delete:", newPosts.length);
          return newPosts;
        });
        
        Alert.alert("Success", "Post deleted successfully!");
      } else {
        console.log("DELETE FAILED - Status:", response.status);
        Alert.alert("Delete Failed", `Server returned status: ${response.status}\nResponse: ${responseText}`);
      }
      
    } catch (error) {
      console.error("DELETE ERROR:", error);
      Alert.alert("Network Error", `Failed to delete: ${error.message}`);
    }
  };

  // Function to fetch user posts
  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      // Clear existing posts first
      setUserPosts([]);
      
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "You need to be logged in");
        setPostsLoading(false);
        return;
      }

      // Generate random string to prevent caching
      const cacheBuster = Math.random().toString(36).substring(2);
      const url = `http://10.68.102.202:5000/api/mentors?nocache=${Date.now()}&rand=${cacheBuster}`;
      
      console.log(`Fetching posts from: ${url}`);
      
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      console.log(`Received ${Array.isArray(data) ? data.length : 0} posts from server`);
      
      // Get user details
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : {};
      
      if (!user._id) {
        console.log("Warning: No user ID available for filtering posts");
      } else {
        console.log(`Filtering posts for user ID: ${user._id}`);
      }
      
      // Handle different response formats and filter
      const postsArray = Array.isArray(data) ? data : (data.posts || []);
      
      const filteredPosts = user._id 
        ? postsArray.filter(post => {
            const postUserId = post.user?._id || post.userId || post.author?._id;
            const isOwner = postUserId === user._id;
            if (isOwner) {
              console.log(`Found matching post: ${post._id} (${post.title || 'Untitled'})`);
            }
            return isOwner;
          })
        : postsArray;
      
      console.log(`Displaying ${filteredPosts.length} posts for current user`);
      
      setUserPosts(filteredPosts);
      setShowPosts(true);
    } catch (err) {
      console.error("Error fetching posts:", err);
      Alert.alert(
        "Error Loading Posts", 
        err.message || "Could not load your posts. Please try again."
      );
    } finally {
      setPostsLoading(false);
    }
  };

  // Function to open edit modal with post data
  const handleEditPost = (post) => {
    setSelectedPost(post);
    setEditedTitle(post.title || '');
    setEditedBio(post.bio || '');
    setEditedSector(post.expertise || SECTORS[0]);
    // Add null check for experienceYears to prevent toString() errors
    setEditedYears(post.experienceYears !== undefined && post.experienceYears !== null 
      ? post.experienceYears.toString() 
      : '0');
    setEditPostModal(true);
  };

  // Function to update a post
  const handleUpdatePost = async () => {
    if (!selectedPost) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // Ensure experienceYears is a number or defaults to 0
      const expYears = parseInt(editedYears, 10) || 0;

      const updatedData = {
        title: editedTitle || selectedPost.title || '',
        bio: editedBio || selectedPost.bio || '',
        expertise: editedSector || selectedPost.expertise || SECTORS[0],
        experienceYears: expYears,
      };

      const res = await fetch(`http://10.68.102.202:5000/api/mentors/${selectedPost._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        Alert.alert("Error", errorData.msg || "Failed to update post");
        return;
      }

      // Update the post in state
      const updatedPosts = userPosts.map(post => 
        post._id === selectedPost._id 
          ? { ...post, ...updatedData } 
          : post
      );
      
      setUserPosts(updatedPosts);
      setEditPostModal(false);
      Alert.alert("Success", "Post updated successfully");
    } catch (err) {
      console.error("Update post error:", err);
      Alert.alert("Error", "Failed to update post");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://10.68.102.202:5000/api/auth/update", {
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

  // Add a function to help with user ID retrieval - add this near the top of the component
  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) return null;
      const user = JSON.parse(userData);
      return user._id;
    } catch (err) {
      console.error("Error getting user ID:", err);
      return null;
    }
  };

  // Update the renderPostItem function to show post ID for debugging
  const renderPostItem = ({ item }) => {
    const postTitle =
      item.title ||
      (item.name ? `${item.name}'s post` : null) ||
      item.heading ||
      "Untitled Post";

    // Debug text to show post ID
    const debugId = item._id ? `ID: ${item._id.slice(-6)}` : 'No ID';

    return (
      <View style={styles.postCard} key={item._id || Math.random().toString()}>
        <Text style={styles.postTitle}>{postTitle}</Text>
        <Text style={styles.postSector}>Sector: {item.expertise || item.sector || "Not specified"}</Text>
        <Text style={styles.postYears}>
          Experience: {item.experienceYears !== undefined ? item.experienceYears : "N/A"} years
        </Text>
        <Text style={styles.postBio}>{item.bio || item.description || "No description provided"}</Text>
        <Text style={styles.debugText}>{debugId}</Text>
        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.postActionButton, styles.editButton]}
            onPress={() => handleEditPost(item)}
          >
            <Text style={styles.postActionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.postActionButton, styles.deleteButton]}
            onPress={() => handleDeletePost(item._id)}
          >
            <Text style={styles.postActionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Add this function to navigate to create post screen
  const handleCreatePost = () => {
    navigation.navigate("CreatePost");
  };

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
              <>
                <TextInput
                  style={styles.nameInputEdit}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.bioInputEdit}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#999"
                  multiline
                />
              </>
            ) : (
              <>
                <Text style={styles.profileName}>{name || "Your Name"}</Text>
                <Text style={styles.profileBio}>
                  {bio || "Add a bio to tell others about yourself"}
                </Text>
              </>
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
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => setEditMode(true)}
              >
                <Text style={styles.actionButtonIcon}>✏️</Text>
                <Text style={styles.actionButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              
              {/* View My Posts Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.postsButton]}
                onPress={fetchUserPosts}
              >
                <Text style={styles.actionButtonIcon}>📋</Text>
                <Text style={styles.actionButtonText}>View My Posts</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* My Posts Section */}
        {showPosts && (
          <View style={styles.postsSection}>
            <View style={styles.postsSectionHeader}>
              <Text style={styles.sectionTitle}>My Posts</Text>
              <View style={styles.postHeaderActions}>
                <TouchableOpacity 
                  style={styles.createPostBtn}
                  onPress={handleCreatePost}
                >
                  <Text style={styles.createPostText}>Create Post</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.refreshPostsBtn}
                  onPress={fetchUserPosts}
                >
                  <Text style={styles.refreshText}>🔄</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPosts(false)}>
                  <Text style={styles.hideText}>Hide</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {postsLoading ? (
              <ActivityIndicator size="large" color="#6750A4" style={styles.loader} />
            ) : userPosts.length > 0 ? (
              userPosts.map((post, index) => renderPostItem({item: post, index}))
            ) : (
              <View style={styles.noPostsContainer}>
                <Text style={styles.noPostsText}>You haven't created any posts yet</Text>
                <TouchableOpacity 
                  style={styles.createFirstPostBtn}
                  onPress={handleCreatePost}
                >
                  <Text style={styles.createFirstPostText}>Create Your First Post</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

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

      {/* Edit Post Modal */}
      <Modal
        visible={editPostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditPostModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Post</Text>
            
            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              style={styles.modalInput}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Enter post title"
            />
            
            <Text style={styles.modalLabel}>Sector</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectorScroll}>
              {SECTORS.map(sector => (
                <TouchableOpacity
                  key={sector}
                  style={[
                    styles.sectorChip,
                    editedSector === sector && styles.sectorChipActive
                  ]}
                  onPress={() => setEditedSector(sector)}
                >
                  <Text 
                    style={[
                      styles.sectorChipText,
                      editedSector === sector && styles.sectorChipTextActive
                    ]}
                  >
                    {sector}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.modalLabel}>Years of Experience</Text>
            <TextInput
              style={styles.modalInput}
              value={editedYears}
              onChangeText={setEditedYears}
              keyboardType="numeric"
              placeholder="Enter years of experience"
            />
            
            <Text style={styles.modalLabel}>Bio</Text>
            <TextInput
              style={[styles.modalInput, styles.bioInput]}
              value={editedBio}
              onChangeText={setEditedBio}
              placeholder="Enter your bio"
              multiline
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]} 
                onPress={() => setEditPostModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSaveButton]} 
                onPress={handleUpdatePost}
              >
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // My Posts Section
  postsSection: {
    padding: 16,
    backgroundColor: "#F0F2F5",
  },
  postsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshPostsBtn: {
    marginLeft: 8,
    padding: 5,
  },
  refreshText: {
    fontSize: 18,
  },
  hideText: {
    color: "#6750A4",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 16,
  },
  createPostBtn: {
    backgroundColor: "#6750A4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createPostText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  noPostsContainer: {
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 12,
  },
  createFirstPostBtn: {
    backgroundColor: "#6750A4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  createFirstPostText: {
    color: "white",
    fontWeight: "600",
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#6750A4",
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1E21",
    marginBottom: 8,
  },
  postSector: {
    fontSize: 14,
    color: "#6750A4",
    fontWeight: "600",
    marginBottom: 4,
  },
  postYears: {
    fontSize: 14,
    color: "#65676B",
    marginBottom: 8,
  },
  postBio: {
    fontSize: 14,
    color: "#1C1E21",
    marginBottom: 12,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  postActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#6750A4",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  postActionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  
  // New button styles
  postsButton: {
    backgroundColor: "#34A853",
    marginTop: 12,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1E21",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  modalCancelButton: {
    backgroundColor: "#F0F2F5",
  },
  modalSaveButton: {
    backgroundColor: "#6750A4",
  },
  modalCancelText: {
    color: "#1C1E21",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sectorScroll: {
    marginBottom: 16,
  },
  sectorChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
    marginRight: 8,
    marginBottom: 8,
  },
  sectorChipActive: {
    backgroundColor: "#6750A4",
  },
  sectorChipText: {
    color: "#1C1E21",
  },
  sectorChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Debug styles
  debugText: {
    fontSize: 10,
    color: "#999",
    marginTop: 10,
    fontStyle: "italic"
  }
});

export default ProfileScreens;
