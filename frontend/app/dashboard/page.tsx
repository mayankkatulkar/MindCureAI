'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import './dashboard.css';

const Dashboard = () => {
  const router = useRouter();
  const [mentalHealthScore, setMentalHealthScore] = useState(75);
  const [productivityScore, setProductivityScore] = useState(82);
  const [isConnected, setIsConnected] = useState(false);
  const [recentActivity, setRecentActivity] = useState([
    { type: 'therapy', text: 'AI therapy session completed', time: '2 hours ago', icon: '🤖' },
    { type: 'breathing', text: 'Breathing exercise - 5 minutes', time: '4 hours ago', icon: '🫁' },
    { type: 'task', text: 'Completed daily mental wellness task', time: '6 hours ago', icon: '✅' },
    { type: 'progress', text: 'Mental wellness score improved +3', time: '1 day ago', icon: '📈' }
  ]);

  const [quickStats, setQuickStats] = useState({
    weeklyProgress: '+15',
    sessionsCompleted: 12,
    streakDays: 7,
    goalsAchieved: 4
  });

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          setMentalHealthScore(data.mentalHealthScore);
          setProductivityScore(data.productivityScore);
          setQuickStats(data.quickStats);
          setRecentActivity(data.recentActivity);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        setIsConnected(false);
      }
    };
    
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Update progress when activities are completed
  const updateProgress = async (activity: string) => {
    try {
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity })
      });
      
      if (response.ok) {
        const result = await response.json();
        setMentalHealthScore(result.data.mentalHealthScore);
        setProductivityScore(result.data.productivityScore);
        setRecentActivity(result.data.recentActivity);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const navigateToPage = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <AppHeader />
      <div className="dashboard-page" style={{ paddingTop: '4rem' }}>
      {/* Connection Status */}
      <div className="connection-banner">
        <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'AI System Connected' : 'Connecting to AI System...'}
        </div>
      </div>

      {/* Main Scores Section */}
      <div className="scores-section">
        <div className="score-card primary">
          <div className="score-header">
            <h3>Mental Wellness Score</h3>
            <span className="score-trend positive">+{quickStats.weeklyProgress}</span>
          </div>
          <div className="score-display">
            <div className="score-circle">
              <div className="score-fill" style={{ '--fill': `${mentalHealthScore}%` } as React.CSSProperties}>
                <span className="score-value">{mentalHealthScore}</span>
              </div>
            </div>
            <div className="score-info">
              <p className="score-status">Good Progress</p>
              <p className="score-desc">Keep up the great work!</p>
            </div>
          </div>
        </div>

        <div className="score-card secondary">
          <div className="score-header">
            <h3>Productivity Score</h3>
            <span className="score-trend positive">+8</span>
          </div>
          <div className="score-display">
            <div className="score-circle">
              <div className="score-fill" style={{ '--fill': `${productivityScore}%` } as React.CSSProperties}>
                <span className="score-value">{productivityScore}</span>
              </div>
            </div>
            <div className="score-info">
              <p className="score-status">Excellent</p>
              <p className="score-desc">Highly productive week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <span className="stat-value">{quickStats.streakDays}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <span className="stat-value">{quickStats.goalsAchieved}</span>
            <span className="stat-label">Goals Achieved</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <span className="stat-value">{quickStats.sessionsCompleted}</span>
            <span className="stat-label">AI Sessions</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-grid">
          <button className="action-card primary" onClick={() => {
            updateProgress('therapy');
            navigateToPage('/voice-chat');
          }}>
            <div className="action-icon">🤖</div>
            <div className="action-content">
              <h4>Talk to AI Now</h4>
              <p>Start your therapy session</p>
            </div>
          </button>
          
          <button className="action-card" onClick={() => navigateToPage('/therapist-directory')}>
            <div className="action-icon">👩‍⚕️</div>
            <div className="action-content">
              <h4>Find Therapist</h4>
              <p>Book professional help</p>
            </div>
          </button>
          
          <button className="action-card" onClick={() => navigateToPage('/peer-support')}>
            <div className="action-icon">🤝</div>
            <div className="action-content">
              <h4>Peer Support</h4>
              <p>Connect with others</p>
            </div>
          </button>
          
          <button className="action-card emergency" onClick={() => navigateToPage('/crisis-support')}>
            <div className="action-icon">🚨</div>
            <div className="action-content">
              <h4>Emergency Support</h4>
              <p>Immediate help available</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3 className="section-title">Recent Activity</h3>
        <div className="activity-list">
          {recentActivity.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">{activity.icon}</div>
              <div className="activity-content">
                <p className="activity-text">{activity.text}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Focus */}
      <div className="todays-focus">
        <h3 className="section-title">Today's Focus</h3>
        <div className="focus-card">
          <div className="focus-icon">🧘</div>
          <div className="focus-content">
            <h4>Mindful Breathing</h4>
            <p>Take 10 minutes for a guided breathing exercise to center yourself and reduce stress.</p>
            <button className="focus-action" onClick={() => {
              updateProgress('task');
              navigateToPage('/voice-chat');
            }}>
              Start Now
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Dashboard;
