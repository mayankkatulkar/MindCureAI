'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion } from 'motion/react';
import { type ReceivedChatMessage } from '@livekit/components-react';
import { cn } from '@/lib/utils';

interface StreamingTextPanelProps {
  messages: ReceivedChatMessage[];
  className?: string;
}

export const StreamingTextPanel = ({ messages, className }: StreamingTextPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className={cn(
        'bg-background/95 border-border h-full w-1/3 border-l backdrop-blur-sm',
        'flex flex-col transition-transform duration-300 ease-in-out',
        className
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b-2 border-cyan-500 bg-cyan-50 p-4">
        <h2 className="foreground text-lg font-semibold">Live Transcript</h2>
        <p className="muted-foreground text-sm">Real-time conversation stream</p>
      </div>

      {/* Messages Container */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        <AnimatePresence>
          {messages.map((message: ReceivedChatMessage) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="group"
            >
              <div className="flex items-start gap-2">
                {/* Avatar/Indicator */}
                <div className="bg-primary/20 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                  <span className="primary text-xs font-medium">
                    {message.from?.isLocal ? 'U' : 'R'}
                  </span>
                </div>

                {/* Message Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="foreground text-sm font-medium">
                      {message.from?.isLocal ? 'You' : 'Raphael'}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="foreground text-sm leading-relaxed whitespace-pre-wrap">
                    <ReactMarkdown>{message.message}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div className="text-muted-foreground">
              <div className="mb-2 text-4xl">💬</div>
              <p className="text-sm">Start a conversation to see the live transcript here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
