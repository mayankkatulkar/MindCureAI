'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../auth.css';

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  reminders: boolean;
}

interface PrivacySettings {
  anonymous: boolean;
  shareProgress: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  mentalHealthGoals: string[];
  currentChallenges: string[];
  previousTherapy: string;
  preferredTherapyType: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

const SignupPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1); // Multi-step signup
  const [formData, setFormData] = useState<FormData>({
    // Step 1: Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Mental Wellness Profile
    mentalHealthGoals: [],
    currentChallenges: [],
    previousTherapy: '',
    preferredTherapyType: '',
    
    // Step 3: Preferences
    notifications: {
      email: true,
      sms: false,
      reminders: true
    },
    privacy: {
      anonymous: false,
      shareProgress: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const mentalHealthGoals = [
    'Reduce Anxiety', 'Manage Depression', 'Improve Sleep', 
    'Stress Management', 'Build Confidence', 'Better Relationships',
    'Work-Life Balance', 'Emotional Regulation', 'Trauma Recovery'
  ];

  const challenges = [
    'Panic Attacks', 'Social Anxiety', 'Insomnia', 'Mood Swings',
    'Concentration Issues', 'Loneliness', 'Work Stress', 'Grief',
    'Addiction Recovery', 'Relationship Issues'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Pick<FormData, 'notifications' | 'privacy'>] as any),
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    if (error) setError('');
  };

  const handleArrayToggle = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }));
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        break;
      case 2:
        if (formData.mentalHealthGoals.length === 0) {
          setError('Please select at least one mental wellness goal');
          return false;
        }
        break;
      default:
        break;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: Replace with actual signup API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('mindcure_token', data.token);
        localStorage.setItem('mindcure_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Signup failed');
      }
    } catch (error) {
      // For demo purposes, simulate successful signup
      localStorage.setItem('mindcure_token', 'demo_token');
      localStorage.setItem('mindcure_user', JSON.stringify({
        id: 1,
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        profile: formData
      }));
      router.push('/dashboard');
    }

    setIsLoading(false);
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${step >= 1 ? 'active' : ''}`}>
        <span>1</span>
        <label>Account</label>
      </div>
      <div className={`step ${step >= 2 ? 'active' : ''}`}>
        <span>2</span>
        <label>Profile</label>
      </div>
      <div className={`step ${step >= 3 ? 'active' : ''}`}>
        <span>3</span>
        <label>Preferences</label>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="step-content">
      <h2 className="step-title">Create Your Account</h2>
      <p className="step-subtitle">Let's start your mental wellness journey</p>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName" className="form-label">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="John"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName" className="form-label">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Doe"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="form-input"
          placeholder="john@example.com"
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

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className="form-input"
          placeholder="••••••••"
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2 className="step-title">Mental Wellness Profile</h2>
      <p className="step-subtitle">Help us personalize your experience</p>

      <div className="form-group">
        <label className="form-label">What are your mental wellness goals? (Select all that apply)</label>
        <div className="checkbox-grid">
          {mentalHealthGoals.map(goal => (
            <label key={goal} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.mentalHealthGoals.includes(goal)}
                onChange={() => handleArrayToggle('mentalHealthGoals', goal)}
              />
              <span className="checkbox-label">{goal}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Current challenges (Optional)</label>
        <div className="checkbox-grid">
          {challenges.map(challenge => (
            <label key={challenge} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.currentChallenges.includes(challenge)}
                onChange={() => handleArrayToggle('currentChallenges', challenge)}
              />
              <span className="checkbox-label">{challenge}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="previousTherapy" className="form-label">Have you had therapy before?</label>
        <select
          id="previousTherapy"
          name="previousTherapy"
          value={formData.previousTherapy}
          onChange={handleInputChange}
          className="form-select"
        >
          <option value="">Select an option</option>
          <option value="never">Never tried therapy</option>
          <option value="online">Online therapy only</option>
          <option value="in-person">In-person therapy only</option>
          <option value="both">Both online and in-person</option>
        </select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2 className="step-title">Preferences</h2>
      <p className="step-subtitle">Customize your MindCure experience</p>

      <div className="form-group">
        <label className="form-label">Notification Preferences</label>
        <div className="preference-group">
          <label className="preference-item">
            <input
              type="checkbox"
              name="notifications.email"
              checked={formData.notifications.email}
              onChange={handleInputChange}
            />
            <span>Email notifications</span>
          </label>
          <label className="preference-item">
            <input
              type="checkbox"
              name="notifications.sms"
              checked={formData.notifications.sms}
              onChange={handleInputChange}
            />
            <span>SMS reminders</span>
          </label>
          <label className="preference-item">
            <input
              type="checkbox"
              name="notifications.reminders"
              checked={formData.notifications.reminders}
              onChange={handleInputChange}
            />
            <span>Daily check-in reminders</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Privacy Settings</label>
        <div className="preference-group">
          <label className="preference-item">
            <input
              type="checkbox"
              name="privacy.anonymous"
              checked={formData.privacy.anonymous}
              onChange={handleInputChange}
            />
            <span>Stay anonymous in peer support</span>
          </label>
          <label className="preference-item">
            <input
              type="checkbox"
              name="privacy.shareProgress"
              checked={formData.privacy.shareProgress}
              onChange={handleInputChange}
            />
            <span>Share progress with matched therapists</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card signup">
          <div className="auth-header">
            <h1 className="auth-title">Join MindCure</h1>
            <p className="auth-subtitle">Start your personalized mental wellness journey today</p>
          </div>

          {renderStepIndicator()}

          <form className="auth-form" onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="form-actions">
              {step > 1 && (
                <button 
                  type="button" 
                  className="auth-button secondary"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </button>
              )}
              
              <button 
                type="submit" 
                className="auth-button primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-spinner">Processing...</span>
                ) : step === 3 ? (
                  'Create Account'
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link href="/login" className="login-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
