import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Vibration
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ScheduleScreen = ({ route }) => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get post creator info from navigation params
  const postCreator = route?.params?.postCreator;
  const postType = route?.params?.postType || 'franchise';
  const postTitle = route?.params?.postTitle || 'Post';
  
  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    
    // Add a subtle vibration
    Vibration.vibrate(100);
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowToast(false);
    });
  };
  
  const handleSchedule = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (!user) {
        Alert.alert('Error', 'Please log in first');
        return;
      }

      const currentUser = JSON.parse(user);
      const currentUserId = currentUser.id || currentUser._id;

      console.log('Creating schedule for current user:', currentUserId);
      console.log('Post creator:', postCreator);

      // Create schedule event for current user
      const timestamp = Date.now();
      const scheduleEvent = {
        id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        title: `Meeting: ${postTitle}`,
        date: selectedDate,
        time: selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'meeting',
        role: 'schedule',
        notes: `Meeting scheduled with ${postCreator?.name || 'Post Creator'} about ${postTitle}`,
        location: 'To be determined',
        userId: currentUserId,
        postCreatorId: postCreator?.id || postCreator?._id,
        postCreatorName: postCreator?.name,
        scheduledBy: currentUser.name
      };

      console.log('Schedule event created:', scheduleEvent);

      // Store the schedule for current user
      const existingSchedules = await AsyncStorage.getItem('userSchedules');
      const schedules = existingSchedules ? JSON.parse(existingSchedules) : [];
      console.log('Existing schedules before adding:', schedules.length);
      
      schedules.push(scheduleEvent);
      console.log('Schedules after adding user event:', schedules.length);
      
      await AsyncStorage.setItem('userSchedules', JSON.stringify(schedules));

      // Create notification for post creator
      if (postCreator && (postCreator.id || postCreator._id)) {
        const uniqueTimestamp = Date.now() + Math.random();
        const notificationId = `notif_${uniqueTimestamp.toString().replace('.', '_')}`;
        // Create franchise-specific message
        const isForFranchise = postType === 'franchise';
        const messageText = isForFranchise 
          ? `🏢 ${currentUser.name} is interested in your franchise "${postTitle}" and has scheduled a meeting!`
          : `${currentUser.name} has scheduled a meeting with you about "${postTitle}"`;
          
        const notification = {
          id: notificationId,
          title: isForFranchise ? `New Franchise Meeting Request` : `New Meeting Request`,
          message: messageText,
          date: selectedDate,
          time: selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'meeting_request',
          fromUserId: currentUserId,
          fromUserName: currentUser.name,
          toUserId: String(postCreator.id || postCreator._id), // Ensure string format
          postTitle: postTitle,
          postType: postType,
          read: false,
          createdAt: new Date().toISOString()
        };

        console.log('Creating notification with ID:', notificationId);
        console.log('Notification toUserId:', notification.toUserId);

        // Store notification for post creator
        const existingNotifications = await AsyncStorage.getItem('userNotifications');
        const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
        
        // Add the new notification at the beginning of the array (newest first)
        notifications.unshift(notification);
        await AsyncStorage.setItem('userNotifications', JSON.stringify(notifications));
        
        console.log('Total notifications after adding:', notifications.length);

        // Also create a schedule event for the post creator
        const creatorScheduleEvent = {
          id: `${timestamp + 2}_${Math.random().toString(36).substr(2, 9)}`,
          title: `Meeting Request from ${currentUser.name}`,
          date: selectedDate,
          time: selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'meeting',
          role: 'schedule',
          notes: `${currentUser.name} scheduled a meeting about ${postTitle}`,
          location: 'To be determined',
          userId: postCreator.id || postCreator._id,
          requestedBy: currentUser.name,
          scheduledBy: currentUser.name
        };

        console.log('Creator schedule event created:', creatorScheduleEvent);
        schedules.push(creatorScheduleEvent);
        await AsyncStorage.setItem('userSchedules', JSON.stringify(schedules));
        console.log('Total schedules stored:', schedules.length);
        
        console.log('Notification created for post creator:', notification);
        console.log('Total notifications stored:', notifications.length);
      }

      // Show toast notification first
      showToastNotification(`📅 Meeting scheduled with ${postCreator?.name || 'Post creator'}!`);
      
      // Small delay then show options
      setTimeout(() => {
        Alert.alert(
          'Success',
          `Meeting scheduled successfully!\n${postCreator?.name || 'Post creator'} has been notified.`,
          [
            {
              text: 'View Calendar',
              onPress: () => navigation.navigate('CalendarScreen')
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      }, 500);
    } catch (error) {
      showToastNotification('❌ Failed to create schedule');
      console.error('Schedule creation error:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday(day) && styles.calendarDayToday,
            isSelected(day) && styles.calendarDaySelected,
          ]}
          onPress={() => {
            const newDate = new Date(currentDate);
            newDate.setDate(day);
            setSelectedDate(newDate);
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isToday(day) && styles.calendarDayTextToday,
            isSelected(day) && styles.calendarDayTextSelected,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const renderTimePicker = () => {
    const hours = [];
    const minutes = ['00', '15', '30', '45'];
    
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute of minutes) {
        const timeOption = `${hour.toString().padStart(2, '0')}:${minute}`;
        const timeDate = new Date();
        timeDate.setHours(hour, parseInt(minute), 0, 0);
        
        hours.push(
          <TouchableOpacity
            key={timeOption}
            style={[
              styles.timeSlot,
              selectedTime.getHours() === hour && selectedTime.getMinutes() === parseInt(minute) && styles.timeSlotSelected
            ]}
            onPress={() => setSelectedTime(timeDate)}
          >
            <Text style={[
              styles.timeSlotText,
              selectedTime.getHours() === hour && selectedTime.getMinutes() === parseInt(minute) && styles.timeSlotTextSelected
            ]}>
              {timeOption}
            </Text>
          </TouchableOpacity>
        );
      }
    }
    
    return hours;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Meeting</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={() => navigateMonth(-1)}>
              <Text style={styles.navButton}>‹</Text>
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            
            <TouchableOpacity onPress={() => navigateMonth(1)}>
              <Text style={styles.navButton}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>
        </View>

        {/* Time Picker Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {renderTimePicker()}
          </View>
        </View>

        {/* Selected Date & Time Display */}
        <View style={styles.selectionSummary}>
          <Text style={styles.summaryTitle}>Meeting Details</Text>
          {postCreator && (
            <Text style={styles.summaryText}>
              👤 Meeting with: {postCreator.name}
            </Text>
          )}
          <Text style={styles.summaryText}>
            📋 About: {postTitle}
          </Text>
          <Text style={styles.summaryText}>
            📅 {selectedDate.toLocaleDateString()}
          </Text>
          <Text style={styles.summaryText}>
            🕐 {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Schedule Button */}
        <TouchableOpacity 
          style={styles.scheduleButton}
          onPress={handleSchedule}
        >
          <Text style={styles.scheduleButtonText}>📅 Schedule Meeting</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Toast Notification */}
      {showToast && (
        <Animated.View 
          style={[
            styles.toastContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            }
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6750A4',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  navButton: {
    fontSize: 24,
    color: '#6750A4',
    fontWeight: 'bold',
    paddingHorizontal: 15,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  calendarDayEmpty: {
    width: 40,
    height: 40,
    margin: 2,
  },
  calendarDay: {
    width: 40,
    height: 40,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  calendarDayToday: {
    backgroundColor: '#6750A4',
  },
  calendarDaySelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#6750A4',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  calendarDayTextToday: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: '#6750A4',
    fontWeight: 'bold',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '22%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#6750A4',
    borderColor: '#6750A4',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  selectionSummary: {
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6750A4',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6750A4',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  scheduleButton: {
    backgroundColor: '#6750A4',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ScheduleScreen;