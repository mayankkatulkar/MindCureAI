'use client';

import React from 'react';
import { AppHeader } from '@/components/app-header';

export default function EQEvaluationPage() {
    return (
        <>
            <AppHeader />
            <div className="min-h-screen bg-background pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold mb-4">Emotional Intelligence Evaluation</h1>
                        <p className="text-muted-foreground mb-8">
                            Assess and track your emotional intelligence development with our AI-powered evaluation system.
                        </p>

                        <div className="bg-card rounded-lg border border-border p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <span className="text-3xl">🧠</span>
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
                            <p className="text-muted-foreground">
                                Our EQ evaluation system is being developed to help you understand and improve your emotional intelligence.
                                Check back soon!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
