import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
//import { View, Text, StyleSheet, SafeAreaView, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert, // added
} from "react-native";
import * as ImagePicker from "expo-image-picker";

// Change Cloudinary config to be more forgiving
const CLOUDINARY_CLOUD_NAME = "dpgsqqr9j";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
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
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary not configured.");
  }
  const fileType = (localUri.split(".").pop() || "jpg").toLowerCase();
  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: `photo_${Date.now()}.${fileType}`,
    type: `image/${fileType}`,
  });
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.secure_url;
};

const CreatePostScreen = () => {
  const [activeIdx, setActiveIdx] = useState(null);
  const [activeForm, setActiveForm] = useState("entrepreneur"); // entrepreneur, mentor, investor, franchise
  const navigation = useNavigation();
  const removeImage = (idx) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx(null);
  };

  const handlePost = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append("businessTitle", businessTitle);
      formData.append("tagline", tagline);
      formData.append("industry", industry);
      formData.append("shortDescription", shortDescription);
      formData.append("longDescription", longDescription);
      formData.append("fundAmount", fundAmount);
      formData.append("otherNeeds", otherNeeds);
      // Debug: log all selectedImages before upload
      if (selectedImages.length > 0) {
        for (const asset of selectedImages) {
          console.log("Uploading asset:", asset);
          if (asset.uri.startsWith("blob:")) {
            // Web: convert blob URI to File/Blob
            try {
              const response = await fetch(asset.uri);
              const blob = await response.blob();
              formData.append("images", blob, asset.fileName || "photo.jpg");
            } catch (err) {
              console.log("Error converting blob URI to file:", err);
            }
          } else if (asset.file) {
            // Web: use File object directly
            formData.append(
              "images",
              asset.file,
              asset.fileName || "photo.jpg"
            );
          } else {
            // Native: use correct property names
            formData.append("images", {
              uri: asset.uri,
              type: asset.mimeType || "image/jpeg",
              name: asset.fileName || "photo.jpg",
            });
          }
        }
      }
      const response = await fetch(
        "http://192.168.1.121:5000/api/entrepreneur/posts",
        {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        }
      );
      const data = await response.json();
      if (response.ok) {
        alert("Post created successfully!");
        // Optionally clear form fields here
      } else {
        alert(data.msg || "Failed to create post");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // New: current user info for mentor attribution
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    (async () => {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || "");
        setUserEmail(user.email || "");
      }
    })();
  }, []);

  // ...existing entrepreneur state...

  // Replace old mentor state with new fields
  const [mentorTitle, setMentorTitle] = useState("");
  const [mentorSector, setMentorSector] = useState(SECTORS[0]);
  const [mentorYears, setMentorYears] = useState("3");
  const [mentorBrief, setMentorBrief] = useState("");
  const [mentorLocalImages, setMentorLocalImages] = useState([]);
  const [mentorSubmitting, setMentorSubmitting] = useState(false);

  // New: pick multiple mentor images
  const pickMentorImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (!result.canceled) {
      const selected = (result.assets || []).map((a) => a.uri);
      setMentorLocalImages((prev) => [...prev, ...selected].slice(0, 6));
    }
  };

  // Replace old handleMentorSubmit with new flow
  const handleMentorSubmit = async () => {
    if (!mentorTitle.trim()) return Alert.alert("Validation", "Enter a title.");
    if (!mentorBrief.trim()) return Alert.alert("Validation", "Enter a brief.");
    if (isNaN(parseInt(mentorYears)))
      return Alert.alert("Validation", "Years must be a number.");
    if (!userName) return Alert.alert("Validation", "User name is required. Please sign in again.");

    const token = await AsyncStorage.getItem("token");
    setMentorSubmitting(true);
    
    try {
      // Skip image uploads for now
      console.log("Skipping image uploads due to Cloudinary preset issues");
      
      // Create mentor data without images
      const mentorData = {
        name: userName,
        email: userEmail,
        expertise: mentorSector,
        bio: mentorBrief.trim(),
        photos: [], // Empty array instead of trying to upload
        title: mentorTitle.trim(),
        experienceYears: parseInt(mentorYears, 10)
      };
      
      console.log("Submitting mentor data:", mentorData);
      
      const res = await fetch("http://192.168.178.202:5000/api/mentors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(mentorData),
      });
      
      // Handle response
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error response:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.msg || errorData.message || `Server error (${res.status})`);
        } catch (e) {
          throw new Error(`Server error (${res.status}): ${errorText}`);
        }
      }
      
      Alert.alert(
        "Success", 
        "Mentor post created successfully! (Note: Image upload was skipped)"
      );
      
      // Reset form
      setMentorTitle("");
      setMentorSector(SECTORS[0]);
      setMentorYears("3");
      setMentorBrief("");
      setMentorLocalImages([]);
      
      // Navigate to home to see the post
      navigation.navigate("HomeTabs");
    } catch (err) {
      console.error("Submission error:", err);
      Alert.alert("Error", err.message || "Failed to create post.");
    } finally {
      setMentorSubmitting(false);
    }
  };

  const [businessTitle, setBusinessTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [industry, setIndustry] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [otherNeeds, setOtherNeeds] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [mentorName, setMentorName] = useState("");
  const [mentorExpertise, setMentorExpertise] = useState("");
  const [mentorBio, setMentorBio] = useState("");

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Retail",
    "Manufacturing",
    "Energy",
    "Transportation",
    "Hospitality",
    "Real Estate",
    "Agriculture",
    "Media & Entertainment",
    "Telecommunications",
    "Food & Beverage",
    "Automotive",
    "Construction",
    "Government",
    "Non-Profit",
    "Pharmaceutical",
    "Aerospace",
    "Logistics",
    "Insurance",
    "Legal",
    "Sports & Recreation",
  ];

  const pickImage = async () => {
    // Ask for permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    // Open picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImages((prev) => [
        ...prev,
        ...result.assets, // store full asset objects
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.formSwitchBtn,
            activeForm === "entrepreneur" && styles.formSwitchBtnActive,
          ]}
          onPress={() => setActiveForm("entrepreneur")}
        >
          <Text
            style={[
              styles.formSwitchText,
              activeForm === "entrepreneur" && styles.formSwitchTextActive,
            ]}
          >
            Entrepreneur
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.formSwitchBtn,
            activeForm === "mentor" && styles.formSwitchBtnActive,
          ]}
          onPress={() => setActiveForm("mentor")}
        >
          <Text
            style={[
              styles.formSwitchText,
              activeForm === "mentor" && styles.formSwitchTextActive,
            ]}
          >
            Mentor
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.formSwitchBtn,
            activeForm === "investor" && styles.formSwitchBtnActive,
          ]}
          onPress={() => {
            const parentNav = navigation.getParent && navigation.getParent();
            if (parentNav) parentNav.navigate("InvestorForm");
            else navigation.navigate("InvestorForm");
          }}
        >
          <Text
            style={[
              styles.formSwitchText,
              activeForm === "investor" && styles.formSwitchTextActive,
            ]}
          >
            Investor
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.formSwitchBtn,
            activeForm === "franchise" && styles.formSwitchBtnActive,
          ]}
          onPress={() => setActiveForm("franchise")}
        >
          <Text
            style={[
              styles.formSwitchText,
              activeForm === "franchise" && styles.formSwitchTextActive,
            ]}
          >
            Franchise Owner
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeForm === "entrepreneur" && (
          <>
            <Text style={styles.label}>Business Title</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter your business title"
              value={businessTitle}
              onChangeText={setBusinessTitle}
            />

            <Text style={styles.label}>Tagline</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter your tagline"
              value={tagline}
              onChangeText={setTagline}
            />

            <Text style={styles.label}>Industry</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={industry}
                onValueChange={(itemValue) => setIndustry(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Industry" value="" />
                {industries.map((ind) => (
                  <Picker.Item key={ind} label={ind} value={ind} />
                ))}
              </Picker>
            </View>
            <Text style={styles.label}>Short Description</Text>
            <TextInput
              style={[styles.inputField, { height: 60 }]}
              placeholder="Write a short description about your post"
              multiline
              maxLength={200}
              value={shortDescription}
              onChangeText={setShortDescription}
            />

            <Text style={styles.label}>Detailed Description</Text>
            <TextInput
              style={[styles.inputField, { height: 100 }]}
              placeholder="Write a detailed description about your post"
              multiline
              maxLength={200}
              value={longDescription}
              onChangeText={setLongDescription}
            />

            <Text style={styles.label}>Fund Amount</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter fund amount"
              value={fundAmount}
              onChangeText={setFundAmount}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Other Needs</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Eg: Mentorship, Partnerships, Manpower"
              value={otherNeeds}
              onChangeText={setOtherNeeds}
            />

            <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload Image</Text>
            </TouchableOpacity>

            {selectedImages.length > 0 && (
              <ScrollView horizontal style={{ marginTop: 10 }}>
                {selectedImages.map((asset, idx) => (
                  <View
                    key={idx}
                    style={styles.imageWrapper}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseLeave={() => setActiveIdx(null)}
                  >
                    <TouchableOpacity
                      activeOpacity={1}
                      onLongPress={() => setActiveIdx(idx)}
                      onPressOut={() => setActiveIdx(null)}
                      style={{ width: 100, height: 100 }}
                    >
                      <Image
                        source={{ uri: asset.uri }}
                        style={styles.uploadedImage}
                      />
                      {activeIdx === idx && (
                        <TouchableOpacity
                          style={styles.removeImageBtn}
                          onPress={() => removeImage(idx)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.removeImageText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.postButton} onPress={handlePost}>
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.discardButton}
              onPress={() => {
                setBusinessTitle("");
                setTagline("");
                setIndustry("");
                setShortDescription("");
                setLongDescription("");
                setFundAmount("");
                setOtherNeeds("");
                setSelectedImages([]);
              }}
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </>
        )}
        {activeForm === "mentor" && (
          <>
            {/* New mentor post form (same UX as Home) */}
            <Text style={styles.label}>Heading / Title</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. 8+ years in Travel Tech"
              value={mentorTitle}
              onChangeText={setMentorTitle}
            />

            <Text style={styles.label}>Sector</Text>
            <View style={styles.chipsRow}>
              {SECTORS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setMentorSector(s)}
                  style={[
                    styles.chip,
                    mentorSector === s && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      mentorSector === s && styles.chipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. 5"
              value={mentorYears}
              onChangeText={setMentorYears}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Brief of Experience</Text>
            <TextInput
              style={[styles.inputField, { height: 110, textAlignVertical: "top" }]}
              placeholder="Describe your experience..."
              multiline
              value={mentorBrief}
              onChangeText={setMentorBrief}
            />

            <Text style={styles.label}>Photos (Optional - currently disabled)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {mentorLocalImages.map((u, i) => (
                <TouchableOpacity
                  key={u + i}
                  onLongPress={() =>
                    setMentorLocalImages((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  style={{ marginRight: 8, marginBottom: 8 }}
                >
                  <Image source={{ uri: u }} style={styles.imageThumb} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => Alert.alert(
                  "Image Upload Disabled",
                  "Image uploads have been temporarily disabled due to Cloudinary configuration issues. You can still submit the form without images."
                )}
                style={[styles.chip, { borderStyle: "dashed", borderWidth: 1, borderColor: "#bbb" }]}
              >
                <Text style={{ color: "#999" }}>Images Disabled</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.postButton, mentorSubmitting && { opacity: 0.7 }]}
              onPress={handleMentorSubmit}
              disabled={mentorSubmitting}
            >
              <Text style={styles.postButtonText}>
                {mentorSubmitting ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.discardButton}
              onPress={() => {
                setMentorTitle("");
                setMentorSector(SECTORS[0]);
                setMentorYears("3");
                setMentorBrief("");
                setMentorLocalImages([]);
              }}
            >
              <Text className="discardButtonText" style={styles.discardButtonText}>
                Discard
              </Text>
            </TouchableOpacity>
          </>
        )}
        {activeForm === "investor" && (
          <View style={styles.placeholderForm}>
            <Text style={styles.placeholderText}>
              Investor Form (to be implemented)
            </Text>
          </View>
        )}
        {activeForm === "franchise" && (
          <View style={styles.placeholderForm}>
            <Text style={styles.placeholderText}>
              Franchise Owner Form (to be implemented)
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  imageWrapper: {
    position: "relative",
    marginRight: 10,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  removeImageText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 22,
  },
  visible: {
    opacity: 1,
  },
  hidden: {
    opacity: 0,
  },
  scrollView: {
    flex: 1,
  },
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
    //backgroundColor: "#FFFFFF",
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
    fontWeight: "normal",
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  uploadButton: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6750A4",
    //color: "#fff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginRight: 200,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "regular",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  formSwitchBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: "#eee",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  formSwitchBtnActive: {
    backgroundColor: "#6750A4",
    borderColor: "#6750A4",
  },
  formSwitchText: {
    color: "#333",
    fontSize: 10,
    fontWeight: "bold",
  },
  formSwitchTextActive: {
    color: "#fff",
  },
  placeholderForm: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  placeholderText: {
    color: "#888",
    fontSize: 18,
    fontStyle: "italic",
  },
  postButton: {
    backgroundColor: "#6750A4",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  discardButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#6750A4",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 32,
  },
  discardButtonText: {
    color: "#6750A4",
    fontSize: 18,
    fontWeight: "bold",
  },
  chipsRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 8 
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#eee",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: "#0a7" },
  chipText: { color: "#333" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  imageThumb: {
    width: 86,
    height: 86,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
});

export default CreatePostScreen;
