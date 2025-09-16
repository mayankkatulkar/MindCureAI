'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { useCallTraceContext } from '@/components/call-trace-provider';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import { MediaTiles } from '@/components/livekit/media-tiles';
import { StreamingTextPanel } from '@/components/streaming-text-panel';
import { BrowserAutomationViewer } from '@/components/browser-automation-viewer';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
}

export const SessionView = ({
  appConfig,
  disabled,
  sessionStarted,
  ref,
}: React.ComponentProps<'div'> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  const [streamingPanelOpen, setStreamingPanelOpen] = useState(true);
  const [browserAutomationOpen, setBrowserAutomationOpen] = useState(false);
  const { messages, send } = useChatAndTranscription();
  const { addMessage, endSession, isInRoomContext } = useCallTraceContext();
  const room = useRoomContext();
  const lastProcessedMessageId = React.useRef<string | null>(null);

  // Track messages for call traces
  useEffect(() => {
    if (sessionStarted && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.id !== lastProcessedMessageId.current) {
        addMessage(lastMessage);
        lastProcessedMessageId.current = lastMessage.id;

        // Auto-show browser automation viewer when browser automation is mentioned
        if (lastMessage.message) {
          const messageText = lastMessage.message.toLowerCase();
          if (messageText.includes('browser automation') || 
              messageText.includes('web automation') || 
              messageText.includes('browsing') ||
              messageText.includes('searching the web') ||
              messageText.includes('opening website') ||
              messageText.includes('navigating to')) {
            setBrowserAutomationOpen(true);
          }
        }
      }
    }
  }, [messages, sessionStarted, addMessage]);

  // Cleanup: Save call trace when component unmounts or session ends
  useEffect(() => {
    return () => {
      if (sessionStarted) {
        endSession();
      }
    };
  }, [sessionStarted, endSession]);

  async function handleSendMessage(message: string) {
    await send(message);
  }

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === 'connecting'
              ? 'Agent did not join the room. '
              : 'Agent connected but did not complete initializing. ';

          toastAlert({
            title: 'Session ended',
            description: (
              <p className="w-full">
                {reason}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.livekit.io/agents/start/voice-ai/"
                  className="whitespace-nowrap underline"
                >
                  See quickstart guide
                </a>
                .
              </p>
            ),
          });
          room.disconnect();
        }
      }, 10_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  return (
    <main
      ref={ref}
      inert={disabled}
      className={cn('flex h-screen', !chatOpen && 'max-h-svh overflow-hidden')}
    >
      {/* Main Content Area - 2/3 width */}
      <div className="relative flex flex-1 flex-col">
        <ChatMessageView
          className={cn(
            'mx-auto min-h-svh w-full max-w-2xl px-3 pt-20 pb-40 transition-[opacity,translate] duration-300 ease-out md:px-0 md:pt-24 md:pb-48',
            chatOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-20 opacity-0'
          )}
        >
          <div className="space-y-3 whitespace-pre-wrap">
            <AnimatePresence>
              {messages.map((message: ReceivedChatMessage) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <ChatEntry hideName key={message.id} entry={message} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ChatMessageView>

        <div className="bg-background mp-12 fixed top-16 right-0 left-0 h-20 md:h-24">
          {/* skrim */}
          <div className="from-background absolute bottom-0 left-0 h-12 w-full translate-y-full bg-gradient-to-b to-transparent" />
        </div>

        {/* Media Tiles Container - Centered in main content area */}
        <div className="pointer-events-none absolute inset-x-0 top-20 bottom-32 z-50 md:top-24 md:bottom-40">
          <div className="relative mx-auto h-full max-w-2xl px-4 md:px-0">
            <MediaTiles chatOpen={chatOpen} streamingPanelOpen={streamingPanelOpen} />
          </div>
        </div>

        {/* Control Bar - Centered in main content area */}
        <div className="bg-background absolute right-0 bottom-0 left-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12">
          <motion.div
            key="control-bar"
            initial={{ opacity: 0, translateY: '100%' }}
            animate={{
              opacity: sessionStarted ? 1 : 0,
              translateY: sessionStarted ? '0%' : '100%',
            }}
            transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
          >
            <div className="relative z-10 mx-auto w-full max-w-2xl">
              {appConfig.isPreConnectBufferEnabled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                    transition: {
                      ease: 'easeIn',
                      delay: messages.length > 0 ? 0 : 0.8,
                      duration: messages.length > 0 ? 0.2 : 0.5,
                    },
                  }}
                  aria-hidden={messages.length > 0}
                  className={cn(
                    'absolute inset-x-0 -top-12 text-center',
                    sessionStarted && messages.length === 0 && 'pointer-events-none'
                  )}
                >
                  <p className="animate-text-shimmer inline-block !bg-clip-text text-sm font-semibold text-transparent">
                    Agent is listening, ask it a question
                  </p>
                </motion.div>
              )}

              <AgentControlBar
                capabilities={capabilities}
                onChatOpenChange={setChatOpen}
                onSendMessage={handleSendMessage}
                onDisconnect={endSession}
              />
            </div>
            {/* skrim */}
            <div className="from-background border-background absolute top-0 left-0 h-12 w-full -translate-y-full bg-gradient-to-t to-transparent" />
          </motion.div>
        </div>
      </div>

      {/* Streaming Text Panel - 1/3 width */}
      <StreamingTextPanel
        messages={messages}
        className={cn(
          sessionStarted ? 'opacity-100' : 'pointer-events-none opacity-0',
          streamingPanelOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      />

      {/* Browser Automation Viewer */}
      <BrowserAutomationViewer
        isVisible={browserAutomationOpen && sessionStarted}
        className={cn(
          browserAutomationOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      />

      {/* Toggle Buttons for Panels */}
      {sessionStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute top-20 right-4 z-50 flex flex-col gap-2"
        >
          {/* Streaming Panel Toggle */}
          <button
            onClick={() => setStreamingPanelOpen(!streamingPanelOpen)}
            className="bg-background/80 border-border hover:bg-background/90 rounded-lg border p-2 shadow-lg backdrop-blur-sm transition-colors"
            title={streamingPanelOpen ? 'Hide transcript' : 'Show transcript'}
          >
            <div className="flex h-5 w-5 items-center justify-center">
              {streamingPanelOpen ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </div>
          </button>

          {/* Browser Automation Toggle */}
          <button
            onClick={() => setBrowserAutomationOpen(!browserAutomationOpen)}
            className={cn(
              "bg-background/80 border-border hover:bg-background/90 rounded-lg border p-2 shadow-lg backdrop-blur-sm transition-colors",
              browserAutomationOpen && "bg-blue-50 border-blue-200"
            )}
            title={browserAutomationOpen ? 'Hide browser automation' : 'Show browser automation'}
          >
            <div className="flex h-5 w-5 items-center justify-center">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </button>
        </motion.div>
      )}
    </main>
  );
};
