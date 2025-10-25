import './global.css';
import { AuthProvider } from '@/components/layouts/AuthProvider';
import { ToastProvider } from '@/lib/providers/ToastProvider';

export const metadata = {
  title: 'Meeting Manager - Candidate Interview Scheduler',
  description: 'Manage candidate interviews and meetings efficiently',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          {children}
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
