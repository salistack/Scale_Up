import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CalendarScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Mentor Meeting: John Doe',
      date: new Date(),
      time: '14:30 - 15:30',
      type: 'meeting',
      role: 'mentor',
      notes: 'Discuss MVP development progress',
      location: 'Zoom Meeting'
    },
    {
      id: 2,
      title: 'Pitch Evaluation: GreenTech',
      date: new Date(),
      time: '16:00 - 17:00',
      type: 'pitch',
      role: 'investor',
      notes: 'Series A funding discussion',
      location: 'Conference Room A'
    }
  ]);

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
            name={item.type === 'meeting' ? 'people' : item.type === 'pitch' ? 'mic' : 'event'} 
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
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter-list" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity onPress={() => navigateMonth(-1)}>
          <Icon name="chevron-left" size={24} color="#45B7D1" />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity onPress={() => navigateMonth(1)}>
          <Icon name="chevron-right" size={24} color="#45B7D1" />
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
          Events for {selectedDate.toLocaleDateString()}
        </Text>
        
        <FlatList
          data={getEventsForSelectedDate()}
          renderItem={renderEventCard}
          keyExtractor={item => item.id.toString()}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Event</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TextInput style={styles.input} placeholder="Event Title" />
            <TextInput style={styles.input} placeholder="Date" />
            <TextInput style={styles.input} placeholder="Time" />
            <TextInput style={styles.input} placeholder="Location" />
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Notes" 
              multiline 
            />
            
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Add Event</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#45B7D1',
  },
  calendarDaySelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#45B7D1',
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
    color: '#45B7D1',
    fontWeight: 'bold',
  },
  eventDot: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
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
  eventCardEntrepreneur: { borderLeftWidth: 4, borderLeftColor: '#FF6B6B' },
  eventCardInvestor: { borderLeftWidth: 4, borderLeftColor: '#4ECDC4' },
  eventCardMentor: { borderLeftWidth: 4, borderLeftColor: '#FFD166' },
  eventCardFranchise: { borderLeftWidth: 4, borderLeftColor: '#45B7D1' },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#45B7D1',
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
    backgroundColor: '#45B7D1',
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
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
    backgroundColor: '#45B7D1',
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