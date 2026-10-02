import { useStrings } from '@/lib/i18n';

const LoadingScreen = () => {
  const strings = useStrings();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">
        {strings.layout.loadingScreen}
      </p>
    </main>
  );
};

export default LoadingScreen;
