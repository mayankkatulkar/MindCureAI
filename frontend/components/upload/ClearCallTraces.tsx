'use client';

import React, { useState } from 'react';
import { toastAlert } from '@/components/alert-toast';

export default function ClearCallTraces() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClearCallTraces = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/clear-call-traces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Dispatch custom event to clear traces from UI
        window.dispatchEvent(new CustomEvent('clear-call-traces'));

        toastAlert({
          title: 'Success',
          description: data.message,
        });
      } else {
        toastAlert({
          title: 'Error',
          description: data.message || 'Failed to clear call traces',
        });
      }
    } catch (error) {
      console.error('Error clearing call traces:', error);
      toastAlert({
        title: 'Error',
        description: 'Failed to clear call traces. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClearCallTraces}
      disabled={isLoading}
      className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Clearing...
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear Call Traces
        </>
      )}
    </button>
  );
}
