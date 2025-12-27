import { Button } from '@/components/ui/button';
import { VoiceSettings, type GeminiVoice } from '@/components/voice-settings';
import { MindCureLogo } from '@/components/sidebar-nav';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: () => void;
  onVoiceChange?: (voice: GeminiVoice) => void;
  onGenZModeChange?: (isGenZ: boolean) => void;
}

export const Welcome = ({
  disabled,
  startButtonText,
  onStartCall,
  onVoiceChange,
  onGenZModeChange,
  ref,
}: React.ComponentProps<'div'> & WelcomeProps) => {
  return (
    <div
      ref={ref}
      inert={disabled}
      className="fixed inset-0 z-10 mx-auto flex h-svh flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Voice & Mode Settings in top right */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-2 z-20">
        <span className="text-xs text-gray-400 font-medium">AI Settings</span>
        <VoiceSettings
          compact
          onVoiceChange={onVoiceChange}
          onGenZModeChange={onGenZModeChange}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8">
          <MindCureLogo size="large" />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          AI Voice Therapy
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 max-w-md px-4 leading-relaxed mb-8">
          Talk to Dr. Sarah, your AI mental health companion.
          Available 24/7 for support, guidance, and understanding.
        </p>

        {/* Start Button */}
        <button
          onClick={onStartCall}
          disabled={disabled}
          className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-semibold rounded-2xl transition-all shadow-2xl hover:shadow-purple-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          {startButtonText}
        </button>

        {/* Features */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 max-w-lg px-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="text-purple-400">✓</span>
            100% Private
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="text-purple-400">✓</span>
            No Judgment
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="text-purple-400">✓</span>
            24/7 Available
          </div>
        </div>
      </div>
    </div>
  );
};
