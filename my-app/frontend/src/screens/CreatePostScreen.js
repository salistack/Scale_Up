import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
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
  Alert,
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

  // Entrepreneur State
  const [businessTitle, setBusinessTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [industry, setIndustry] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [otherNeeds, setOtherNeeds] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);

  // Mentor State
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [mentorTitle, setMentorTitle] = useState("");
  const [mentorSector, setMentorSector] = useState(SECTORS[0]);
  const [mentorYears, setMentorYears] = useState("3");
  const [mentorBrief, setMentorBrief] = useState("");
  const [mentorLocalImages, setMentorLocalImages] = useState([]);
  const [mentorSubmitting, setMentorSubmitting] = useState(false);

  // Investor State
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [fundingType, setFundingType] = useState("");
  const [expectedROI, setExpectedROI] = useState("");
  const [interestLevel, setInterestLevel] = useState("");
  const [investorDescription, setInvestorDescription] = useState("");
  
  // Franchise State
  const [franchiseName, setFranchiseName] = useState("");
  const [franchiseDescription, setFranchiseDescription] = useState("");
  const [franchiseLocation, setFranchiseLocation] = useState("");
  const [franchiseCategory, setFranchiseCategory] = useState("");
  const [franchiseContact, setFranchiseContact] = useState("");
  const [franchiseImage, setFranchiseImage] = useState(null);

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
  
  // Franchise Categories
  const franchiseCategories = [
    "Food", 
    "Retail", 
    "Service", 
    "Education", 
    "Healthcare", 
    "Other"
  ];

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

  // Image Handling
  const removeImage = (idx) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx(null);
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImages((prev) => [...prev, ...result.assets]);
    }
  };

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
  
  // Pick Franchise Image
  const pickFranchiseImage = async () => {
    const permissionResult = 
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Please allow photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      console.log("Selected franchise image:", result.assets[0]);
      
      // Get image info
      const selectedImage = result.assets[0];
      
      // Check file size and format
      const fileSize = selectedImage.fileSize; // in bytes
      const maxSize = 10 * 1024 * 1024; // 10 MB
      
      if (fileSize > maxSize) {
        Alert.alert(
          "Image too large", 
          "Please select an image smaller than 10MB"
        );
        return;
      }
      
      setFranchiseImage(selectedImage);
    }
  };

  // Entrepreneur Post Handler
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

      if (selectedImages.length > 0) {
        for (const asset of selectedImages) {
          console.log("Uploading asset:", asset);
          if (asset.uri.startsWith("blob:")) {
            try {
              const response = await fetch(asset.uri);
              const blob = await response.blob();
              formData.append("images", blob, asset.fileName || "photo.jpg");
            } catch (err) {
              console.log("Error converting blob URI to file:", err);
            }
          } else if (asset.file) {
            formData.append(
              "images",
              asset.file,
              asset.fileName || "photo.jpg"
            );
          } else {
            formData.append("images", {
              uri: asset.uri,
              type: asset.mimeType || "image/jpeg",
              name: asset.fileName || "photo.jpg",
            });
          }
        }
      }

      const response = await fetch(
        "http://172.27.96.1:5000/api/entrepreneur/posts",
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
      } else {
        alert(data.msg || "Failed to create post");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Mentor Submit Handler
  const handleMentorSubmit = async () => {
    if (!mentorTitle.trim()) return Alert.alert("Validation", "Enter a title.");
    if (!mentorBrief.trim()) return Alert.alert("Validation", "Enter a brief.");
    if (isNaN(parseInt(mentorYears)))
      return Alert.alert("Validation", "Years must be a number.");
    if (!userName)
      return Alert.alert(
        "Validation",
        "User name is required. Please sign in again."
      );

    const token = await AsyncStorage.getItem("token");
    setMentorSubmitting(true);

    try {
      const mentorData = {
        name: userName,
        email: userEmail,
        expertise: mentorSector,
        bio: mentorBrief.trim(),
        photos: [],
        title: mentorTitle.trim(),
        experienceYears: parseInt(mentorYears, 10),
      };

      console.log("Submitting mentor data:", mentorData);

      const res = await fetch("http://172.27.96.1:5000/api/mentors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(mentorData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData.msg || errorData.message || `Server error (${res.status})`
          );
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

      navigation.navigate("HomeTabs");
    } catch (err) {
      console.error("Submission error:", err);
      Alert.alert("Error", err.message || "Failed to create post.");
    } finally {
      setMentorSubmitting(false);
    }
  };

  // Investor Submit Handler
  const handleInvestorSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please log in first");
        return;
      }

      if (!investmentAmount || !fundingType || !expectedROI || !interestLevel) {
        Alert.alert("Error", "Please fill all required fields");
        return;
      }

      const postData = {
        investmentAmount: Number(investmentAmount),
        fundingType,
        expectedROI: Number(expectedROI),
        interestLevel: Number(interestLevel),
        description: investorDescription,
      };

      const response = await fetch("http://172.27.96.1:5000/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Proposal created successfully!");
        // Reset form
        setInvestmentAmount("");
        setFundingType("");
        setExpectedROI("");
        setInterestLevel("");
        setInvestorDescription("");
      } else {
        Alert.alert("Error", data.msg || "Failed to create proposal");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };
  
  // Franchise Submit Handler
  const handleFranchiseSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please log in first");
        return;
      }
      
      // Validate fields
      if (!franchiseName || !franchiseDescription || !franchiseLocation || !franchiseCategory || !franchiseContact) {
        Alert.alert("Error", "Please fill all required fields");
        return;
      }
      
      // Create form data
      const formData = new FormData();
      formData.append("name", franchiseName);
      formData.append("description", franchiseDescription);
      formData.append("location", franchiseLocation);
      formData.append("category", franchiseCategory);
      formData.append("contact", franchiseContact);
      
      // Handle image upload: try Cloudinary first to get a URL; fallback to multipart attach
      if (franchiseImage) {
        const uri = franchiseImage.uri;
        let uploadedUrl = null;
        try {
          console.log("Uploading franchise image to Cloudinary from frontend...");
          uploadedUrl = await uploadToCloudinary(uri);
          console.log("Cloudinary upload success. URL:", uploadedUrl);
        } catch (e) {
          console.warn("Cloudinary frontend upload failed, will send file via multipart to backend:", e?.message || e);
        }

        if (uploadedUrl) {
          // Send URL so backend can store it reliably
          formData.append("imageUrl", uploadedUrl);
        } else {
          try {
            console.log("Preparing to attach image file to FormData", franchiseImage);
            // Derive a safe mime type and extension
            let derivedExt = '';
            if (uri && uri.includes('.')) {
              derivedExt = uri.substring(uri.lastIndexOf('.') + 1).toLowerCase();
            }
            const mimeFromPicker = franchiseImage.mimeType || '';
            let ext = (mimeFromPicker.split('/')[1] || derivedExt || 'jpeg');
            if (ext === 'jpg') ext = 'jpeg';
            const mimeType = mimeFromPicker || `image/${ext}`;
            const fileName = `franchise_${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;

            // Add to form data (let RN set proper Content-Type with boundary)
            formData.append("image", {
              uri,
              name: fileName,
              type: mimeType,
            });
            console.log(`Image appended to form data: ${fileName} (${mimeType})`);
          } catch (imageError) {
            console.error("Error preparing image:", imageError);
            Alert.alert(
              "Image Error", 
              "There was a problem with the image. Try uploading a different one or continue without an image."
            );
            // Continue without image instead of returning
          }
        }
      }
      
      console.log("Submitting franchise form...");
      Alert.alert("Submitting", "Sending your franchise information...");
      
      // Make API request
      const response = await fetch("http://172.27.96.1:5000/api/franchise/create", {
        method: "POST",
        headers: {
          // IMPORTANT: Do NOT set Content-Type manually for multipart/form-data.
          // Let React Native set the correct boundary.
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      console.log("Response status:", response.status);
      // Log a subset of headers for debugging
      try {
        const headerDump = {};
        response.headers && response.headers.forEach && response.headers.forEach((v, k) => headerDump[k] = v);
        console.log("Response headers:", headerDump);
      } catch {}
      const responseText = await response.text();
      console.log("Raw response text:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing response:", e);
        Alert.alert("Error", "Invalid response from server");
        return;
      }
      
      if (response.ok && data && data.success) {
        Alert.alert("Success", "Franchise created successfully!");
        // Reset form
        setFranchiseName("");
        setFranchiseDescription("");
        setFranchiseLocation("");
        setFranchiseCategory("");
        setFranchiseContact("");
        setFranchiseImage(null);
        
        navigation.navigate("HomeTabs");
      } else {
        console.error("API Error Response:", data);
        const baseMsg = data && (data.message || data.msg);
        let detail = baseMsg || `Failed to create franchise (status ${response.status}).`;
        if (response.status === 401) detail = "Authentication failed. Please log in again.";
        if (response.status === 400 && baseMsg) detail = baseMsg;
        Alert.alert("Error", detail);
      }
    } catch (err) {
      console.error("Franchise Submit Error:", err);
      Alert.alert(
        "Error", 
        "An error occurred while creating the franchise. Please check your internet connection and try again."
      );
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
          onPress={() => setActiveForm("investor")}
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
              maxLength={2500}
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
                  style={[styles.chip, mentorSector === s && styles.chipActive]}
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
              style={[
                styles.inputField,
                { height: 110, textAlignVertical: "top" },
              ]}
              placeholder="Describe your experience..."
              multiline
              value={mentorBrief}
              onChangeText={setMentorBrief}
            />

            <Text style={styles.label}>
              Photos (Optional - currently disabled)
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {mentorLocalImages.map((u, i) => (
                <TouchableOpacity
                  key={u + i}
                  onLongPress={() =>
                    setMentorLocalImages((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                  style={{ marginRight: 8, marginBottom: 8 }}
                >
                  <Image source={{ uri: u }} style={styles.imageThumb} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Image Upload Disabled",
                    "Image uploads have been temporarily disabled due to Cloudinary configuration issues. You can still submit the form without images."
                  )
                }
                style={[
                  styles.chip,
                  {
                    borderStyle: "dashed",
                    borderWidth: 1,
                    borderColor: "#bbb",
                  },
                ]}
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
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </>
        )}

        {activeForm === "investor" && (
          <>
            <Text style={styles.label}>Investment Amount</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter amount"
              value={investmentAmount}
              onChangeText={setInvestmentAmount}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Funding Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={fundingType}
                onValueChange={setFundingType}
                style={styles.picker}
              >
                <Picker.Item label="Select Type" value="" />
                <Picker.Item label="Equity" value="Equity" />
                <Picker.Item label="Loan" value="Loan" />
                <Picker.Item label="Grant" value="Grant" />
              </Picker>
            </View>

            <Text style={styles.label}>Expected ROI (%)</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter ROI"
              value={expectedROI}
              onChangeText={setExpectedROI}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Interest Level</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={interestLevel}
                onValueChange={setInterestLevel}
                style={styles.picker}
              >
                <Picker.Item label="Select Level" value="" />
                <Picker.Item label="1 - Low" value="1" />
                <Picker.Item label="2" value="2" />
                <Picker.Item label="3 - Medium" value="3" />
                <Picker.Item label="4" value="4" />
                <Picker.Item label="5 - High" value="5" />
              </Picker>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.inputField, { height: 100 }]}
              placeholder="Add a description"
              value={investorDescription}
              onChangeText={setInvestorDescription}
              multiline
            />

            <TouchableOpacity
              style={styles.postButton}
              onPress={handleInvestorSubmit}
            >
              <Text style={styles.postButtonText}>Submit Proposal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.discardButton}
              onPress={() => {
                setInvestmentAmount("");
                setFundingType("");
                setExpectedROI("");
                setInterestLevel("");
                setInvestorDescription("");
              }}
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </>
        )}

        {activeForm === "franchise" && (
          <>
            <Text style={styles.label}>Franchise Name</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter your franchise name"
              value={franchiseName}
              onChangeText={setFranchiseName}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.inputField, { height: 100 }]}
              placeholder="Describe your franchise opportunity"
              multiline
              value={franchiseDescription}
              onChangeText={setFranchiseDescription}
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter franchise location"
              value={franchiseLocation}
              onChangeText={setFranchiseLocation}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={franchiseCategory}
                onValueChange={(itemValue) => setFranchiseCategory(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Category" value="" />
                {franchiseCategories.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Contact Information</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter contact information (phone, email)"
              value={franchiseContact}
              onChangeText={setFranchiseContact}
            />

            <TouchableOpacity onPress={pickFranchiseImage} style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload Franchise Image</Text>
            </TouchableOpacity>

            {franchiseImage && (
              <View style={{ marginTop: 15, alignItems: 'center' }}>
                <Image 
                  source={{ uri: franchiseImage.uri }} 
                  style={{ width: 200, height: 200, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' }} 
                />
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <Text style={{ marginBottom: 5, color: '#666' }}>
                    {(franchiseImage.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </View>
                <TouchableOpacity
                  style={{ marginTop: 10, padding: 8, backgroundColor: '#f44336', borderRadius: 4 }}
                  onPress={() => setFranchiseImage(null)}
                >
                  <Text style={{ color: 'white' }}>Remove Image</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.postButton} onPress={handleFranchiseSubmit}>
              <Text style={styles.postButtonText}>Create Franchise</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.discardButton}
              onPress={() => {
                setFranchiseName("");
                setFranchiseDescription("");
                setFranchiseLocation("");
                setFranchiseCategory("");
                setFranchiseContact("");
                setFranchiseImage(null);
              }}
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </>
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
    gap: 8,
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
