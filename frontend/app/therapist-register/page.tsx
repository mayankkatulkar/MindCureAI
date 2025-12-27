'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import '../auth.css';

interface TherapistFormData {
    licenseNumber: string;
    licenseState: string;
    specializations: string[];
    hourlyRate: number;
    bio: string;
    yearsExperience: number;
}

const specializations = [
    'Anxiety & Panic Disorders',
    'Depression',
    'Trauma & PTSD',
    'Relationship Issues',
    'Addiction & Recovery',
    'Grief & Loss',
    'Eating Disorders',
    'OCD',
    'ADHD',
    'Stress Management',
    'Life Transitions',
    'Self-Esteem',
    'Anger Management',
    'Family Therapy',
    'Couples Therapy',
    'Child & Adolescent',
];

const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
];

export default function TherapistRegisterPage() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState<TherapistFormData>({
        licenseNumber: '',
        licenseState: '',
        specializations: [],
        hourlyRate: 75,
        bio: '',
        yearsExperience: 0,
    });

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);
        };
        getUser();
    }, [supabase, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const toggleSpecialization = (spec: string) => {
        setFormData(prev => ({
            ...prev,
            specializations: prev.specializations.includes(spec)
                ? prev.specializations.filter(s => s !== spec)
                : [...prev.specializations, spec]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validation
        if (!formData.licenseNumber || !formData.licenseState) {
            setError('Please provide your license information');
            setIsLoading(false);
            return;
        }

        if (formData.specializations.length === 0) {
            setError('Please select at least one specialization');
            setIsLoading(false);
            return;
        }

        try {
            // Insert therapist profile
            const { error: insertError } = await supabase
                .from('therapists')
                .insert({
                    id: user.id,
                    license_number: formData.licenseNumber,
                    license_state: formData.licenseState,
                    specializations: formData.specializations,
                    hourly_rate: formData.hourlyRate,
                    bio: formData.bio,
                    years_experience: formData.yearsExperience,
                    verified: false, // Will be verified by admin
                });

            if (insertError) {
                throw insertError;
            }

            // Update profile user_type
            await supabase
                .from('profiles')
                .update({ user_type: 'therapist' })
                .eq('id', user.id);

            setSuccess(true);
            setTimeout(() => {
                router.push('/therapist-dashboard');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Failed to register. Please try again.');
        }

        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-background">
                    <div className="auth-card">
                        <div className="success-message" style={{ textAlign: 'center', padding: '3rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                            <h2 style={{ color: '#10b981', marginBottom: '1rem' }}>Registration Complete!</h2>
                            <p style={{ color: '#64748b' }}>
                                Your therapist profile has been submitted for verification.
                                We'll notify you once approved.
                            </p>
                            <p style={{ color: '#64748b', marginTop: '1rem' }}>
                                Redirecting to your dashboard...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="auth-card signup">
                    <div className="auth-header">
                        <h1 className="auth-title">🧑‍⚕️ Therapist Registration</h1>
                        <p className="auth-subtitle">Join MindCure and help people improve their mental health</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="error-message">
                                <span className="error-icon">⚠️</span>
                                {error}
                            </div>
                        )}

                        <div className="step-content">
                            <h2 className="step-title">Professional Information</h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="licenseNumber" className="form-label">License Number *</label>
                                    <input
                                        type="text"
                                        id="licenseNumber"
                                        name="licenseNumber"
                                        value={formData.licenseNumber}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="e.g., PSY12345"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="licenseState" className="form-label">Licensed State *</label>
                                    <select
                                        id="licenseState"
                                        name="licenseState"
                                        value={formData.licenseState}
                                        onChange={handleInputChange}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Select state</option>
                                        {usStates.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="yearsExperience" className="form-label">Years of Experience</label>
                                    <input
                                        type="number"
                                        id="yearsExperience"
                                        name="yearsExperience"
                                        value={formData.yearsExperience}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        min="0"
                                        max="50"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="hourlyRate" className="form-label">Hourly Rate ($)</label>
                                    <input
                                        type="number"
                                        id="hourlyRate"
                                        name="hourlyRate"
                                        value={formData.hourlyRate}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        min="25"
                                        max="500"
                                        step="5"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Specializations * (Select all that apply)</label>
                                <div className="checkbox-grid">
                                    {specializations.map(spec => (
                                        <label key={spec} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={formData.specializations.includes(spec)}
                                                onChange={() => toggleSpecialization(spec)}
                                            />
                                            <span className="checkbox-label">{spec}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="bio" className="form-label">Professional Bio</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Tell potential clients about your approach, experience, and what makes you unique..."
                                    rows={4}
                                    style={{ resize: 'vertical', minHeight: '100px' }}
                                />
                            </div>
                        </div>

                        <div className="form-info" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <p style={{ color: '#0369a1', fontSize: '0.9rem', margin: 0 }}>
                                🔒 Your license will be verified before you can start accepting clients.
                                This usually takes 1-2 business days.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="auth-button primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="loading-spinner">Submitting...</span>
                            ) : (
                                'Complete Registration'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
