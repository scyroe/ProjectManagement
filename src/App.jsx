import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import AuthScreen from '@/components/auth/AuthScreen';
import LoadingScreen from '@/components/layout/LoadingScreen';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout';
import { useAppRoute } from '@/hooks/use-app-route';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';
import { LanguageProvider } from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';

export default function App() {
  const { authLoading, session } = useAuthSession();
  const { activeRoute, currentPage, navigate } = useAppRoute();
  useRealtimeSync();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {authLoading ? (
          <LoadingScreen />
        ) : !session ? (
          <AuthScreen />
        ) : (
          <WorkspaceLayout
            activeRoute={activeRoute}
            currentPage={currentPage}
            navigate={navigate}
            userId={session.user.id}
          />
        )}
        <Toaster richColors position="top-right" />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
