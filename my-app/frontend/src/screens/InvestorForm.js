import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

const InvestorForm = ({ navigation }) => {
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [fundingType, setFundingType] = useState("");
  const [expectedROI, setExpectedROI] = useState("");
  const [interestLevel, setInterestLevel] = useState(""); // numeric 1-5
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
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
        description,
      };

      // The backend mounts investor proposal routes at /api/proposals
      const response = await fetch(
        "http://192.168.1.121:5000/api/proposals",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(postData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Proposal created successfully!");
        setInvestmentAmount("");
        setFundingType("");
        setExpectedROI("");
        setInterestLevel("");
        setDescription("");
        navigation.goBack();
      } else {
        Alert.alert("Error", data.msg || "Failed to create proposal");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Investor Proposal</Text>

        <Text style={styles.label}>Investment Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          value={investmentAmount}
          onChangeText={setInvestmentAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Funding Type</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={fundingType}
            onValueChange={(v) => setFundingType(v)}
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
          style={styles.input}
          placeholder="Enter ROI"
          value={expectedROI}
          onChangeText={setExpectedROI}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Interest Level</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={interestLevel}
            onValueChange={(v) => setInterestLevel(v)}
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
          style={[styles.input, { height: 120 }]}
          placeholder="Add a description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Proposal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 14, color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
    backgroundColor: "#f9f9f9",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 14,
    backgroundColor: "#f9f9f9",
  },
  picker: { height: 48 },
  button: {
    backgroundColor: "#6750A4",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default InvestorForm;
