import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CreatePostScreen = ({ route }) => {
  const { userRole = 'entrepreneur' } = route?.params || {};
  const [postData, setPostData] = useState({
    title: '',
    content: '',
    tags: [],
    attachments: [],
    category: '',
  });
  const [activeTab, setActiveTab] = useState('write');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = {
    entrepreneur: ['Startup Idea', 'Pitch Deck', 'Funding Request', 'Progress Update'],
    mentor: ['Advice', 'Experience', 'Resources', 'Opportunity'],
    investor: ['Funding Round', 'Industry Insights', 'Opportunity', 'Trends'],
    franchise: ['Expansion', 'Success Story', 'Partnership', 'Update'],
  };

  const roleConfig = {
    entrepreneur: {
      titlePlaceholder: 'Your innovative startup idea title...',
      contentPlaceholder: 'Describe your idea, problem you\'re solving, target market, unique value proposition...',
      ctaText: 'Submit Idea',
      icon: '💡',
    },
    mentor: {
      titlePlaceholder: 'Share your expertise or advice...',
      contentPlaceholder: 'Write your mentorship tips, experiences, or guidance for entrepreneurs...',
      ctaText: 'Share Advice',
      icon: '👥',
    },
    investor: {
      titlePlaceholder: 'Investment opportunity or insights...',
      contentPlaceholder: 'Share funding opportunities, industry trends, or investment criteria...',
      ctaText: 'Post Announcement',
      icon: '💰',
    },
    franchise: {
      titlePlaceholder: 'Franchise update or success story...',
      contentPlaceholder: 'Share expansion updates, partner success stories, or operational insights...',
      ctaText: 'Share Update',
      icon: '🏢',
    },
  };

  const config = roleConfig[userRole];

  const handleSubmit = () => {
    if (!postData.title.trim() || !postData.content.trim()) {
      Alert.alert('Missing Information', 'Please fill in both title and content');
      return;
    }

    // Simulate API call
    Alert.alert(
      'Success!',
      `Your ${userRole} post has been submitted successfully`,
      [
        {
          text: 'OK',
          onPress: () => {
            setPostData({ title: '', content: '', tags: [], attachments: [], category: '' });
            setSelectedCategory('');
          },
        },
      ]
    );
  };

  const addTag = (tag) => {
    if (!postData.tags.includes(tag) && postData.tags.length < 5) {
      setPostData({ ...postData, tags: [...postData.tags, tag] });
    }
  };

  const removeTag = (tagToRemove) => {
    setPostData({
      ...postData,
      tags: postData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <Text style={styles.previewTitle}>Preview</Text>
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <View style={styles.previewAvatar}>
            <Text style={styles.previewAvatarText}>{config.icon}</Text>
          </View>
          <View>
            <Text style={styles.previewAuthor}>You</Text>
            <Text style={styles.previewTimestamp}>Just now</Text>
          </View>
        </View>
        
        <Text style={styles.previewPostTitle}>{postData.title || 'Your post title will appear here'}</Text>
        <Text style={styles.previewPostContent}>
          {postData.content || 'Your post content will appear here...'}
        </Text>
        
        {postData.tags.length > 0 && (
          <View style={styles.previewTags}>
            {postData.tags.map((tag, index) => (
              <View key={index} style={styles.previewTag}>
                <Text style={styles.previewTagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        {userRole === 'entrepreneur' && (
          <View style={styles.qrSection}>
            <Text style={styles.qrText}>📱 QR Code will be generated for your pitch</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'write' && styles.tabActive]}
            onPress={() => setActiveTab('write')}
          >
            <Text style={[styles.tabText, activeTab === 'write' && styles.tabTextActive]}>
              Write
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'preview' && styles.tabActive]}
            onPress={() => setActiveTab('preview')}
          >
            <Text style={[styles.tabText, activeTab === 'preview' && styles.tabTextActive]}>
              Preview
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'write' ? (
          <>
            {/* Category Selection */}
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
              {categories[userRole].map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    setPostData({ ...postData, category });
                  }}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title Input */}
            <Text style={styles.sectionLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder={config.titlePlaceholder}
              value={postData.title}
              onChangeText={(text) => setPostData({ ...postData, title: text })}
              maxLength={100}
            />

            {/* Content Input */}
            <Text style={styles.sectionLabel}>Content</Text>
            <TextInput
              style={styles.contentInput}
              placeholder={config.contentPlaceholder}
              value={postData.content}
              onChangeText={(text) => setPostData({ ...postData, content: text })}
              multiline
              textAlignVertical="top"
              numberOfLines={8}
            />

            {/* Tags */}
            <Text style={styles.sectionLabel}>Tags (Optional)</Text>
            <View style={styles.tagsContainer}>
              {postData.tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                  <Icon name="close" size={14} color="#666" />
                </TouchableOpacity>
              ))}
              {postData.tags.length < 5 && (
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add tag..."
                  onSubmitEditing={(e) => {
                    addTag(e.nativeEvent.text.trim());
                    e.nativeEvent.text = '';
                  }}
                />
              )}
            </View>

            {/* Attachment Section */}
            <Text style={styles.sectionLabel}>Attachments (Optional)</Text>
            <TouchableOpacity style={styles.attachmentButton}>
              <Icon name="attach-file" size={20} color="#45B7D1" />
              <Text style={styles.attachmentText}>Add files, images, or documents</Text>
            </TouchableOpacity>

            {/* QR Code Option for Entrepreneurs */}
            {userRole === 'entrepreneur' && (
              <TouchableOpacity style={styles.qrOption}>
                <View style={styles.qrOptionLeft}>
                  <Icon name="qr-code" size={24} color="#45B7D1" />
                  <View style={styles.qrOptionText}>
                    <Text style={styles.qrOptionTitle}>Generate Pitch QR Code</Text>
                    <Text style={styles.qrOptionDesc}>Investors can scan to view full pitch</Text>
                  </View>
                </View>
                <Icon name="check-box-outline-blank" size={24} color="#CCC" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          renderPreview()
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{config.ctaText}</Text>
          <Icon name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleBadgeText: {
    color: '#45B7D1',
    fontWeight: '600',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#45B7D1',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 20,
  },
  categories: {
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#45B7D1',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#45B7D1',
    fontSize: 14,
    marginRight: 4,
  },
  tagInput: {
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    fontSize: 14,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  attachmentText: {
    marginLeft: 10,
    color: '#45B7D1',
    fontSize: 16,
  },
  qrOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  qrOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrOptionText: {
    marginLeft: 12,
  },
  qrOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  qrOptionDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  previewContainer: {
    marginTop: 10,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#45B7D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewAvatarText: {
    fontSize: 18,
  },
  previewAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  previewTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  previewPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  previewPostContent: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  previewTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  previewTagText: {
    color: '#45B7D1',
    fontSize: 12,
    fontWeight: '500',
  },
  qrSection: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#45B7D1',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#45B7D1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default CreatePostScreen;