import { Toaster } from 'react-hot-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { AuthPage } from '@/components/auth/AuthPage';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useApiKeyStore } from '@/stores/apiKeyStore';

function App() {
  const { user, loading } = useAuthStore();
  const { fetchConversations } = useChatStore();
  const { fetchSettings } = useSettingsStore();
  const { fetchKeys } = useApiKeyStore();

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchSettings();
      fetchKeys();
    }
  }, [user, fetchConversations, fetchSettings, fetchKeys]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      <MainLayout>
        <ChatContainer />
      </MainLayout>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1e',
            color: '#f3f4f6',
            border: '1px solid #2d2d35',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#7B52C1',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;
