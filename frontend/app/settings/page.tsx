'use client';

import React, { useState, useEffect } from 'react';
import './settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState({
    name: 'Demo User',
    email: 'demo@mindcure.com',
    phone: '',
    avatar: '',
    location: '',
    timezone: 'UTC-8',
    mentalHealthGoals: ['Reduce Anxiety', 'Improve Sleep'],
    currentChallenges: ['Work Stress', 'Social Anxiety'],
    therapyPreference: 'both',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    pushNotifications: true,
    dailyReminders: true,
    weeklyProgress: true,
    emergencyAlerts: true,
    therapistMessages: true,
    peerSupport: false
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    dataSharing: false,
    anonymousPeerSupport: true,
    shareProgressWithTherapist: true,
    allowResearchParticipation: false,
    locationSharing: false
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    dataRetention: '2years',
    loginNotifications: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Load user settings from localStorage or API
    const savedUser = localStorage.getItem('mindcure_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUserProfile(prev => ({ ...prev, ...userData }));
    }
  }, []);

  const handleProfileChange = (field: string, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const handleNotificationChange = (field: string) => {
    setNotifications(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handlePrivacyChange = (field: string, value: any) => {
    setPrivacy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSecurity(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveMessage('');

    try {
      // TODO: Replace with actual API call
      const settingsData = {
        profile: userProfile,
        notifications,
        privacy,
        security
      };

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('mindcure_token')}`
        },
        body: JSON.stringify(settingsData)
      });

      if (response.ok) {
        localStorage.setItem('mindcure_user', JSON.stringify(userProfile));
        setSaveMessage('Settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      // For demo purposes, save to localStorage
      localStorage.setItem('mindcure_user', JSON.stringify(userProfile));
      localStorage.setItem('mindcure_notifications', JSON.stringify(notifications));
      localStorage.setItem('mindcure_privacy', JSON.stringify(privacy));
      localStorage.setItem('mindcure_security', JSON.stringify(security));
      setSaveMessage('Settings saved successfully!');
    }

    setIsLoading(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleExportData = () => {
    const userData = {
      profile: userProfile,
      notifications,
      privacy,
      security,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindcure-data-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion
      alert('Account deletion functionality would be implemented here');
    }
  };

  const renderProfileTab = () => (
    <div className="settings-section">
      <h2 className="section-title">Profile Information</h2>
      
      <div className="profile-header">
        <div className="avatar-section">
          <div className="avatar-placeholder">
            {userProfile.name.charAt(0).toUpperCase()}
          </div>
          <button className="change-avatar-btn">Change Photo</button>
        </div>
        
        <div className="profile-info">
          <h3>{userProfile.name}</h3>
          <p className="profile-email">{userProfile.email}</p>
          <span className="profile-status">Active Member</span>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={userProfile.name}
            onChange={(e) => handleProfileChange('name', e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={userProfile.email}
            onChange={(e) => handleProfileChange('email', e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-input"
            value={userProfile.phone}
            onChange={(e) => handleProfileChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
          <input
            type="text"
            className="form-input"
            value={userProfile.location}
            onChange={(e) => handleProfileChange('location', e.target.value)}
            placeholder="City, State"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Timezone</label>
          <select
            className="form-select"
            value={userProfile.timezone}
            onChange={(e) => handleProfileChange('timezone', e.target.value)}
          >
            <option value="UTC-8">Pacific Time (UTC-8)</option>
            <option value="UTC-7">Mountain Time (UTC-7)</option>
            <option value="UTC-6">Central Time (UTC-6)</option>
            <option value="UTC-5">Eastern Time (UTC-5)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Therapy Preference</label>
          <select
            className="form-select"
            value={userProfile.therapyPreference}
            onChange={(e) => handleProfileChange('therapyPreference', e.target.value)}
          >
            <option value="online">Online Only</option>
            <option value="in-person">In-Person Only</option>
            <option value="both">Both Online & In-Person</option>
          </select>
        </div>
      </div>

      <div className="emergency-contact-section">
        <h3 className="subsection-title">Emergency Contact</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Contact Name</label>
            <input
              type="text"
              className="form-input"
              value={userProfile.emergencyContact.name}
              onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
              placeholder="Emergency contact name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={userProfile.emergencyContact.phone}
              onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Relationship</label>
            <select
              className="form-select"
              value={userProfile.emergencyContact.relationship}
              onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
            >
              <option value="">Select relationship</option>
              <option value="parent">Parent</option>
              <option value="spouse">Spouse/Partner</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="settings-section">
      <h2 className="section-title">Notification Preferences</h2>
      
      <div className="notification-groups">
        <div className="notification-group">
          <h3 className="group-title">Communication</h3>
          <div className="notification-items">
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-name">Email Notifications</span>
                <span className="notification-desc">Receive updates via email</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={() => handleNotificationChange('email')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-name">SMS Messages</span>
                <span className="notification-desc">Text message notifications</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={() => handleNotificationChange('sms')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-name">Push Notifications</span>
                <span className="notification-desc">Browser and mobile alerts</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.pushNotifications}
                  onChange={() => handleNotificationChange('pushNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="notification-group">
          <h3 className="group-title">Reminders</h3>
          <div className="notification-items">
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-name">Daily Check-ins</span>
                <span className="notification-desc">Daily mental health reminders</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.dailyReminders}
                  onChange={() => handleNotificationChange('dailyReminders')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-name">Weekly Progress</span>
                <span className="notification-desc">Weekly progress summaries</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.weeklyProgress}
                  onChange={() => handleNotificationChange('weeklyProgress')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="notification-group">
          <h3 className="group-title">Support & Safety</h3>
          <div className="notification-items">
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-name">Emergency Alerts</span>
                <span className="notification-desc">Critical safety notifications</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.emergencyAlerts}
                  onChange={() => handleNotificationChange('emergencyAlerts')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-name">Therapist Messages</span>
                <span className="notification-desc">Messages from your therapist</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.therapistMessages}
                  onChange={() => handleNotificationChange('therapistMessages')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-name">Peer Support</span>
                <span className="notification-desc">Peer support notifications</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.peerSupport}
                  onChange={() => handleNotificationChange('peerSupport')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="settings-section">
      <h2 className="section-title">Privacy & Data</h2>
      
      <div className="privacy-groups">
        <div className="privacy-group">
          <h3 className="group-title">Profile Visibility</h3>
          <div className="radio-group">
            <label className="radio-item">
              <input
                type="radio"
                name="profileVisibility"
                value="public"
                checked={privacy.profileVisibility === 'public'}
                onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
              />
              <span className="radio-label">
                <strong>Public</strong> - Visible to other users
              </span>
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="profileVisibility"
                value="private"
                checked={privacy.profileVisibility === 'private'}
                onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
              />
              <span className="radio-label">
                <strong>Private</strong> - Only visible to you and your therapist
              </span>
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="profileVisibility"
                value="anonymous"
                checked={privacy.profileVisibility === 'anonymous'}
                onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
              />
              <span className="radio-label">
                <strong>Anonymous</strong> - Completely anonymous
              </span>
            </label>
          </div>
        </div>

        <div className="privacy-group">
          <h3 className="group-title">Data Sharing</h3>
          <div className="privacy-items">
            <div className="privacy-item">
              <div className="privacy-info">
                <span className="privacy-name">Share Data for Research</span>
                <span className="privacy-desc">Help improve mental health research (anonymized)</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacy.allowResearchParticipation}
                  onChange={() => handlePrivacyChange('allowResearchParticipation', !privacy.allowResearchParticipation)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="privacy-item">
              <div className="privacy-info">
                <span className="privacy-name">Share Progress with Therapist</span>
                <span className="privacy-desc">Allow matched therapists to see your progress</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacy.shareProgressWithTherapist}
                  onChange={() => handlePrivacyChange('shareProgressWithTherapist', !privacy.shareProgressWithTherapist)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="privacy-item">
              <div className="privacy-info">
                <span className="privacy-name">Anonymous Peer Support</span>
                <span className="privacy-desc">Stay anonymous in peer support chats</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacy.anonymousPeerSupport}
                  onChange={() => handlePrivacyChange('anonymousPeerSupport', !privacy.anonymousPeerSupport)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="privacy-item">
              <div className="privacy-info">
                <span className="privacy-name">Location Sharing</span>
                <span className="privacy-desc">Share location for local therapist matching</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacy.locationSharing}
                  onChange={() => handlePrivacyChange('locationSharing', !privacy.locationSharing)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="privacy-group">
          <h3 className="group-title">Data Management</h3>
          <div className="data-actions">
            <button className="action-button secondary" onClick={handleExportData}>
              <span className="action-icon">📥</span>
              Export My Data
            </button>
            <button className="action-button danger" onClick={handleDeleteAccount}>
              <span className="action-icon">🗑️</span>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="settings-section">
      <h2 className="section-title">Security & Access</h2>
      
      <div className="security-groups">
        <div className="security-group">
          <h3 className="group-title">Authentication</h3>
          <div className="security-items">
            <div className="security-item">
              <div className="security-info">
                <span className="security-name">Two-Factor Authentication</span>
                <span className="security-desc">Add an extra layer of security</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={security.twoFactorAuth}
                  onChange={() => handleSecurityChange('twoFactorAuth', !security.twoFactorAuth)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="security-item">
              <div className="security-info">
                <span className="security-name">Login Notifications</span>
                <span className="security-desc">Get notified of new logins</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={security.loginNotifications}
                  onChange={() => handleSecurityChange('loginNotifications', !security.loginNotifications)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="security-group">
          <h3 className="group-title">Session Management</h3>
          <div className="form-group">
            <label className="form-label">Session Timeout</label>
            <select
              className="form-select"
              value={security.sessionTimeout}
              onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>

        <div className="security-group">
          <h3 className="group-title">Data Retention</h3>
          <div className="form-group">
            <label className="form-label">Keep My Data For</label>
            <select
              className="form-select"
              value={security.dataRetention}
              onChange={(e) => handleSecurityChange('dataRetention', e.target.value)}
            >
              <option value="1year">1 Year</option>
              <option value="2years">2 Years</option>
              <option value="5years">5 Years</option>
              <option value="forever">Forever</option>
            </select>
          </div>
        </div>

        <div className="security-group">
          <h3 className="group-title">Password</h3>
          <div className="password-actions">
            <button className="action-button primary">
              <span className="action-icon">🔒</span>
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your account, privacy, and preferences</p>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span>
              Profile
            </button>
            <button
              className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="nav-icon">🔔</span>
              Notifications
            </button>
            <button
              className={`nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <span className="nav-icon">🔒</span>
              Privacy
            </button>
            <button
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <span className="nav-icon">🛡️</span>
              Security
            </button>
          </nav>
        </div>

        <div className="settings-main">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'privacy' && renderPrivacyTab()}
          {activeTab === 'security' && renderSecurityTab()}

          <div className="settings-actions">
            <button
              className="save-button"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            
            {saveMessage && (
              <div className="save-message">
                <span className="success-icon">✅</span>
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
