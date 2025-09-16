'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import './landing.css';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '🤖',
      title: 'AI Voice Therapy',
      description: 'Experience natural conversations with our advanced AI therapist. Available 24/7 with realistic voice interactions - just click and start talking.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: '👩‍⚕️',
      title: 'Professional Therapists',
      description: 'Connect with licensed therapists matched to your specific needs and preferences',
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      icon: '🤝',
      title: 'Peer Support Network',
      description: 'Find anonymous support from people who understand your journey',
      gradient: 'from-green-500 to-blue-500'
    },
    {
      icon: '📈',
      title: 'Progress Tracking',
      description: 'Monitor your mental wellness journey with AI-powered insights and personalized recommendations',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Software Engineer',
      text: 'MindCure helped me manage my anxiety during a career transition. The AI therapist was incredibly understanding.',
      rating: 5
    },
    {
      name: 'Michael R.',
      role: 'Student',
      text: 'The peer support feature connected me with people who really get it. I felt less alone in my struggles.',
      rating: 5
    },
    {
      name: 'Jennifer L.',
      role: 'Marketing Manager',
      text: 'Having 24/7 access to support changed my life. The progress tracking helps me see how far I\'ve come.',
      rating: 5
    }
  ];

  return (
    <>
      <AppHeader />
      <div className="landing-container" style={{ paddingTop: '4rem' }}>
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <span className="brand-icon">💜</span>
            <span className="brand-text">MindCure</span>
          </div>
          <div className="nav-actions">
            <Link href="/login" className="nav-button login">
              Sign In
            </Link>
            <Link href="/signup" className="nav-button signup">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="floating-element element-1"></div>
          <div className="floating-element element-2"></div>
          <div className="floating-element element-3"></div>
        </div>
        
        <div className={`hero-content ${isVisible ? 'visible' : ''}`}>
          <h1 className="hero-title">
            Your Mental Wellness Journey
            <span className="hero-highlight"> Starts Here</span>
          </h1>
          <p className="hero-subtitle">
            Experience the future of mental wellness care with AI-powered therapy, 
            professional support, and a caring community all in one platform.
          </p>
          
                      <div className="hero-buttons">
              <Link href="/voice-chat" className="hero-btn primary">
                🤖 Start AI Voice Chat
              </Link>
              <Link href="/signup" className="hero-btn secondary">
                Create Account
              </Link>
            </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Users Helped</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Support Available</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">95%</span>
              <span className="stat-label">Satisfaction Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-content">
          <h2 className="section-title">
            Everything You Need for Mental Wellness
          </h2>
          <p className="section-subtitle">
            Comprehensive mental wellness support tailored to your unique needs
          </p>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`feature-card ${activeFeature === index ? 'active' : ''} ${index === 0 ? 'clickable' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
                onClick={index === 0 ? () => window.location.href = '/voice-chat' : undefined}
                style={{cursor: index === 0 ? 'pointer' : 'default'}}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                {index === 0 && (
                  <div className="feature-cta">
                    <span className="cta-text">Try Voice Chat Now →</span>
                  </div>
                )}
                <div className="feature-glow"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="process-section">
        <div className="process-content">
          <h2 className="section-title">How MindCure Works</h2>
          
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Create Your Profile</h3>
                <p className="step-description">
                  Share your mental wellness goals and preferences to personalize your experience
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Get Matched</h3>
                <p className="step-description">
                  Our AI matches you with the right therapists and support networks
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Start Your Journey</h3>
                <p className="step-description">
                  Begin therapy sessions, connect with peers, and track your progress
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="testimonials-content">
          <h2 className="section-title">What Our Users Say</h2>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">⭐</span>
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <span className="author-name">{testimonial.name}</span>
                  <span className="author-role">{testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crisis Support Banner */}
      <section className="crisis-banner">
        <div className="crisis-content">
          <div className="crisis-text">
            <h3 className="crisis-title">Need Immediate Help?</h3>
            <p className="crisis-description">
              If you're experiencing a mental wellness crisis, support is available 24/7
            </p>
          </div>
          <Link href="/crisis-support" className="crisis-button">
            <span className="crisis-icon">🚨</span>
            Get Crisis Support
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Mental Wellness?</h2>
          <p className="cta-subtitle">
            Join thousands of people who've found hope, healing, and community with MindCure
          </p>
          
          <div className="cta-actions">
            <Link href="/signup" className="cta-button primary large">
              <span className="cta-icon">💜</span>
              Start Free Today
            </Link>
            <Link href="/login" className="cta-button secondary">
              Sign In
            </Link>
            <p className="cta-note">No credit card required • Free 7-day trial</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-icon">💜</span>
            <span className="brand-text">MindCure</span>
            <p className="footer-tagline">
              Empowering mental wellness through technology and community
            </p>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <Link href="/">AI Therapy</Link>
              <Link href="/therapist-directory">Find Therapists</Link>
              <Link href="/peer-support">Peer Support</Link>
              <Link href="/crisis-support">Crisis Support</Link>
            </div>
            
            <div className="link-group">
              <h4>Company</h4>
              <Link href="/about">About Us</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/contact">Contact</Link>
            </div>
            
            <div className="link-group">
              <h4>Support</h4>
              <Link href="/help">Help Center</Link>
              <Link href="/resources">Resources</Link>
              <Link href="/community">Community</Link>
              <Link href="/blog">Blog</Link>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 MindCure. All rights reserved.</p>
          <p className="footer-disclaimer">
            MindCure is not a replacement for professional medical advice. 
            If you're experiencing a crisis, please contact emergency services.
          </p>
        </div>
      </footer>
      </div>
    </>
  );
}
