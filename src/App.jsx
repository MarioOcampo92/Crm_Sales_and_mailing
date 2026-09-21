import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KanbanPage from './pages/KanbanPage';
import ImportPage from './pages/ImportPage';
import DirectorioPage from './pages/DirectorioPage';
import MailingPage from './pages/MailingPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function ProtectedApp() {
  const { session, loading } = useAuth();

  // Mientras comprueba la sesión → spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  // Sin sesión → login
  if (!session) return <LoginPage />;

  // Con sesión → app completa
  return (
    <Layout>
      <Routes>
        <Route path="/"        element={<DashboardPage />} />
        <Route path="/kanban"  element={<KanbanPage />} />
        <Route path="/leads"   element={<DirectorioPage />} />
        <Route path="/mailing" element={<MailingPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/import"  element={<ImportPage />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <ProtectedApp />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
