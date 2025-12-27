'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

interface Therapist {
  id: string;
  name: string;
  specialization: string;
  specializations: string[];
  rating: number;
  experience: string;
  yearsExperience: number;
  availability: string;
  nextAvailable: string;
  insuranceCovered: boolean;
  sessionTypes: string[];
  price: string;
  hourlyRate: number | null;
  image: string | null;
  bio: string;
  licenseNumber: string;
  licenseState: string;
  totalSessions: number;
  verified: boolean;
}

const TherapistDirectory = () => {
  const [searchFilter, setSearchFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTherapists = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchFilter !== 'all') {
        params.append('specialty', searchFilter);
      }

      const response = await fetch(`/api/therapist?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch therapists');
      }

      const data = await response.json();
      setTherapists(data.therapists || []);
    } catch (err) {
      console.error('Error fetching therapists:', err);
      setError('Unable to load therapists. Please try again later.');
      setTherapists([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchFilter]);

  useEffect(() => {
    fetchTherapists();
  }, [fetchTherapists]);

  const filteredTherapists = therapists.filter(therapist => {
    const matchesSpecialization = searchFilter === 'all' ||
      therapist.specialization.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesAvailability = availabilityFilter === 'all' ||
      therapist.nextAvailable === availabilityFilter;
    return matchesSpecialization && matchesAvailability;
  });

  const bookSession = async (therapistId: string, therapistName: string, hourlyRate: number | null) => {
    setIsBooking(true);

    try {
      // Redirect to Stripe checkout for payment
      const response = await fetch('/api/therapist-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistId,
          sessionType: 'video',
          notes: `Session with ${therapistName}`
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else if (response.status === 401) {
        // User not logged in
        alert('Please log in to book a session.');
        window.location.href = '/login';
      } else {
        alert(`❌ ${data.error || 'Failed to start booking. Please try again.'}`);
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Failed to book session. Please try again or contact support.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Emergency Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/crisis-support"
            className="block bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl p-4 border border-red-500/20 hover:border-red-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="font-bold text-red-600 dark:text-red-400">Need Immediate Help?</h3>
                  <p className="text-sm text-muted-foreground">Crisis counselor available now - less than 5 min wait</p>
                </div>
              </div>
              <span className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors group-hover:shadow-lg">
                Connect Now
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Find Your Perfect Therapist
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered matching based on your needs and preferences
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg mb-8"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Specialization</label>
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              >
                <option value="all">All Specializations</option>
                <option value="anxiety">Anxiety & Panic</option>
                <option value="depression">Depression</option>
                <option value="trauma">Trauma & PTSD</option>
                <option value="addiction">Addiction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Availability</label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              >
                <option value="all">Any Time</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="next-week">Next Week</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* AI Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/20 mb-8"
        >
          <div className="flex items-start gap-4">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-bold text-foreground mb-1">AI Recommendation</h3>
              <p className="text-muted-foreground text-sm">
                Based on your recent sessions, we recommend therapists specializing in <strong className="text-purple-600 dark:text-purple-400">anxiety management</strong> and <strong className="text-purple-600 dark:text-purple-400">cognitive behavioral therapy</strong>.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl p-4 mb-6 flex items-center justify-between"
          >
            <span className="text-yellow-800 dark:text-yellow-200">⚠️ {error}</span>
            <button onClick={fetchTherapists} className="text-yellow-600 hover:underline text-sm font-medium">
              Try Again
            </button>
          </motion.div>
        )}

        {/* Therapists Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Top Matches for You</h2>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : filteredTherapists.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white/70 dark:bg-slate-800/70 rounded-2xl"
            >
              <span className="text-5xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold text-foreground mb-2">No therapists found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
              <button
                onClick={() => {
                  setSearchFilter('all');
                  setAvailabilityFilter('all');
                }}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTherapists.map((therapist, index) => (
                <motion.div
                  key={therapist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                      {therapist.image ? (
                        <img src={therapist.image} alt={therapist.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        '👨‍⚕️'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground truncate">{therapist.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">{therapist.specialization}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-medium">{therapist.rating}</span>
                        <span className="text-muted-foreground text-sm">• {therapist.experience}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{therapist.bio}</p>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Available</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{therapist.availability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Session Types</span>
                      <span className="font-medium">{therapist.sessionTypes.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost</span>
                      <span className={`font-medium ${therapist.insuranceCovered ? 'text-green-600 dark:text-green-400' : ''}`}>
                        {therapist.price}
                        {therapist.insuranceCovered && <span className="ml-1">✓</span>}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => bookSession(therapist.id, therapist.name, therapist.hourlyRate)}
                      disabled={isBooking}
                      className="py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {isBooking ? 'Booking...' : `Book ${therapist.hourlyRate ? `$${therapist.hourlyRate}` : ''}`}
                    </button>
                    <button className="py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium rounded-xl transition-colors">
                      Profile
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Insurance Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50"
        >
          <h3 className="font-bold text-foreground mb-4">Insurance & Billing</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-2xl">🛡️</span>
              <div>
                <h4 className="font-medium text-foreground">Insurance Verification</h4>
                <p className="text-sm text-muted-foreground">We'll verify your coverage before booking</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-2xl">💳</span>
              <div>
                <h4 className="font-medium text-foreground">Flexible Payment</h4>
                <p className="text-sm text-muted-foreground">Multiple payment options available</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-2xl">📅</span>
              <div>
                <h4 className="font-medium text-foreground">Easy Scheduling</h4>
                <p className="text-sm text-muted-foreground">Book, reschedule, or cancel anytime</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TherapistDirectory;
