'use client';

import React, { useState, useEffect } from 'react';
import './therapist-directory.css';

const TherapistDirectory = () => {
  const [searchFilter, setSearchFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const [therapists] = useState([
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialization: 'Anxiety & Panic Disorders',
      rating: 4.9,
      experience: '8 years',
      availability: 'Today 3:00 PM',
      insuranceCovered: true,
      sessionTypes: ['Video', 'Voice', 'Chat'],
      price: 'Covered by insurance',
      image: '👩‍⚕️',
      bio: 'Specialized in cognitive behavioral therapy with focus on anxiety and panic disorders.',
      nextAvailable: 'today'
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialization: 'Depression & CBT',
      rating: 4.8,
      experience: '12 years',
      availability: 'Tomorrow 10:00 AM',
      insuranceCovered: false,
      sessionTypes: ['Video', 'In-person'],
      price: '$150/session',
      image: '👨‍⚕️',
      bio: 'Expert in depression treatment and cognitive behavioral therapy techniques.',
      nextAvailable: 'tomorrow'
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      specialization: 'Trauma & PTSD',
      rating: 4.9,
      experience: '10 years',
      availability: 'Today 6:00 PM',
      insuranceCovered: true,
      sessionTypes: ['Video', 'Voice'],
      price: 'Covered by insurance',
      image: '👩‍⚕️',
      bio: 'Trauma-informed care specialist with extensive EMDR and CBT training.',
      nextAvailable: 'today'
    },
    {
      id: 4,
      name: 'Dr. James Wilson',
      specialization: 'Addiction & Recovery',
      rating: 4.7,
      experience: '15 years',
      availability: 'Next week',
      insuranceCovered: true,
      sessionTypes: ['Video', 'In-person', 'Group'],
      price: 'Covered by insurance',
      image: '👨‍⚕️',
      bio: 'Addiction counselor specializing in substance abuse and behavioral addictions.',
      nextAvailable: 'next-week'
    }
  ]);

  const [emergencySupport] = useState({
    available: true,
    waitTime: '< 5 minutes',
    type: 'Crisis Counselor'
  });

  const filteredTherapists = therapists.filter(therapist => {
    const matchesSpecialization = searchFilter === 'all' || 
      therapist.specialization.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesAvailability = availabilityFilter === 'all' || 
      therapist.nextAvailable === availabilityFilter;
    return matchesSpecialization && matchesAvailability;
  });

  const bookSession = (therapistId: number, therapistName: string) => {
    setIsLoading(true);
    // Simulate booking API call
    setTimeout(() => {
      setIsLoading(false);
      alert(`Booking session with ${therapistName}. You will receive a confirmation email shortly.`);
    }, 2000);
  };

  const connectEmergency = () => {
    window.location.href = '/crisis-support';
  };

  const searchPsychologyToday = () => {
    window.open('https://www.psychologytoday.com/us/therapists', '_blank');
  };

  return (
    <div className="therapist-directory">
      {/* Emergency Support Banner */}
      <div className="emergency-banner">
        <div className="emergency-content">
          <div className="emergency-icon">🚨</div>
          <div className="emergency-text">
            <h3>Need Immediate Help?</h3>
            <p>Crisis counselor available now - {emergencySupport.waitTime} wait time</p>
          </div>
          <button className="emergency-button" onClick={connectEmergency}>
            Connect Now
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="search-section">
        <h2 className="search-title">Find Your Perfect Match</h2>
        <p className="search-subtitle">AI-powered matching based on your condition and preferences</p>
        
        <div className="filters">
          <div className="filter-group">
            <label>Specialization</label>
            <select 
              value={searchFilter} 
              onChange={(e) => setSearchFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Specializations</option>
              <option value="anxiety">Anxiety & Panic</option>
              <option value="depression">Depression</option>
              <option value="trauma">Trauma & PTSD</option>
              <option value="addiction">Addiction</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Availability</label>
            <select 
              value={availabilityFilter} 
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Any Time</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="next-week">Next Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="ai-recommendation">
        <div className="ai-icon">🤖</div>
        <div className="ai-content">
          <h3>AI Recommendation</h3>
          <p>Based on your recent sessions, we recommend therapists specializing in <strong>anxiety management</strong> and <strong>cognitive behavioral therapy</strong>.</p>
        </div>
      </div>

      {/* Therapist List */}
      <div className="therapist-list">
        <h3 className="list-title">Top Matches for You</h3>
        <div className="therapist-grid">
          {filteredTherapists.map((therapist) => (
            <div key={therapist.id} className="therapist-card">
              <div className="therapist-header">
                <div className="therapist-avatar">{therapist.image}</div>
                <div className="therapist-info">
                  <h4 className="therapist-name">{therapist.name}</h4>
                  <p className="therapist-specialization">{therapist.specialization}</p>
                  <div className="therapist-rating">
                    <span className="rating-stars">⭐</span>
                    <span className="rating-value">{therapist.rating}</span>
                    <span className="rating-experience">• {therapist.experience}</span>
                  </div>
                </div>
              </div>

              <div className="therapist-bio">
                <p>{therapist.bio}</p>
              </div>

              <div className="therapist-details">
                <div className="detail-row">
                  <span className="detail-label">Next Available:</span>
                  <span className="detail-value availability">{therapist.availability}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Session Types:</span>
                  <span className="detail-value">{therapist.sessionTypes.join(', ')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Cost:</span>
                  <span className={`detail-value ${therapist.insuranceCovered ? 'covered' : 'paid'}`}>
                    {therapist.price}
                    {therapist.insuranceCovered && <span className="insurance-badge">✓ Covered</span>}
                  </span>
                </div>
              </div>

              <div className="therapist-actions">
                <button 
                  className="book-button primary"
                  onClick={() => bookSession(therapist.id, therapist.name)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Booking...' : 'Book Session'}
                </button>
                <button className="view-profile-button">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* No Results */}
      {filteredTherapists.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No therapists found</h3>
          <p>Try adjusting your filters or search criteria</p>
          <button 
            className="reset-filters"
            onClick={() => {
              setSearchFilter('all');
              setAvailabilityFilter('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Insurance Info */}
      <div className="insurance-info">
        <h3>Insurance & Billing</h3>
        <div className="insurance-grid">
          <div className="insurance-item">
            <span className="insurance-icon">🛡️</span>
            <div>
              <h4>Insurance Verification</h4>
              <p>We'll verify your coverage before booking</p>
            </div>
          </div>
          <div className="insurance-item">
            <span className="insurance-icon">💳</span>
            <div>
              <h4>Flexible Payment</h4>
              <p>Multiple payment options available</p>
            </div>
          </div>
          <div className="insurance-item">
            <span className="insurance-icon">📅</span>
            <div>
              <h4>Easy Scheduling</h4>
              <p>Book, reschedule, or cancel anytime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistDirectory;
