'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';

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
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${isConnected
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
            }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            {isConnected ? 'AI System Connected' : 'Connecting...'}
          </div>
        </motion.div>

        {/* Main Scores */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold opacity-90">Mental Wellness Score</h3>
              <span className="px-2 py-1 bg-white/20 rounded-full text-sm">
                {quickStats.weeklyProgress}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                  <circle
                    cx="48" cy="48" r="42"
                    stroke="white" strokeWidth="8" fill="none"
                    strokeDasharray={`${mentalHealthScore * 2.64} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">{mentalHealthScore}</span>
              </div>
              <div>
                <p className="text-lg font-medium">Good Progress</p>
                <p className="text-white/70 text-sm">Keep up the great work!</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Productivity Score</h3>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                +8
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="42" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="8" fill="none" />
                  <circle
                    cx="48" cy="48" r="42"
                    stroke="url(#gradient)" strokeWidth="8" fill="none"
                    strokeDasharray={`${productivityScore * 2.64} 264`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">{productivityScore}</span>
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">Excellent</p>
                <p className="text-muted-foreground text-sm">Highly productive week</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { icon: '🔥', value: quickStats.streakDays, label: 'Day Streak' },
            { icon: '🎯', value: quickStats.goalsAchieved, label: 'Goals Achieved' },
            { icon: '💬', value: quickStats.sessionsCompleted, label: 'AI Sessions' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 text-center">
              <span className="text-2xl">{stat.icon}</span>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/voice-chat"
              onClick={() => updateProgress('therapy')}
              className="group bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <span className="text-3xl mb-3 block">🤖</span>
              <h4 className="font-semibold">Talk to AI Now</h4>
              <p className="text-white/70 text-sm">Start your therapy session</p>
            </Link>

            <Link
              href="/therapist-directory"
              className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <span className="text-3xl mb-3 block">👩‍⚕️</span>
              <h4 className="font-semibold text-foreground">Find Therapist</h4>
              <p className="text-muted-foreground text-sm">Book professional help</p>
            </Link>

            <Link
              href="/peer-support"
              className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <span className="text-3xl mb-3 block">🤝</span>
              <h4 className="font-semibold text-foreground">Peer Support</h4>
              <p className="text-muted-foreground text-sm">Connect with others</p>
            </Link>

            <Link
              href="/crisis-support"
              className="group bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <span className="text-3xl mb-3 block">🚨</span>
              <h4 className="font-semibold text-red-700 dark:text-red-400">Emergency Support</h4>
              <p className="text-red-600/70 dark:text-red-300/70 text-sm">Immediate help available</p>
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-foreground mb-4">Recent Activity</h3>
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 ${index < recentActivity.length - 1 ? 'border-b border-slate-200/50 dark:border-slate-700/50' : ''
                  }`}
              >
                <span className="text-2xl">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-foreground font-medium">{activity.text}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
