import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CalendarScreen = () => {
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Load user schedules
  const loadUserSchedules = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      let userData = null;
      if (user) {
        userData = JSON.parse(user);
        setCurrentUserId(userData.id || userData._id);
      }

      const userSchedules = await AsyncStorage.getItem('userSchedules');
      if (userSchedules) {
        const schedules = JSON.parse(userSchedules);
        const currentUserId = userData?.id || userData?._id;
        
        console.log('All schedules:', schedules.length);
        console.log('Current user ID:', currentUserId);
        console.log('Schedule user IDs:', schedules.map(s => ({ id: s.id, userId: s.userId, title: s.title })));
        
        // Convert date strings back to Date objects and filter by current user
        const processedSchedules = schedules
          .filter(schedule => {
            // Handle both string and number comparison, and null/undefined cases
            const scheduleUserId = schedule.userId;
            const match = scheduleUserId && currentUserId && 
                         (String(scheduleUserId) === String(currentUserId));
            console.log(`Schedule ${schedule.id}: userId="${scheduleUserId}" (${typeof scheduleUserId}), currentUserId="${currentUserId}" (${typeof currentUserId}), match=${match}`);
            return match;
          })
          .map(schedule => ({
            ...schedule,
            date: new Date(schedule.date)
          }));
          
        console.log('Filtered schedules for user:', processedSchedules.length);
        setEvents(processedSchedules);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  useEffect(() => {
    loadUserSchedules();
  }, []);

  // Reload schedules when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserSchedules();
    }, [])
  );

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

  const hasEvents = (day) => {
    return events.some(event => 
      event.date.getDate() === day &&
      event.date.getMonth() === currentDate.getMonth() &&
      event.date.getFullYear() === currentDate.getFullYear()
    );
  };

  const getEventsForSelectedDate = () => {
    return events.filter(event => 
      event.date.getDate() === selectedDate.getDate() &&
      event.date.getMonth() === selectedDate.getMonth() &&
      event.date.getFullYear() === selectedDate.getFullYear()
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
          {hasEvents(day) && <View style={styles.eventDot} />}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const renderEventCard = ({ item }) => (
    <TouchableOpacity style={[
      styles.eventCard,
      styles[`eventCard${item.role.charAt(0).toUpperCase() + item.role.slice(1)}`]
    ]}>
      <View style={styles.eventHeader}>
        <View style={styles.eventTypeIcon}>
          <Icon 
            name={item.type === 'meeting' ? 'schedule' : item.type === 'pitch' ? 'mic' : 'event'} 
            size={20} 
            color="#FFF" 
          />
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventTime}>{item.time}</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#666" />
      </View>
      {item.notes && <Text style={styles.eventNotes}>{item.notes}</Text>}
      {item.location && (
        <View style={styles.eventLocation}>
          <Icon name="location-on" size={14} color="#666" />
          <Text style={styles.eventLocationText}>{item.location}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#6750A4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Schedules</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={async () => {
            try {
              await AsyncStorage.removeItem('userSchedules');
              await AsyncStorage.removeItem('userNotifications');
              loadUserSchedules();
              console.log('Cleared all schedules and notifications');
              
              // Show confirmation
              Alert.alert('Cleared', 'All schedules and notifications have been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          }}
        >
          <Icon name="clear" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity onPress={() => navigateMonth(-1)}>
          <Icon name="chevron-left" size={24} color="#6750A4" />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity onPress={() => navigateMonth(1)}>
          <Icon name="chevron-right" size={24} color="#6750A4" />
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

      {/* Events List */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>
          Events for {selectedDate.toLocaleDateString()} ({getEventsForSelectedDate().length})
        </Text>
        <Text style={styles.debugText}>
          Total user events: {events.length} | User ID: {currentUserId}
        </Text>
        
        <FlatList
        data={getEventsForSelectedDate()}
        renderItem={renderEventCard}
        keyExtractor={item => String(item.id)}
        showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyEvents}>
              <Icon name="event" size={48} color="#CCC" />
              <Text style={styles.emptyEventsText}>No events scheduled</Text>
            </View>
          }
        />
      </View>

      {/* Add Event Floating Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowEventModal(true)}
      >
        <Icon name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Event Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKAV}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Event</Text>
                  <TouchableOpacity onPress={() => setShowEventModal(false)}>
                    <Icon name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <TextInput style={styles.input} placeholder="Event Title" />
                  <TextInput style={styles.input} placeholder="Date" />
                  <TextInput style={styles.input} placeholder="Time" />
                  <TextInput style={styles.input} placeholder="Location" />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Notes"
                    multiline
                  />
                </ScrollView>

                <TouchableOpacity style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>Add Event</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  backButton: {
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    padding: 10,
  },
  calendarDayEmpty: {
    width: 40,
    height: 40,
    margin: 5,
  },
  calendarDay: {
    width: 40,
    height: 40,
    margin: 5,
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
  eventDot: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6750A4',
  },
  eventsSection: {
    flex: 1,
    padding: 20,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  eventCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventCardEntrepreneur: { borderLeftWidth: 4, borderLeftColor: '#6750A4' },
  eventCardInvestor: { borderLeftWidth: 4, borderLeftColor: '#6750A4' },
  eventCardMentor: { borderLeftWidth: 4, borderLeftColor: '#6750A4' },
  eventCardFranchise: { borderLeftWidth: 4, borderLeftColor: '#6750A4' },
  eventCardSchedule: { borderLeftWidth: 4, borderLeftColor: '#6750A4' },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6750A4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  eventNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyEvents: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyEventsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6750A4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalKAV: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6750A4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CalendarScreen;