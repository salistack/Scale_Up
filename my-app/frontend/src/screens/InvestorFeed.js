import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native"; // Added
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const InvestorFeed = () => {
  const navigation = useNavigation(); // Added
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ROI calculator states
  const [roiModalVisible, setRoiModalVisible] = useState(false);
  const [roiInitial, setRoiInitial] = useState("");
  const [roiFinal, setRoiFinal] = useState("");
  const [roiResult, setRoiResult] = useState(null);
  const [roiForProposal, setRoiForProposal] = useState(null); // optional: tie to a proposal id

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setCurrentUserId(parsed._id || parsed.id || parsed.userId || null);
          } catch {
            setCurrentUserId(storedUser);
          }
        }

        const res = await fetch("http://10.161.162.45:5000/api/proposals", {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          console.error("Failed to fetch proposals", res.status);
          setProposals([]);
        } else {
          const data = await res.json();
          setProposals(Array.isArray(data) ? data : data.proposals || []);
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
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login required", "Please log in to contact investors");
        return;
      }

      const hosts = [];
      const debuggerHost =
        Constants.manifest?.debuggerHost ||
        Constants.manifest2?.packagerOpts?.devClient?.url;
      if (debuggerHost) {
        const hostFromPackager = debuggerHost.split(":")[0];
        if (hostFromPackager) hosts.push(hostFromPackager);
      }
      hosts.push("10.161.162.45", "localhost", "127.0.0.1", "10.0.2.2");

      let lastErr = null;
      let ok = false;
      for (const host of hosts) {
        const url = `http://${host}:5000/api/proposals/email/${id}`;
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const json = await res.json();
          if (res.ok) {
            Alert.alert("Done", json.msg || "Investor notified");
            ok = true;
            break;
          } else lastErr = json;
        } catch (err) {
          lastErr = err;
        }
      }
      if (!ok) {
        console.error("Contact action failed", lastErr);
        Alert.alert(
          "Error",
          lastErr?.msg || lastErr?.message || "Failed to contact investor"
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Delete Proposal",
      "Are you sure you want to delete this proposal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) {
                Alert.alert("Error", "Authentication required");
                return;
              }

              const res = await fetch(
                `http://10.161.162.45:5000/api/proposals/${id}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (res.ok) {
                setProposals(proposals.filter((p) => p._id !== id));
                Alert.alert("Success", "Proposal deleted successfully");
              } else {
                const data = await res.json();
                Alert.alert("Error", data.msg || "Failed to delete proposal");
              }
            } catch (err) {
              console.error("Delete error:", err);
              Alert.alert("Error", "Failed to delete proposal");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (proposal) => {
    navigation.navigate("EditProposal", { id: proposal._id });
  };

  const getRelativeTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return `${Math.floor(diff / 604800)}w`;
  };

  // ROI calculation helpers
  const openRoiCalculator = (proposal = null) => {
    setRoiForProposal(proposal?._id || null);

    // prefill initial value if the proposal has investmentAmount
    const amt = proposal?.investmentAmount ?? "";
    setRoiInitial(amt ? String(amt) : "");

    // prefill expected ROI to help user if available
    if (proposal?.expectedROI) {
      const expected = Number(proposal.expectedROI);
      if (!isNaN(expected) && amt) {
        const initial = Number(amt);
        const final = initial * (1 + expected / 100);
        setRoiFinal(String(Number(final.toFixed(2))));
      }
    } else {
      setRoiFinal("");
    }

    setRoiResult(null);
    setRoiModalVisible(true);
  };

  const calculateRoi = () => {
    const initial = Number(roiInitial);
    const final = Number(roiFinal);

    if (!roiInitial || isNaN(initial) || initial <= 0) {
      Alert.alert("Invalid input", "Please enter a valid initial investment (>0)");
      return;
    }

    if (!roiFinal || isNaN(final) || final < 0) {
      Alert.alert("Invalid input", "Please enter a valid final value (>=0)");
      return;
    }

    const profit = final - initial;
    const roiPercent = (profit / initial) * 100;

    const result = {
      initial: initial,
      final: final,
      profit: Number(profit.toFixed(2)),
      roiPercent: Number(roiPercent.toFixed(2)),
    };

    setRoiResult(result);
  };

  const resetRoi = () => {
    setRoiInitial("");
    setRoiFinal("");
    setRoiResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Investment Feed</Text>
        <View style={styles.headerDivider} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6750A4" />
            <Text style={styles.loadingText}>Loading opportunities...</Text>
          </View>
        ) : proposals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={styles.emptyTitle}>No Investment Opportunities</Text>
            <Text style={styles.emptyText}>
              Check your network connection or try again later
            </Text>
          </View>
        ) : (
          proposals.map((p) => {
            const investorName = p.investor?.name || "Investor";
            const createdAt = p.createdAt ? new Date(p.createdAt) : null;
            const timeLabel = getRelativeTime(createdAt);
            const initials = investorName
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <View key={p._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.name}>{investorName}</Text>
                    <Text style={styles.time}>{timeLabel}</Text>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <Text style={styles.moreIcon}>⋯</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.highlightBanner}>
                  <View style={styles.highlightLeft}>
                    <Text style={styles.fundingType}>
                      {p.fundingType || "Investment"}
                    </Text>
                    <Text style={styles.amount}>{p.investmentAmount || "-"}</Text>
                  </View>
                  <View style={styles.roiBadge}>
                    <Text style={styles.roiText}>
                      ROI {p.expectedROI ?? "-"}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.postBody} numberOfLines={4}>
                  {p.description}
                </Text>

                <View style={styles.tags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagIcon}>📊</Text>
                    <Text style={styles.tagText}>{p.fundingType || "N/A"}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagIcon}>📈</Text>
                    <Text style={styles.tagText}>
                      Interest: {p.interestLevel ?? "-"}
                    </Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricIcon}>👁️</Text>
                    <Text style={styles.metricText}>256 views</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricIcon}>💬</Text>
                    <Text style={styles.metricText}>12 interested</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => contact(p._id)}
                  >
                    <Text style={styles.actionIcon}>💼</Text>
                    <Text style={styles.actionText}>Connect</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openRoiCalculator(p)}
                  >
                    <Text style={styles.actionIcon}>📊</Text>
                    <Text style={styles.actionText}>ROI</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      Alert.alert(
                        "Saved",
                        "Saved to bookmarks (not implemented)"
                      )
                    }
                  >
                    <Text style={styles.actionIcon}>🔖</Text>
                    <Text style={styles.actionText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      Alert.alert("Share", "Share feature coming soon")
                    }
                  >
                    <Text style={styles.actionIcon}>📤</Text>
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>

                {(() => {
                  const ownerId =
                    typeof p.investor === "string"
                      ? p.investor
                      : p.investor?._id || p.investor?.id;
                  if (
                    currentUserId &&
                    ownerId &&
                    currentUserId.toString() === ownerId.toString()
                  ) {
                    return (
                      <View style={styles.ownerActions}>
                        <View style={styles.divider} />
                        <View style={styles.ownerButtonsRow}>
                          <TouchableOpacity
                            style={styles.ownerBtn}
                            onPress={() => handleEdit(p)}
                          >
                            <Text style={styles.ownerBtnText}>✏️ Edit Post</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.ownerBtn, styles.deleteOwnerBtn]}
                            onPress={() => handleDelete(p._id)}
                          >
                            <Text
                              style={[styles.ownerBtnText, styles.deleteText]}
                            >
                              🗑️ Delete
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ROI Calculator Modal */}
      <Modal
        visible={roiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRoiModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>ROI Calculator</Text>
            <Text style={styles.modalSubtitle}>
              Enter Initial Investment and Final Value to compute ROI
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Initial investment (e.g. 10000)"
              keyboardType="numeric"
              value={String(roiInitial)}
              onChangeText={(t) => setRoiInitial(t)}
            />

            <TextInput
              style={styles.input}
              placeholder="Final value (e.g. 12000)"
              keyboardType="numeric"
              value={String(roiFinal)}
              onChangeText={(t) => setRoiFinal(t)}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { flex: 1, marginRight: 6 }]}
                onPress={calculateRoi}
              >
                <Text style={styles.modalBtnText}>Calculate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { flex: 1, marginLeft: 6, backgroundColor: '#eee' }]}
                onPress={() => {
                  resetRoi();
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#333' }]}>Reset</Text>
              </TouchableOpacity>
            </View>

            {roiResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>
                  Profit: {roiResult.profit} ({roiResult.roiPercent}%)
                </Text>
                <Text style={styles.resultSmall}>
                  Initial: {roiResult.initial} · Final: {roiResult.final}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalBtn, { marginTop: 12 }]}
              onPress={() => setRoiModalVisible(false)}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// Styles remain the same with a few additions for modal
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  headerContainer: {
    backgroundColor: "#fff",
    paddingBottom: 0,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: "#1C1E21",
    letterSpacing: 0.3,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#E4E6EB",
  },
  scroll: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#65676B",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1E21",
    marginBottom: 8,
  },
  emptyText: {
    color: "#65676B",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6750A4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1C1E21",
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
    color: "#65676B",
    fontWeight: "400",
  },
  moreButton: {
    padding: 8,
  },
  moreIcon: {
    fontSize: 20,
    color: "#65676B",
    fontWeight: "700",
  },
  highlightBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F5FF",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#6750A4",
  },
  highlightLeft: {
    flex: 1,
  },
  fundingType: {
    fontSize: 13,
    color: "#6750A4",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1C1E21",
  },
  roiBadge: {
    backgroundColor: "#6750A4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  roiText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  postBody: {
    fontSize: 15,
    color: "#1C1E21",
    paddingHorizontal: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E7F3FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  tagIcon: {
    fontSize: 12,
  },
  tagText: {
    color: "#1877F2",
    fontSize: 13,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 20,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricIcon: {
    fontSize: 14,
  },
  metricText: {
    fontSize: 13,
    color: "#65676B",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E4E6EB",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    color: "#65676B",
    fontWeight: "600",
    fontSize: 15,
  },
  ownerActions: {
    marginTop: 4,
  },
  ownerButtonsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  ownerBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
  },
  deleteOwnerBtn: {
    backgroundColor: "#FFE8E8",
  },
  ownerBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1E21",
  },
  deleteText: {
    color: "#E53935",
  },

  /* modal styles */
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "#666",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E4E6EB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 15,
  },
  modalButtonsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#6750A4",
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  resultBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F7F5FF",
    borderRadius: 8,
  },
  resultText: {
    fontWeight: "700",
  },
  resultSmall: {
    color: "#666",
    marginTop: 6,
  },
});

export default InvestorFeed;
