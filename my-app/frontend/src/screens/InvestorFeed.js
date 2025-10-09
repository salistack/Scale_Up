import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const InvestorFeed = ({ navigation }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://192.168.8.101:5000/api/proposals", {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          console.error("Failed to fetch proposals", res.status);
          setProposals([]);
        } else {
          const data = await res.json();
          if (Array.isArray(data)) setProposals(data);
          else if (data && Array.isArray(data.proposals)) setProposals(data.proposals);
          else setProposals([]);
        }
      } catch (err) {
        console.error("Error fetching proposals:", err);
        setProposals([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const contact = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) { Alert.alert('Login required','Please log in to contact investors'); return; }

      const hosts = [];
      const debuggerHost = Constants.manifest?.debuggerHost || Constants.manifest2?.packagerOpts?.devClient?.url;
      if (debuggerHost) {
        const hostFromPackager = debuggerHost.split(":")[0];
        if (hostFromPackager) hosts.push(hostFromPackager);
      }
      hosts.push('192.168.8.101', 'localhost', '127.0.0.1', '10.0.2.2');

      let lastErr = null;
      let ok = false;
      for (const host of hosts) {
        const url = `http://${host}:5000/api/proposals/email/${id}`;
        try {
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
          const json = await res.json();
          if (res.ok) {
            Alert.alert('Done', json.msg || 'Investor notified');
            ok = true;
            break;
          } else {
            lastErr = json;
          }
        } catch (err) {
          lastErr = err;
        }
      }
      if (!ok) {
        console.error('Contact action failed', lastErr);
        Alert.alert('Error', lastErr?.msg || lastErr?.message || 'Failed to contact investor');
      }
    } catch (err) { console.error(err); Alert.alert('Error', err.message); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Investor Feed</Text>
      <ScrollView contentContainerStyle={styles.list}>
          {loading ? (
            <ActivityIndicator size="large" color="#6750A4" />
          ) : proposals.length === 0 ? (
            <Text style={{ color: '#666' }}>No proposals found. Check backend is running and use correct host (localhost vs LAN IP).</Text>
          ) : (
            proposals.map((p) => {
              const investorName = (p.investor && p.investor.name) || "Investor";
              const createdAt = p.createdAt ? new Date(p.createdAt) : null;
              const timeLabel = createdAt
                ? createdAt.toLocaleDateString() + " " + createdAt.toLocaleTimeString()
                : "";
              const initials = investorName
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <View key={p._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}><Text style={{color:'#fff',fontWeight:'700'}}>{initials}</Text></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.nameText}>{investorName}</Text>
                      <Text style={styles.timeText}>{timeLabel}</Text>
                    </View>
                  </View>

                  <Text style={styles.postTitle}>
                    {p.fundingType || "Investment"} • {p.investmentAmount || "-"}
                  </Text>

                  <Text style={styles.postBody}>{p.description}</Text>

                  <View style={styles.tagsRow}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{p.fundingType || "N/A"}</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>ROI: {p.expectedROI ?? "-"}%</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>Interest: {p.interestLevel ?? "-"}</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => contact(p._id)}
                    >
                      <Text style={styles.actionText}>Contact</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.secondaryBtn]}
                      onPress={() => Alert.alert("Saved", "Saved to bookmarks (not implemented)")}
                    >
                      <Text style={[styles.actionText, styles.secondaryText]}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', padding: 16 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6750A4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: { fontWeight: '700', fontSize: 15 },
  timeText: { fontSize: 12, color: '#888' },
  postTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  postBody: { fontSize: 14, color: '#333', marginBottom: 10 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag: { backgroundColor: '#F1F3F8', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  tagText: { fontSize: 12, color: '#333' },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-start', gap: 10 },
  actionBtn: { backgroundColor: '#6750A4', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  actionText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6E6E6', marginLeft: 8 },
  secondaryText: { color: '#333' },
});

export default InvestorFeed;
