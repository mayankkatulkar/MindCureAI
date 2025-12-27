'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

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
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // BYOK API Key State
  const [apiKeyState, setApiKeyState] = useState({
    hasApiKey: false,
    isLoading: false,
    isSaving: false,
    newApiKey: '',
    error: '',
    success: '',
    sessionInfo: {
      allowed: true,
      current_count: 0,
      limit: 5,
      remaining: 5,
      tier: 'byok_free'
    }
  });

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setUserProfile(prev => ({
              ...prev,
              name: data.profile.full_name || prev.name,
              email: data.email || data.profile.email || prev.email,
              location: data.profile.location || prev.location,
              timezone: data.profile.timezone || prev.timezone,
              mentalHealthGoals: data.profile.mental_health_goals || prev.mentalHealthGoals,
              currentChallenges: data.profile.current_challenges || prev.currentChallenges,
              therapyPreference: data.profile.preferred_therapy_type || prev.therapyPreference,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
      setIsLoadingSettings(false);
    };

    loadSettings();
    loadApiKeyStatus();
  }, []);

  // Load API key status
  const loadApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/user/api-key');
      if (response.ok) {
        const data = await response.json();
        setApiKeyState(prev => ({
          ...prev,
          hasApiKey: data.hasApiKey,
          sessionInfo: data.sessionInfo || prev.sessionInfo
        }));
      }
    } catch (error) {
      console.error('Failed to load API key status:', error);
    }
  };

  // Save API key
  const handleSaveApiKey = async () => {
    if (!apiKeyState.newApiKey) return;

    setApiKeyState(prev => ({ ...prev, isSaving: true, error: '', success: '' }));

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyState.newApiKey })
      });

      const data = await response.json();

      if (response.ok) {
        // Also store in localStorage for client-side AI analysis
        localStorage.setItem('gemini_api_key', apiKeyState.newApiKey);

        setApiKeyState(prev => ({
          ...prev,
          hasApiKey: true,
          newApiKey: '',
          success: 'API key saved! You can now use voice AI and get session insights.',
          isSaving: false
        }));
      } else {
        setApiKeyState(prev => ({
          ...prev,
          error: data.error || 'Failed to save API key',
          isSaving: false
        }));
      }
    } catch (error) {
      setApiKeyState(prev => ({
        ...prev,
        error: 'Failed to save API key. Please try again.',
        isSaving: false
      }));
    }
  };

  // Remove API key
  const handleRemoveApiKey = async () => {
    if (!confirm('Remove your API key? You will not be able to use voice AI until you add a new one.')) return;

    try {
      const response = await fetch('/api/user/api-key', { method: 'DELETE' });
      if (response.ok) {
        localStorage.removeItem('gemini_api_key');
        setApiKeyState(prev => ({
          ...prev,
          hasApiKey: false,
          success: 'API key removed'
        }));
      }
    } catch (error) {
      setApiKeyState(prev => ({ ...prev, error: 'Failed to remove API key' }));
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value }
    }));
  };

  const handleNotificationChange = (field: string) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const handlePrivacyChange = (field: string, value: any) => {
    setPrivacy(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSecurity(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: userProfile, notifications, privacy, security })
      });

      if (response.ok) {
        setSaveMessage('Settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      localStorage.setItem('mindcure_user', JSON.stringify(userProfile));
      setSaveMessage('Settings saved locally');
    }

    setIsLoading(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'ai', label: 'AI & API', icon: '🤖' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'security', label: 'Security', icon: '🛡️' },
  ];

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow ${checked ? 'translate-x-7' : 'translate-x-1'
          }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account, privacy, and preferences
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <motion.nav
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-56 flex-shrink-0"
          >
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-2 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Links */}
            <div className="mt-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <h3 className="text-sm font-semibold text-foreground mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/billing" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  💳 Billing & Subscription
                </Link>
                <Link href="/crisis-support" className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors">
                  🚨 Crisis Support
                </Link>
              </div>
            </div>
          </motion.nav>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1"
          >
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">

              <AnimatePresence mode="wait">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-foreground">Profile Information</h2>

                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-3xl text-white font-bold">
                        {userProfile.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{userProfile.name}</h3>
                        <p className="text-muted-foreground text-sm">{userProfile.email}</p>
                        <button className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
                          Change Photo
                        </button>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                        <input
                          type="text"
                          value={userProfile.name}
                          onChange={(e) => handleProfileChange('name', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                        <input
                          type="email"
                          value={userProfile.email}
                          onChange={(e) => handleProfileChange('email', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                        <input
                          type="tel"
                          value={userProfile.phone}
                          onChange={(e) => handleProfileChange('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                        <input
                          type="text"
                          value={userProfile.location}
                          onChange={(e) => handleProfileChange('location', e.target.value)}
                          placeholder="City, State"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Emergency Contact</h3>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <input
                          type="text"
                          value={userProfile.emergencyContact.name}
                          onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                          placeholder="Contact Name"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <input
                          type="tel"
                          value={userProfile.emergencyContact.phone}
                          onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                          placeholder="Phone Number"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <select
                          value={userProfile.emergencyContact.relationship}
                          onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                          <option value="">Relationship</option>
                          <option value="parent">Parent</option>
                          <option value="spouse">Spouse/Partner</option>
                          <option value="sibling">Sibling</option>
                          <option value="friend">Friend</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* AI & API Tab */}
                {activeTab === 'ai' && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-foreground">AI & API Settings</h2>

                    {/* Session Usage */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Session Usage</h3>
                          <p className="text-sm text-muted-foreground">Your monthly AI therapy sessions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">
                            {apiKeyState.sessionInfo.current_count}/{apiKeyState.sessionInfo.limit === 999999 ? '∞' : apiKeyState.sessionInfo.limit}
                          </p>
                          <p className="text-sm text-muted-foreground">sessions this month</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (apiKeyState.sessionInfo.current_count / (apiKeyState.sessionInfo.limit === 999999 ? 1 : apiKeyState.sessionInfo.limit)) * 100)}%` }}
                        />
                      </div>
                      {apiKeyState.sessionInfo.tier === 'byok_free' && (
                        <p className="text-sm text-muted-foreground mt-3">
                          {apiKeyState.sessionInfo.remaining} sessions remaining.
                          <Link href="/pricing" className="text-purple-600 hover:text-purple-700 font-medium ml-1">
                            Upgrade to Pro for unlimited →
                          </Link>
                        </p>
                      )}
                    </div>

                    {/* API Key Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Gemini API Key</h3>

                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                        {apiKeyState.hasApiKey ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                <span className="text-green-500">✓</span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">API Key Configured</p>
                                <p className="text-sm text-muted-foreground">Your Gemini API key is saved securely</p>
                              </div>
                            </div>
                            <button
                              onClick={handleRemoveApiKey}
                              className="px-4 py-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                            >
                              Remove Key
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                                🔑 Bring Your Own Key (BYOK)
                              </p>
                              <p className="text-sm text-muted-foreground">
                                MindCure uses your Gemini API key for AI therapy. You pay Google directly (~$0.10/session),
                                keeping costs transparent and your data private.
                              </p>
                              <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                              >
                                → Get your FREE Gemini API key (30 seconds)
                              </a>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1.5">Your API Key</label>
                              <input
                                type="password"
                                value={apiKeyState.newApiKey}
                                onChange={(e) => setApiKeyState(prev => ({ ...prev, newApiKey: e.target.value, error: '' }))}
                                placeholder="AIza... (paste your Gemini API key)"
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                              />
                            </div>

                            {apiKeyState.error && (
                              <p className="text-sm text-red-500 flex items-center gap-2">
                                ⚠️ {apiKeyState.error}
                              </p>
                            )}

                            {apiKeyState.success && (
                              <p className="text-sm text-green-500 flex items-center gap-2">
                                ✅ {apiKeyState.success}
                              </p>
                            )}

                            <button
                              onClick={handleSaveApiKey}
                              disabled={apiKeyState.isSaving || !apiKeyState.newApiKey}
                              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg"
                            >
                              {apiKeyState.isSaving ? 'Validating...' : 'Save API Key'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subscription Tier */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">Current Plan</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {apiKeyState.sessionInfo.tier?.replace('_', ' ') || 'BYOK Free'}
                          </p>
                        </div>
                        {apiKeyState.sessionInfo.tier === 'byok_free' && (
                          <Link
                            href="/pricing"
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-lg text-sm"
                          >
                            Upgrade to Pro - $9.99/mo
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>

                    {[
                      {
                        title: 'Communication', items: [
                          { key: 'email', name: 'Email Notifications', desc: 'Receive updates via email' },
                          { key: 'sms', name: 'SMS Messages', desc: 'Text message notifications' },
                          { key: 'pushNotifications', name: 'Push Notifications', desc: 'Browser and mobile alerts' },
                        ]
                      },
                      {
                        title: 'Reminders', items: [
                          { key: 'dailyReminders', name: 'Daily Check-ins', desc: 'Daily mental health reminders' },
                          { key: 'weeklyProgress', name: 'Weekly Progress', desc: 'Weekly progress summaries' },
                        ]
                      },
                      {
                        title: 'Support & Safety', items: [
                          { key: 'emergencyAlerts', name: 'Emergency Alerts', desc: 'Critical safety notifications' },
                          { key: 'therapistMessages', name: 'Therapist Messages', desc: 'Messages from your therapist' },
                          { key: 'peerSupport', name: 'Peer Support', desc: 'Peer support notifications' },
                        ]
                      },
                    ].map((group) => (
                      <div key={group.title} className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{group.title}</h3>
                        <div className="space-y-2">
                          {group.items.map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                              <div>
                                <div className="font-medium text-foreground">{item.name}</div>
                                <div className="text-sm text-muted-foreground">{item.desc}</div>
                              </div>
                              <Toggle
                                checked={notifications[item.key as keyof typeof notifications]}
                                onChange={() => handleNotificationChange(item.key)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-foreground">Privacy & Data</h2>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Profile Visibility</h3>
                      <div className="space-y-2">
                        {['public', 'private', 'anonymous'].map((option) => (
                          <label key={option} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                            <input
                              type="radio"
                              name="visibility"
                              value={option}
                              checked={privacy.profileVisibility === option}
                              onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                              className="w-4 h-4 text-purple-600"
                            />
                            <div>
                              <div className="font-medium text-foreground capitalize">{option}</div>
                              <div className="text-sm text-muted-foreground">
                                {option === 'public' && 'Visible to other users'}
                                {option === 'private' && 'Only visible to you and your therapist'}
                                {option === 'anonymous' && 'Completely anonymous'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Data Sharing</h3>
                      {[
                        { key: 'shareProgressWithTherapist', name: 'Share Progress with Therapist', desc: 'Allow matched therapists to see your progress' },
                        { key: 'anonymousPeerSupport', name: 'Anonymous Peer Support', desc: 'Stay anonymous in peer support chats' },
                        { key: 'allowResearchParticipation', name: 'Research Participation', desc: 'Help improve mental health research (anonymized)' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div>
                            <div className="font-medium text-foreground">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.desc}</div>
                          </div>
                          <Toggle
                            checked={privacy[item.key as keyof typeof privacy] as boolean}
                            onChange={() => handlePrivacyChange(item.key, !privacy[item.key as keyof typeof privacy])}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Data Management</h3>
                      <div className="flex flex-wrap gap-3">
                        <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors">
                          📥 Export My Data
                        </button>
                        <button className="px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors">
                          🗑️ Delete Account
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-foreground">Security & Access</h2>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Authentication</h3>
                      {[
                        { key: 'twoFactorAuth', name: 'Two-Factor Authentication', desc: 'Add an extra layer of security' },
                        { key: 'loginNotifications', name: 'Login Notifications', desc: 'Get notified of new logins' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div>
                            <div className="font-medium text-foreground">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.desc}</div>
                          </div>
                          <Toggle
                            checked={security[item.key as keyof typeof security] as boolean}
                            onChange={() => handleSecurityChange(item.key, !security[item.key as keyof typeof security])}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Session Timeout</label>
                        <select
                          value={security.sessionTimeout}
                          onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="never">Never</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Data Retention</label>
                        <select
                          value={security.dataRetention}
                          onChange={(e) => handleSecurityChange('dataRetention', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                          <option value="1year">1 Year</option>
                          <option value="2years">2 Years</option>
                          <option value="forever">Forever</option>
                        </select>
                      </div>
                    </div>

                    <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors">
                      🔒 Change Password
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                {saveMessage && (
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-2">
                    ✅ {saveMessage}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
