'use client';

import { useState } from 'react';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';

export default function Clear() {
  const [isClearing, setIsClearing] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      'Are you sure you want to clear all files and delete vector databases? This action cannot be undone.'
    );

    if (confirmed) {
      setIsClearing(true);

      try {
        const response = await fetch('/api/upload', {
          method: 'DELETE',
        });

        if (response.ok) {
          const result = await response.json();
          alert(result.message || 'All files have been cleared successfully.');
          // Refresh the page to update stats
          window.location.reload();
        } else {
          alert('Failed to clear files. Please try again.');
        }
      } catch {
        alert('Failed to clear files. Please try again.');
      } finally {
        setIsClearing(false);
      }
    }
  }

  return (
    <Button
      className="rounded-2xl border-2 border-red-500 bg-red-100 text-center font-bold text-black shadow-lg hover:bg-red-400 disabled:opacity-50"
      onClick={handleClick}
      disabled={isClearing}
    >
      {isClearing ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
          Clearing...
        </>
      ) : (
        <>
          <TrashIcon className="mr-2 h-4 w-4" />
          Clear All Files & Delete Vector Databases
        </>
      )}
    </Button>
  );
}
