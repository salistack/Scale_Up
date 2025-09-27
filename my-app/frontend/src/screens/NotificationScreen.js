import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Swipeable } from 'react-native-gesture-handler';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'comment',
      role: 'mentor',
      message: 'Dr. Sarah Chen commented on your EcoTech startup idea',
      timestamp: '2 hours ago',
      read: false,
      icon: '💬',
    },
    {
      id: 2,
      type: 'interest',
      role: 'investor',
      message: 'GreenTech Ventures expressed interest in your proposal',
      timestamp: '5 hours ago',
      read: false,
      icon: '💰',
    },
    {
      id: 3,
      type: 'message',
      role: 'mentor',
      message: 'New message from Mentor John regarding your MVP',
      timestamp: '1 day ago',
      read: true,
      icon: '✉️',
    },
    {
      id: 4,
      type: 'system',
      role: 'system',
      message: 'Your profile verification is complete',
      timestamp: '2 days ago',
      read: true,
      icon: '✅',
    },
    {
      id: 5,
      type: 'rating',
      role: 'entrepreneur',
      message: 'You received a 5-star rating for your mentorship session',
      timestamp: '3 days ago',
      read: true,
      icon: '⭐',
    },
  ]);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAsUnread = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: false } : notif
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications(notifications.filter(notif => notif.read));
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
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

  const renderNotificationItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.notificationItemUnread,
        ]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={styles.notificationIcon}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
        </View>
        
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </Swipeable>
  );

  const tabs = [
    { key: 'all', label: 'All', icon: 'all-inbox' },
    { key: 'unread', label: 'Unread', icon: 'mark-as-unread' },
    { key: 'comment', label: 'Comments', icon: 'comment' },
    { key: 'message', label: 'Messages', icon: 'message' },
    { key: 'system', label: 'System', icon: 'notifications' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
          </Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
          <Text style={styles.clearButtonText}>Clear Read</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? '#45B7D1' : '#666'}
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
            {tab.key === 'unread' && unreadCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="notifications-off" size={64} color="#CCC" />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'unread' 
                ? 'You\'re all caught up! No unread notifications.'
                : 'No notifications to display for this filter.'
              }
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 10,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#45B7D1',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  notificationItemUnread: {
    backgroundColor: '#F8F9FA',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#45B7D1',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  actionButton: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    height: '80%',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  markAsReadButton: {
    backgroundColor: '#4ECDC4',
  },
  markAsUnreadButton: {
    backgroundColor: '#FFD166',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationScreen;