import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Swipeable } from "react-native-gesture-handler";

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const loadNotifications = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (!user) return;

      const userData = JSON.parse(user);
      const userId = String(userData.id || userData._id); // Ensure string format
      setCurrentUserId(userId);

      const userNotifications = await AsyncStorage.getItem('userNotifications');
      if (userNotifications) {
        const allNotifications = JSON.parse(userNotifications);
        console.log('All notifications:', allNotifications.length);
        console.log('Current user ID:', userId);
        
        // Filter notifications for current user with better matching
        const userSpecificNotifications = allNotifications.filter(
          notification => {
            const notificationUserId = String(notification.toUserId || '');
            const match = notificationUserId === userId;
            console.log(`Notification ${notification.id}: toUserId="${notificationUserId}", currentUserId="${userId}", match=${match}`);
            return match;
          }
        );
        
        // Sort by creation date (newest first)
        userSpecificNotifications.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        console.log('Filtered notifications:', userSpecificNotifications.length);
        setNotifications(userSpecificNotifications);
      } else {
        console.log('No notifications found in storage');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Reload notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );


  const [refreshing, setRefreshing] = useState(false);

  const markAsRead = async (id) => {
    const updatedNotifications = notifications.map((notif) =>
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    
    // Update AsyncStorage
    try {
      const allNotifications = await AsyncStorage.getItem('userNotifications');
      if (allNotifications) {
        const allNotifs = JSON.parse(allNotifications);
        const updated = allNotifs.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        );
        await AsyncStorage.setItem('userNotifications', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const markAsUnread = async (id) => {
    const updatedNotifications = notifications.map((notif) =>
      notif.id === id ? { ...notif, read: false } : notif
    );
    setNotifications(updatedNotifications);
    
    // Update AsyncStorage
    try {
      const allNotifications = await AsyncStorage.getItem('userNotifications');
      if (allNotifications) {
        const allNotifs = JSON.parse(allNotifications);
        const updated = allNotifs.map((notif) =>
          notif.id === id ? { ...notif, read: false } : notif
        );
        await AsyncStorage.setItem('userNotifications', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const deleteNotification = async (id) => {
    const updatedNotifications = notifications.filter((notif) => notif.id !== id);
    setNotifications(updatedNotifications);
    
    // Update AsyncStorage
    try {
      const allNotifications = await AsyncStorage.getItem('userNotifications');
      if (allNotifications) {
        const allNotifs = JSON.parse(allNotifications);
        const updated = allNotifs.filter((notif) => notif.id !== id);
        await AsyncStorage.setItem('userNotifications', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      // Keep only unread notifications
      const unreadNotifications = notifications.filter((notif) => !notif.read);
      setNotifications(unreadNotifications);
      
      // Update AsyncStorage
      const allNotifications = await AsyncStorage.getItem('userNotifications');
      if (allNotifications) {
        const allNotifs = JSON.parse(allNotifications);
        const updatedNotifs = allNotifs.filter((notif) => !notif.read || String(notif.toUserId) !== String(currentUserId));
        await AsyncStorage.setItem('userNotifications', JSON.stringify(updatedNotifs));
      }
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const renderRightActions = (notification) => (
    <View style={styles.rightActions}>
      {!notification.read ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.markAsReadButton]}
          onPress={() => markAsRead(notification.id)}
        >
          <Icon name="mark-as-unread" size={20} color="#FFF" />
          <Text style={styles.actionText}>Read</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionButton, styles.markAsUnreadButton]}
          onPress={() => markAsUnread(notification.id)}
        >
          <Icon name="mark-as-read" size={20} color="#FFF" />
          <Text style={styles.actionText}>Unread</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => deleteNotification(notification.id)}
      >
        <Icon name="delete" size={20} color="#FFF" />
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const formatNotification = (notification) => {
    if (notification.type === 'meeting_request') {
      return {
        ...notification,
        icon: "📅",
        timestamp: notification.createdAt ? 
          new Date(notification.createdAt).toLocaleDateString() : 
          'Recently'
      };
    }
    return notification;
  };

  const renderNotificationItem = ({ item }) => {
    const formattedItem = formatNotification(item);
    
    return (
      <Swipeable renderRightActions={() => renderRightActions(formattedItem)}>
        <TouchableOpacity
          style={[
            styles.notificationItem,
            !formattedItem.read && styles.notificationItemUnread,
          ]}
          onPress={() => {
            markAsRead(formattedItem.id);
            // If it's a meeting request, navigate to calendar
            if (formattedItem.type === 'meeting_request') {
              navigation.navigate('CalendarScreen');
            }
          }}
        >
          <View style={styles.notificationIcon}>
            <Text style={styles.iconText}>{formattedItem.icon || "📬"}</Text>
          </View>

          <View style={styles.notificationContent}>
            <Text style={styles.notificationMessage}>{formattedItem.message}</Text>
            {formattedItem.date && formattedItem.time && (
              <Text style={styles.notificationMeetingInfo}>
                📅 {new Date(formattedItem.date).toLocaleDateString()} at {formattedItem.time}
              </Text>
            )}
            <Text style={styles.notificationTimestamp}>{formattedItem.timestamp}</Text>
          </View>

          {!formattedItem.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // Use only real notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount} unread {unreadCount === 1 ? "message" : "messages"}
          </Text>
          <Text style={styles.debugText}>
            Total: {notifications.length} | User: {currentUserId}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.clearButton, styles.clearAllButton]} 
            onPress={async () => {
              try {
                // Clear only current user's notifications, keep others
                const allNotifications = await AsyncStorage.getItem('userNotifications');
                if (allNotifications) {
                  const allNotifs = JSON.parse(allNotifications);
                  const otherUsersNotifs = allNotifs.filter(
                    notif => String(notif.toUserId || '') !== String(currentUserId)
                  );
                  await AsyncStorage.setItem('userNotifications', JSON.stringify(otherUsersNotifs));
                }
                setNotifications([]);
                console.log('Cleared all notifications for current user');
              } catch (error) {
                console.error('Error clearing notifications:', error);
              }
            }}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
            <Text style={styles.clearButtonText}>Clear Read</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="notifications-off" size={64} color="#CCC" />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateText}>
              {"No notifications to display."}
            </Text>
          </View>
        }
      />
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
    justifyContent: "space-between",
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
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  debugText: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
    fontStyle: 'italic',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
  },
  clearAllButton: {
    backgroundColor: "#FFE5E5",
  },
  clearButtonText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 12,
  },
  // ...existing code...
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
  },
  notificationItemUnread: {
    backgroundColor: "#F8F9FA",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: "#333",
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationMeetingInfo: {
    fontSize: 14,
    color: "#6750A4",
    marginBottom: 4,
    fontWeight: "500",
  },
  notificationTimestamp: {
    fontSize: 12,
    color: "#666",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6750A4",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
  },
  actionButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    height: "80%",
    marginHorizontal: 4,
    borderRadius: 8,
  },
  markAsReadButton: {
    backgroundColor: "#4ECDC4",
  },
  markAsUnreadButton: {
    backgroundColor: "#FFD166",
  },
  deleteButton: {
    backgroundColor: "#FF6B6B",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default NotificationScreen;
