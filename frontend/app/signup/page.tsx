'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'motion/react';
import { MindCureLogo } from '@/components/sidebar-nav';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'user' | 'therapist';
  mentalHealthGoals: string[];
  geminiApiKey: string;
}

const SignupPage = () => {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'user',
    mentalHealthGoals: [],
    geminiApiKey: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const mentalHealthGoals = [
    'Reduce Anxiety', 'Manage Depression', 'Improve Sleep',
    'Stress Management', 'Build Confidence', 'Better Relationships',
    'Work-Life Balance', 'Emotional Regulation'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (error) setError('');
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      mentalHealthGoals: prev.mentalHealthGoals.includes(goal)
        ? prev.mentalHealthGoals.filter(g => g !== goal)
        : [...prev.mentalHealthGoals, goal]
    }));
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            user_type: formData.userType,
            mental_health_goals: formData.mentalHealthGoals,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        if (formData.userType === 'therapist') {
          router.push('/therapist-register');
        } else {
          router.push('/voice-chat');
        }
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <MindCureLogo size="small" />
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Join MindCure</h1>
            <p className="text-gray-400">Start your wellness journey today</p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-3">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-500'
                    }`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2"
            >
              ⚠️ {error}
            </motion.div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            <AnimatePresence mode="wait">
              {/* Step 1: Account Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="John"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">I am a...</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'user', label: '🧘 User', desc: 'Seeking support' },
                        { value: 'therapist', label: '👨‍⚕️ Therapist', desc: 'Providing help' },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all border ${formData.userType === option.value
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        >
                          <input
                            type="radio"
                            name="userType"
                            value={option.value}
                            checked={formData.userType === option.value}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <span className="text-2xl mb-1">{option.label.split(' ')[0]}</span>
                          <span className="text-white font-medium">{option.label.split(' ')[1]}</span>
                          <span className="text-xs text-gray-400">{option.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Goals */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-white">What are your goals?</h2>
                    <p className="text-gray-400 text-sm">Select all that apply</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {mentalHealthGoals.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => handleGoalToggle(goal)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all text-left ${formData.mentalHealthGoals.includes(goal)
                          ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                      >
                        {formData.mentalHealthGoals.includes(goal) ? '✓ ' : ''}{goal}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: API Key */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-white">🔑 Power Your AI Therapist</h2>
                    <p className="text-gray-400 text-sm">Your key, your control, your privacy</p>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-purple-300 text-sm mb-2">
                      <strong>Why Bring Your Own Key?</strong>
                    </p>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>✓ You pay Google directly (~$0.10/session)</li>
                      <li>✓ Your conversations stay private</li>
                      <li>✓ Transparent costs - no hidden fees</li>
                      <li>✓ 5 free sessions/month included</li>
                    </ul>
                  </div>

                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center py-3 bg-white/5 border border-white/10 rounded-xl text-purple-400 hover:bg-white/10 transition-all"
                  >
                    → Get your FREE Gemini API key (30 seconds)
                  </a>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Your API Key</label>
                    <input
                      type="password"
                      name="geminiApiKey"
                      value={formData.geminiApiKey}
                      onChange={handleInputChange}
                      placeholder="AIza... (paste your Gemini API key)"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, geminiApiKey: '' }))}
                    className="w-full text-center text-gray-400 text-sm hover:text-gray-300 transition-colors"
                  >
                    Skip for now (add later in Settings)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium rounded-xl transition-all"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </>
                ) : step === 3 ? 'Create Account' : 'Next'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
