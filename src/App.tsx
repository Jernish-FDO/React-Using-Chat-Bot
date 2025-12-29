import { Toaster } from 'react-hot-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChatContainer } from '@/components/chat/ChatContainer';

function App() {
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
            background: '#343541',
            color: '#ececf1',
            border: '1px solid #565869',
          },
          success: {
            iconTheme: {
              primary: '#10a37f',
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
