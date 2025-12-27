'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReceivedChatMessage } from '@livekit/components-react';
import { cn } from '@/lib/utils';

interface TranscriptChatProps {
  messages: ReceivedChatMessage[];
  className?: string;
}

/**
 * Premium chat-style transcript display
 * Shows user messages on the right, AI on the left
 * Cozy mental health aesthetic
 */
export const TranscriptChat = ({ messages, className }: TranscriptChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="text-gray-400 text-sm">
          <span className="text-2xl block mb-2">🎙️</span>
          Start speaking to see your conversation here
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex flex-col gap-3 overflow-y-auto max-h-64 px-4 py-3",
        className
      )}
    >
      <AnimatePresence initial={false}>
        {messages.map((message, index) => {
          const isUser = message.from?.isLocal;
          const isLatest = index === messages.length - 1;

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
                delay: isLatest ? 0 : 0.1
              }}
              className={cn(
                "flex",
                isUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
                  isUser
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md"
                    : "bg-white/80 backdrop-blur-sm text-gray-700 border border-purple-100 rounded-bl-md",
                  isLatest && !isUser && "ring-2 ring-purple-200/50"
                )}
              >
                {/* Sender label */}
                <div className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider mb-1",
                  isUser ? "text-white/70" : "text-purple-500"
                )}>
                  {isUser ? 'You' : 'Dr. Sarah'}
                </div>

                {/* Message text */}
                <p className={cn(
                  "text-sm leading-relaxed",
                  isUser ? "text-white" : "text-gray-700"
                )}>
                  {message.message}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Typing indicator for when AI is thinking */}
      {messages.length > 0 && !messages[messages.length - 1].from?.isLocal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          className="flex justify-start"
        >
          <div className="bg-white/60 rounded-2xl px-4 py-3 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-purple-400 rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Legacy export for backward compatibility
export const StreamingTextPanel = TranscriptChat;
