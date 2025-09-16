'use client';

import React, { useState, useEffect } from 'react';
import './peer-support.css';

const PeerSupport = () => {
  const [onlineUsers, setOnlineUsers] = useState(247);
  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [supportMode, setSupportMode] = useState('random'); // 'random', 'groups', 'similar', 'local'
  const [inVideoCall, setInVideoCall] = useState(false);
  const [callType, setCallType] = useState<'video' | 'voice' | 'text'>('text');

  const [supportGroups] = useState([
    {
      id: 1,
      name: 'Anxiety Support Circle',
      members: 45,
      activity: 'Very Active',
      description: 'Safe space for those dealing with anxiety and panic disorders',
      topic: 'anxiety',
      lastActive: '2 minutes ago'
    },
    {
      id: 2,
      name: 'Depression Fighters',
      members: 62,
      activity: 'Active',
      description: 'Supporting each other through depression recovery',
      topic: 'depression',
      lastActive: '15 minutes ago'
    },
    {
      id: 3,
      name: 'Mindful Moments',
      members: 38,
      activity: 'Moderate',
      description: 'Daily mindfulness and meditation practices',
      topic: 'mindfulness',
      lastActive: '1 hour ago'
    }
  ]);

  const [recentConnections] = useState([
    { id: 1, type: 'Helpful conversation about anxiety management', time: '2 hours ago', rating: 5 },
    { id: 2, type: 'Shared coping strategies for stress', time: '1 day ago', rating: 4 },
    { id: 3, type: 'Mindfulness session together', time: '2 days ago', rating: 5 }
  ]);

  useEffect(() => {
    // Simulate changing online users count
    const interval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 10) - 5);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const startRandomChat = () => {
    setIsSearching(true);
    setMatchFound(false);
    
    // Simulate finding a match
    setTimeout(() => {
      setMatchFound(true);
      setCurrentMatch({
        id: Math.floor(Math.random() * 10000),
        mood: 'Looking for support',
        interests: ['mindfulness', 'anxiety'],
        waitTime: Math.floor(Math.random() * 30) + 10
      });
      setIsSearching(false);
    }, 3000);
  };

  const joinGroup = (groupId: number) => {
    alert(`Joining support group... You'll be connected shortly!`);
  };

  const endChat = () => {
    setMatchFound(false);
    setCurrentMatch(null);
    setInVideoCall(false);
    setCallType('text');
  };

  const startVideoChat = () => {
    setCallType('video');
    setInVideoCall(true);
  };

  const startVoiceChat = () => {
    setCallType('voice');
    setInVideoCall(true);
  };

  // If in video call, show video interface
  if (inVideoCall && currentMatch) {
    return (
      <div className="peer-support video-mode">
        <VideoCall
          roomName={`peer-support-${currentMatch.id}`}
          participantName={`User-${Math.floor(Math.random() * 1000)}`}
          onDisconnect={endChat}
          callType="peer-support"
        />
      </div>
    );
  }

  const findSimilarExperiences = () => {
    setSupportMode('similar');
    alert('Matching you with people who have similar experiences...');
  };

  const findLocalSupport = () => {
    setSupportMode('local');
    alert('Finding local mental health meetups and support groups...');
  };

  return (
    <div className="peer-support">
      {/* Online Status */}
      <div className="online-status">
        <div className="status-indicator">
          <span className="pulse-dot"></span>
          <span className="online-count">{onlineUsers} people online</span>
          <span className="status-text">ready to support each other</span>
        </div>
      </div>

      {/* Connection Options */}
      <div className="connection-options">
        <h2 className="section-title">Find Someone Like You</h2>
        <p className="section-subtitle">Choose how you'd like to connect with others</p>

        <div className="option-grid">
          {/* Random Chat */}
          <div className="option-card primary">
            <div className="option-icon">🎲</div>
            <div className="option-content">
              <h3>Random Support Chat</h3>
              <p>Connect instantly with someone who wants to listen (Omegle-style)</p>
              <div className="option-features">
                <span>• Anonymous & encrypted</span>
                <span>• Voice or text chat</span>
                <span>• AI moderated for safety</span>
              </div>
            </div>
            <button 
              className="option-button"
              onClick={startRandomChat}
              disabled={isSearching || matchFound}
            >
              {isSearching ? 'Finding match...' : matchFound ? 'Connected!' : 'Start Now'}
            </button>
          </div>

          {/* Support Groups */}
          <div className="option-card">
            <div className="option-icon">👥</div>
            <div className="option-content">
              <h3>Join Support Groups</h3>
              <p>Ongoing conversations with people facing similar challenges</p>
              <div className="option-features">
                <span>• Topic-based groups</span>
                <span>• Moderated discussions</span>
                <span>• Regular meetups</span>
              </div>
            </div>
            <button 
              className="option-button"
              onClick={() => setSupportMode('groups')}
            >
              Browse Groups
            </button>
          </div>

          {/* Similar Experiences */}
          <div className="option-card">
            <div className="option-icon">🎯</div>
            <div className="option-content">
              <h3>Similar Experiences</h3>
              <p>Connect with people who've been through what you're facing</p>
              <div className="option-features">
                <span>• AI-matched experiences</span>
                <span>• Shared coping strategies</span>
                <span>• Mutual support</span>
              </div>
            </div>
            <button 
              className="option-button"
              onClick={findSimilarExperiences}
            >
              Find Matches
            </button>
          </div>

          {/* Local Community */}
          <div className="option-card">
            <div className="option-icon">🌍</div>
            <div className="option-content">
              <h3>Local Community</h3>
              <p>Find in-person meetups and support groups in your area</p>
              <div className="option-features">
                <span>• Local meetups</span>
                <span>• Community events</span>
                <span>• Real-world connections</span>
              </div>
            </div>
            <button 
              className="option-button"
              onClick={findLocalSupport}
            >
              Find Local
            </button>
          </div>
        </div>
      </div>

      {/* Active Connection */}
      {matchFound && currentMatch && (
        <div className="active-connection">
          <div className="connection-header">
            <h3>Connected to Anonymous User #{currentMatch.id}</h3>
            <button className="end-chat-button" onClick={endChat}>End Chat</button>
          </div>
          <div className="connection-info">
            <div className="match-details">
              <span>🎭 {currentMatch.mood}</span>
              <span>💭 Interests: {currentMatch.interests.join(', ')}</span>
              <span>⏱️ Available for {currentMatch.waitTime} minutes</span>
            </div>
          </div>
          <div className="chat-interface">
            <div className="chat-placeholder">
              <p>🔒 This conversation is encrypted and anonymous</p>
              <p>💬 Start typing or click the microphone to begin voice chat</p>
            </div>
            <div className="chat-controls">
              <button className="voice-button" onClick={startVoiceChat}>
                🎤 Voice Chat
              </button>
              <button className="video-button" onClick={startVideoChat}>
                📹 Video Chat
              </button>
              <button className={`text-button ${callType === 'text' ? 'active' : ''}`}>
                💬 Text Chat
              </button>
              <button className="report-button">⚠️ Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Support Groups */}
      {supportMode === 'groups' && (
        <div className="support-groups">
          <h3 className="section-title">Active Support Groups</h3>
          <div className="groups-grid">
            {supportGroups.map((group) => (
              <div key={group.id} className="group-card">
                <div className="group-header">
                  <h4 className="group-name">{group.name}</h4>
                  <span className={`activity-badge ${group.activity.toLowerCase().replace(' ', '-')}`}>
                    {group.activity}
                  </span>
                </div>
                <p className="group-description">{group.description}</p>
                <div className="group-stats">
                  <span>👥 {group.members} members</span>
                  <span>⏰ {group.lastActive}</span>
                </div>
                <button 
                  className="join-group-button"
                  onClick={() => joinGroup(group.id)}
                >
                  Join Group
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Connections */}
      <div className="recent-connections">
        <h3 className="section-title">Your Recent Connections</h3>
        <div className="connections-list">
          {recentConnections.map((connection) => (
            <div key={connection.id} className="connection-item">
              <div className="connection-content">
                <p className="connection-description">{connection.type}</p>
                <span className="connection-time">{connection.time}</span>
              </div>
              <div className="connection-rating">
                {'⭐'.repeat(connection.rating)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="safety-notice">
        <div className="safety-icon">🛡️</div>
        <div className="safety-content">
          <h3>Your Safety Matters</h3>
          <p>All conversations are:</p>
          <ul>
            <li>✅ Completely anonymous and encrypted</li>
            <li>✅ AI-moderated for inappropriate content</li>
            <li>✅ Reportable if you feel unsafe</li>
            <li>✅ Available to end at any time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PeerSupport;
