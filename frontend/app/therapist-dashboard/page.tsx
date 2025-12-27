'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import Link from 'next/link';

interface SessionRequest {
    id: string;
    user_id: string;
    profiles: {
        full_name: string;
        email: string;
    };
    issue_summary: string;
    urgency: 'low' | 'normal' | 'high' | 'crisis';
    created_at: string;
}

interface Booking {
    id: string;
    user_id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    notes: string;
}

export default function TherapistDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        therapist: any;
        bookings: Booking[];
        requests: SessionRequest[];
        earnings: any;
    } | null>(null);

    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/therapist/dashboard');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else if (res.status === 403) {
                router.push('/dashboard'); // Not a therapist
            } else {
                router.push('/login');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 30000); // Poll for new requests every 30s
        return () => clearInterval(interval);
    }, []);

    const handleRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
        try {
            await fetch('/api/therapist/dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action, notes: 'Processed via dashboard' })
            });
            fetchDashboard(); // Refresh data
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <>
            <AppHeader />
            <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">

                    {/* Header Stats */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Dr. {data.therapist?.license_number ? 'Dashboard' : 'Welcome'}</h1>
                        <p className="mt-2 text-gray-600">Manage your sessions, patients, and schedule.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-500">Today's Earnings</div>
                            <div className="mt-2 text-3xl font-bold text-gray-900">${data.earnings.today}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-500">Upcoming Sessions</div>
                            <div className="mt-2 text-3xl font-bold text-indigo-600">{data.bookings.length}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-500">Patient Rating</div>
                            <div className="mt-2 text-3xl font-bold text-yellow-500">★ {data.therapist?.rating || 'New'}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Main Content: Sessions & Requests */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Live Requests Section */}
                            {data.requests.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
                                    <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                            </span>
                                            Live Patient Requests
                                        </h2>
                                        <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                                            {data.requests.length} Pending
                                        </span>
                                    </div>
                                    <div className="divide-y divide-red-50">
                                        {data.requests.map((req) => (
                                            <div key={req.id} className="p-6 hover:bg-red-50/30 transition-colors">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{req.profiles?.full_name || 'Anonymous User'}</h3>
                                                        <p className="text-sm text-gray-500">Requested {new Date(req.created_at).toLocaleTimeString()}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide
                            ${req.urgency === 'crisis' ? 'bg-red-600 text-white' :
                                                            req.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-blue-100 text-blue-800'}`}>
                                                        {req.urgency} Priority
                                                    </span>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm mb-4 border border-gray-100">
                                                    "{req.issue_summary}"
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleRequestAction(req.id, 'accept')}
                                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors shadow-sm"
                                                    >
                                                        Accept & Connect
                                                    </button>
                                                    <button
                                                        onClick={() => handleRequestAction(req.id, 'decline')}
                                                        className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-2 px-4 rounded-lg font-medium transition-colors"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upcoming Sessions */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900">Upcoming Schedule</h2>
                                </div>
                                {data.bookings.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        No upcoming sessions scheduled.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {data.bookings.map((booking) => (
                                            <div key={booking.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                        {new Date(booking.scheduled_at).getDate()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">Session with Patient</div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                                            <span>🕒 {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            <span>•</span>
                                                            <span>{booking.duration_minutes} min</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/therapist-video/${booking.id}`}
                                                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                                                >
                                                    Join Call
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: Availability & Tools */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-4">Availability Status</h3>
                                <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100">
                                    <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="font-medium">Accepting Instant Requests</span>
                                </div>
                                <button className="mt-4 w-full py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                                    Update Availability
                                </button>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-4">Quick Tools</h3>
                                <div className="space-y-3">
                                    <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                        <span className="text-xl">📝</span>
                                        <span>Session Notes</span>
                                    </button>
                                    <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                        <span className="text-xl">🗓️</span>
                                        <span>Calendar Sync</span>
                                    </button>
                                    <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                        <span className="text-xl">💳</span>
                                        <span>Payout Settings</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
