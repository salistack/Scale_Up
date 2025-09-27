import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeRole, setActiveRole] = useState('entrepreneur');
  const [greeting, setGreeting] = useState('');
  const [userData, setUserData] = useState(null);

  // Sample user data based on role
  const sampleData = {
    entrepreneur: {
      name: 'Inaam',
      stats: [
        { icon: '💡', label: 'Ideas Submitted', value: 5, color: '#FF6B6B' },
        { icon: '👥', label: 'Mentorships Engaged', value: 3, color: '#4ECDC4' },
        { icon: '💰', label: 'Investor Proposals', value: 2, color: '#45B7D1' },
        { icon: '⭐', label: 'Avg. Rating', value: '4.2/5', color: '#FFD166' }
      ],
      cta: 'Submit New Idea',
      feed: [
        {
          id: 1,
          title: 'EcoTech Startup Idea',
          description: 'Revolutionizing waste management with IoT sensors and AI optimization',
          author: 'Dr. Sarah Chen',
          rating: 4.5,
          type: 'mentor-advice',
          timestamp: '2 hours ago'
        },
        {
          id: 2,
          title: 'Investor Interest: GreenTech Ventures',
          description: 'Expressed interest in your sustainable energy proposal',
          author: 'GreenTech Ventures',
          rating: null,
          type: 'investor-interest',
          timestamp: '5 hours ago'
        }
      ]
    },
    investor: {
      name: 'Michael',
      stats: [
        { icon: '📊', label: 'Pending Proposals', value: 12, color: '#45B7D1' },
        { icon: '💸', label: 'Total Investments', value: '$2.4M', color: '#4ECDC4' },
        { icon: '📈', label: 'Avg. ROI', value: '28%', color: '#FFD166' },
        { icon: '⭐', label: 'Portfolio Size', value: 8, color: '#FF6B6B' }
      ],
      cta: 'Evaluate Startups',
      feed: [
        {
          id: 1,
          title: 'Trending: HealthTech AI',
          description: 'AI-powered diagnostic tools gaining traction',
          author: 'Startup Analytics',
          rating: 4.8,
          type: 'trending',
          timestamp: '1 hour ago'
        }
      ]
    },
    mentor: {
      name: 'Dr. Sharma',
      stats: [
        { icon: '👥', label: 'Active Mentees', value: 7, color: '#4ECDC4' },
        { icon: '📝', label: 'Posts Shared', value: 24, color: '#45B7D1' },
        { icon: '⭐', label: 'Avg. Rating', value: '4.7/5', color: '#FFD166' },
        { icon: '💡', label: 'Ideas Reviewed', value: 15, color: '#FF6B6B' }
      ],
      cta: 'Share Experience / Advice',
      feed: [
        {
          id: 1,
          title: 'New Idea Needs Feedback',
          description: 'Blockchain solution for supply chain transparency',
          author: 'Tech Innovators Inc.',
          rating: null,
          type: 'feedback-request',
          timestamp: '3 hours ago'
        }
      ]
    },
    franchise: {
      name: 'Robert',
      stats: [
        { icon: '🏢', label: 'Active Partners', value: 15, color: '#45B7D1' },
        { icon: '📊', label: 'Onboarding Progress', value: '75%', color: '#4ECDC4' },
        { icon: '🚀', label: 'Expansion Opportunities', value: 3, color: '#FFD166' },
        { icon: '💰', label: 'Revenue Growth', value: '32%', color: '#FF6B6B' }
      ],
      cta: 'Onboard Partner',
      feed: [
        {
          id: 1,
          title: 'Partner Success: Metro Expansion',
          description: 'New franchise partner achieving 150% targets',
          author: 'Expansion Team',
          rating: null,
          type: 'success-story',
          timestamp: '1 day ago'
        }
      ]
    }
  };

  useEffect(() => {
    updateGreeting();
    setUserData(sampleData[activeRole]);
  }, [activeRole]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      updateGreeting();
      setRefreshing(false);
    }, 2000);
  };

  const handleCTAPress = () => {
    // Handle CTA button press based on role
    console.log(`${activeRole} CTA pressed`);
  };

  const renderStatsCard = (stat, index) => (
    <Animated.View key={index} style={styles.statCard}>
      <Text style={styles.statIcon}>{stat.icon}</Text>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </Animated.View>
  );

  const renderFeedCard = (item, index) => (
    <TouchableOpacity key={index} style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>{item.title}</Text>
        {item.rating && (
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD166" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
        )}
      </View>
      <Text style={styles.feedDescription}>{item.description}</Text>
      <View style={styles.feedFooter}>
        <Text style={styles.feedAuthor}>{item.author}</Text>
        <Text style={styles.feedTimestamp}>{item.timestamp}</Text>
      </View>
      {item.type === 'mentor-advice' && (
        <View style={styles.qrCodePlaceholder}>
          <Text style={styles.qrText}>📱 QR Code Available</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderRoleSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleSelector}>
      {['entrepreneur', 'investor', 'mentor', 'franchise'].map((role) => (
        <TouchableOpacity
          key={role}
          style={[
            styles.roleButton,
            activeRole === role && styles.roleButtonActive
          ]}
          onPress={() => setActiveRole(role)}
        >
          <Text style={[
            styles.roleButtonText,
            activeRole === role && styles.roleButtonTextActive
          ]}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (!userData) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>🚀 StartupConnect</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="notifications" size={24} color="#333" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{greeting}, {userData.name}!</Text>
          <Text style={styles.subtitle}>Here's your personalized overview</Text>
        </View>

        {/* Role Selector */}
        {renderRoleSelector()}

        {/* Quick Stats Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          {userData.stats.map(renderStatsCard)}
        </ScrollView>

        {/* CTA Button */}
        <TouchableOpacity style={styles.ctaButton} onPress={handleCTAPress}>
          <Text style={styles.ctaText}>{userData.cta}</Text>
          <Icon name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* AI Quick Tip Panel */}
        <View style={styles.aiTipPanel}>
          <Text style={styles.aiTipTitle}>💡 Quick Tip</Text>
          <Text style={styles.aiTipText}>
            {activeRole === 'entrepreneur' && 'Focus on validating your MVP with early users before seeking large investments.'}
            {activeRole === 'investor' && 'Diversify your portfolio across different stages and industries for better risk management.'}
            {activeRole === 'mentor' && 'Schedule regular check-ins with mentees to track progress and provide timely guidance.'}
            {activeRole === 'franchise' && 'Standardize operational processes to ensure consistent quality across all locations.'}
          </Text>
        </View>

        {/* Feed Section */}
        <View style={styles.feedSection}>
          <View style={styles.feedHeader}>
            <Text style={styles.feedSectionTitle}>Latest Updates</Text>
            <TextInput
              style={styles.searchBar}
              placeholder="Search..."
              placeholderTextColor="#999"
            />
          </View>
          
          {userData.feed.map(renderFeedCard)}
        </View>
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomNav}>
        {['home', 'feed', 'add', 'notifications', 'person'].map((icon, index) => (
          <TouchableOpacity key={index} style={styles.navItem}>
            <Icon 
              name={icon} 
              size={24} 
              color={icon === 'home' ? '#45B7D1' : '#666'} 
            />
          </TouchableOpacity>
        ))}
      </View>
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
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#45B7D1',
  },
  notificationButton: {
    position: 'relative',
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  roleSelector: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  roleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
  },
  roleButtonActive: {
    backgroundColor: '#45B7D1',
  },
  roleButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsContent: {
    paddingHorizontal: 20,
  },
  statCard: {
    width: 140,
    height: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#45B7D1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#45B7D1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  aiTipPanel: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD166',
    marginBottom: 20,
  },
  aiTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  aiTipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  feedSection: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  feedHeader: {
    marginBottom: 15,
  },
  feedSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  searchBar: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  feedCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontWeight: '600',
    color: '#333',
  },
  feedDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  feedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedAuthor: {
    fontSize: 12,
    color: '#45B7D1',
    fontWeight: '600',
  },
  feedTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  qrCodePlaceholder: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  qrText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    padding: 10,
  },
});

export default HomeScreen;