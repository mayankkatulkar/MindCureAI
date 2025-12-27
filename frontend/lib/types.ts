export type ThemeMode = 'dark' | 'light' | 'system';

export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;
}

export interface SandboxConfig {
  [key: string]:
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | null;
}

export interface ChatSession {
  id: string;
  title: string;
  summary?: string;
  voice_used: string;
  genz_mode: boolean;
  duration_seconds: number;
  mood_before?: string;
  mood_after?: string;
  created_at: string;
  transcript?: any[];
  metadata?: any;
}
