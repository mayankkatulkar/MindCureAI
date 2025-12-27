'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { MindCureLogo } from '@/components/sidebar-nav';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '🤖',
      title: 'AI Voice Therapy',
      description: 'Experience natural conversations with our advanced AI therapist. Available 24/7 with realistic voice interactions.',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <MindCureLogo size="small" />
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-foreground">Your Mental Wellness</span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Starts Here
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Experience the future of mental wellness care with AI-powered therapy,
              professional support, and a caring community all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/voice-chat"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                🤖 Start AI Voice Chat
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-foreground font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-lg"
              >
                Create Account
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">10K+</div>
                <div className="text-sm text-muted-foreground">Users Helped</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">Support Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">95%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Mental Wellness
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive mental wellness support tailored to your unique needs
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${index === 0 ? 'cursor-pointer' : ''}`}
                onClick={index === 0 ? () => window.location.href = '/voice-chat' : undefined}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                {index === 0 && (
                  <div className="mt-4 text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:underline">
                    Try Voice Chat Now →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How MindCure Works
            </h2>
          </motion.div>

          <div className="space-y-8">
            {[
              { step: 1, title: 'Create Your Profile', description: 'Share your mental wellness goals and preferences to personalize your experience' },
              { step: 2, title: 'Get Matched', description: 'Our AI matches you with the right therapists and support networks' },
              { step: 3, title: 'Start Your Journey', description: 'Begin therapy sessions, connect with peers, and track your progress' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-6"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
              >
                <div className="text-yellow-500 mb-4">
                  {'⭐'.repeat(testimonial.rating)}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Crisis Banner */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/crisis-support"
            className="block bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all group"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <span className="text-3xl">🚨</span>
                <div>
                  <h3 className="font-bold text-red-600 dark:text-red-400 text-lg">Need Immediate Help?</h3>
                  <p className="text-muted-foreground">If you're experiencing a crisis, support is available 24/7</p>
                </div>
              </div>
              <span className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors">
                Get Crisis Support
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to Transform Your Mental Wellness?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of people who've found hope, healing, and community with MindCure
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                💜 Start Free Today
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-foreground font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
              >
                Sign In
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • Free 7-day trial
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div>
              <MindCureLogo size="small" />
              <p className="text-sm text-muted-foreground mt-4">
                Empowering mental wellness through technology and community
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/voice-chat" className="hover:text-foreground transition-colors">AI Therapy</Link></li>
                <li><Link href="/therapist-directory" className="hover:text-foreground transition-colors">Find Therapists</Link></li>
                <li><Link href="/peer-support" className="hover:text-foreground transition-colors">Peer Support</Link></li>
                <li><Link href="/crisis-support" className="hover:text-foreground transition-colors">Crisis Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200/50 dark:border-slate-700/50 text-center text-sm text-muted-foreground">
            <p>© 2024 MindCure. All rights reserved.</p>
            <p className="mt-2">
              MindCure is not a replacement for professional medical advice. If you're experiencing a crisis, please contact emergency services.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
