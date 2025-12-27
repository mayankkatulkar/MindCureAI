import { headers } from 'next/headers';
import { App } from '@/components/app';
import { getAppConfig } from '@/lib/utils';
import { VoiceChatLayout } from '@/components/voice-chat-layout';

export default async function VoiceChatPage() {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);

  return <VoiceChatLayout appConfig={appConfig} />;
}
