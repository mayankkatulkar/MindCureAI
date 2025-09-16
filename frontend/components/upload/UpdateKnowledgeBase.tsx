'use client';

import { useState } from 'react';
import { BrainIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';

export default function UpdateKnowledgeBase() {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      'Are you sure you want to update the knowledge base? This will recreate the RAG embeddings with all uploaded files. This process may take a few minutes.'
    );

    if (confirmed) {
      setIsUpdating(true);

      try {
        const response = await fetch('/api/recreate-rag', {
          method: 'POST',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert('Knowledge base updated successfully! The AI can now use the new information.');
          } else {
            alert('Failed to update knowledge base. Please try again.');
          }
        } else {
          alert('Failed to update knowledge base. Please try again.');
        }
      } catch (error) {
        console.error('Error updating knowledge base:', error);
        alert('Failed to update knowledge base. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
  }

  return (
    <Button
      className="rounded-2xl border-2 border-green-500 bg-green-100 text-center font-bold text-black shadow-lg hover:bg-green-400 disabled:opacity-50"
      onClick={handleClick}
      disabled={isUpdating}
    >
      {isUpdating ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
          Updating...
        </>
      ) : (
        <>
          <BrainIcon className="mr-2 h-4 w-4" />
          Update KnowledgeBase
        </>
      )}
    </Button>
  );
}
