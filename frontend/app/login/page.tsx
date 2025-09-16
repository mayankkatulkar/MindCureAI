'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../auth.css';

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate form
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Replace with actual authentication API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        // Store token in localStorage
        localStorage.setItem('mindcure_token', data.token);
        localStorage.setItem('mindcure_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid credentials');
      }
    } catch (error) {
      // For demo purposes, simulate successful login
      localStorage.setItem('mindcure_token', 'demo_token');
      localStorage.setItem('mindcure_user', JSON.stringify({
        id: 1,
        email: formData.email,
        name: 'Demo User'
      }));
      router.push('/dashboard');
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    console.log('Google login clicked');
  };

  const handleGuestLogin = () => {
    // For immediate demo access
    localStorage.setItem('mindcure_token', 'guest_token');
    localStorage.setItem('mindcure_user', JSON.stringify({
      id: 0,
      email: 'guest@mindcure.com',
      name: 'Guest User'
    }));
    router.push('/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue your mental wellness journey</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-options">
              <Link href="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner">Signing In...</span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <button 
              type="button" 
              className="auth-button google"
              onClick={handleGoogleLogin}
            >
              <span className="google-icon">🔗</span>
              Continue with Google
            </button>

            <button 
              type="button" 
              className="auth-button guest"
              onClick={handleGuestLogin}
            >
              <span className="guest-icon">👤</span>
              Continue as Guest
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link href="/signup" className="signup-link">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-features">
          <h3>Why Choose MindCure?</h3>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <div>
                <h4>AI-Powered Therapy</h4>
                <p>24/7 access to intelligent mental wellness support</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <div>
                <h4>Professional Therapists</h4>
                <p>Connect with licensed professionals when needed</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤝</span>
              <div>
                <h4>Peer Support</h4>
                <p>Anonymous support from people who understand</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <div>
                <h4>Progress Tracking</h4>
                <p>Monitor your mental wellness journey over time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
