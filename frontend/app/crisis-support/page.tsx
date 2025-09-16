'use client';

import React, { useState, useEffect } from 'react';
import './crisis-support.css';

const CrisisSupport = () => {
  const [emergencyContacts] = useState([
    {
      id: 1,
      name: 'National Suicide Prevention Lifeline',
      number: '988',
      available: '24/7',
      type: 'crisis',
      description: 'Free, confidential crisis support'
    },
    {
      id: 2,
      name: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      available: '24/7',
      type: 'text',
      description: 'Text-based crisis support'
    },
    {
      id: 3,
      name: 'Emergency Services',
      number: '911',
      available: '24/7',
      type: 'emergency',
      description: 'Immediate medical emergency'
    }
  ]);

  const [crisisResources] = useState([
    {
      id: 1,
      title: 'Immediate Safety Plan',
      description: 'Step-by-step guide for when you\'re in crisis',
      icon: '🛡️',
      action: 'View Plan'
    },
    {
      id: 2,
      title: 'Breathing Exercises',
      description: 'Quick calming techniques for anxiety',
      icon: '🫁',
      action: 'Start Exercise'
    },
    {
      id: 3,
      title: 'Grounding Techniques',
      description: '5-4-3-2-1 sensory grounding method',
      icon: '🌱',
      action: 'Learn Technique'
    },
    {
      id: 4,
      title: 'Support Chat',
      description: 'Connect with a crisis counselor',
      icon: '💬',
      action: 'Start Chat'
    }
  ]);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  const connectToCrisisSupport = (type: string) => {
    setIsConnecting(true);
    setConnectionType(type);
    
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      if (type === 'chat') {
        alert('Connecting you to a crisis counselor... Please wait.');
      } else if (type === 'call') {
        alert('Initiating crisis call... You will be connected shortly.');
      }
    }, 2000);
  };

  const callEmergencyNumber = (number: string) => {
    if (number === '911' || number === '988') {
      window.open(`tel:${number}`);
    } else {
      alert(`Please call: ${number}`);
    }
  };

  const startBreathingExercise = () => {
    window.location.href = '/ai-chat';
  };

  const viewSafetyPlan = () => {
    alert('Opening your personalized safety plan...');
  };

  const startGroundingTechnique = () => {
    alert('Starting 5-4-3-2-1 grounding technique...');
  };

  return (
    <div className="crisis-support">
      {/* Emergency Alert */}
      <div className="emergency-alert">
        <div className="alert-icon">🚨</div>
        <div className="alert-content">
          <h2>You're Not Alone</h2>
          <p>If you're having thoughts of suicide or self-harm, please reach out for help immediately. Trained counselors are available 24/7.</p>
        </div>
      </div>

      {/* Immediate Help */}
      <div className="immediate-help">
        <h3 className="section-title">Get Help Right Now</h3>
        <div className="help-buttons">
          <button 
            className="help-button primary"
            onClick={() => connectToCrisisSupport('chat')}
            disabled={isConnecting && connectionType === 'chat'}
          >
            <div className="button-icon">💬</div>
            <div className="button-content">
              <h4>Crisis Chat</h4>
              <p>{isConnecting && connectionType === 'chat' ? 'Connecting...' : '< 2 min wait'}</p>
            </div>
          </button>

          <button 
            className="help-button secondary"
            onClick={() => connectToCrisisSupport('call')}
            disabled={isConnecting && connectionType === 'call'}
          >
            <div className="button-icon">📞</div>
            <div className="button-content">
              <h4>Crisis Call</h4>
              <p>{isConnecting && connectionType === 'call' ? 'Connecting...' : 'Immediate support'}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="emergency-contacts">
        <h3 className="section-title">Emergency Contacts</h3>
        <div className="contacts-list">
          {emergencyContacts.map((contact) => (
            <div key={contact.id} className={`contact-card ${contact.type}`}>
              <div className="contact-info">
                <h4 className="contact-name">{contact.name}</h4>
                <p className="contact-description">{contact.description}</p>
                <div className="contact-details">
                  <span className="contact-number">{contact.number}</span>
                  <span className="contact-availability">{contact.available}</span>
                </div>
              </div>
              <button 
                className="contact-button"
                onClick={() => callEmergencyNumber(contact.number)}
              >
                {contact.type === 'text' ? 'Text Now' : 'Call Now'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Crisis Resources */}
      <div className="crisis-resources">
        <h3 className="section-title">Crisis Support Tools</h3>
        <div className="resources-grid">
          {crisisResources.map((resource) => (
            <div key={resource.id} className="resource-card">
              <div className="resource-icon">{resource.icon}</div>
              <div className="resource-content">
                <h4 className="resource-title">{resource.title}</h4>
                <p className="resource-description">{resource.description}</p>
              </div>
              <button 
                className="resource-button"
                onClick={() => {
                  if (resource.title.includes('Breathing')) {
                    startBreathingExercise();
                  } else if (resource.title.includes('Safety Plan')) {
                    viewSafetyPlan();
                  } else if (resource.title.includes('Grounding')) {
                    startGroundingTechnique();
                  } else if (resource.title.includes('Support Chat')) {
                    connectToCrisisSupport('chat');
                  }
                }}
              >
                {resource.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Reminders */}
      <div className="safety-reminders">
        <h3 className="section-title">Remember</h3>
        <div className="reminders-list">
          <div className="reminder-item">
            <span className="reminder-icon">💝</span>
            <span className="reminder-text">You are valuable and your life has meaning</span>
          </div>
          <div className="reminder-item">
            <span className="reminder-icon">🌅</span>
            <span className="reminder-text">This feeling is temporary - you can get through this</span>
          </div>
          <div className="reminder-item">
            <span className="reminder-icon">🤝</span>
            <span className="reminder-text">Asking for help is a sign of strength, not weakness</span>
          </div>
          <div className="reminder-item">
            <span className="reminder-icon">🌟</span>
            <span className="reminder-text">You have survived difficult times before</span>
          </div>
        </div>
      </div>

      {/* Professional Help */}
      <div className="professional-help">
        <h3 className="section-title">Ongoing Support</h3>
        <div className="help-options">
          <div className="help-option">
            <div className="option-icon">👩‍⚕️</div>
            <div className="option-content">
              <h4>Find a Therapist</h4>
              <p>Connect with mental wellness professionals in your area</p>
              <button 
                className="option-button"
                onClick={() => window.location.href = '/therapist-directory'}
              >
                Browse Therapists
              </button>
            </div>
          </div>
          
          <div className="help-option">
            <div className="option-icon">🤝</div>
            <div className="option-content">
              <h4>Peer Support</h4>
              <p>Connect with others who understand what you're going through</p>
              <button 
                className="option-button"
                onClick={() => window.location.href = '/peer-support'}
              >
                Join Community
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 24/7 Notice */}
      <div className="always-available">
        <div className="availability-icon">🌙</div>
        <div className="availability-content">
          <h4>24/7 Support Available</h4>
          <p>Crisis support is always available, day or night. You don't have to face this alone.</p>
        </div>
      </div>
    </div>
  );
};

export default CrisisSupport;
