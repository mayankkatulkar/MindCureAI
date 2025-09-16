import { CallTraceProvider } from '@/components/call-trace-provider';
import HeaderTabs from '@/components/header-tabs';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  return (
    <CallTraceProvider>
      <HeaderTabs />
      {children}
    </CallTraceProvider>
  );
}
