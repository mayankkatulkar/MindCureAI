import { headers } from 'next/headers';
import { App } from '@/components/app';
import { getAppConfig } from '@/lib/utils';

export default async function VoiceChatPage() {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);

  return <App appConfig={appConfig} />;
}
