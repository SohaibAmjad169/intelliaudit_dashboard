import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ThemeProvider } from 'next-themes';
// import { ThemeProvider as NextThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ErrorBoundary } from './components/shared/feedback/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { AiAssistantProvider } from './features/ai-assistant';
import './styles/global.css';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider defaultTheme="dark" storageKey="intelliaudit-theme" attribute="class" enableSystem>
            <SidebarProvider>
              <div className="min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground">
                <AiAssistantProvider>
                  <RouterProvider router={router} />
                  <Toaster />
                </AiAssistantProvider>
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}