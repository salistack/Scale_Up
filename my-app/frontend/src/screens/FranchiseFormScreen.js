import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const FranchiseFormScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Food & Beverage");
  const [contact, setContact] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    "Food & Beverage",
    "Retail",
    "Education",
    "Healthcare",
    "Technology",
    "Fitness",
    "Entertainment",
    "Services",
    "Other"
  ];

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload an image.');
      return;
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // Form validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a franchise name');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    if (!contact.trim()) {
      Alert.alert('Error', 'Please provide contact information');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get token from storage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'You need to be logged in to post a franchise');
        setLoading(false);
        return;
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('category', category);
      formData.append('contact', contact);
      
      // Add image if selected
      if (image) {
        const fileType = image.split('.').pop() || 'jpg';
        formData.append('image', {
          uri: image,
          type: `image/${fileType}`,
          name: `franchise_${Date.now()}.${fileType}`
        });
      }
      
      // Send request to API
      const response = await fetch('http://172.27.96.1:5000/api/franchise/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Franchise posted successfully!', [
          { text: 'OK', onPress: () => {
            // First navigate to HomeTabs to ensure bottom tabs are visible
            navigation.navigate('HomeTabs');
          }}
        ]);
        
        // Reset form
        setName('');
        setDescription('');
        setLocation('');
        setCategory('Food & Beverage');
        setContact('');
        setImage(null);
      } else {
        Alert.alert('Error', data.message || 'Failed to post franchise');
      }
    } catch (error) {
      console.error('Franchise submission error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Franchise</Text>
      </View>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.label}>Franchise Name</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter franchise name"
          value={name}
          onChangeText={setName}
        />
        
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.inputField, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Describe your franchise opportunity"
          multiline
          value={description}
          onChangeText={setDescription}
        />
        
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.inputField}
          placeholder="City, Country"
          value={location}
          onChangeText={setLocation}
        />
        
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            style={styles.picker}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
        
        <Text style={styles.label}>Contact Information</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Phone, Email, or Website"
          value={contact}
          onChangeText={setContact}
        />
        
        <Text style={styles.label}>Franchise Image (Optional)</Text>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>Select Image</Text>
        </TouchableOpacity>
        
        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
            >
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.submitButton, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#6750A4",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginRight: 40, // Balance the back button
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
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
  },
  picker: {
    height: 50,
  },
  imageButton: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 16,
  },
  imageButtonText: {
    color: "#333",
    fontSize: 16,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 4,
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#6750A4",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default FranchiseFormScreen;