'use client';

import React, { useState, useEffect } from 'react';
import { VideoCall } from '@/components/VideoCall';
import { motion, AnimatePresence } from 'motion/react';

interface SupportGroup {
  id: string;
  name: string;
  description: string;
  topics: string[];
  member_count: number;
  meeting_schedule?: string;
}

const PeerSupport = () => {
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [supportMode, setSupportMode] = useState('random');
  const [inVideoCall, setInVideoCall] = useState(false);
  const [callType, setCallType] = useState<'video' | 'voice' | 'text'>('text');
  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [recentConnections, setRecentConnections] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch real-time stats from database
  useEffect(() => {
    const fetchPeerStats = async () => {
      try {
        const res = await fetch('/api/peer-stats');
        const data = await res.json();
        setOnlineUsers(data.onlineUsers || 0);
        setRecentConnections(data.recentConnections || []);
      } catch (error) {
        console.error('Failed to fetch peer stats:', error);
      }
      setLoadingStats(false);
    };
    fetchPeerStats();

    // Refresh stats every 30 seconds for real-time feel
    const interval = setInterval(fetchPeerStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch support groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/support-groups');
        const data = await res.json();
        setSupportGroups(data.groups || []);
      } catch (error) {
        console.error('Failed to fetch support groups:', error);
      }
      setLoadingGroups(false);
    };
    fetchGroups();
  }, []);


  const startRandomChat = async () => {
    setIsSearching(true);
    setMatchFound(false);

    try {
      const joinRes = await fetch('/api/peer-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join_queue', interests: ['anxiety', 'stress'] })
      });

      const joinData = await joinRes.json();

      if (joinData.status === 'matched') {
        handleMatchSuccess(joinData.match);
      } else {
        const pollInterval = setInterval(async () => {
          try {
            const checkRes = await fetch('/api/peer-match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'check_status' })
            });
            const checkData = await checkRes.json();

            if (checkData.status === 'matched') {
              clearInterval(pollInterval);
              handleMatchSuccess(checkData.match);
            }
          } catch (e) {
            console.error('Polling error', e);
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(pollInterval);
          if (!matchFound) {
            setIsSearching(false);
            leaveQueue();
          }
        }, 60000);
      }
    } catch (e) {
      console.error(e);
      setIsSearching(false);
    }
  };

  const handleMatchSuccess = (match: any) => {
    setMatchFound(true);
    setCurrentMatch({
      ...match,
      mood: 'Ready to chat',
      interests: ['mental wellness'],
      waitTime: 0
    });
    setIsSearching(false);
  };

  const leaveQueue = async () => {
    await fetch('/api/peer-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave_queue' })
    });
  };

  const joinGroup = (groupId: string) => {
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

  if (inVideoCall && currentMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)]">
          <VideoCall
            roomName={currentMatch.roomId || `peer-support-${currentMatch.id}`}
            participantName="Anonymous Peer"
            onDisconnect={endChat}
            callType="peer-support"
            mode={callType === 'video' ? 'video' : 'voice'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Online Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-full px-6 py-3 shadow-lg border border-white/20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="font-semibold text-foreground">{onlineUsers} people online</span>
            <span className="text-muted-foreground text-sm">ready to connect</span>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Peer Support Network
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with people who understand. Anonymous, safe, and supportive.
          </p>
        </motion.div>

        {/* Connection Options Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Random Chat Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-4xl mb-4">🎲</div>
              <h3 className="text-xl font-bold text-foreground mb-2">Random Support Chat</h3>
              <p className="text-muted-foreground mb-4">
                Connect instantly with someone who wants to listen
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">Anonymous</span>
                <span className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Encrypted</span>
                <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">AI Moderated</span>
              </div>
              <button
                onClick={startRandomChat}
                disabled={isSearching || matchFound}
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isSearching ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Finding Match...
                  </span>
                ) : matchFound ? 'Connected!' : 'Start Now'}
              </button>
            </div>
          </motion.div>

          {/* Support Groups Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-blue-200/50 dark:border-blue-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-foreground mb-2">Support Groups</h3>
              <p className="text-muted-foreground mb-4">
                Join ongoing conversations with people facing similar challenges
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Topic-based</span>
                <span className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">Moderated</span>
                <span className="text-xs px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">Meetups</span>
              </div>
              <button
                onClick={() => setSupportMode('groups')}
                className="w-full py-3 px-6 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-foreground font-semibold rounded-xl border border-slate-200 dark:border-slate-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Browse Groups
              </button>
            </div>
          </motion.div>
        </div>

        {/* Active Connection Card */}
        <AnimatePresence>
          {matchFound && currentMatch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-12 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 shadow-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Connected to Anonymous Peer</h3>
                  <p className="text-muted-foreground text-sm">Encrypted conversation • AI moderated</p>
                </div>
                <button
                  onClick={endChat}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium rounded-lg transition-colors"
                >
                  End Chat
                </button>
              </div>

              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-6 mb-4">
                <p className="text-center text-muted-foreground mb-4">🔒 This conversation is encrypted and anonymous</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={startVoiceChat} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors">
                    🎤 Voice Chat
                  </button>
                  <button onClick={startVideoChat} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
                    📹 Video Chat
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-medium rounded-xl transition-colors">
                    💬 Text Chat
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Support Groups List */}
        <AnimatePresence>
          {supportMode === 'groups' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Active Support Groups</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {supportGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{group.name}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {group.topics?.slice(0, 3).map((topic, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span>👥 {group.member_count} members</span>
                      {group.meeting_schedule && <span>📅 {group.meeting_schedule}</span>}
                    </div>
                    <button
                      onClick={() => joinGroup(group.id)}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Join Group
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Connections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Recent Connections</h2>
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            {loadingStats ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground text-sm">Loading your connections...</p>
              </div>
            ) : recentConnections.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-4xl mb-3 block">🤝</span>
                <p className="font-medium text-foreground mb-1">No connections yet</p>
                <p className="text-sm text-muted-foreground">Start a chat to connect with someone who understands</p>
              </div>
            ) : (
              recentConnections.map((connection, index) => (
                <div
                  key={connection.id}
                  className={`flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${index < recentConnections.length - 1 ? 'border-b border-slate-200/50 dark:border-slate-700/50' : ''
                    }`}
                >
                  <div>
                    <p className="font-medium text-foreground">{connection.type}</p>
                    <p className="text-sm text-muted-foreground">{connection.time}</p>
                  </div>
                  <div className="text-yellow-500">
                    {'⭐'.repeat(connection.rating || 5)}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>


        {/* Safety Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">🛡️</div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Your Safety Matters</h3>
              <p className="text-muted-foreground mb-3">All conversations are:</p>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">✅ Completely anonymous and encrypted</li>
                <li className="flex items-center gap-2">✅ AI-moderated for inappropriate content</li>
                <li className="flex items-center gap-2">✅ Reportable if you feel unsafe</li>
                <li className="flex items-center gap-2">✅ Available to end at any time</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PeerSupport;
