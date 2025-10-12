import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const EditProposal = ({ navigation, route }) => {
  const id = route?.params?.id;
  const [loading, setLoading] = useState(true);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [fundingType, setFundingType] = useState('');
  const [expectedROI, setExpectedROI] = useState('');
  const [interestLevel, setInterestLevel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) {
        Alert.alert('Error', 'Missing proposal id');
        navigation.goBack();
        return;
      }
      setLoading(true);
      try {
        // include token in GET in case server requires auth to view a single proposal
        let token = await AsyncStorage.getItem('token');
        if (token && typeof token === 'string') {
          token = token.trim();
          if (token.toLowerCase().startsWith('bearer ')) token = token.split(' ')[1];
        }
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`http://172.27.96.1:5000/api/proposals/${id}`, { headers });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          Alert.alert('Error', data.msg || 'Failed to fetch proposal');
          navigation.goBack();
          return;
        }
        const data = await res.json();
        setInvestmentAmount(data.investmentAmount?.toString() || '');
        setFundingType(data.fundingType || '');
        setExpectedROI(data.expectedROI?.toString() || '');
        setInterestLevel(data.interestLevel?.toString() || '');
        setDescription(data.description || '');
      } catch (err) {
        console.error('Failed to load proposal', err);
        Alert.alert('Error', 'Could not load proposal');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Small runtime debug: show which platform and whether the Picker import is present
  useEffect(() => {
    try {
      console.log('EditProposal mounted. Platform:', Platform.OS, 'Picker type:', typeof Picker);
    } catch (e) {
      console.log('EditProposal debug log failed', e);
    }
  }, []);

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return Alert.alert('Authentication', 'Please log in');

      const body = {
        investmentAmount: Number(investmentAmount),
        fundingType,
        expectedROI: Number(expectedROI),
        interestLevel: Number(interestLevel),
        description,
      };

      // send update
      // normalize token again for the PUT
      let token2 = await AsyncStorage.getItem('token');
      if (token2 && typeof token2 === 'string') {
        token2 = token2.trim();
        if (token2.toLowerCase().startsWith('bearer ')) token2 = token2.split(' ')[1];
      }
      console.log('Using token for update (debug):', !!token2);
      const res = await fetch(`http://172.27.96.1:5000/api/proposals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        const json = await res.json().catch(() => ({}));
        console.error('Unauthorized update attempt:', json);
        Alert.alert('Unauthorized', json.msg || 'Your session has expired or token is invalid. Please log in again.');
        // clear token and route to login to get a fresh token
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        Alert.alert('Success', 'Proposal updated');
        navigation.goBack();
      } else {
        console.error('Update failed', res.status, data);
        Alert.alert('Error', data.msg || 'Failed to update');
      }
    } catch (err) {
      console.error('Update error', err);
      Alert.alert('Error', 'Update failed');
    }
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color="#6750A4" style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Proposal</Text>

        <Text style={styles.label}>Investment Amount</Text>
        <TextInput style={styles.input} value={investmentAmount} onChangeText={setInvestmentAmount} keyboardType="numeric" />

        <Text style={styles.label}>Funding Type</Text>
        {/* Debug: show current value */}
        <Text style={styles.debugText}>Current: {String(fundingType)}</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={fundingType}
            onValueChange={(v) => { console.log('Picker fundingType ->', v); setFundingType(v); }}
            style={styles.picker}
          >
            <Picker.Item label="Select Type" value="" />
            <Picker.Item label="Equity" value="Equity" />
            <Picker.Item label="Loan" value="Loan" />
            <Picker.Item label="Grant" value="Grant" />
          </Picker>
        </View>

        <Text style={styles.label}>Expected ROI (%)</Text>
        <TextInput style={styles.input} value={expectedROI} onChangeText={setExpectedROI} keyboardType="numeric" />

        <Text style={styles.label}>Interest Level</Text>
        {/* Debug: show current value */}
        <Text style={styles.debugText}>Current: {String(interestLevel)}</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={interestLevel}
            onValueChange={(v) => { console.log('Picker interestLevel ->', v); setInterestLevel(v); }}
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
        <TextInput style={[styles.input, { height: 120 }]} value={description} onChangeText={setDescription} multiline />

        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Update Proposal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 18 },
  label: { fontSize: 14, color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 14, backgroundColor: '#fafafa' },
  pickerWrap: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 14, backgroundColor: '#f9f9f9' },
  picker: { height: 48 },
  debugText: { color: '#333', marginBottom: 6 },
  button: { backgroundColor: '#6750A4', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});

export default EditProposal;
